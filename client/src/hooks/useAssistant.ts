import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { createBrowserAssistant, WORKSPACE_KEY } from "@/lib/assistant";
import {
  automationInputSchema,
  memoryInputSchema,
  timerInputSchema,
} from "@shared/nexo/schemas";
import type { AgentContext, AgentTrace, Workspace } from "@shared/nexo/types";

export function useAssistant() {
  const [local] = useState(createBrowserAssistant);
  const [workspace, setWorkspace] = useState<Workspace>(() =>
    local.assistant.store.read()
  );
  const [status, setStatus] = useState(() => local.assistant.status());
  const [tools, setTools] = useState(() => local.assistant.listTools());
  const [mode, setMode] = useState<"checking" | "local" | "server">("checking");
  const [connected, setConnected] = useState(true);
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(local.warning);
  const busy = useRef(false);
  const refreshing = useRef(false);
  const revision = useRef(0);
  const modeRef = useRef(mode);
  const workspaceRef = useRef(workspace);
  const utils = trpc.useUtils();
  const client = utils.client;
  const update = useCallback(
    (snapshot: {
      workspace: Workspace;
      status: typeof status;
      tools: typeof tools;
    }) => {
      workspaceRef.current = snapshot.workspace;
      setWorkspace(snapshot.workspace);
      setStatus(snapshot.status);
      setTools(snapshot.tools);
      setConnected(true);
    },
    []
  );
  const syncLocal = useCallback(
    () =>
      update({
        workspace: local.assistant.store.read(),
        status: local.assistant.status(),
        tools: local.assistant.listTools(),
      }),
    [local, update]
  );
  const refresh = useCallback(async () => {
    if (modeRef.current === "checking" || busy.current || refreshing.current)
      return;
    refreshing.current = true;
    const startedRevision = revision.current;
    try {
      if (modeRef.current === "server") {
        const snapshot = await client.nexo2.workspace.snapshot.query();
        if (revision.current === startedRevision && !busy.current)
          update(snapshot);
      } else {
        local.assistant.tick();
        syncLocal();
      }
    } catch (cause) {
      setConnected(false);
      setError(
        cause instanceof Error ? cause.message : "Workspace refresh failed"
      );
    } finally {
      refreshing.current = false;
    }
  }, [client, local, syncLocal, update]);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timeout = setTimeout(() => controller.abort(), 3000);
    void (async () => {
      let nextMode: "local" | "server" = "local";
      try {
        const response = await fetch("/api/health", {
          signal: controller.signal,
          credentials: "include",
        });
        if (
          response.ok &&
          response.headers.get("content-type")?.includes("application/json")
        ) {
          const health = (await response.json()) as { service?: string };
          if (health.service === "nexo-jarvis") {
            nextMode = "server";
            const snapshot = await client.nexo2.workspace.snapshot.query();
            if (!disposed) update(snapshot);
          }
        }
      } catch (cause) {
        // A detected backend stays selected on errors; writes are never replayed locally.
        if (nextMode === "server" && !disposed) {
          setConnected(false);
          setError(
            cause instanceof Error ? cause.message : "Backend unavailable"
          );
        }
      } finally {
        clearTimeout(timeout);
        if (!disposed) {
          modeRef.current = nextMode;
          setMode(nextMode);
          if (nextMode === "local") syncLocal();
        }
      }
    })();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [client, syncLocal, update]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (modeRef.current === "local") {
        try {
          if (local.assistant.tick()) syncLocal();
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Reminder update failed"
          );
        }
      }
    }, 1000);
    const serverTimer = setInterval(() => {
      const state = workspaceRef.current;
      if (
        modeRef.current === "server" &&
        (state.timers.some(item => item.status === "active") ||
          state.automations.some(item => item.enabled))
      )
        void refresh();
    }, 5000);
    const onFocus = () => void refresh();
    const onStorage = (event: StorageEvent) => {
      if (
        event.key !== WORKSPACE_KEY ||
        modeRef.current !== "local" ||
        !event.newValue
      )
        return;
      try {
        local.assistant.store.reload(JSON.parse(event.newValue));
        syncLocal();
      } catch {
        setError(
          "Another tab saved invalid workspace data; current data was preserved."
        );
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(timer);
      clearInterval(serverTimer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [local, refresh, syncLocal]);

  const operation = useCallback(
    async <T>(action: () => Promise<T>): Promise<T> => {
      if (busy.current || modeRef.current === "checking")
        throw new Error("Wait for the current command to finish");
      if (modeRef.current === "server" && !connected)
        throw new Error("Reconnect the server before issuing another command");
      busy.current = true;
      revision.current++;
      setBusy(true);
      setError(undefined);
      try {
        return await action();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Command failed");
        throw cause;
      } finally {
        busy.current = false;
        setBusy(false);
      }
    },
    [connected]
  );

  const run = useCallback(
    (
      input: string,
      context: AgentContext = {},
      readOnly = false
    ): Promise<{ response: string; trace: AgentTrace }> =>
      operation(async () => {
        if (modeRef.current === "server") {
          const result = await client.nexo2.agent.run.mutate({
            input,
            coordinates: context.coordinates,
            granted: readOnly ? "read" : "write",
          });
          update(result);
          return result;
        }
        const result = await local.assistant.runAgent(
          input,
          readOnly ? "read" : "write",
          context
        );
        syncLocal();
        return result;
      }),
    [client, local, operation, syncLocal, update]
  );

  const execute = useCallback(
    (tool: string, input: unknown): Promise<void> =>
      operation(async () => {
        if (modeRef.current === "local") {
          await local.assistant.executeTool(tool, input);
          syncLocal();
          return;
        }
        const id = () => z.object({ id: z.string().min(1) }).parse(input);
        switch (tool) {
          case "memory.capture":
            update(
              await client.nexo2.memory.create.mutate(
                memoryInputSchema.parse(input)
              )
            );
            break;
          case "memory.delete":
            update(await client.nexo2.memory.delete.mutate(id()));
            break;
          case "task.timer":
            update(
              await client.nexo2.timers.create.mutate(
                timerInputSchema.parse(input)
              )
            );
            break;
          case "task.cancel":
            update(await client.nexo2.timers.cancel.mutate(id()));
            break;
          case "automation.create":
            update(
              await client.nexo2.automations.create.mutate(
                automationInputSchema.parse(input)
              )
            );
            break;
          case "automation.toggle":
            update(
              await client.nexo2.automations.setEnabled.mutate(
                z.object({ id: z.string(), enabled: z.boolean() }).parse(input)
              )
            );
            break;
          case "automation.delete":
            update(await client.nexo2.automations.delete.mutate(id()));
            break;
          case "notification.ack":
            update(await client.nexo2.notifications.acknowledge.mutate());
            break;
          default:
            throw new Error(`Unsupported workspace action: ${tool}`);
        }
      }),
    [client, local, operation, syncLocal, update]
  );

  return {
    workspace,
    status,
    tools,
    mode,
    connected,
    isBusy,
    isReady: mode !== "checking",
    error,
    clearError: () => setError(undefined),
    refresh,
    run,
    execute,
    recovery: local.recovery,
  };
}
