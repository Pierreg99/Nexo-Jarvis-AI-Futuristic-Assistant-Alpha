import type {
  AgentContext,
  MemoryRecord,
  TimerRecord,
  AutomationRecord,
} from "./types";
import type { WeatherSnapshot } from "../liveData";
import { formatDate, formatDuration, formatSchedule, translate } from "../i18n";

type RuntimeStatus = {
  runtime: string;
  tools: number;
  notes: number;
  activeTimers: number;
  automations: number;
  uptimeSeconds: number;
  timestamp: string;
};
export type CommandPlan = {
  intent: string;
  calls: Array<{ tool: string; input: unknown }>;
  response: (results: unknown[]) => string;
};
const clip = (value: string) =>
  value.length > 400 ? `${value.slice(0, 397)}…` : value;

export function durationSeconds(value: string): number | undefined {
  const units =
    /(\d+(?:[.,]\d+)?)\s*(hours?|hrs?|stunden?|std|minutes?|mins?|minuten?|seconds?|secs?|sekunden?|h|m|s)\b/gi;
  let total = 0,
    count = 0;
  for (const match of value.matchAll(units)) {
    const unit = match[2].toLowerCase();
    total +=
      Number(match[1].replace(",", ".")) *
      (/^(h|st)/.test(unit) ? 3600 : /^m/.test(unit) ? 60 : 1);
    count++;
  }
  const rest = value
    .replace(units, "")
    .replace(/\b(and|und)\b/gi, "")
    .replace(/[\s,]+/g, "");
  return count &&
    !rest &&
    Number.isSafeInteger(total) &&
    total > 0 &&
    total <= 604800
    ? total
    : undefined;
}

/** Explicit English and German commands share the same permission-checked tools. */
export function planCommand(
  input: string,
  context: AgentContext = {}
): CommandPlan {
  const language = context.language ?? "en";
  const t = (message: string, values?: Record<string, string | number>) =>
    translate(language, message, values);
  const date = (value: string, options?: Intl.DateTimeFormatOptions) =>
    formatDate(language, value, options);
  const items = (values: MemoryRecord[]) =>
    values.length
      ? values
          .slice(0, 10)
          .map(item => `• ${clip(item.content)}`)
          .join("\n")
      : t("No matching notes yet. Save one with ‘Remember: …’.");
  const single = <T>(
    tool: string,
    args: Record<string, unknown>,
    response: (value: T) => string
  ): CommandPlan => ({
    intent: tool,
    calls: [
      {
        tool,
        input:
          tool === "assistant.help" || tool === "conversation.respond"
            ? { ...args, language }
            : args,
      },
    ],
    response: values => response(values[0] as T),
  });
  const text = input.trim();
  const lower = text.toLowerCase().replace(/[?!]+$/, "");
  const capture =
    /^(?:remember(?: that)?|save (?:a )?note|take (?:a )?note|note|merke(?: dir)?|notiz|speichere (?:eine )?notiz)\s*[:\-]?\s+(.+)$/is.exec(
      text
    );
  if (capture)
    return single(
      "memory.capture",
      { content: capture[1] },
      (value: MemoryRecord) =>
        t("Saved note: {content}", { content: clip(value.content) })
    );
  if (/^(?:take (?:a )?note|new note|notiz|neue notiz)$/.test(lower))
    return single("assistant.help", {}, () =>
      t("Add a note with ‘Remember: your note’ or use New note in Knowledge.")
    );
  if (
    /^(?:read|show|list|open) (?:my |the )?(?:notes|memory|knowledge base)$/.test(
      lower
    ) ||
    /^(?:zeige|lies|öffne) (?:meine |die )?(?:notizen|wissensdatenbank)$/.test(
      lower
    )
  )
    return single("memory.list", {}, items);
  const search =
    /^(?:find (?:my )?notes(?: about)?|search (?:my )?(?:notes|memory)(?: for)?|suche notizen(?: nach| zu)?)\s+(.+)$/i.exec(
      text
    );
  if (search) return single("memory.search", { query: search[1] }, items);
  const recurring =
    /^(?:remind me every|erinnere mich alle)\s+(.+?)\s+(?:to|an|ans|zum|zur)\s+(.+)$/i.exec(
      text
    );
  if (recurring) {
    const seconds = durationSeconds(recurring[1]);
    if (!seconds)
      return single("assistant.help", {}, () =>
        t("Try ‘Remind me every 30 minutes to stretch’ (up to 7 days).")
      );
    return single(
      "automation.create",
      {
        name: recurring[2].slice(0, 200),
        prompt: recurring[2],
        schedule: `every ${seconds}s`,
      },
      (value: AutomationRecord) =>
        t("Recurring reminder created: {prompt}. Next run {time}.", {
          prompt: value.prompt,
          time: date(value.nextRun!),
        })
    );
  }
  const reminder =
    /^(?:remind me in|erinnere mich in)\s+(.+?)\s+(?:to|an|ans|zum|zur)\s+(.+)$/i.exec(
      text
    );
  const timer =
    /^(?:set|start|starte)?\s*(?:a |an |einen )?(.+?)\s+timer(?:\s+(?:for|named|für)\s+(.+))?$/i.exec(
      text
    ) ??
    /^(?:timer|set (?:a )?timer (?:for|to)|stelle einen timer auf)\s+(.+)$/i.exec(
      text
    );
  if (reminder || timer) {
    const match = reminder ?? timer!;
    const seconds = durationSeconds(match[1]);
    if (!seconds)
      return single("assistant.help", {}, () =>
        t(
          "Use a duration from 1 second to 7 days, for example ‘Set a 5 min timer’ or ‘Remind me in 1 hour to stretch’."
        )
      );
    return single(
      "task.timer",
      { seconds, title: match[2] ?? "Timer" },
      (value: TimerRecord) =>
        t("{title} started for {duration}. Due {time}.", {
          title: value.title,
          duration: formatDuration(language, seconds),
          time: date(value.dueAt, { timeStyle: "medium" }),
        })
    );
  }
  if (
    /^(?:show|list|read) (?:my )?(?:timers|countdowns)$/.test(lower) ||
    /^(?:zeige|liste|lies) (?:meine )?(?:timer|countdowns)$/.test(lower)
  )
    return single("task.list", {}, (values: TimerRecord[]) =>
      values.length
        ? values
            .map(
              value =>
                `• ${t("{title} — {status}, due {time} ({id})", { title: value.title, status: t(value.status), time: date(value.dueAt), id: value.id })}`
            )
            .join("\n")
        : t("No active timers. Try ‘Set a 5 min timer’.")
    );
  const cancel =
    /^(?:cancel|stop|stoppe|beende|brich) timer\s+(.+?)(?:\s+ab)?$/i.exec(text);
  if (cancel)
    return single(
      "task.cancel",
      { id: cancel[1].trim() },
      (value: TimerRecord) => t("Cancelled {title}.", { title: value.title })
    );
  if (
    /^(?:show|list) (?:my )?(?:automations|reminders)$/.test(lower) ||
    /^(?:zeige|liste) (?:meine )?(?:automationen|erinnerungen)$/.test(lower)
  )
    return single("automation.list", {}, (values: AutomationRecord[]) =>
      values.length
        ? values
            .map(
              value =>
                `• ${value.name} — ${t(value.enabled ? "enabled" : "paused")}, ${formatSchedule(language, value.schedule)}`
            )
            .join("\n")
        : t(
            "No recurring reminders. Try ‘Remind me every 30 minutes to stretch’."
          )
    );
  if (
    /^(?:(?:show|check|what is) (?:the )?)?(?:system status|status|system)$/.test(
      lower
    ) ||
    /^(?:(?:zeige|prüfe) (?:den )?)?systemstatus$/.test(lower)
  )
    return single("system.status", {}, (value: RuntimeStatus) =>
      t(
        "Runtime {runtime}; {tools} tools, {notes} notes, {timers} active timers and {reminders} recurring reminders. Uptime {uptime} seconds.",
        {
          runtime: value.runtime,
          tools: value.tools,
          notes: value.notes,
          timers: value.activeTimers,
          reminders: value.automations,
          uptime: value.uptimeSeconds,
        }
      )
    );
  if (/\b(weather|wetter)\b/.test(lower))
    return context.coordinates
      ? single(
          "weather.current",
          context.coordinates,
          (value: WeatherSnapshot) =>
            t(
              "{condition}, {temperature}°C (feels like {apparent}°C). Wind {wind} km/h. {timezone}.",
              {
                condition: t(value.condition),
                temperature: Math.round(value.temperature),
                apparent: Math.round(value.apparentTemperature),
                wind: Math.round(value.windSpeed),
                timezone: value.timezone,
              }
            )
        )
      : single("assistant.help", {}, () =>
          t(
            "Enable location access or set coordinates in Settings to get current weather."
          )
        );
  if (
    /^(?:show|read|latest|what are the|zeige|lies|neueste)?\s*(?:news|headlines|nachrichten)(?: today| heute)?$/.test(
      lower
    )
  )
    return single(
      "news.latest",
      {},
      (values: Array<{ title: string; domain: string }>) =>
        values.length
          ? values
              .slice(0, 5)
              .map(value => `• ${value.title} (${value.domain})`)
              .join("\n")
          : t("No headlines are available right now.")
    );
  if (
    /^(?:summarize today|daily briefing|briefing|tagesübersicht)$/.test(lower)
  )
    return {
      intent: "briefing",
      calls: [
        { tool: "system.status", input: {} },
        { tool: "task.list", input: {} },
        { tool: "memory.list", input: { limit: 3 } },
      ],
      response: values =>
        `${t("Workspace briefing: {notes} notes and {timers} active countdowns.", { notes: (values[0] as RuntimeStatus).notes, timers: (values[1] as TimerRecord[]).filter(item => item.status === "active").length })}\n${items(values[2] as MemoryRecord[])}`,
    };
  if (
    /^(?:help|commands|what can you do|hilfe|befehle|was kannst du)$/.test(
      lower
    )
  )
    return single("assistant.help", {}, String);
  if (/\b(calendar|kalender)\b/.test(lower))
    return single("assistant.help", {}, () =>
      t(
        "External calendars require a configured provider connection. You can use local timers and recurring reminders now."
      )
    );
  if (/^(?:what time is it|time|wie spät ist es|uhrzeit)$/.test(lower))
    return single("system.status", {}, (value: RuntimeStatus) =>
      date(value.timestamp)
    );
  return single("conversation.respond", { input: text }, String);
}
