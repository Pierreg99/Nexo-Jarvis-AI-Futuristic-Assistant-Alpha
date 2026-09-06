import type { AutomationRecord } from "./types";
import { newId } from "./ids";

const automations = new Map<string, AutomationRecord>();

export function createAutomation(input: Omit<AutomationRecord, "id">): AutomationRecord {
  const record = { ...input, id: newId("auto") };
  automations.set(record.id, record);
  return record;
}

export function listAutomations(): AutomationRecord[] {
  return [...automations.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function setAutomationEnabled(id: string, enabled: boolean): AutomationRecord {
  const current = automations.get(id);
  if (!current) throw new Error("Automation not found");
  const updated = { ...current, enabled };
  automations.set(id, updated);
  return updated;
}
