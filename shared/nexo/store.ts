import { workspaceSchema } from "./schemas";
import type { Workspace } from "./types";

export function emptyWorkspace(): Workspace {
  return {
    version: 1,
    memory: [],
    timers: [],
    automations: [],
    audit: [],
    notifications: [],
    conversation: [],
    traces: [],
  };
}

/** Save before swapping state: failed persistence must not report a successful write. */
export class WorkspaceStore {
  private state: Workspace;
  constructor(
    initial: unknown = emptyWorkspace(),
    private readonly save?: (state: Workspace) => void
  ) {
    this.state = workspaceSchema.parse(initial);
  }
  read(): Workspace {
    return structuredClone(this.state);
  }
  update(change: (draft: Workspace) => void): void {
    const draft = this.read();
    change(draft);
    const next = workspaceSchema.parse(draft);
    this.save?.(structuredClone(next));
    this.state = next;
  }
  reload(value: unknown): void {
    this.state = workspaceSchema.parse(value);
  }
}

export function newId(prefix: string): string {
  if (typeof crypto.randomUUID === "function")
    return `${prefix}_${crypto.randomUUID()}`;
  // getRandomValues also works on trusted-LAN HTTP installs where randomUUID is unavailable.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, value =>
    value.toString(16).padStart(2, "0")
  ).join("");
  return `${prefix}_${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
