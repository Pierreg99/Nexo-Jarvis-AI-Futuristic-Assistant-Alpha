export type PermissionLevel = "read" | "write" | "high-risk";

export type AgentState = "idle" | "planning" | "executing" | "verifying" | "speaking" | "error";

export type ToolDefinition<I = unknown, O = unknown> = {
  name: string;
  description: string;
  permission: PermissionLevel;
  inputSchema: string;
  execute: (input: I) => Promise<O>;
};

export type ToolCall = {
  id: string;
  tool: string;
  input: unknown;
  permission: PermissionLevel;
};

export type AgentTrace = {
  id: string;
  state: AgentState;
  intent: string;
  toolCalls: ToolCall[];
  startedAt: string;
  completedAt?: string;
  error?: string;
};

export type MemoryKind = "fact" | "preference" | "note" | "conversation" | "task";

export type MemoryRecord = {
  id: string;
  kind: MemoryKind;
  content: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type AutomationRecord = {
  id: string;
  name: string;
  prompt: string;
  schedule: string;
  enabled: boolean;
  permission: PermissionLevel;
  nextRun?: string;
  lastRun?: string;
};
