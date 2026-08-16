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
  ChevronRight,
  CircleHelp,
  Command,
  Gauge,
  Headphones,
  Mic,
  MicOff,
  Moon,
  Newspaper,
  PanelLeft,
  Plus,
  Radio,
  Search,
  Send,
  Settings2,
  Sparkles,
  TerminalSquare,
  TimerReset,
  Volume2,
  X,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type AssistantState = "idle" | "listening" | "thinking" | "speaking";
type Module = "command" | "terminal" | "knowledge" | "media" | "monitor" | "settings";

type Conversation = {
  id: number;
  sender: "user" | "nexo";
  text: string;
  time: string;
};

const moduleItems: { id: Module; label: string; icon: typeof Command }[] = [
  { id: "command", label: "Command bay", icon: Command },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
  { id: "knowledge", label: "Knowledge", icon: BrainCircuit },
  { id: "media", label: "Media", icon: Headphones },
  { id: "monitor", label: "System monitor", icon: Gauge },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const shortcutPrompts = ["Summarize today", "Set a 5 min timer", "Read my notes", "Open knowledge base"];

function getReply(input: string) {
  const command = input.toLowerCase().trim();
  if (command.includes("weather")) return "Local weather telemetry is connected. Clear skies are forecast for the next few hours, with a mild breeze from the west.";
  if (command.includes("timer") || command.includes("minute")) return "Timer protocol armed. I will keep the countdown visible in the command stream.";
  if (command.includes("note")) return "Note capture is ready. Dictate the detail and I will store it in the active session.";
  if (command.includes("joke")) return "Certainly. Why did the algorithm refuse to panic? It had already considered the edge cases.";
  if (command.includes("help") || command.includes("what can")) return "You can ask for a briefing, set a timer, capture a note, check the weather, open a module, or simply speak naturally. I will interpret the intent.";
  if (command.includes("open") && command.includes("knowledge")) return "Knowledge module selected. The latest research signal is prepared at the right of your command bay.";
  if (command.includes("morning") || command.includes("today")) return "Today’s focus window is clear. I have surfaced the three signals most likely to need your attention.";
  return "Processing complete. I have logged your command and prepared the relevant workspace context. How shall we proceed?";
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date);
}

export default function Home() {
  const [now, setNow] = useState(() => new Date());
  const [activeModule, setActiveModule] = useState<Module>("command");
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<Conversation[]>([
    { id: 1, sender: "nexo", text: "Good evening. All primary systems are in range. What shall we focus on?", time: "20:41" },
  ]);
  const speechRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation]);

  const statusCopy = useMemo(() => ({
    idle: "Awaiting a command",
    listening: "Listening — speak freely",
    thinking: "Processing intent",
    speaking: "Response in progress",
  })[assistantState], [assistantState]);

  const respond = (text: string) => {
    const reply = getReply(text);
    setAssistantState("thinking");
    window.setTimeout(() => {
      const responseTime = formatClock(new Date()).slice(0, 5);
      setConversation((current) => [...current, { id: Date.now() + 1, sender: "nexo", text: reply, time: responseTime }]);
      setAssistantState("speaking");
      if (isSoundOn && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 1.04;
        utterance.pitch = 0.88;
        utterance.onend = () => setAssistantState("idle");
        window.speechSynthesis.speak(utterance);
      } else {
        window.setTimeout(() => setAssistantState("idle"), 1200);
      }
    }, 900);
  };

  const submitCommand = (value = input) => {
    const clean = value.trim();
    if (!clean) return;
    const userTime = formatClock(new Date()).slice(0, 5);
    setConversation((current) => [...current, { id: Date.now(), sender: "user", text: clean, time: userTime }]);
    setInput("");
    respond(clean);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitCommand();
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) submitCommand();
  };

  const toggleListening = () => {
    if (assistantState === "listening") {
      speechRef.current?.stop?.();
      setAssistantState("idle");
      return;
    }

    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setConversation((current) => [...current, { id: Date.now(), sender: "nexo", text: "Voice recognition is not available in this browser. You can still issue commands through the text console.", time: formatClock(new Date()).slice(0, 5) }]);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => submitCommand(event.results[0][0].transcript);
    recognition.onerror = () => setAssistantState("idle");
    recognition.onend = () => setAssistantState((state) => state === "listening" ? "idle" : state);
    speechRef.current = recognition;
    setAssistantState("listening");
    recognition.start();
  };

  const coreClass = assistantState === "idle" ? "" : `core-${assistantState}`;
  const moduleTitle = moduleItems.find((item) => item.id === activeModule)?.label ?? "Command bay";

  return (
    <div className="app-shell">
      <div className="ambient-plate" />
      <div className="grain" />

      <header className="relative z-20 flex h-[76px] items-center justify-between border-b border-cyan-100/10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsRailOpen((open) => !open)} className="grid h-9 w-9 place-items-center border border-cyan-100/15 bg-cyan-100/[0.025] text-cyan-50 transition-colors hover:border-cyan-300/40 hover:bg-cyan-300/[0.08] lg:hidden" aria-label="Toggle navigation">
            {isRailOpen ? <X size={18} /> : <PanelLeft size={18} />}
          </button>
          <div className="flex items-center gap-3">
            <img src="/manus-storage/nexo-prism-logo_dd418f34.png" alt="Nexo Prism" className="h-9 w-9 object-contain drop-shadow-[0_0_13px_rgba(38,228,255,0.7)]" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[1.05rem] font-bold tracking-[0.18em] text-white">NEXO</span>
                <span className="technical-label text-cyan-200/75">Jarvis</span>
              </div>
              <p className="technical-label mt-0.5 text-[0.5rem] tracking-[0.13em] text-cyan-100/45">Personal command environment</p>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-2"><span className="signal-dot" /><span className="technical-label text-cyan-100">Neural link online</span></div>
          <div className="text-right"><div className="font-mono text-sm tracking-[0.12em] text-cyan-50">{formatClock(now)}</div><div className="technical-label mt-0.5 text-[0.52rem]">16 August 2026 · GMT+2</div></div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative grid h-9 w-9 place-items-center text-cyan-50/70 transition-colors hover:text-cyan-200" aria-label="Notifications"><Bell size={18} /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-300" /></button>
          <button onClick={() => setIsSoundOn((on) => !on)} className={`grid h-9 w-9 place-items-center transition-colors ${isSoundOn ? "text-cyan-200" : "text-cyan-50/35"}`} aria-label="Toggle voice output">{isSoundOn ? <Volume2 size={18} /> : <MicOff size={18} />}</button>
          <div className="ml-1 grid h-8 w-8 place-items-center border border-cyan-100/20 bg-cyan-200/10 font-mono text-[0.68rem] text-cyan-100">AJ</div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-[calc(100svh-76px)]">
        <aside className={`absolute inset-y-0 left-0 z-30 w-[232px] border-r border-cyan-100/10 bg-[#061016]/95 px-3 py-5 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0 ${isRailOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="technical-label mb-3 px-3 text-[0.55rem]">Workspace modules</div>
          <nav className="space-y-1">
            {moduleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return <button key={item.id} onClick={() => { setActiveModule(item.id); setIsRailOpen(false); }} className={`group flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left text-sm transition-all ${isActive ? "border-cyan-300 bg-cyan-300/[0.09] text-cyan-50" : "border-transparent text-cyan-100/50 hover:border-cyan-300/40 hover:bg-cyan-300/[0.04] hover:text-cyan-50"}`}><Icon size={17} strokeWidth={isActive ? 2 : 1.5} /><span>{item.label}</span>{isActive && <ChevronRight size={15} className="ml-auto text-cyan-300" />}</button>;
            })}
          </nav>
          <div className="absolute bottom-5 left-3 right-3">
            <div className="instrument-panel panel-cut relative overflow-hidden p-3">
              <div className="corner-mark" />
              <div className="technical-label mb-3 text-[0.53rem]">Quick capture</div>
              <button onClick={() => submitCommand("Take a note") } className="flex w-full items-center justify-between text-left text-xs text-cyan-50/70 transition-colors hover:text-cyan-200"><span className="flex items-center gap-2"><Plus size={14} />New note</span><span className="font-mono text-[0.58rem] text-cyan-200/45">N</span></button>
            </div>
          </div>
        </aside>

        {isRailOpen && <button aria-label="Close navigation" className="absolute inset-0 z-20 bg-black/55 lg:hidden" onClick={() => setIsRailOpen(false)} />}

        <main className="relative min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="technical-label mb-1 text-cyan-200/70">Module / {moduleTitle}</div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-[1.8rem]">Good evening, Alex.</h1>
            </div>
            <div className="hidden text-right sm:block"><div className="technical-label">Session duration</div><div className="mt-1 font-mono text-xs text-cyan-100/70">02:13:48</div></div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="instrument-panel panel-cut relative min-h-[610px] overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
              <div className="corner-mark" />
              <svg className="signal-network" viewBox="0 0 900 440" preserveAspectRatio="none" aria-hidden="true">
                <path className="signal-route-soft" d="M 0 66 H 180 L 260 142" />
                <path className="signal-route" d="M 900 78 H 742 L 642 158" />
                <path className="signal-route-soft" d="M 895 307 H 724 L 630 255" />
                <path className="signal-route" d="M 0 328 H 182 L 278 276" />
                <path className="signal-route-soft" d="M 113 220 H 278" />
                <path className="signal-route-soft" d="M 622 220 H 792" />
                <circle className="signal-node" cx="742" cy="78" r="2.4" />
                <circle className="signal-node" cx="182" cy="328" r="2.4" />
                <circle className="signal-node" cx="622" cy="220" r="2" />
              </svg>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-100/10 pb-4">
                <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${assistantState === "thinking" ? "bg-amber-300 shadow-[0_0_10px_#ffb14a]" : "bg-cyan-300 shadow-[0_0_10px_#26e4ff]"}`} /><span className="technical-label text-cyan-50/80">{statusCopy}</span></div>
                <div className="flex items-center gap-4"><span className="technical-label hidden text-[0.54rem] sm:block">Voice input · browser native</span><button onClick={toggleListening} className={`microphone-button flex items-center gap-2 border px-3 py-1.5 text-xs font-medium ${assistantState === "listening" ? "border-cyan-200 bg-cyan-200/15 text-cyan-50 shadow-[0_0_20px_rgba(38,228,255,.18)]" : "border-cyan-100/20 bg-cyan-100/[0.04] text-cyan-100/70 hover:border-cyan-200/60 hover:text-cyan-50"}`}><Mic size={14} />{assistantState === "listening" ? "Stop" : "Speak"}</button></div>
              </div>

              <div className="relative flex min-h-[372px] items-center justify-center overflow-hidden">
                <div className="absolute left-2 top-5 hidden text-left sm:block"><div className="technical-label">Core index</div><div className="mt-1 font-mono text-xs text-cyan-50">04.771</div><div className="mt-5 technical-label">Inference</div><div className="mt-1 font-mono text-xs text-cyan-50">32 ms</div></div>
                <div className="absolute right-2 top-5 hidden text-right sm:block"><div className="technical-label">Active channel</div><div className="mt-1 font-mono text-xs text-cyan-50">VOICE_01</div><div className="mt-5 technical-label">Signal fidelity</div><div className="mt-1 font-mono text-xs text-cyan-50">99.8%</div></div>
                <div className={`core-stage ${coreClass}`} aria-label={`Nexo core is ${assistantState}`}>
                  <div className="orbit" />
                  <img className="core-image" src="/manus-storage/nexo-core-hero_85de455d.png" alt="Animated Nexo orbital core" />
                  <div className="absolute bottom-3 text-center"><div className="technical-label text-cyan-100/55">Nexo core</div><div className="mt-1 text-xs text-cyan-50">{assistantState === "idle" ? "Standing by" : statusCopy}</div></div>
                </div>
              </div>

              <div className="grid gap-4 border-t border-cyan-100/10 pt-4 lg:grid-cols-[1fr_0.82fr]">
                <div>
                  <div className="mb-2 flex items-center justify-between"><span className="technical-label">Conversation stream</span><span className="font-mono text-[0.6rem] text-cyan-100/35">{conversation.length.toString().padStart(2, "0")} messages</span></div>
                  <div ref={transcriptRef} className="transcript-scroll h-[98px] space-y-2 overflow-y-auto pr-2">
                    {conversation.map((item) => <div key={item.id} className={`flex gap-3 text-xs ${item.sender === "user" ? "justify-end" : ""}`}><span className={`max-w-[86%] leading-relaxed ${item.sender === "nexo" ? "text-cyan-50/82" : "text-cyan-200"}`}>{item.text}</span><span className="shrink-0 font-mono text-[0.59rem] text-cyan-100/30">{item.time}</span></div>)}
                  </div>
                </div>
                <div className="relative flex flex-col justify-end">
                  <form onSubmit={onSubmit} className="flex items-center gap-2 border border-cyan-100/15 bg-black/20 px-3 py-2 focus-within:border-cyan-300/60 focus-within:shadow-[0_0_0_3px_rgba(38,228,255,.07)]">
                    <Command size={15} className="shrink-0 text-cyan-200/70" />
                    <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onInputKeyDown} placeholder="Issue a command…" className="min-w-0 flex-1 bg-transparent text-sm text-cyan-50 outline-none placeholder:text-cyan-100/28" />
                    <button type="submit" className="grid h-7 w-7 place-items-center bg-cyan-300 text-[#031114] transition-transform hover:bg-cyan-100 active:scale-95" aria-label="Send command"><Send size={14} /></button>
                  </form>
                </div>
              </div>
            </section>

            <aside className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <section className="instrument-panel perimeter-module panel-cut relative min-h-[190px] overflow-hidden border-l p-5">
                <div className="corner-mark" />
                <div className="relative z-10 flex items-start justify-between"><div><div className="technical-label">Knowledge signal</div><h2 className="mt-2 text-base font-semibold text-white">Signals, not noise.</h2><p className="mt-1 max-w-[13rem] text-xs leading-relaxed text-cyan-50/56">A concise feed, routed toward the questions you actually ask.</p></div><ArrowUpRight size={17} className="text-cyan-200" /></div>
                <img src="/manus-storage/nexo-knowledge-atlas_b18115ae.png" alt="Abstract knowledge atlas" className="absolute bottom-[-42px] right-[-38px] w-56 opacity-55 mix-blend-screen" />
                <button onClick={() => setActiveModule("knowledge")} className="absolute bottom-4 left-5 z-10 flex items-center gap-2 text-xs text-cyan-200 transition-colors hover:text-white"><Search size={13} />Access signal</button>
                <span className="module-coordinate">AUX · 07.31</span>
              </section>

              <section className="instrument-panel perimeter-module panel-cut relative border-l p-5">
                <div className="corner-mark" />
                <div className="flex items-center justify-between"><div><div className="technical-label">System pulse</div><div className="mt-2 text-lg font-semibold text-white">Nominal</div></div><Activity size={22} className="text-cyan-300" /></div>
                <div className="mt-5 space-y-3">
                  {[{ label: "Neural bandwidth", value: 84 }, { label: "Memory cache", value: 62 }, { label: "Voice fidelity", value: 98 }].map((item) => <div key={item.label}><div className="mb-1.5 flex justify-between font-mono text-[0.6rem] text-cyan-100/55"><span>{item.label}</span><span>{item.value}%</span></div><div className="h-px bg-cyan-100/10"><div className="h-px bg-cyan-300 shadow-[0_0_7px_#26e4ff]" style={{ width: `${item.value}%` }} /></div></div>)}
                </div>
                <span className="module-coordinate">SYS · NOMINAL</span>
              </section>

              <section className="instrument-panel perimeter-module panel-cut relative border-l p-5 sm:col-span-2 xl:col-span-1">
                <div className="corner-mark" />
                <div className="flex items-center justify-between"><div className="technical-label">Command vectors</div><Sparkles size={15} className="text-cyan-300" /></div>
                <div className="mt-3 flex flex-wrap gap-2">{shortcutPrompts.map((prompt) => <button key={prompt} onClick={() => submitCommand(prompt)} className="border border-cyan-100/12 px-2.5 py-1.5 text-left text-[0.68rem] text-cyan-50/65 transition-colors hover:border-cyan-200/45 hover:bg-cyan-300/[0.06] hover:text-cyan-50">{prompt}</button>)}</div>
                <span className="module-coordinate">ROUTE · SELECT</span>
              </section>
            </aside>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 border-t border-cyan-100/10 pt-3"><Radio size={16} className="text-cyan-300" /><div><div className="technical-label">Network</div><div className="mt-0.5 text-xs text-cyan-50/68">Secure relay connected</div></div></div>
            <div className="flex items-center gap-3 border-t border-cyan-100/10 pt-3"><TimerReset size={16} className="text-cyan-300" /><div><div className="technical-label">Next reminder</div><div className="mt-0.5 text-xs text-cyan-50/68">No active countdowns</div></div></div>
            <div className="flex items-center gap-3 border-t border-cyan-100/10 pt-3"><Moon size={16} className="text-cyan-300" /><div><div className="technical-label">Ambient state</div><div className="mt-0.5 text-xs text-cyan-50/68">Focus mode engaged</div></div></div>
          </div>
        </main>
      </div>
    </div>
  );
}
