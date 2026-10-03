import { afterEach, describe, expect, it, vi } from "vitest";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import { Assistant } from "../shared/nexo/assistant";
import { durationSeconds, planCommand } from "../shared/nexo/commands";
import { emptyWorkspace, WorkspaceStore } from "../shared/nexo/store";
import { createFileStore, startScheduler } from "./nexo2/runtime";
import { respondWithAI } from "./nexo2/conversation";
import { getLatestHeadlines } from "./liveData";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("actual assistant actions", () => {
  it("captures and retrieves notes through verified tool calls", async () => {
    const assistant = new Assistant();
    const result = await assistant.runAgent(
      "Remember: launch the orbital project"
    );
    expect(result.trace.toolCalls).toMatchObject([
      { tool: "memory.capture", verified: true },
    ]);
    expect(assistant.searchMemory("orbital")).toHaveLength(1);
    expect(
      (await assistant.runAgent("Read my notes", "read")).response
    ).toContain("launch the orbital project");
    expect(assistant.store.read().conversation).toHaveLength(4);
  });
  it("treats captured content as data even when it includes other command words", async () => {
    const assistant = new Assistant();
    await assistant.runAgent("Remember: system status and a 5 min timer");
    expect(assistant.listMemory()[0].content).toBe(
      "system status and a 5 min timer"
    );
    expect(assistant.listTimers()).toHaveLength(0);
  });
  it("supports German note and timer commands", async () => {
    const assistant = new Assistant();
    await assistant.runAgent("Merke dir: Wasser trinken");
    expect(
      (await assistant.runAgent("Zeige meine Notizen")).response
    ).toContain("Wasser trinken");
    const result = await assistant.runAgent("Stelle einen Timer auf 5 Minuten");
    expect(result.trace.intent).toBe("task.timer");
    expect(assistant.listTimers()).toHaveLength(1);
  });
  it("enforces read-only mode without changing memory", async () => {
    const assistant = new Assistant();
    const result = await assistant.runAgent("Remember: blocked note", "read");
    expect(result.trace.state).toBe("error");
    expect(result.trace.toolCalls[0].verified).toBeUndefined();
    expect(assistant.listMemory()).toEqual([]);
    expect(assistant.recentAudit(1)[0]).toMatchObject({
      action: "memory.capture",
      ok: false,
    });
  });
  it("validates tool inputs before any action and audits the failure", async () => {
    const assistant = new Assistant();
    await expect(
      assistant.executeTool("task.timer", { seconds: -1 })
    ).rejects.toThrow("Invalid input");
    await expect(
      assistant.executeTool("memory.capture", { content: "   " })
    ).rejects.toThrow("Invalid input");
    expect(assistant.listTimers()).toEqual([]);
    expect(assistant.recentAudit()).toHaveLength(2);
  });
  it("requires both high-risk permission and confirmation", async () => {
    const assistant = new Assistant();
    const execute = vi.fn(async () => "done");
    assistant.registerTool({
      name: "test.high-risk",
      description: "Test only",
      permission: "high-risk",
      inputSchema: z.object({}),
      execute,
    });
    await expect(
      assistant.executeTool("test.high-risk", {}, "write", true)
    ).rejects.toThrow("Permission denied");
    await expect(
      assistant.executeTool("test.high-risk", {}, "high-risk")
    ).rejects.toThrow("Confirmation required");
    expect(execute).not.toHaveBeenCalled();
    await expect(
      assistant.executeTool("test.high-risk", {}, "high-risk", true)
    ).resolves.toBe("done");
    expect(execute).toHaveBeenCalledOnce();
  });
  it("ranks tags and importance and does not expose mutable memory references", () => {
    const assistant = new Assistant();
    const record = assistant.remember({
      content: "Design choices",
      kind: "preference",
      tags: ["orbital"],
      importance: 9,
    });
    record.tags.push("tampered");
    const found = assistant.searchMemory("orbital");
    found[0].content = "tampered";
    expect(assistant.listMemory()[0]).toMatchObject({
      content: "Design choices",
      tags: ["orbital"],
    });
  });
  it("never claims free-form actions were completed without an AI provider", async () => {
    const result = await new Assistant().runAgent(
      "Please send an email to my friend"
    );
    expect(result.response).toContain("connect a server");
    expect(result.trace.intent).toBe("conversation.respond");
  });
  it("uses actual weather values and asks for coordinates when missing", async () => {
    const weather = vi.fn(async () => ({
      temperature: 7,
      apparentTemperature: 5,
      windSpeed: 14,
      condition: "Rain",
      timezone: "Europe/Berlin",
    }));
    const assistant = new Assistant(undefined, { weather });
    expect((await assistant.runAgent("Weather")).response).toContain(
      "location access"
    );
    const result = await assistant.runAgent("Weather", "read", {
      coordinates: { latitude: 52, longitude: 13 },
    });
    expect(result.response).toContain("Rain, 7°C");
    expect(weather).toHaveBeenCalledWith(52, 13);
  });
});

describe("durations and reminders", () => {
  it.each([
    ["5 min", 300],
    ["1 hour and 30 minutes", 5400],
    ["1,5 Stunden", 5400],
    ["30 seconds", 30],
    ["7 days", undefined],
    ["0 min", undefined],
    ["-5 min", undefined],
    ["900 hours", undefined],
    ["5 min nonsense", undefined],
    ["0.01 seconds", undefined],
  ])("parses %s safely", (input, expected) => {
    expect(durationSeconds(input as string)).toBe(expected);
  });
  it("completes timers exactly once across reloads", async () => {
    let now = new Date("2026-10-03T12:00:00Z");
    const store = new WorkspaceStore();
    const assistant = new Assistant(store, { now: () => now });
    await assistant.runAgent("Set a 5 min timer for tea");
    expect(assistant.listTimers()[0].title).toBe("tea");
    now = new Date("2026-10-03T12:05:00Z");
    expect(assistant.tick()).toBe(true);
    expect(assistant.tick()).toBe(false);
    const reloaded = new Assistant(new WorkspaceStore(store.read()), {
      now: () => now,
    });
    expect(reloaded.tick()).toBe(false);
    expect(reloaded.store.read().notifications).toHaveLength(1);
    expect(reloaded.listTimers()[0].status).toBe("completed");
  });
  it("coalesces missed recurring reminders and keeps their original cadence", async () => {
    let now = new Date("2026-10-03T12:00:00Z");
    const assistant = new Assistant(undefined, { now: () => now });
    await assistant.runAgent("Remind me every 30 minutes to stretch");
    now = new Date("2026-10-03T14:05:00Z");
    assistant.tick();
    expect(assistant.store.read().notifications).toHaveLength(1);
    expect(assistant.listAutomations()[0].nextRun).toBe(
      "2026-10-03T14:30:00.000Z"
    );
    expect(assistant.tick()).toBe(false);
  });
  it("pauses reminders and resumes from the current time", () => {
    let now = new Date("2026-10-03T12:00:00Z");
    const assistant = new Assistant(undefined, { now: () => now });
    const record = assistant.createAutomation({
      name: "Stretch",
      prompt: "Stretch",
      schedule: "every 30m",
    });
    assistant.setAutomationEnabled(record.id, false);
    now = new Date("2026-10-03T13:00:00Z");
    expect(assistant.tick()).toBe(false);
    expect(assistant.setAutomationEnabled(record.id, true).nextRun).toBe(
      "2026-10-03T13:30:00.000Z"
    );
  });
  it("disables one-time reminders after delivery and rejects past schedules", () => {
    let now = new Date("2026-10-03T12:00:00Z");
    const assistant = new Assistant(undefined, { now: () => now });
    expect(() =>
      assistant.createAutomation({
        name: "Past",
        prompt: "Past",
        schedule: "2026-10-03T11:00:00Z",
      })
    ).toThrow("future");
    const record = assistant.createAutomation({
      name: "Review",
      prompt: "Review notes",
      schedule: "2026-10-03T12:01:00Z",
    });
    now = new Date("2026-10-03T12:02:00Z");
    assistant.tick();
    expect(assistant.listAutomations()[0]).toMatchObject({
      enabled: false,
      nextRun: undefined,
    });
    expect(() => assistant.setAutomationEnabled(record.id, true)).toThrow(
      "expired"
    );
    assistant.acknowledgeNotifications();
    expect(assistant.store.read().notifications[0].read).toBe(true);
  });
  it("does not complete cancelled timers and rejects ambiguous title cancellation", () => {
    let now = new Date("2026-10-03T12:00:00Z");
    const assistant = new Assistant(undefined, { now: () => now });
    const first = assistant.createTimer({ seconds: 30, title: "Tea" });
    const second = assistant.createTimer({ seconds: 30, title: "Tea" });
    expect(() => assistant.cancelTimer("Tea")).toThrow("More than one");
    assistant.cancelTimer(first.id);
    assistant.cancelTimer(second.id);
    now = new Date("2026-10-03T12:01:00Z");
    expect(assistant.tick()).toBe(false);
    expect(assistant.store.read().notifications).toEqual([]);
  });
});

describe("workspace durability and API isolation", () => {
  it("restores saved timers when the server scheduler restarts", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "nexo-restart-"));
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T12:00:00Z"));
    const actor = `user:${crypto.randomUUID()}`;
    new Assistant(createFileStore(actor, directory)).createTimer({
      seconds: 30,
      title: "Restart reminder",
    });
    const stop = startScheduler(directory);
    try {
      await vi.advanceTimersByTimeAsync(31000);
      const restored = new Assistant(createFileStore(actor, directory));
      expect(restored.listTimers()[0].status).toBe("completed");
      expect(restored.store.read().notifications[0].text).toBe(
        "Restart reminder is complete."
      );
    } finally {
      stop();
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("preserves the previous state if a save fails", () => {
    const store = new WorkspaceStore(emptyWorkspace(), () => {
      throw new Error("Disk full");
    });
    const assistant = new Assistant(store);
    expect(() =>
      assistant.remember({
        content: "Never persisted",
        kind: "note",
        importance: 5,
        tags: [],
      })
    ).toThrow("Disk full");
    expect(store.read().memory).toEqual([]);
  });
  it("reloads durable notes and isolates actors on disk", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "nexo-test-"));
    try {
      const first = new Assistant(createFileStore("user:one", directory));
      first.remember({
        content: "Private note",
        kind: "note",
        importance: 5,
        tags: [],
      });
      expect(
        new Assistant(createFileStore("user:one", directory)).listMemory()[0]
          .content
      ).toBe("Private note");
      expect(
        new Assistant(createFileStore("user:two", directory)).listMemory()
      ).toEqual([]);
      expect(readdirSync(directory)).toHaveLength(1);
      const file = path.join(directory, readdirSync(directory)[0]);
      expect(JSON.parse(readFileSync(file, "utf8")).version).toBe(1);
      writeFileSync(file, "broken json");
      expect(() => createFileStore("user:one", directory)).toThrow("backup");
      expect(readFileSync(file, "utf8")).toBe("broken json");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("rejects malformed workspace imports without replacing the current state", () => {
    const store = new WorkspaceStore();
    expect(() => store.reload({ version: 999 })).toThrow();
    expect(store.read()).toEqual(emptyWorkspace());
  });
  it("isolates API memory, conversations and traces between guest sessions", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "nexo-api-"));
    vi.stubEnv("NEXO_DATA_DIR", directory);
    const caller = (workspaceId: string) =>
      appRouter.createCaller({
        user: null,
        workspaceId,
        req: { headers: {} },
        res: {},
      } as TrpcContext);
    try {
      const first = caller(crypto.randomUUID());
      const second = caller(crypto.randomUUID());
      await first.nexo2.agent.run({
        input: "Remember: confidential orbital launch",
      });
      expect((await first.nexo2.memory.list()).length).toBe(1);
      expect(await second.nexo2.memory.list()).toEqual([]);
      const snapshot = await second.nexo2.workspace.snapshot();
      expect(snapshot.workspace.conversation).toEqual([]);
      expect(snapshot.workspace.traces).toEqual([]);
      await expect(first.nexo2.agent.run({ input: "   " })).rejects.toThrow();
      await expect(
        first.nexo2.agent.run({
          input: "System status",
          granted: "high-risk" as "write",
        })
      ).rejects.toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it("refuses access without a workspace session", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { headers: {} },
      res: {},
    } as TrpcContext);
    await expect(caller.nexo2.memory.list()).rejects.toThrow(
      "workspace session"
    );
  });
});

describe("upstream integrations", () => {
  it("falls back to current headlines and excludes unsafe links", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("failure", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            hits: [
              {
                title: "Good story",
                url: "https://example.com/article",
                objectID: "1",
              },
              { title: "Unsafe", url: "javascript:alert(1)", objectID: "2" },
              { title: "Broken", url: "invalid url", objectID: "3" },
            ],
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetcher);
    const headlines = await getLatestHeadlines();
    expect(headlines).toMatchObject([
      { title: "Good story", domain: "example.com" },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("sends contextual AI requests with server credentials and rejects upstream failures", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_BASE_URL", "https://provider.example/v1");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Useful answer" } }],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response("secret upstream body", { status: 401 })
      );
    vi.stubGlobal("fetch", fetcher);
    expect(await respondWithAI("Hello", [], [])).toBe("Useful answer");
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://provider.example/v1/chat/completions"
    );
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-key"
    );
    const payload = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(payload.messages.at(-1)).toMatchObject({
      role: "user",
      content: "Hello",
    });
    await expect(respondWithAI("Hello", [], [])).rejects.toThrow("HTTP 401");
  });
});
