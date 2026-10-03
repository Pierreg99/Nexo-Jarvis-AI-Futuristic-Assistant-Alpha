import { z } from "zod";
import { planCommand } from "./commands";
import {
  automationInputSchema,
  coordinatesSchema,
  intervalMilliseconds,
  memoryInputSchema,
  timerInputSchema,
} from "./schemas";
import { newId, WorkspaceStore } from "./store";
import type {
  AgentContext,
  AgentTrace,
  AuditEntry,
  AutomationRecord,
  ConversationRecord,
  MemoryRecord,
  PermissionLevel,
  TimerRecord,
  ToolCall,
  ToolDefinition,
} from "./types";

const rank: Record<PermissionLevel, number> = {
  read: 0,
  write: 1,
  "high-risk": 2,
};
export const requiresConfirmation = (permission: PermissionLevel) =>
  permission === "high-risk";
export const canExecute = (
  granted: PermissionLevel,
  required: PermissionLevel
) => rank[granted] >= rank[required];
export function assertAllowed(
  granted: PermissionLevel,
  required: PermissionLevel
): void {
  if (!canExecute(granted, required))
    throw new Error(
      `Permission denied: requires ${required}, granted ${granted}`
    );
}
const help =
  "Try: ‘Remember: …’, ‘Read my notes’, ‘Find notes about …’, ‘Set a 5 min timer’, ‘Remind me every 30 minutes to stretch’, ‘Show timers’, ‘Weather’, ‘News’, ‘System status’, or ‘Summarize today’. English and German note/timer commands are supported.";
const keySchema = z.object({ id: z.string().min(1).max(200) });
const listSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

export type AssistantOptions = {
  runtime?: string;
  now?: () => Date;
  status?: () => Record<string, unknown>;
  weather?: (latitude: number, longitude: number) => Promise<unknown>;
  news?: () => Promise<unknown>;
  conversation?: (
    input: string,
    history: ConversationRecord[],
    memory: MemoryRecord[]
  ) => Promise<string>;
};

export class Assistant {
  private readonly tools = new Map<string, ToolDefinition>();
  private readonly now: () => Date;
  private readonly startedAt: number;
  constructor(
    readonly store = new WorkspaceStore(),
    private readonly options: AssistantOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());
    this.startedAt = this.now().getTime();
    this.registerTool({
      name: "system.status",
      description: "Read actual runtime and workspace status.",
      permission: "read",
      inputSchema: z.object({}),
      execute: async () => this.status(),
    });
    this.registerTool({
      name: "assistant.help",
      description: "List supported commands.",
      permission: "read",
      inputSchema: z.object({}),
      execute: async () => help,
    });
    this.registerTool({
      name: "memory.capture",
      description: "Save a note, fact or preference.",
      permission: "write",
      inputSchema: memoryInputSchema,
      execute: async input => this.remember(input),
    });
    this.registerTool({
      name: "memory.list",
      description: "Read saved notes.",
      permission: "read",
      inputSchema: listSchema,
      execute: async input => this.listMemory(input.limit),
    });
    this.registerTool({
      name: "memory.search",
      description: "Search note content and tags.",
      permission: "read",
      inputSchema: listSchema.extend({
        query: z.string().trim().min(1).max(1000),
      }),
      execute: async input => this.searchMemory(input.query, input.limit),
    });
    this.registerTool({
      name: "memory.delete",
      description: "Delete a saved note.",
      permission: "write",
      inputSchema: keySchema,
      execute: async input => this.removeMemory(input.id),
    });
    this.registerTool({
      name: "task.timer",
      description: "Start a persistent countdown.",
      permission: "write",
      inputSchema: timerInputSchema,
      execute: async input => this.createTimer(input),
    });
    this.registerTool({
      name: "task.list",
      description: "List active countdowns.",
      permission: "read",
      inputSchema: z.object({}),
      execute: async () =>
        this.listTimers().filter(timer => timer.status === "active"),
    });
    this.registerTool({
      name: "task.cancel",
      description: "Cancel a countdown by ID or unique title.",
      permission: "write",
      inputSchema: keySchema,
      execute: async input => this.cancelTimer(input.id),
    });
    this.registerTool({
      name: "automation.create",
      description: "Create a scheduled or recurring reminder.",
      permission: "write",
      inputSchema: automationInputSchema,
      execute: async input => this.createAutomation(input),
    });
    this.registerTool({
      name: "automation.list",
      description: "List scheduled reminders.",
      permission: "read",
      inputSchema: z.object({}),
      execute: async () => this.listAutomations(),
    });
    this.registerTool({
      name: "automation.toggle",
      description: "Pause or resume a reminder.",
      permission: "write",
      inputSchema: keySchema.extend({ enabled: z.boolean() }),
      execute: async input =>
        this.setAutomationEnabled(input.id, input.enabled),
    });
    this.registerTool({
      name: "automation.delete",
      description: "Delete a recurring reminder.",
      permission: "write",
      inputSchema: keySchema,
      execute: async input => this.removeAutomation(input.id),
    });
    this.registerTool({
      name: "notification.ack",
      description: "Mark notifications as read.",
      permission: "write",
      inputSchema: z.object({}),
      execute: async () => this.acknowledgeNotifications(),
    });
    if (options.weather)
      this.registerTool({
        name: "weather.current",
        description: "Fetch live weather at provided coordinates.",
        permission: "read",
        inputSchema: coordinatesSchema,
        execute: async input =>
          options.weather!(input.latitude, input.longitude),
      });
    if (options.news)
      this.registerTool({
        name: "news.latest",
        description: "Fetch current public headlines.",
        permission: "read",
        inputSchema: z.object({}),
        execute: async () => options.news!(),
      });
    this.registerTool({
      name: "conversation.respond",
      description:
        "Answer using the configured AI provider, or explain available local functions.",
      permission: "read",
      inputSchema: z.object({ input: z.string().trim().min(1).max(4000) }),
      execute: async ({ input }) => {
        if (options.conversation)
          return (
            await options.conversation(
              input,
              this.store.read().conversation.slice(-20),
              this.searchMemory(input, 5)
            )
          ).slice(0, 16000);
        if (/\b(joke|witz)\b/i.test(input))
          return "Why did the algorithm stay calm? It had already considered the edge cases.";
        return `I can manage your notes, timers and reminders, and read live weather and news. For open-ended AI conversation, connect a server with an AI provider in Settings. ${help}`;
      },
    });
  }
  status() {
    const state = this.store.read();
    return {
      runtime: this.options.runtime ?? "browser",
      timestamp: this.now().toISOString(),
      uptimeSeconds: Math.round((this.now().getTime() - this.startedAt) / 1000),
      tools: this.tools.size,
      notes: state.memory.length,
      activeTimers: state.timers.filter(item => item.status === "active")
        .length,
      automations: state.automations.filter(item => item.enabled).length,
      aiConfigured: Boolean(this.options.conversation),
      ...this.options.status?.(),
    };
  }
  registerTool<I, O>(tool: ToolDefinition<I, O>): void {
    this.tools.set(tool.name, tool as ToolDefinition);
  }
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
  listTools() {
    return [...this.tools.values()].map(
      ({ name, description, permission, inputSchema }) => ({
        name,
        description,
        permission,
        inputSchema: JSON.stringify(z.toJSONSchema(inputSchema)),
      })
    );
  }
  toolCall(name: string, input: unknown): ToolCall {
    const tool = this.getTool(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return {
      id: newId("call"),
      tool: name,
      input,
      permission: tool.permission,
    };
  }
  async executeTool(
    name: string,
    input: unknown,
    granted: PermissionLevel = "write",
    confirmed = false
  ): Promise<unknown> {
    const tool = this.getTool(name);
    try {
      if (!tool) throw new Error(`Unknown tool: ${name}`);
      assertAllowed(granted, tool.permission);
      if (requiresConfirmation(tool.permission) && !confirmed)
        throw new Error(`Confirmation required for high-risk tool: ${name}`);
      const parsed = tool.inputSchema.safeParse(input);
      if (!parsed.success)
        throw new Error(
          `Invalid input for ${name}: ${parsed.error.issues.map(issue => issue.message).join("; ")}`
        );
      const result = await tool.execute(parsed.data);
      this.audit({
        id: newId("tool"),
        actor: "nexo",
        action: name,
        permission: tool.permission,
        ok: true,
      });
      return result;
    } catch (error) {
      this.audit({
        id: newId("tool"),
        actor: "nexo",
        action: name,
        permission: tool?.permission ?? "unknown",
        ok: false,
        metadata: {
          error:
            error instanceof Error
              ? error.message.slice(0, 1000)
              : "Execution failed",
        },
      });
      throw error;
    }
  }
  audit(entry: Omit<AuditEntry, "createdAt">): AuditEntry {
    const value = { ...entry, createdAt: this.now().toISOString() };
    this.store.update(state => {
      state.audit = [...state.audit, value].slice(-500);
    });
    return structuredClone(value);
  }
  recentAudit(limit = 50): AuditEntry[] {
    return this.store
      .read()
      .audit.slice(-Math.max(1, Math.min(limit, 100)))
      .reverse();
  }
  remember(
    input: Omit<MemoryRecord, "id" | "createdAt" | "updatedAt">
  ): MemoryRecord {
    const value = memoryInputSchema.parse(input);
    const now = this.now().toISOString();
    const record = {
      ...value,
      id: newId("mem"),
      createdAt: now,
      updatedAt: now,
    };
    this.store.update(state => {
      if (state.memory.length >= 1000)
        throw new Error("Memory is full. Delete or export notes first.");
      state.memory.push(record);
    });
    return structuredClone(record);
  }
  listMemory(limit = 50): MemoryRecord[] {
    return this.store
      .read()
      .memory.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, Math.max(1, Math.min(limit, 100)));
  }
  searchMemory(query: string, limit = 10): MemoryRecord[] {
    const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return this.store
      .read()
      .memory.map(item => ({
        item,
        score: terms.reduce(
          (score, term) =>
            score +
            (`${item.content} ${item.tags.join(" ")}`
              .toLocaleLowerCase()
              .includes(term)
              ? 1
              : 0),
          0
        ),
      }))
      .filter(entry => entry.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.item.importance - a.item.importance ||
          b.item.updatedAt.localeCompare(a.item.updatedAt)
      )
      .slice(0, Math.max(1, Math.min(limit, 100)))
      .map(entry => entry.item);
  }
  removeMemory(id: string): MemoryRecord {
    const found = this.store.read().memory.find(item => item.id === id);
    if (!found) throw new Error("Note not found");
    this.store.update(state => {
      state.memory = state.memory.filter(item => item.id !== id);
    });
    return found;
  }
  clearMemory(): void {
    this.store.update(state => {
      state.memory = [];
    });
  }
  createTimer(input: z.input<typeof timerInputSchema>): TimerRecord {
    const value = timerInputSchema.parse(input);
    const now = this.now();
    const timer: TimerRecord = {
      id: newId("timer"),
      title: value.title,
      createdAt: now.toISOString(),
      dueAt: new Date(now.getTime() + value.seconds * 1000).toISOString(),
      status: "active",
    };
    this.store.update(state => {
      if (state.timers.filter(item => item.status === "active").length >= 100)
        throw new Error("Too many active timers");
      state.timers = [
        ...state.timers.filter(item => item.status === "active"),
        ...state.timers.filter(item => item.status !== "active").slice(-99),
        timer,
      ];
    });
    return structuredClone(timer);
  }
  listTimers(): TimerRecord[] {
    return this.store
      .read()
      .timers.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }
  cancelTimer(id: string): TimerRecord {
    const matching = this.listTimers().filter(
      item =>
        item.status === "active" &&
        (item.id === id || item.title.toLowerCase() === id.toLowerCase())
    );
    if (matching.length !== 1)
      throw new Error(
        matching.length
          ? "More than one timer has this title. Use its ID."
          : "Active timer not found"
      );
    const timer = { ...matching[0], status: "cancelled" as const };
    this.store.update(state => {
      state.timers = state.timers.map(item =>
        item.id === timer.id ? timer : item
      );
    });
    return timer;
  }
  createAutomation(
    input: z.input<typeof automationInputSchema>
  ): AutomationRecord {
    const value = automationInputSchema.parse(input);
    const interval = intervalMilliseconds(value.schedule);
    const next = interval
      ? this.now().getTime() + interval
      : Date.parse(value.schedule);
    if (next <= this.now().getTime())
      throw new Error("Choose a future reminder time");
    const record: AutomationRecord = {
      ...value,
      id: newId("auto"),
      permission: "write",
      nextRun: new Date(next).toISOString(),
    };
    this.store.update(state => {
      if (state.automations.length >= 100)
        throw new Error("Too many reminders");
      state.automations.push(record);
    });
    return structuredClone(record);
  }
  listAutomations(): AutomationRecord[] {
    return this.store
      .read()
      .automations.sort((a, b) => a.name.localeCompare(b.name));
  }
  setAutomationEnabled(id: string, enabled: boolean): AutomationRecord {
    const current = this.listAutomations().find(item => item.id === id);
    if (!current) throw new Error("Automation not found");
    const interval = intervalMilliseconds(current.schedule);
    if (
      enabled &&
      !interval &&
      Date.parse(current.schedule) <= this.now().getTime()
    )
      throw new Error(
        "This one-time reminder has expired. Create a new reminder."
      );
    const record = {
      ...current,
      enabled,
      nextRun:
        enabled && interval
          ? new Date(this.now().getTime() + interval).toISOString()
          : current.nextRun,
    };
    this.store.update(state => {
      state.automations = state.automations.map(item =>
        item.id === id ? record : item
      );
    });
    return record;
  }
  removeAutomation(id: string): AutomationRecord {
    const record = this.listAutomations().find(item => item.id === id);
    if (!record) throw new Error("Automation not found");
    this.store.update(state => {
      state.automations = state.automations.filter(item => item.id !== id);
    });
    return record;
  }
  /** Missed intervals coalesce into one notification; advancing from the old due date keeps the cadence. */
  tick(): boolean {
    const now = this.now();
    const time = now.getTime();
    const state = this.store.read();
    if (
      !state.timers.some(
        item => item.status === "active" && Date.parse(item.dueAt) <= time
      ) &&
      !state.automations.some(
        item => item.enabled && item.nextRun && Date.parse(item.nextRun) <= time
      )
    )
      return false;
    this.store.update(draft => {
      const notify = (sourceId: string, text: string, action: string) => {
        draft.notifications.push({
          id: newId("notification"),
          sourceId,
          text,
          createdAt: now.toISOString(),
          read: false,
        });
        draft.audit.push({
          id: newId("audit"),
          actor: "scheduler",
          action,
          permission: "write",
          ok: true,
          createdAt: now.toISOString(),
        });
      };
      for (const timer of draft.timers)
        if (timer.status === "active" && Date.parse(timer.dueAt) <= time) {
          timer.status = "completed";
          notify(timer.id, `${timer.title} is complete.`, "task.complete");
        }
      for (const item of draft.automations)
        if (item.enabled && item.nextRun && Date.parse(item.nextRun) <= time) {
          const due = Date.parse(item.nextRun);
          notify(item.id, item.prompt, "automation.remind");
          item.lastRun = now.toISOString();
          const interval = intervalMilliseconds(item.schedule);
          if (interval)
            item.nextRun = new Date(
              due + (Math.floor((time - due) / interval) + 1) * interval
            ).toISOString();
          else {
            item.enabled = false;
            item.nextRun = undefined;
          }
        }
      draft.notifications = draft.notifications.slice(-200);
      draft.audit = draft.audit.slice(-500);
    });
    return true;
  }
  acknowledgeNotifications(): { success: true } {
    this.store.update(state => {
      state.notifications.forEach(item => {
        item.read = true;
      });
    });
    return { success: true };
  }
  async runAgent(
    input: string,
    granted: PermissionLevel = "write",
    context: AgentContext = {}
  ): Promise<{ response: string; trace: AgentTrace }> {
    const clean = z.string().trim().min(1).max(4000).parse(input);
    const plan = planCommand(clean, context);
    const trace: AgentTrace = {
      id: newId("trace"),
      state: "planning",
      intent: plan.intent,
      toolCalls: [],
      startedAt: this.now().toISOString(),
    };
    let response: string;
    try {
      trace.state = "executing";
      const results: unknown[] = [];
      for (const step of plan.calls) {
        const call = this.toolCall(step.tool, step.input);
        trace.toolCalls.push(call);
        results.push(await this.executeTool(step.tool, step.input, granted));
        call.verified = true;
      }
      trace.state = "verifying";
      response = plan.response(results).slice(0, 16000);
      if (!response.trim()) throw new Error("No response was returned");
      trace.state = "speaking";
    } catch (error) {
      trace.state = "error";
      trace.error =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : "Execution failed";
      response = `Execution blocked: ${trace.error}`;
    }
    trace.completedAt = this.now().toISOString();
    this.store.update(state => {
      state.traces = [...state.traces, trace].slice(-50);
      state.conversation = [
        ...state.conversation,
        {
          id: newId("message"),
          sender: "user" as const,
          text: clean,
          createdAt: trace.startedAt,
        },
        {
          id: newId("message"),
          sender: "nexo" as const,
          text: response,
          createdAt: trace.completedAt!,
        },
      ].slice(-200);
    });
    return { response, trace };
  }
}
