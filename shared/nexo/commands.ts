import type {
  AgentContext,
  MemoryRecord,
  TimerRecord,
  AutomationRecord,
} from "./types";
import type { WeatherSnapshot } from "../liveData";

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
const items = (values: MemoryRecord[]) =>
  values.length
    ? values
        .slice(0, 10)
        .map(item => `• ${clip(item.content)}`)
        .join("\n")
    : "No matching notes yet. Save one with ‘Remember: …’.";

export function durationSeconds(value: string): number | undefined {
  const units =
    /(\d+(?:[.,]\d+)?)\s*(hours?|hrs?|stunden?|std|minutes?|mins?|minuten?|seconds?|secs?|sekunden?|h|m|s)\b/gi;
  let total = 0;
  let count = 0;
  for (const match of value.matchAll(units)) {
    const unit = match[2].toLowerCase();
    const multiplier = /^(h|st)/.test(unit) ? 3600 : /^m/.test(unit) ? 60 : 1;
    total += Number(match[1].replace(",", ".")) * multiplier;
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

function single<T>(
  tool: string,
  input: unknown,
  response: (value: T) => string
): CommandPlan {
  return {
    intent: tool,
    calls: [{ tool, input }],
    response: values => response(values[0] as T),
  };
}

/** Only explicit commands may write. Free-form conversation never executes model-generated actions. */
export function planCommand(
  input: string,
  context: AgentContext = {}
): CommandPlan {
  const text = input.trim();
  const lower = text.toLowerCase().replace(/[?!]+$/, "");
  const capture =
    /^(?:remember(?: that)?|save (?:a )?note|take (?:a )?note|note|merke(?: dir)?|notiz)\s*[:\-]?\s+(.+)$/is.exec(
      text
    );
  if (capture)
    return single(
      "memory.capture",
      { content: capture[1] },
      (value: MemoryRecord) => `Saved note: ${clip(value.content)}`
    );
  if (/^(?:take (?:a )?note|new note|notiz|neue notiz)$/.test(lower))
    return single(
      "assistant.help",
      {},
      () =>
        "Add a note with ‘Remember: your note’ or use New note in Knowledge."
    );
  if (
    /^(?:read|show|list|open) (?:my |the )?(?:notes|memory|knowledge base)$/.test(
      lower
    ) ||
    /^(?:zeige|lies) (?:meine )?notizen$/.test(lower)
  )
    return single("memory.list", {}, items);
  const search =
    /^(?:find (?:my )?notes(?: about)?|search (?:my )?(?:notes|memory)(?: for)?|suche notizen(?: nach)?)\s+(.+)$/i.exec(
      text
    );
  if (search) return single("memory.search", { query: search[1] }, items);
  const reminder =
    /^(?:remind me in|erinnere mich in)\s+(.+?)\s+(?:to|an)\s+(.+)$/i.exec(
      text
    );
  const timer =
    /^(?:set|start|starte)?\s*(?:a |an )?(.+?)\s+timer(?:\s+(?:for|named)\s+(.+))?$/i.exec(
      text
    ) ??
    /^(?:timer|set (?:a )?timer (?:for|to)|stelle einen timer auf)\s+(.+)$/i.exec(
      text
    );
  if (reminder || timer) {
    const match = reminder ?? timer!;
    const seconds = durationSeconds(match[1]);
    if (!seconds)
      return single(
        "assistant.help",
        {},
        () =>
          "Use a duration from 1 second to 7 days, for example ‘Set a 5 min timer’ or ‘Remind me in 1 hour to stretch’."
      );
    return single(
      "task.timer",
      { seconds, title: match[2] ?? "Timer" },
      (value: TimerRecord) =>
        `${value.title} started for ${seconds >= 60 ? `${seconds / 60} minutes` : `${seconds} seconds`}. Due ${new Date(value.dueAt).toLocaleTimeString()}.`
    );
  }
  const recurring =
    /^(?:remind me every|erinnere mich alle)\s+(.+?)\s+(?:to|an)\s+(.+)$/i.exec(
      text
    );
  if (recurring) {
    const seconds = durationSeconds(recurring[1]);
    if (!seconds)
      return single(
        "assistant.help",
        {},
        () => "Try ‘Remind me every 30 minutes to stretch’ (up to 7 days)."
      );
    return single(
      "automation.create",
      {
        name: recurring[2].slice(0, 200),
        prompt: recurring[2],
        schedule: `every ${seconds}s`,
      },
      (value: AutomationRecord) =>
        `Recurring reminder created: ${value.prompt}. Next run ${new Date(value.nextRun!).toLocaleString()}.`
    );
  }
  if (/^(?:show|list|read) (?:my )?(?:timers|countdowns)$/.test(lower))
    return single("task.list", {}, (values: TimerRecord[]) =>
      values.length
        ? values
            .map(
              value =>
                `• ${value.title} — ${value.status}, due ${new Date(value.dueAt).toLocaleString()} (${value.id})`
            )
            .join("\n")
        : "No active timers. Try ‘Set a 5 min timer’."
    );
  const cancel = /^(?:cancel|stop) timer\s+(.+)$/i.exec(text);
  if (cancel)
    return single(
      "task.cancel",
      { id: cancel[1].trim() },
      (value: TimerRecord) => `Cancelled ${value.title}.`
    );
  if (/^(?:show|list) (?:my )?(?:automations|reminders)$/.test(lower))
    return single("automation.list", {}, (values: AutomationRecord[]) =>
      values.length
        ? values
            .map(
              value =>
                `• ${value.name} — ${value.enabled ? "enabled" : "paused"}, ${value.schedule}`
            )
            .join("\n")
        : "No recurring reminders. Try ‘Remind me every 30 minutes to stretch’."
    );
  if (
    /^(?:(?:show|check|what is) (?:the )?)?(?:system status|status|system)$/.test(
      lower
    )
  )
    return single(
      "system.status",
      {},
      (value: RuntimeStatus) =>
        `Runtime ${value.runtime}; ${value.tools} tools, ${value.notes} notes, ${value.activeTimers} active timers and ${value.automations} recurring reminders. Uptime ${value.uptimeSeconds} seconds.`
    );
  if (/\b(weather|wetter)\b/.test(lower))
    return context.coordinates
      ? single(
          "weather.current",
          context.coordinates,
          (value: WeatherSnapshot) =>
            `${value.condition}, ${Math.round(value.temperature)}°C (feels like ${Math.round(value.apparentTemperature)}°C). Wind ${Math.round(value.windSpeed)} km/h. ${value.timezone}.`
        )
      : single(
          "assistant.help",
          {},
          () =>
            "Enable location access or set coordinates in Settings to get current weather."
        );
  if (
    /^(?:show|read|latest|what are the)?\s*(?:news|headlines|nachrichten)(?: today)?$/.test(
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
          : "No headlines are available right now."
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
        `Workspace briefing: ${(values[0] as RuntimeStatus).notes} notes and ${(values[1] as TimerRecord[]).filter(item => item.status === "active").length} active countdowns.\n${items(values[2] as MemoryRecord[])}`,
    };
  if (/^(?:help|commands|what can you do|hilfe)$/.test(lower))
    return single("assistant.help", {}, String);
  if (/\b(calendar|kalender)\b/.test(lower))
    return single(
      "assistant.help",
      {},
      () =>
        "External calendars require a configured provider connection. You can use local timers and recurring reminders now."
    );
  if (/^(?:what time is it|time|wie spät ist es)$/.test(lower))
    return single("system.status", {}, (value: RuntimeStatus) =>
      new Date(value.timestamp).toLocaleString()
    );
  return single("conversation.respond", { input: text }, String);
}
