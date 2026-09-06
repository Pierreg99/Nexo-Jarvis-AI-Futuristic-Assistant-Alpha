import type { AgentTrace, PermissionLevel } from "./types";
import { executeTool, toolCall } from "./tools";
import { newId } from "./ids";

function inferIntent(input: string): string {
  const value = input.toLowerCase();
  if (value.includes("status") || value.includes("system")) return "system.status";
  if (value.includes("note") || value.includes("remember")) return "memory.capture";
  if (value.includes("timer")) return "task.timer";
  return "conversation.respond";
}

export async function runAgent(input: string, granted: PermissionLevel = "write"): Promise<{ response: string; trace: AgentTrace }> {
  const startedAt = new Date().toISOString();
  const trace: AgentTrace = { id: newId("trace"), state: "planning", intent: inferIntent(input), toolCalls: [], startedAt };
  try {
    trace.state = "executing";
    if (trace.intent === "system.status") {
      const call = toolCall("system.status", {});
      trace.toolCalls.push(call);
      const result = await executeTool(call.tool, call.input, granted);
      trace.state = "verifying";
      const response = `Systems nominal. Runtime ${String((result as { node: string }).node)}; uptime ${String((result as { uptimeSeconds: number }).uptimeSeconds)} seconds.`;
      trace.state = "speaking";
      trace.completedAt = new Date().toISOString();
      return { response, trace };
    }

    trace.state = "speaking";
    trace.completedAt = new Date().toISOString();
    return { response: `Intent classified as ${trace.intent}. The Nexo 2.0 tool pipeline is ready for this command.`, trace };
  } catch (error) {
    trace.state = "error";
    trace.error = error instanceof Error ? error.message : String(error);
    trace.completedAt = new Date().toISOString();
    return { response: `Execution blocked: ${trace.error}`, trace };
  }
}
