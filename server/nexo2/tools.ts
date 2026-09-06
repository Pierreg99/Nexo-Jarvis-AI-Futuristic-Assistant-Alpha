import { audit } from "./audit";
import type { ToolDefinition, ToolCall, PermissionLevel } from "./types";
import { assertAllowed, requiresConfirmation } from "./permissions";
import { newId } from "./ids";

const tools = new Map<string, ToolDefinition>();

export function registerTool<I, O>(tool: ToolDefinition<I, O>): void {
  tools.set(tool.name, tool as ToolDefinition);
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools.get(name);
}

export function listTools(): Array<Pick<ToolDefinition, "name" | "description" | "permission" | "inputSchema">> {
  return [...tools.values()].map(({ name, description, permission, inputSchema }) => ({ name, description, permission, inputSchema }));
}

export async function executeTool(name: string, input: unknown, granted: PermissionLevel, confirmed = false): Promise<unknown> {
  const tool = tools.get(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  assertAllowed(granted, tool.permission);
  if (requiresConfirmation(tool.permission) && !confirmed) {
    throw new Error(`Confirmation required for high-risk tool: ${name}`);
  }
  const id = newId("tool");
  try {
    const result = await tool.execute(input);
    audit({ id, actor: "nexo", action: name, permission: tool.permission, ok: true, metadata: { input } });
    return result;
  } catch (error) {
    audit({ id, actor: "nexo", action: name, permission: tool.permission, ok: false, metadata: { error: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}

export function toolCall(name: string, input: unknown): ToolCall {
  const tool = tools.get(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return { id: newId("call"), tool: name, input, permission: tool.permission };
}

registerTool({
  name: "system.status",
  description: "Return a safe runtime status snapshot.",
  permission: "read",
  inputSchema: "{}",
  execute: async () => ({ uptimeSeconds: Math.round(process.uptime()), node: process.version, timestamp: new Date().toISOString() }),
});
