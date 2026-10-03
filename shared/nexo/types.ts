import type { z } from "zod";

export type PermissionLevel = "read" | "write" | "high-risk";
export type AgentState =
  | "idle"
  | "planning"
  | "executing"
  | "verifying"
  | "speaking"
  | "error";
export type ToolDefinition<I = unknown, O = unknown> = {
  name: string;
  description: string;
  permission: PermissionLevel;
  inputSchema: z.ZodType<I>;
  execute: (input: I) => Promise<O>;
};
export type ToolCall = {
  id: string;
  tool: string;
  input: unknown;
  permission: PermissionLevel;
  verified?: boolean;
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
export type MemoryKind =
  | "fact"
  | "preference"
  | "note"
  | "conversation"
  | "task";
export type MemoryRecord = {
  id: string;
  kind: MemoryKind;
  content: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};
export type TimerRecord = {
  id: string;
  title: string;
  dueAt: string;
  createdAt: string;
  status: "active" | "completed" | "cancelled";
};
export type AutomationRecord = {
  id: string;
  name: string;
  prompt: string;
  /** "every 30m" or an ISO timestamp with a timezone. */
  schedule: string;
  enabled: boolean;
  permission: PermissionLevel;
  nextRun?: string;
  lastRun?: string;
};
export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  permission: string;
  ok: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
};
export type NotificationRecord = {
  id: string;
  sourceId: string;
  text: string;
  createdAt: string;
  read: boolean;
};
export type ConversationRecord = {
  id: string;
  sender: "user" | "nexo";
  text: string;
  createdAt: string;
};
export type Workspace = {
  version: 1;
  memory: MemoryRecord[];
  timers: TimerRecord[];
  automations: AutomationRecord[];
  audit: AuditEntry[];
  notifications: NotificationRecord[];
  conversation: ConversationRecord[];
  traces: AgentTrace[];
};
export type AgentContext = {
  coordinates?: { latitude: number; longitude: number };
};
