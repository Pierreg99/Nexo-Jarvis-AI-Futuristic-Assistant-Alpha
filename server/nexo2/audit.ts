export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  permission: string;
  ok: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

const entries: AuditEntry[] = [];

export function audit(entry: Omit<AuditEntry, "createdAt">): AuditEntry {
  const value = { ...entry, createdAt: new Date().toISOString() };
  entries.push(value);
  if (entries.length > 500) entries.shift();
  return value;
}

export function recentAudit(limit = 50): AuditEntry[] {
  return entries.slice(-limit).reverse();
}
