import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { Assistant } from "../../shared/nexo/assistant";
import { emptyWorkspace, WorkspaceStore } from "../../shared/nexo/store";
import { getCurrentWeather, getLatestHeadlines } from "../liveData";
import { aiConfigured, respondWithAI } from "./conversation";
import type { Workspace } from "../../shared/nexo/types";

export const defaultAssistant = new Assistant(new WorkspaceStore(), {
  runtime: process.version,
  status: () => ({
    node: process.version,
    uptimeSeconds: Math.round(process.uptime()),
  }),
  weather: getCurrentWeather,
  news: getLatestHeadlines,
});

/** Single-process durable store. A hashed actor ID never becomes a user-controlled path. */
export function createFileStore(
  actor: string,
  directory = process.env.NEXO_DATA_DIR ?? path.resolve(".nexo-data")
): WorkspaceStore {
  const file = path.join(
    directory,
    `${createHash("sha256").update(actor).digest("hex")}.json`
  );
  return storeAt(file);
}

function storeAt(file: string): WorkspaceStore {
  let initial: unknown = emptyWorkspace();
  try {
    initial = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      throw new Error(
        "Workspace could not be loaded. Restore its backup before continuing."
      );
  }
  const save = (state: Workspace) => {
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    const temporary = `${file}.${randomUUID()}.tmp`;
    writeFileSync(temporary, JSON.stringify(state), { mode: 0o600 });
    renameSync(temporary, file);
  };
  return new WorkspaceStore(initial, save);
}

const runtimes = new Map<string, Assistant>();
const schedulerOnly = new Set<string>();
export function assistantFor(actor: string): Assistant {
  const key = path.resolve(
    process.env.NEXO_DATA_DIR ?? ".nexo-data",
    `${createHash("sha256").update(actor).digest("hex")}.json`
  );
  let assistant = runtimes.get(key);
  if (!assistant || schedulerOnly.delete(key)) {
    assistant = new Assistant(assistant?.store ?? storeAt(key), {
      runtime: process.version,
      status: () => ({
        node: process.version,
        uptimeSeconds: Math.round(process.uptime()),
      }),
      weather: getCurrentWeather,
      news: getLatestHeadlines,
      conversation:
        aiConfigured() &&
        (actor.startsWith("user:") ||
          process.env.NEXO_AI_ALLOW_GUESTS === "true")
          ? respondWithAI
          : undefined,
    });
    if (!runtimes.has(key) && runtimes.size >= 500)
      runtimes.delete(runtimes.keys().next().value!);
    runtimes.set(key, assistant);
  }
  return assistant;
}

export function startScheduler(
  directory = process.env.NEXO_DATA_DIR ?? path.resolve(".nexo-data")
): () => void {
  // Restore persisted reminders at startup, without waiting for their owner's next visit.
  try {
    for (const filename of readdirSync(directory)
      .filter(name => /^[a-f0-9]{64}\.json$/.test(name))
      .slice(0, 500)) {
      const key = path.resolve(directory, filename);
      if (runtimes.has(key)) continue;
      try {
        runtimes.set(
          key,
          new Assistant(storeAt(key), { runtime: process.version })
        );
        schedulerOnly.add(key);
      } catch {
        console.error(
          "[Nexo] A saved workspace needs recovery; its file was preserved."
        );
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      console.error("[Nexo] Saved reminders could not be loaded.");
  }
  const interval = setInterval(() => {
    for (const assistant of runtimes.values()) {
      try {
        assistant.tick();
      } catch (error) {
        console.error(
          "[Nexo] Reminder persistence failed",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }, 1000);
  interval.unref();
  return () => clearInterval(interval);
}
