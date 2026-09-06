import { beforeEach, describe, expect, it } from "vitest";
import { runAgent } from "./nexo2/agent";
import { audit, recentAudit } from "./nexo2/audit";
import { clearMemory, remember, searchMemory } from "./nexo2/memory";
import { canExecute, requiresConfirmation } from "./nexo2/permissions";
import { listTools } from "./nexo2/tools";

describe("Nexo 2.0 agent foundation", () => {
  beforeEach(() => clearMemory());

  it("exposes a read-only system status tool", () => {
    expect(listTools().some((tool) => tool.name === "system.status" && tool.permission === "read")).toBe(true);
  });

  it("runs a deterministic agent trace for system status", async () => {
    const result = await runAgent("show system status", "read");
    expect(result.trace.intent).toBe("system.status");
    expect(result.trace.toolCalls[0].tool).toBe("system.status");
    expect(result.trace.completedAt).toBeTruthy();
  });

  it("protects high-risk tools with confirmation", () => {
    expect(requiresConfirmation("high-risk")).toBe(true);
    expect(canExecute("write", "high-risk")).toBe(false);
  });

  it("ranks memory matches", () => {
    remember({ kind: "preference", content: "User prefers concise technical dashboards", importance: 8, tags: ["ui"] });
    remember({ kind: "note", content: "Project launch checklist", importance: 4, tags: ["project"] });
    expect(searchMemory("technical dashboards")[0]?.kind).toBe("preference");
  });

  it("keeps bounded audit history", () => {
    audit({ id: "test", actor: "test", action: "unit", permission: "read", ok: true });
    expect(recentAudit(1)[0]?.action).toBe("unit");
  });
});
