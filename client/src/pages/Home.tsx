/**
 * Nexo Jarvis — Orbital Instrumentation home command bay.
 * Keep the holographic core primary; use precise telemetry peripherally and Nexo Cyan only for live states.
 */
import {
  Activity,
  ArrowUpRight,
  AudioLines,
  Bell,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  CloudSun,
  Command,
  ExternalLink,
  Gauge,
  Headphones,
  MapPin,
  Maximize,
  Maximize2,
  Mic,
  MicOff,
  Minimize,
  Moon,
  Newspaper,
  PanelLeft,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Sparkles,
  TerminalSquare,
  TimerReset,
  Volume2,
  WifiOff,
  X,
} from "lucide-react";
import {
  FormEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { getCurrentWeather, getLatestHeadlines } from "@shared/liveData";
import { newId } from "@shared/nexo/store";
import { useAssistant } from "@/hooks/useAssistant";
import { usePreferences } from "@/hooks/usePreferences";
import WorkspacePanels, {
  countdown,
  type WorkspaceModule,
} from "@/components/WorkspacePanels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NexoCore3D = lazy(() => import("@/components/NexoCore3D"));

type AssistantState = "idle" | "listening" | "thinking" | "speaking";
type Module = WorkspaceModule;

type Conversation = {
  id: string;
  sender: "user" | "nexo";
  text: string;
  time: string;
};

type WeatherTelemetry = {
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  condition: string;
  timezone: string;
};

type LiveHeadline = {
  title: string;
  url: string;
  domain: string;
};

const moduleItems: { id: Module; label: string; icon: typeof Command }[] = [
  { id: "command", label: "Command bay", icon: Command },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
  { id: "knowledge", label: "Knowledge", icon: BrainCircuit },
  { id: "automations", label: "Timers & reminders", icon: TimerReset },
  { id: "media", label: "Voice controls", icon: Headphones },
  { id: "monitor", label: "System monitor", icon: Gauge },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const shortcutPrompts = [
  "Summarize today",
  "Set a 5 min timer",
  "Read my notes",
  "Open knowledge base",
];

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export default function Home() {
  const assistant = useAssistant();
  const {
    preferences,
    update: updatePreferences,
    warning: preferencesWarning,
  } = usePreferences();
  const [now, setNow] = useState(() => new Date());
  const [activeModule, setActiveModule] = useState<Module>("command");
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [isRailOpen, setIsRailOpen] = useState(false);
  const isSoundOn = preferences.voiceEnabled;
  const [input, setInput] = useState("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(preferences.coordinates);
  const [locationState, setLocationState] = useState<
    "locating" | "ready" | "denied"
  >("locating");
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [headlines, setHeadlines] = useState<LiveHeadline[]>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [headlinesError, setHeadlinesError] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedCalendarProvider, setSelectedCalendarProvider] = useState<
    "google" | "outlook" | null
  >(null);
  const [coreTilt, setCoreTilt] = useState({ x: 0, y: 0 });
  const [webglEnabled, setWebglEnabled] = useState(false);
  const [coreFocusOpen, setCoreFocusOpen] = useState(false);
  const [coreSceneKey, setCoreSceneKey] = useState(0);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<Conversation | null>(
    null
  );
  const commandBusy = useRef(false);
  const sessionStartedAt = useRef(Date.now());
  const notified = useRef(new Set<string>());
  const conversation: Conversation[] = assistant.workspace.conversation.map(
    item => ({
      ...item,
      time: formatClock(new Date(item.createdAt)).slice(0, 5),
    })
  );
  if (pendingCommand) conversation.push(pendingCommand);
  const activeTimers = assistant.workspace.timers
    .filter(item => item.status === "active")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const unreadNotifications = assistant.workspace.notifications.filter(
    item => !item.read
  ).length;
  const latestTrace = assistant.workspace.traces.at(-1);
  const speechRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newNotifications = assistant.workspace.notifications.filter(
      item => !item.read && !notified.current.has(item.id)
    );
    for (const item of newNotifications) notified.current.add(item.id);
    for (const item of newNotifications.slice(-5)) {
      toast(item.text, {
        duration: 10000,
        action: {
          label: "View",
          onClick: () => setActiveModule("notifications"),
        },
      });
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      )
        new Notification("Nexo reminder", { body: item.text, tag: item.id });
    }
  }, [assistant.workspace.notifications]);

  useEffect(
    () => () => {
      speechRef.current?.abort?.();
      window.speechSynthesis?.cancel();
    },
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (preferences.coordinates) {
      setLocationState("ready");
      return;
    }
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationState("ready");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 900_000 }
    );
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const reducedMotionPreview = new URLSearchParams(
      window.location.search
    ).has("reducedMotionPreview");
    try {
      const canvas = document.createElement("canvas");
      const hasWebGL = Boolean(
        canvas.getContext("webgl2") || canvas.getContext("webgl")
      );
      setWebglEnabled(hasWebGL && !reducedMotion && !reducedMotionPreview);
    } catch {
      setWebglEnabled(false);
    }
  }, []);

  useEffect(() => {
    setFullscreenSupported(Boolean(document.fullscreenEnabled));
    const syncFullscreen = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenEnabled) return;
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    void request.catch(() =>
      setIsFullscreen(Boolean(document.fullscreenElement))
    );
  }, []);

  useEffect(() => {
    // "F" maximizes the command deck, mirroring media players; ignored while typing or with modifiers.
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        (event.key !== "f" && event.key !== "F") ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (
        (event.target as HTMLElement | null)?.closest(
          "input, textarea, select, [contenteditable='true']"
        )
      )
        return;
      event.preventDefault();
      toggleFullscreen();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [toggleFullscreen]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [assistant.workspace.conversation, pendingCommand]);

  const statusCopy = useMemo(
    () =>
      ({
        idle: "Awaiting a command",
        listening: "Listening — speak freely",
        thinking: "Processing intent",
        speaking: "Response in progress",
      })[assistantState],
    [assistantState]
  );

  const refreshWeather = useCallback(
    async (location: { latitude: number; longitude: number }) => {
      setWeatherLoading(true);
      setWeatherError(false);
      try {
        setWeather(
          await getCurrentWeather(location.latitude, location.longitude)
        );
      } catch {
        setWeatherError(true);
      } finally {
        setWeatherLoading(false);
      }
    },
    []
  );

  const refreshHeadlines = useCallback(async () => {
    setHeadlinesLoading(true);
    setHeadlinesError(false);
    try {
      setHeadlines(await getLatestHeadlines());
    } catch {
      setHeadlinesError(true);
    } finally {
      setHeadlinesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (coordinates) void refreshWeather(coordinates);
  }, [coordinates, refreshWeather]);

  useEffect(() => {
    void refreshHeadlines();
  }, [refreshHeadlines]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (coordinates) void refreshWeather(coordinates);
      void refreshHeadlines();
    };
    const interval = window.setInterval(refreshOnFocus, 600_000);
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [coordinates, refreshHeadlines, refreshWeather]);

  const submitCommand = async (value = input) => {
    const clean = value.trim();
    if (
      !clean ||
      commandBusy.current ||
      !assistant.isReady ||
      !assistant.connected
    )
      return;
    commandBusy.current = true;
    window.speechSynthesis?.cancel();
    speechRef.current?.abort?.();
    const userTime = formatClock(new Date()).slice(0, 5);
    setPendingCommand({
      id: newId("pending"),
      sender: "user",
      text: clean,
      time: userTime,
    });
    setInput("");
    setAssistantState("thinking");
    if (/^open knowledge base$/i.test(clean)) setActiveModule("knowledge");
    try {
      const { response: reply } = await assistant.run(
        clean,
        { coordinates: coordinates ?? undefined },
        preferences.readOnly
      );
      setPendingCommand(null);
      if (isSoundOn && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.lang = preferences.language;
        utterance.rate = preferences.rate;
        utterance.voice =
          window.speechSynthesis
            .getVoices()
            .find(voice => voice.voiceURI === preferences.voice) ?? null;
        utterance.onend = utterance.onerror = () => setAssistantState("idle");
        setAssistantState("speaking");
        window.speechSynthesis.speak(utterance);
      } else setAssistantState("idle");
    } catch {
      setPendingCommand(null);
      setAssistantState("idle");
    } finally {
      commandBusy.current = false;
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitCommand();
  };

  const toggleListening = () => {
    if (assistant.isBusy || !assistant.isReady) return;
    if (assistantState === "listening") {
      speechRef.current?.stop?.();
      setAssistantState("idle");
      return;
    }

    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      toast(
        "Voice recognition is unavailable in this browser. Use the text console."
      );
      return;
    }

    const recognition = new Recognition();
    window.speechSynthesis?.cancel();
    recognition.lang = preferences.language;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      void submitCommand(event.results[0][0].transcript);
    };
    recognition.onerror = (event: any) => {
      setAssistantState("idle");
      if (event.error !== "aborted")
        toast.error(
          `Voice input unavailable: ${event.error ?? "recognition failed"}`
        );
    };
    recognition.onend = () =>
      setAssistantState(state => (state === "listening" ? "idle" : state));
    speechRef.current = recognition;
    setAssistantState("listening");
    try {
      recognition.start();
    } catch {
      setAssistantState("idle");
      toast.error("Voice input could not start. Check microphone permissions.");
    }
  };

  const handleCorePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setCoreTilt({
      x: Number((y * -7).toFixed(2)),
      y: Number((x * 7).toFixed(2)),
    });
  };

  const coreClass = assistantState === "idle" ? "" : `core-${assistantState}`;
  const moduleTitle =
    moduleItems.find(item => item.id === activeModule)?.label ?? "Command bay";

  return (
    <div className="app-shell">
      <div className="ambient-plate" />
      <div className="grain" />

      <header className="relative z-20 flex h-[76px] items-center justify-between border-b border-cyan-100/10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsRailOpen(open => !open)}
            className="grid h-9 w-9 place-items-center border border-cyan-100/15 bg-cyan-100/[0.025] text-cyan-50 transition-colors hover:border-cyan-300/40 hover:bg-cyan-300/[0.08] lg:hidden"
            aria-label="Toggle navigation"
          >
            {isRailOpen ? <X size={18} /> : <PanelLeft size={18} />}
          </button>
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}nexo-logo.svg`}
              alt="Nexo Prism"
              className="h-9 w-9 object-contain drop-shadow-[0_0_13px_rgba(38,228,255,0.7)]"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[1.05rem] font-bold tracking-[0.18em] text-white">
                  NEXO
                </span>
                <span className="technical-label text-cyan-200/75">Jarvis</span>
              </div>
              <p className="technical-label mt-0.5 text-[0.5rem] tracking-[0.13em] text-cyan-100/45">
                Personal command environment
              </p>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-2">
            <span className="signal-dot" />
            <span className="technical-label text-cyan-100">
              {assistant.mode === "checking"
                ? "Connecting workspace"
                : !assistant.connected
                  ? "Server disconnected"
                  : assistant.status.aiConfigured
                    ? "AI conversation online"
                    : "Command engine ready"}
            </span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm tracking-[0.12em] text-cyan-50">
              {formatClock(now)}
            </div>
            <div className="technical-label mt-0.5 text-[0.52rem]">
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
              }).format(now)}{" "}
              · {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fullscreenSupported && (
            <button
              onClick={toggleFullscreen}
              className={`hidden h-9 w-9 place-items-center transition-colors hover:text-cyan-200 sm:grid ${isFullscreen ? "text-cyan-200" : "text-cyan-50/70"}`}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-pressed={isFullscreen}
              aria-keyshortcuts="F"
              title={`${isFullscreen ? "Exit" : "Enter"} fullscreen (F)`}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          )}
          <button
            onClick={() => setActiveModule("notifications")}
            className="relative grid h-9 w-9 place-items-center text-cyan-50/70 transition-colors hover:text-cyan-200"
            aria-label={`Notifications, ${unreadNotifications} unread`}
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute right-0 top-0 grid min-w-4 place-items-center rounded-full bg-amber-300 px-1 text-[0.6rem] text-black">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              updatePreferences({ voiceEnabled: !isSoundOn });
              if (isSoundOn) {
                window.speechSynthesis?.cancel();
                setAssistantState("idle");
              }
            }}
            className={`grid h-9 w-9 place-items-center transition-colors ${isSoundOn ? "text-cyan-200" : "text-cyan-50/35"}`}
            aria-label="Toggle voice output"
            aria-pressed={isSoundOn}
          >
            {isSoundOn ? <Volume2 size={18} /> : <MicOff size={18} />}
          </button>
          <div className="ml-1 grid h-8 w-8 place-items-center border border-cyan-100/20 bg-cyan-200/10 font-mono text-[0.68rem] text-cyan-100">
            {preferences.name
              .trim()
              .split(/\s+/)
              .map(part => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "N"}
          </div>
        </div>
      </header>

      <div className="command-deck-body relative z-10 flex min-h-[calc(100svh-76px)]">
        <aside
          className={`absolute inset-y-0 left-0 z-30 w-[232px] border-r border-cyan-100/10 bg-[#061016]/95 px-3 py-5 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0 ${isRailOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="technical-label mb-3 px-3 text-[0.55rem]">
            Workspace modules
          </div>
          <nav className="space-y-1">
            {moduleItems.map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id);
                    setIsRailOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left text-sm transition-all ${isActive ? "border-cyan-300 bg-cyan-300/[0.09] text-cyan-50" : "border-transparent text-cyan-100/50 hover:border-cyan-300/40 hover:bg-cyan-300/[0.04] hover:text-cyan-50"}`}
                >
                  <Icon size={17} strokeWidth={isActive ? 2 : 1.5} />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight size={15} className="ml-auto text-cyan-300" />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="absolute bottom-5 left-3 right-3">
            <div className="instrument-panel panel-cut relative overflow-hidden p-3">
              <div className="corner-mark" />
              <div className="technical-label mb-3 text-[0.53rem]">
                Quick capture
              </div>
              <button
                onClick={() => {
                  setActiveModule("knowledge");
                  setIsRailOpen(false);
                }}
                className="flex w-full items-center justify-between text-left text-xs text-cyan-50/70 transition-colors hover:text-cyan-200"
              >
                <span className="flex items-center gap-2">
                  <Plus size={14} />
                  New note
                </span>
                <span className="font-mono text-[0.58rem] text-cyan-200/45">
                  N
                </span>
              </button>
            </div>
          </div>
        </aside>

        {isRailOpen && (
          <button
            aria-label="Close navigation"
            className="absolute inset-0 z-20 bg-black/55 lg:hidden"
            onClick={() => setIsRailOpen(false)}
          />
        )}

        <main className="command-deck-main relative min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="command-deck-heading mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="technical-label mb-1 text-cyan-200/70">
                Module / {moduleTitle}
              </div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-[1.8rem]">
                Good{" "}
                {now.getHours() < 12
                  ? "morning"
                  : now.getHours() < 18
                    ? "afternoon"
                    : "evening"}
                , {preferences.name.trim() || "Commander"}.
              </h1>
            </div>
            <div className="hidden text-right sm:block">
              <div className="technical-label">Session duration</div>
              <div className="mt-1 font-mono text-xs text-cyan-100/70">
                {new Date(Math.max(0, now.getTime() - sessionStartedAt.current))
                  .toISOString()
                  .slice(11, 19)}
              </div>
            </div>
          </div>

          <div className="command-grid grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="command-core-panel instrument-panel panel-cut relative min-h-[610px] overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
              <div className="corner-mark" />
              <svg
                className="signal-network"
                viewBox="0 0 900 440"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  className="signal-route-soft"
                  d="M 0 66 H 180 L 260 142"
                />
                <path className="signal-route" d="M 900 78 H 742 L 642 158" />
                <path
                  className="signal-route-soft"
                  d="M 895 307 H 724 L 630 255"
                />
                <path className="signal-route" d="M 0 328 H 182 L 278 276" />
                <path className="signal-route-soft" d="M 113 220 H 278" />
                <path className="signal-route-soft" d="M 622 220 H 792" />
                <circle className="signal-node" cx="742" cy="78" r="2.4" />
                <circle className="signal-node" cx="182" cy="328" r="2.4" />
                <circle className="signal-node" cx="622" cy="220" r="2" />
              </svg>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-100/10 pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${assistantState === "thinking" ? "bg-amber-300 shadow-[0_0_10px_#ffb14a]" : "bg-cyan-300 shadow-[0_0_10px_#26e4ff]"}`}
                  />
                  <span className="technical-label text-cyan-50/80">
                    {statusCopy}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="technical-label hidden text-[0.54rem] sm:block">
                    Voice input · browser native
                  </span>
                  <button
                    onClick={toggleListening}
                    disabled={assistant.isBusy || !assistant.isReady}
                    className={`microphone-button flex items-center gap-2 border px-3 py-1.5 text-xs font-medium ${assistantState === "listening" ? "border-cyan-200 bg-cyan-200/15 text-cyan-50 shadow-[0_0_20px_rgba(38,228,255,.18)]" : "border-cyan-100/20 bg-cyan-100/[0.04] text-cyan-100/70 hover:border-cyan-200/60 hover:text-cyan-50"}`}
                  >
                    <Mic size={14} />
                    {assistantState === "listening" ? "Stop" : "Speak"}
                  </button>
                </div>
              </div>

              <div className="command-core-viewport relative flex min-h-[372px] items-center justify-center overflow-hidden">
                <div className="absolute left-2 top-5 hidden text-left sm:block">
                  <div className="technical-label">Runtime mode</div>
                  <div className="mt-1 font-mono text-xs text-cyan-50">
                    {assistant.mode.toUpperCase()}
                  </div>
                  <div className="mt-5 technical-label">Last execution</div>
                  <div className="mt-1 font-mono text-xs text-cyan-50">
                    {latestTrace?.completedAt
                      ? `${Date.parse(latestTrace.completedAt) - Date.parse(latestTrace.startedAt)} ms`
                      : "Awaiting input"}
                  </div>
                </div>
                <div className="absolute right-2 top-5 hidden text-right sm:block">
                  <div className="technical-label">Active channel</div>
                  <div className="mt-1 font-mono text-xs text-cyan-50">
                    {assistantState === "listening" ? "VOICE" : "TEXT"}
                  </div>
                  <div className="mt-5 technical-label">Available tools</div>
                  <div className="mt-1 font-mono text-xs text-cyan-50">
                    {assistant.tools.length}
                  </div>
                </div>
                <div
                  className={`core-stage ${coreClass} ${webglEnabled ? "core-stage-webgl" : ""}`}
                  aria-label={`Nexo core is ${assistantState}`}
                  onPointerMove={
                    webglEnabled ? undefined : handleCorePointerMove
                  }
                  onPointerLeave={
                    webglEnabled ? undefined : () => setCoreTilt({ x: 0, y: 0 })
                  }
                >
                  {webglEnabled ? (
                    <Suspense
                      fallback={
                        <div className="core-webgl-loader">
                          <span />
                          Calibrating spatial core
                        </div>
                      }
                    >
                      <NexoCore3D key={coreSceneKey} state={assistantState} />
                    </Suspense>
                  ) : (
                    <>
                      <div
                        className="core-depth"
                        style={{
                          transform: `rotateX(${coreTilt.x}deg) rotateY(${coreTilt.y}deg)`,
                        }}
                        aria-hidden="true"
                      >
                        <div className="core-depth-shell core-depth-shell-a" />
                        <div className="core-depth-shell core-depth-shell-b" />
                        <div className="core-depth-lens" />
                        <i className="core-particle core-particle-a" />
                        <i className="core-particle core-particle-b" />
                        <i className="core-particle core-particle-c" />
                      </div>
                      <div className="orbit" />
                      <img
                        className="core-image"
                        src={`${import.meta.env.BASE_URL}nexo-core.svg`}
                        alt="Animated Nexo orbital core"
                      />
                      <div className="core-glare" aria-hidden="true" />
                    </>
                  )}
                  <div className="core-control-strip">
                    <button
                      onClick={() => setCoreSceneKey(key => key + 1)}
                      className="core-control"
                      aria-label="Reset 3D core view"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      onClick={() => setCoreFocusOpen(true)}
                      className="core-control"
                      aria-label="Open immersive 3D core"
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                  <div className="absolute bottom-3 z-10 text-center">
                    <div className="technical-label text-cyan-100/55">
                      Nexo core {webglEnabled ? "· WebGL" : "· fallback"}
                    </div>
                    <div className="mt-1 text-xs text-cyan-50">
                      {assistantState === "idle" ? "Standing by" : statusCopy}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-t border-cyan-100/10 pt-4 lg:grid-cols-[1fr_0.82fr]">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="technical-label">Conversation stream</span>
                    <span className="font-mono text-[0.6rem] text-cyan-100/35">
                      {conversation.length.toString().padStart(2, "0")} messages
                    </span>
                  </div>
                  <div
                    ref={transcriptRef}
                    role="log"
                    aria-label="Conversation stream"
                    aria-live="polite"
                    className="transcript-scroll h-[98px] space-y-2 overflow-y-auto pr-2"
                  >
                    {!conversation.length && (
                      <p className="text-xs text-cyan-100/55">
                        Ready to help. Save a note, start a timer, or type Help
                        for available commands.
                      </p>
                    )}
                    {conversation.map(item => (
                      <div
                        key={item.id}
                        className={`flex gap-3 text-xs ${item.sender === "user" ? "justify-end" : ""}`}
                      >
                        <span
                          className={`max-w-[86%] whitespace-pre-wrap break-words leading-relaxed ${item.sender === "nexo" ? "text-cyan-50/82" : "text-cyan-200"}`}
                        >
                          {item.text}
                        </span>
                        <span className="shrink-0 font-mono text-[0.59rem] text-cyan-100/30">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative flex flex-col justify-end">
                  <form
                    onSubmit={onSubmit}
                    className="flex items-center gap-2 border border-cyan-100/15 bg-black/20 px-3 py-2 focus-within:border-cyan-300/60 focus-within:shadow-[0_0_0_3px_rgba(38,228,255,.07)]"
                  >
                    <Command size={15} className="shrink-0 text-cyan-200/70" />
                    <input
                      value={input}
                      onChange={event => setInput(event.target.value)}
                      maxLength={4000}
                      disabled={
                        assistant.isBusy ||
                        !assistant.isReady ||
                        !assistant.connected
                      }
                      aria-label="Issue a command"
                      placeholder={
                        assistant.isBusy
                          ? "Executing command…"
                          : "Issue a command…"
                      }
                      className="min-w-0 flex-1 bg-transparent text-sm text-cyan-50 outline-none placeholder:text-cyan-100/28"
                    />
                    <button
                      type="submit"
                      disabled={
                        assistant.isBusy ||
                        !assistant.isReady ||
                        !assistant.connected ||
                        !input.trim()
                      }
                      className="grid h-7 w-7 disabled:opacity-40 place-items-center bg-cyan-300 text-[#031114] transition-transform hover:bg-cyan-100 active:scale-95"
                      aria-label="Send command"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                  {(assistant.error || preferencesWarning) && (
                    <div role="alert" className="mt-2 text-xs text-amber-100">
                      {assistant.error || preferencesWarning}
                      <button
                        onClick={() => {
                          assistant.clearError();
                          void assistant.refresh();
                        }}
                        className="ml-2 underline"
                      >
                        Retry connection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="telemetry-rail grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <section className="instrument-panel perimeter-module panel-cut relative min-h-[200px] overflow-hidden border-l p-5">
                <div className="corner-mark" />
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <div className="technical-label">Local weather</div>
                    {weatherLoading ? (
                      <div className="live-loading-title">
                        <span className="live-loading-orbit" />
                        Reading local telemetry
                      </div>
                    ) : (
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                        {weather
                          ? `${Math.round(weather.temperature)}°`
                          : locationState === "locating"
                            ? "—"
                            : "Location"}
                      </h2>
                    )}
                    <p className="mt-1 max-w-[13rem] text-xs leading-relaxed text-cyan-50/56">
                      {weather
                        ? `${weather.condition} · Feels like ${Math.round(weather.apparentTemperature)}°`
                        : weatherError
                          ? "Weather relay is temporarily unavailable."
                          : locationState === "denied"
                            ? "Enable location access to receive weather telemetry."
                            : "Locating your command environment…"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      coordinates && void refreshWeather(coordinates)
                    }
                    disabled={!coordinates || weatherLoading}
                    className="grid h-7 w-7 place-items-center text-cyan-200 transition-colors hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:text-cyan-100/25"
                    aria-label="Refresh weather"
                  >
                    <CloudSun size={22} />
                  </button>
                </div>
                {weatherLoading && (
                  <div
                    className="live-loading-stack"
                    aria-label="Loading weather data"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                <div className="relative z-10 mt-4 flex items-center gap-2 pb-2 text-xs text-cyan-200">
                  <MapPin size={13} />
                  {weather
                    ? `${Math.round(weather.windSpeed)} km/h wind · ${weather.timezone}`
                    : "Awaiting coordinates"}
                </div>
                <span className="module-coordinate">WX · LIVE</span>
              </section>

              <section className="instrument-panel perimeter-module panel-cut relative min-h-[225px] border-l p-5">
                <div className="corner-mark" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="technical-label">News relay</div>
                    <div className="mt-2 text-base font-semibold text-white">
                      Current signals
                    </div>
                  </div>
                  <button
                    onClick={() => void refreshHeadlines()}
                    disabled={headlinesLoading}
                    className="grid h-7 w-7 place-items-center text-cyan-300 transition-colors hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:text-cyan-100/25"
                    aria-label="Refresh news"
                  >
                    <RefreshCw
                      size={17}
                      className={headlinesLoading ? "animate-spin" : ""}
                    />
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {headlinesLoading && (
                    <div
                      className="live-news-loading"
                      aria-label="Loading news data"
                    >
                      <div className="live-news-scanline" />
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                  {headlinesError && (
                    <div className="flex items-center gap-2 text-xs text-amber-200">
                      <WifiOff size={14} />
                      News relay is temporarily unavailable.
                    </div>
                  )}
                  {headlines.map((headline, index) => (
                    <a
                      key={headline.url}
                      href={headline.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`${index >= 2 ? "headline-overflow " : ""}group block border-l border-cyan-300/25 pl-3 text-xs leading-relaxed text-cyan-50/76 transition-colors hover:border-cyan-200 hover:text-cyan-50`}
                    >
                      <span className="line-clamp-2">{headline.title}</span>
                      <span className="mt-1 flex items-center gap-1 font-mono text-[0.56rem] text-cyan-200/55">
                        {headline.domain}
                        <ExternalLink size={10} />
                      </span>
                    </a>
                  ))}
                </div>
                <span className="module-coordinate">NEWS · 10M</span>
              </section>

              <section className="instrument-panel perimeter-module panel-cut relative border-l p-5 sm:col-span-2 xl:col-span-1">
                <div className="corner-mark" />
                <div className="flex items-center justify-between">
                  <div className="technical-label">Calendar relay</div>
                  <CalendarDays size={17} className="text-cyan-300" />
                </div>
                <div className="mt-3">
                  <p className="text-xs leading-relaxed text-cyan-50/58">
                    No external calendar is connected. Timers and scheduled
                    reminders are available in your workspace.
                  </p>
                  <button
                    onClick={() => setActiveModule("automations")}
                    className="mt-3 flex items-center gap-2 text-xs text-cyan-200 transition-colors hover:text-white"
                  >
                    <TimerReset size={13} />
                    Open timers & reminders
                  </button>
                  <button
                    onClick={() => setCalendarDialogOpen(true)}
                    className="mt-3 flex items-center gap-2 text-xs text-cyan-100/55 hover:text-white"
                  >
                    <Settings2 size={13} />
                    Calendar provider information
                  </button>
                </div>
                <span className="module-coordinate">CAL · SECURE</span>
              </section>
            </aside>
          </div>

          <div className="status-strip mt-5 grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 border-t border-cyan-100/10 pt-3">
              <Radio size={16} className="text-cyan-300" />
              <div>
                <div className="technical-label">Network</div>
                <div className="mt-0.5 text-xs text-cyan-50/68">
                  {assistant.mode === "server"
                    ? assistant.connected
                      ? "Server workspace connected"
                      : "Server disconnected"
                    : "Browser-local workspace"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-cyan-100/10 pt-3">
              <TimerReset size={16} className="text-cyan-300" />
              <div>
                <div className="technical-label">Next reminder</div>
                <div className="mt-0.5 text-xs text-cyan-50/68">
                  {activeTimers[0]
                    ? `${activeTimers[0].title} · ${countdown(activeTimers[0].dueAt, now)}`
                    : "No active countdowns"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-cyan-100/10 pt-3">
              <Moon size={16} className="text-cyan-300" />
              <div>
                <div className="technical-label">Ambient state</div>
                <div className="mt-0.5 text-xs text-cyan-50/68">
                  {preferences.readOnly
                    ? "Read-only mode"
                    : isSoundOn
                      ? "Voice output enabled"
                      : "Silent output"}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <WorkspacePanels
        module={activeModule}
        onClose={() => setActiveModule("command")}
        assistant={assistant}
        preferences={preferences}
        onPreferences={updatePreferences}
        onCommand={command => {
          void submitCommand(command);
        }}
        coordinates={coordinates}
        onCoordinates={location => {
          updatePreferences({ coordinates: location });
          setCoordinates(location);
          setLocationState("ready");
        }}
        now={now}
      />

      <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
        <DialogContent className="max-w-md border-cyan-200/25 bg-[#071319] p-0 text-cyan-50 shadow-[0_25px_80px_rgba(0,0,0,.55)]">
          <div className="border-b border-cyan-100/10 px-6 py-5">
            <DialogHeader>
              <div className="technical-label text-cyan-200/70">
                Calendar relay / secure link
              </div>
              <DialogTitle className="mt-1 text-xl tracking-[-0.03em] text-white">
                Calendar integrations
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-cyan-50/58">
                Google and Outlook calendar connectors are not configured in
                this installation. Use workspace reminders now; connecting an
                external calendar requires a provider integration and account
                authorization.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-3 px-6 py-5">
            {[
              {
                id: "google" as const,
                name: "Google Calendar",
                detail: "View your next events and focus windows.",
              },
              {
                id: "outlook" as const,
                name: "Outlook Calendar",
                detail: "View your Microsoft 365 calendar signals.",
              },
            ].map(provider => (
              <button
                key={provider.id}
                onClick={() => setSelectedCalendarProvider(provider.id)}
                className={`w-full border p-4 text-left transition-colors ${selectedCalendarProvider === provider.id ? "border-cyan-200 bg-cyan-300/[0.1]" : "border-cyan-100/15 bg-cyan-100/[0.025] hover:border-cyan-200/45"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {provider.name}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-cyan-50/54">
                      {provider.detail}
                    </div>
                  </div>
                  <span
                    className={`technical-label text-[0.51rem] ${selectedCalendarProvider === provider.id ? "text-cyan-200" : "text-cyan-100/40"}`}
                  >
                    {selectedCalendarProvider === provider.id
                      ? "Selected"
                      : "Not connected"}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-cyan-100/10 px-6 py-4">
            <p className="text-xs leading-relaxed text-amber-100/70">
              {selectedCalendarProvider
                ? `Authorization for ${selectedCalendarProvider === "google" ? "Google Calendar" : "Outlook Calendar"} must be approved before data can be read.`
                : "No authorization request is sent from this panel. Calendar connectors require additional provider setup."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={coreFocusOpen} onOpenChange={setCoreFocusOpen}>
        <DialogContent
          className="nexo-focus-dialog max-w-none rounded-none border-0 bg-[#02080d] p-0 text-cyan-50 sm:max-w-none"
          showCloseButton={false}
        >
          <div className="nexo-focus-topbar">
            <div>
              <div className="technical-label text-cyan-200/70">
                Immersive core / spatial control
              </div>
              <div className="mt-1 text-sm text-cyan-50">
                Drag to orbit · Scroll or pinch to zoom
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCoreSceneKey(key => key + 1)}
                className="core-control core-control-large"
                aria-label="Reset immersive 3D core"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setCoreFocusOpen(false)}
                className="core-control core-control-large"
                aria-label="Close immersive 3D core"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {webglEnabled ? (
            <Suspense
              fallback={
                <div className="nexo-focus-loading">
                  Calibrating immersive scene…
                </div>
              }
            >
              <NexoCore3D
                key={`focus-${coreSceneKey}`}
                state={assistantState}
                immersive
              />
            </Suspense>
          ) : (
            <div className="nexo-focus-loading">
              The immersive WebGL scene is unavailable on this device. The
              command-bay fallback remains active.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
