import type { PermissionLevel } from "./types";

const rank: Record<PermissionLevel, number> = { read: 0, write: 1, "high-risk": 2 };

export function requiresConfirmation(permission: PermissionLevel): boolean {
  return permission === "high-risk";
}

export function canExecute(granted: PermissionLevel, required: PermissionLevel): boolean {
  return rank[granted] >= rank[required];
}

export function assertAllowed(granted: PermissionLevel, required: PermissionLevel): void {
  if (!canExecute(granted, required)) {
    throw new Error(`Permission denied: requires ${required}, granted ${granted}`);
  }
}
