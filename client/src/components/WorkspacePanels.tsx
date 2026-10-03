import { useEffect, useState, type FormEvent } from "react";
import { Download, Pause, Play, Search, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadJSON } from "@/lib/assistant";
import type { useAssistant } from "@/hooks/useAssistant";
import type { Preferences } from "@/hooks/usePreferences";
import { durationSeconds } from "@shared/nexo/commands";
import type { MemoryRecord } from "@shared/nexo/types";

export type WorkspaceModule =
  | "command"
  | "terminal"
  | "knowledge"
  | "automations"
  | "media"
  | "monitor"
  | "settings"
  | "notifications";
type Props = {
  module: WorkspaceModule;
  onClose: () => void;
  assistant: ReturnType<typeof useAssistant>;
  preferences: Preferences;
  onPreferences: (change: Partial<Preferences>) => void;
  onCommand: (command: string) => void;
  coordinates: { latitude: number; longitude: number } | null;
  onCoordinates: (coordinates: { latitude: number; longitude: number }) => void;
  now: Date;
};
const field =
  "w-full border border-cyan-100/20 bg-black/30 px-3 py-2 text-sm text-cyan-50 outline-none focus:border-cyan-300";
const button =
  "inline-flex items-center justify-center gap-2 border border-cyan-200/25 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-40";
const titles: Record<WorkspaceModule, string> = {
  command: "Command bay",
  terminal: "Execution terminal",
  knowledge: "Knowledge & notes",
  automations: "Timers & reminders",
  media: "Voice controls",
  monitor: "System monitor",
  settings: "Workspace settings",
  notifications: "Notifications",
};

export function countdown(dueAt: string, now: Date): string {
  const remaining = Math.max(
    0,
    Math.ceil((Date.parse(dueAt) - now.getTime()) / 1000)
  );
  const hours = Math.floor(remaining / 3600);
  return `${hours ? `${hours}:` : ""}${String(Math.floor(remaining / 60) % 60).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}

export default function WorkspacePanels({
  module,
  onClose,
  assistant,
  preferences,
  onPreferences,
  onCommand,
  coordinates,
  onCoordinates,
  now,
}: Props) {
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<MemoryRecord["kind"]>("note");
  const [timerTitle, setTimerTitle] = useState("Timer");
  const [duration, setDuration] = useState("5 min");
  const [reminder, setReminder] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [oneTime, setOneTime] = useState(false);
  const [at, setAt] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const disabled =
    assistant.isBusy ||
    !assistant.isReady ||
    preferences.readOnly ||
    !assistant.connected;
  const state = assistant.workspace;

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  const execute = async (tool: string, input: unknown, message?: string) => {
    try {
      await assistant.execute(tool, input);
      if (message) toast.success(message);
      return true;
    } catch {
      return false;
    }
  };
  const saveNote = async (event: FormEvent) => {
    event.preventDefault();
    if (
      await execute(
        "memory.capture",
        { content: note, kind, importance: 5, tags: [] },
        "Note saved"
      )
    )
      setNote("");
  };
  const deleteNote = async (record: MemoryRecord) => {
    if (await execute("memory.delete", { id: record.id }))
      toast("Note deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            void execute("memory.capture", {
              content: record.content,
              kind: record.kind,
              importance: record.importance,
              tags: record.tags,
            });
          },
        },
      });
  };
  const saveTimer = (event: FormEvent) => {
    event.preventDefault();
    const seconds = durationSeconds(duration);
    if (!seconds) {
      toast.error(
        "Use a duration such as 5 min, 1 hour or 30 seconds (up to 7 days)."
      );
      return;
    }
    void execute("task.timer", { title: timerTitle, seconds }, "Timer started");
  };
  const saveReminder = async (event: FormEvent) => {
    event.preventDefault();
    if (oneTime && (!at || !Number.isFinite(new Date(at).getTime()))) {
      toast.error("Choose a reminder time.");
      return;
    }
    const schedule = oneTime ? new Date(at).toISOString() : `every ${minutes}m`;
    if (
      await execute(
        "automation.create",
        {
          name: reminder.slice(0, 200),
          prompt: reminder,
          schedule,
          enabled: true,
        },
        "Reminder created"
      )
    )
      setReminder("");
  };
  const notes = state.memory
    .filter(item =>
      `${item.content} ${item.tags.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const testVoice = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Speech output is unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      preferences.language === "de-DE"
        ? "Nexo ist bereit. Was möchtest du tun?"
        : "Nexo is ready. What shall we focus on?"
    );
    utterance.lang = preferences.language;
    utterance.rate = preferences.rate;
    utterance.voice =
      voices.find(voice => voice.voiceURI === preferences.voice) ?? null;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Dialog
      open={module !== "command"}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto border-cyan-200/25 bg-[#071319] text-cyan-50 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{titles[module]}</DialogTitle>
          <DialogDescription className="text-cyan-100/55">
            {assistant.mode === "server"
              ? "Connected workspace · changes are saved on your server."
              : "Personal workspace · saved in this browser."}
          </DialogDescription>
        </DialogHeader>
        {assistant.error && (
          <div
            role="alert"
            className="border border-amber-300/30 p-3 text-sm text-amber-100"
          >
            {assistant.error}
            <button onClick={assistant.clearError} className="ml-3 underline">
              Dismiss
            </button>
          </div>
        )}
        {preferences.readOnly && (
          <p className="text-xs text-amber-100">
            Read-only mode is enabled. Turn it off in Settings to save changes.
          </p>
        )}

        {module === "knowledge" && (
          <div className="space-y-5">
            <form onSubmit={saveNote} className="space-y-3">
              <label className="block text-xs">
                New note
                <textarea
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  maxLength={4000}
                  required
                  rows={3}
                  className={`${field} mt-2`}
                  placeholder="Capture a note, fact or preference…"
                />
              </label>
              <div className="flex items-center gap-3">
                <label className="text-xs">
                  Type
                  <select
                    value={kind}
                    onChange={event =>
                      setKind(event.target.value as MemoryRecord["kind"])
                    }
                    className={`${field} ml-2 w-auto`}
                  >
                    {["note", "fact", "preference", "task"].map(value => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <button className={button} disabled={disabled || !note.trim()}>
                  Save note
                </button>
              </div>
            </form>
            <label className="flex items-center gap-2">
              <Search size={16} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className={field}
                placeholder="Search notes and tags…"
                aria-label="Search saved notes"
              />
            </label>
            <p className="technical-label">
              {notes.length} / {state.memory.length} notes
            </p>
            <div className="space-y-3">
              {notes.map(record => (
                <article
                  key={record.id}
                  className="border border-cyan-100/15 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="technical-label">
                      {record.kind} ·{" "}
                      {new Date(record.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => void deleteNote(record)}
                      disabled={disabled}
                      className={button}
                      aria-label={`Delete note: ${record.content.slice(0, 40)}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                    {record.content}
                  </p>
                  {record.tags.length > 0 && (
                    <p className="mt-2 text-xs text-cyan-200/60">
                      {record.tags.join(" · ")}
                    </p>
                  )}
                </article>
              ))}
              {!notes.length && (
                <p className="text-sm text-cyan-100/50">
                  {search
                    ? "No notes match your search."
                    : "Your saved notes will appear here."}
                </p>
              )}
            </div>
          </div>
        )}

        {module === "automations" && (
          <div className="space-y-6">
            <form
              onSubmit={saveTimer}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="text-xs">
                Timer title
                <input
                  value={timerTitle}
                  onChange={event => setTimerTitle(event.target.value)}
                  maxLength={200}
                  required
                  className={`${field} mt-2`}
                />
              </label>
              <label className="text-xs">
                Duration
                <input
                  value={duration}
                  onChange={event => setDuration(event.target.value)}
                  required
                  className={`${field} mt-2`}
                  placeholder="5 min"
                />
              </label>
              <button disabled={disabled} className={`${button} self-end`}>
                Start timer
              </button>
            </form>
            <div className="space-y-2">
              {state.timers
                .filter(item => item.status === "active")
                .map(timer => (
                  <div
                    key={timer.id}
                    className="flex items-center justify-between gap-3 border border-cyan-100/15 p-3"
                  >
                    <div>
                      <div className="text-sm">{timer.title}</div>
                      <div
                        className="mt-1 font-mono text-xl text-cyan-200"
                        aria-label={`Countdown for ${timer.title}`}
                      >
                        {countdown(timer.dueAt, now)}
                      </div>
                    </div>
                    <button
                      disabled={disabled}
                      onClick={() =>
                        void execute("task.cancel", { id: timer.id })
                      }
                      className={button}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              {!state.timers.some(item => item.status === "active") && (
                <p className="text-xs text-cyan-100/50">
                  No active countdowns.
                </p>
              )}
            </div>
            <form
              onSubmit={saveReminder}
              className="space-y-3 border-t border-cyan-100/15 pt-5"
            >
              <label className="block text-xs">
                Reminder
                <input
                  value={reminder}
                  onChange={event => setReminder(event.target.value)}
                  maxLength={1000}
                  required
                  className={`${field} mt-2`}
                  placeholder="Stretch, drink water, review notes…"
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={oneTime}
                  onChange={event => setOneTime(event.target.checked)}
                />
                One-time reminder
              </label>
              <div className="flex items-end gap-3">
                {oneTime ? (
                  <label className="flex-1 text-xs">
                    Local date and time
                    <input
                      type="datetime-local"
                      value={at}
                      onChange={event => setAt(event.target.value)}
                      required
                      className={`${field} mt-2`}
                    />
                  </label>
                ) : (
                  <label className="flex-1 text-xs">
                    Repeat every (minutes)
                    <input
                      type="number"
                      min={1}
                      max={10080}
                      step={1}
                      value={minutes}
                      onChange={event => setMinutes(Number(event.target.value))}
                      required
                      className={`${field} mt-2`}
                    />
                  </label>
                )}
                <button disabled={disabled} className={button}>
                  Create reminder
                </button>
              </div>
            </form>
            <p className="text-xs leading-relaxed text-cyan-100/55">
              Reminders appear while Nexo is running. Browser reminders catch up
              when you reopen the page; they cannot wake a closed browser. The
              server continues scheduling while its process is running.
            </p>
            <div className="space-y-3">
              {state.automations.map(item => (
                <article
                  key={item.id}
                  className="flex items-center justify-between gap-3 border border-cyan-100/15 p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm">{item.prompt}</p>
                    <p className="mt-1 text-xs text-cyan-100/50">
                      {item.enabled ? "Enabled" : "Paused"} ·{" "}
                      {item.schedule.startsWith("every ")
                        ? item.schedule
                        : new Date(item.schedule).toLocaleString()}
                      {item.nextRun &&
                        ` · Next ${new Date(item.nextRun).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      disabled={disabled}
                      onClick={() =>
                        void execute("automation.toggle", {
                          id: item.id,
                          enabled: !item.enabled,
                        })
                      }
                      className={button}
                      aria-label={`${item.enabled ? "Pause" : "Resume"} ${item.name}`}
                    >
                      {item.enabled ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      disabled={disabled}
                      onClick={() =>
                        void execute("automation.delete", { id: item.id })
                      }
                      className={button}
                      aria-label={`Delete reminder ${item.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {module === "terminal" && (
          <div className="space-y-5">
            <div className="flex gap-2">
              <button
                className={button}
                onClick={() => {
                  onClose();
                  onCommand("System status");
                }}
              >
                Run status check
              </button>
              <button
                className={button}
                onClick={() =>
                  downloadJSON(
                    { traces: state.traces, audit: state.audit },
                    "nexo-execution-history.json"
                  )
                }
              >
                <Download size={14} />
                Export trace
              </button>
            </div>
            {state.traces
              .slice()
              .reverse()
              .map(trace => (
                <details
                  key={trace.id}
                  className="border border-cyan-100/15 p-3"
                >
                  <summary className="cursor-pointer text-sm">
                    {trace.state === "error" ? "Blocked" : "Verified"} ·{" "}
                    {trace.intent} ·{" "}
                    {new Date(trace.startedAt).toLocaleTimeString()}
                  </summary>
                  <div className="mt-3 space-y-2 text-xs">
                    {trace.error && (
                      <p className="text-amber-100">{trace.error}</p>
                    )}
                    {trace.toolCalls.map(call => (
                      <div
                        key={call.id}
                        className="border-l border-cyan-200/30 pl-3"
                      >
                        <p>
                          {call.tool} · {call.permission} ·{" "}
                          {call.verified ? "completed" : "blocked"}
                        </p>
                        <pre className="mt-1 whitespace-pre-wrap break-all text-cyan-100/50">
                          {JSON.stringify(call.input, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            {!state.traces.length && (
              <p className="text-sm text-cyan-100/50">
                Issue a command to see its execution trace.
              </p>
            )}
            <h3 className="technical-label">Recent audit</h3>
            {state.audit
              .slice(-20)
              .reverse()
              .map(entry => (
                <p
                  key={entry.id}
                  className="font-mono text-xs text-cyan-100/65"
                >
                  {new Date(entry.createdAt).toLocaleTimeString()} ·{" "}
                  {entry.action} · {entry.ok ? "OK" : "BLOCKED"}
                </p>
              ))}
          </div>
        )}

        {module === "monitor" && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Runtime", assistant.status.runtime],
                [
                  "Workspace",
                  assistant.mode === "server"
                    ? "Server persistence"
                    : "Browser storage",
                ],
                [
                  "AI conversation",
                  assistant.status.aiConfigured
                    ? "Configured"
                    : "Provider not configured",
                ],
                ["Saved notes", state.memory.length],
                [
                  "Active timers",
                  state.timers.filter(item => item.status === "active").length,
                ],
                [
                  "Enabled reminders",
                  state.automations.filter(item => item.enabled).length,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="border border-cyan-100/15 p-3"
                >
                  <div className="technical-label">{label}</div>
                  <div className="mt-2 text-sm">{String(value)}</div>
                </div>
              ))}
            </div>
            <button className={button} onClick={() => void assistant.refresh()}>
              Refresh runtime
            </button>
            <h3 className="technical-label">
              Tool registry · {assistant.tools.length} tools
            </h3>
            {assistant.tools.map(tool => (
              <article
                key={tool.name}
                className="border-b border-cyan-100/10 pb-3"
              >
                <p className="font-mono text-xs">
                  {tool.name}{" "}
                  <span className="text-cyan-200/55">· {tool.permission}</span>
                </p>
                <p className="mt-1 text-xs text-cyan-100/50">
                  {tool.description}
                </p>
              </article>
            ))}
          </div>
        )}

        {(module === "media" || module === "settings") && (
          <div className="space-y-5">
            {module === "settings" && (
              <>
                <label className="block text-xs">
                  Your name
                  <input
                    value={preferences.name}
                    onChange={event =>
                      onPreferences({ name: event.target.value })
                    }
                    maxLength={60}
                    className={`${field} mt-2`}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={preferences.readOnly}
                    onChange={event =>
                      onPreferences({ readOnly: event.target.checked })
                    }
                  />
                  Read-only commands and workspace
                </label>
                <div className="border border-cyan-100/15 p-3">
                  <p className="text-sm">
                    {assistant.mode === "server"
                      ? "Connected to the Nexo server"
                      : "Browser-local assistant"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-cyan-100/55">
                    {assistant.status.aiConfigured
                      ? "Open-ended conversation uses your configured server AI provider. Relevant notes and recent conversation are included with your request."
                      : "Notes, timers, reminders and live data work without an AI key. For open-ended conversation, run the Node server with OPENAI_API_KEY. Keys remain on the server. See README for setup."}
                  </p>
                  <button
                    className={`${button} mt-3`}
                    onClick={() => void assistant.refresh()}
                  >
                    Refresh connection
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="technical-label">
                    Weather location ·{" "}
                    {coordinates
                      ? `${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)}`
                      : "Not set"}
                  </p>
                  <form
                    onSubmit={event => {
                      event.preventDefault();
                      const lat = Number(latitude),
                        lon = Number(longitude);
                      if (
                        !latitude.trim() ||
                        !longitude.trim() ||
                        !Number.isFinite(lat) ||
                        !Number.isFinite(lon) ||
                        Math.abs(lat) > 90 ||
                        Math.abs(lon) > 180
                      ) {
                        toast.error("Enter valid latitude and longitude.");
                        return;
                      }
                      onCoordinates({ latitude: lat, longitude: lon });
                      toast.success("Weather location updated");
                    }}
                    className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <input
                      value={latitude}
                      onChange={event => setLatitude(event.target.value)}
                      className={field}
                      type="number"
                      min={-90}
                      max={90}
                      step="any"
                      required
                      placeholder="Latitude"
                      aria-label="Latitude"
                    />
                    <input
                      value={longitude}
                      onChange={event => setLongitude(event.target.value)}
                      className={field}
                      type="number"
                      min={-180}
                      max={180}
                      step="any"
                      required
                      placeholder="Longitude"
                      aria-label="Longitude"
                    />
                    <button className={button}>Set location</button>
                  </form>
                </div>
              </>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferences.voiceEnabled}
                onChange={event => {
                  onPreferences({ voiceEnabled: event.target.checked });
                  if (!event.target.checked) window.speechSynthesis?.cancel();
                }}
              />
              Speak assistant responses
            </label>
            <label className="block text-xs">
              Recognition language
              <select
                value={preferences.language}
                onChange={event =>
                  onPreferences({
                    language: event.target.value as Preferences["language"],
                  })
                }
                className={`${field} mt-2`}
              >
                <option value="en-GB">English</option>
                <option value="de-DE">Deutsch</option>
              </select>
            </label>
            <label className="block text-xs">
              Voice
              <select
                value={preferences.voice}
                onChange={event => onPreferences({ voice: event.target.value })}
                className={`${field} mt-2`}
              >
                <option value="">Browser default</option>
                {voices.map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              Speech speed · {preferences.rate.toFixed(2)}
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={preferences.rate}
                onChange={event =>
                  onPreferences({ rate: Number(event.target.value) })
                }
                className="mt-2 w-full accent-cyan-300"
              />
            </label>
            <button className={button} onClick={testVoice}>
              <Volume2 size={14} />
              Test voice
            </button>
            {module === "settings" && (
              <div className="flex flex-wrap gap-3 border-t border-cyan-100/15 pt-4">
                <button
                  className={button}
                  onClick={() =>
                    downloadJSON(
                      state,
                      `nexo-workspace-${new Date().toISOString().slice(0, 10)}.json`
                    )
                  }
                >
                  <Download size={14} />
                  Export workspace
                </button>
                {assistant.recovery && (
                  <button
                    className={button}
                    onClick={() =>
                      downloadJSON(
                        assistant.recovery,
                        "nexo-workspace-recovery.json"
                      )
                    }
                  >
                    Download recovery file
                  </button>
                )}
                <button
                  className={button}
                  onClick={() => {
                    if (!("Notification" in window)) {
                      toast.error(
                        "Desktop notifications are unavailable in this browser."
                      );
                      return;
                    }
                    void Notification.requestPermission().then(permission =>
                      toast(
                        permission === "granted"
                          ? "Desktop notifications enabled while Nexo is open."
                          : "In-app notifications remain available."
                      )
                    );
                  }}
                >
                  Enable desktop notifications
                </button>
              </div>
            )}
          </div>
        )}

        {module === "notifications" && (
          <div className="space-y-3">
            <button
              className={button}
              disabled={disabled}
              onClick={() => void execute("notification.ack", {})}
            >
              Mark all as read
            </button>
            {state.notifications
              .slice()
              .reverse()
              .map(item => (
                <article
                  key={item.id}
                  className={`border p-3 ${item.read ? "border-cyan-100/10 text-cyan-100/50" : "border-cyan-200/30 text-cyan-50"}`}
                >
                  <p className="text-sm">{item.text}</p>
                  <p className="mt-1 text-xs text-cyan-100/40">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </article>
              ))}
            {!state.notifications.length && (
              <p className="text-sm text-cyan-100/50">
                Completed timers and scheduled reminders appear here.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
