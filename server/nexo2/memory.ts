import type { MemoryRecord } from "./types";
import { newId } from "./ids";

const memory = new Map<string, MemoryRecord>();

export function remember(input: Omit<MemoryRecord, "id" | "createdAt" | "updatedAt">): MemoryRecord {
  const now = new Date().toISOString();
  const record: MemoryRecord = { ...input, id: newId("mem"), createdAt: now, updatedAt: now };
  memory.set(record.id, record);
  return record;
}

export function searchMemory(query: string, limit = 10): MemoryRecord[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return [...memory.values()]
    .map((item) => ({ item, score: terms.reduce((score, term) => score + (item.content.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.item.importance - a.item.importance || b.item.updatedAt.localeCompare(a.item.updatedAt))
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function listMemory(limit = 50): MemoryRecord[] {
  return [...memory.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}

export function clearMemory(): void {
  memory.clear();
}
