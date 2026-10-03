import { Assistant } from "@shared/nexo/assistant";
import { emptyWorkspace, WorkspaceStore } from "@shared/nexo/store";
import { getCurrentWeather, getLatestHeadlines } from "@shared/liveData";

export const WORKSPACE_KEY = "nexo.workspace.v1";
export function createBrowserAssistant(): {
  assistant: Assistant;
  warning?: string;
  recovery?: string;
} {
  let warning: string | undefined;
  let recovery: string | undefined;
  let initial: unknown = emptyWorkspace();
  let writable = true;
  try {
    recovery = localStorage.getItem(WORKSPACE_KEY) ?? undefined;
    if (recovery) initial = JSON.parse(recovery);
    // Probe availability without touching saved user data.
    localStorage.setItem(`${WORKSPACE_KEY}.probe`, "1");
    localStorage.removeItem(`${WORKSPACE_KEY}.probe`);
    new WorkspaceStore(initial);
  } catch {
    initial = emptyWorkspace();
    writable = false;
    warning = recovery
      ? "Saved workspace could not be read. Download the recovery file in Settings before clearing browser data."
      : "Browser storage is unavailable. This session is temporary; export it before closing this page.";
  }
  const store = new WorkspaceStore(initial, state => {
    if (!writable && recovery)
      throw new Error(
        "Saved workspace needs recovery. Export it in Settings before clearing browser data."
      );
    if (!writable) return;
    try {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(state));
    } catch {
      throw new Error(
        "Workspace could not be saved. Export your data or free browser storage and retry."
      );
    }
  });
  return {
    assistant: new Assistant(store, {
      runtime: "browser",
      weather: getCurrentWeather,
      news: getLatestHeadlines,
    }),
    warning,
    recovery: warning ? recovery : undefined,
  };
}

export function downloadJSON(value: unknown, filename: string): void {
  const url = URL.createObjectURL(
    new Blob(
      [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
      { type: "application/json" }
    )
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
