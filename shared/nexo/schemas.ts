import { z } from "zod";
import type { Workspace } from "./types";

export const permissionSchema = z.enum(["read", "write", "high-risk"]);
const timestamp = z.iso.datetime({ offset: true });
const id = z.string().min(1).max(100);
export const memoryInputSchema = z.object({
  kind: z
    .enum(["fact", "preference", "note", "conversation", "task"])
    .default("note"),
  content: z.string().trim().min(1).max(4000),
  importance: z.number().int().min(0).max(10).default(5),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});
export const timerInputSchema = z.object({
  seconds: z.number().int().min(1).max(604800),
  title: z.string().trim().min(1).max(200).default("Timer"),
});
export function intervalMilliseconds(schedule: string): number | undefined {
  const match = /^every ([1-9]\d*)(s|m|h|d)$/.exec(schedule);
  if (!match) return undefined;
  const value =
    Number(match[1]) *
    ({ s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]] ?? 0);
  return value >= 1000 && value <= 604800000 ? value : undefined;
}
export const scheduleSchema = z
  .string()
  .max(100)
  .refine(
    value =>
      intervalMilliseconds(value) !== undefined ||
      timestamp.safeParse(value).success,
    "Use a timezone-qualified ISO date or an interval such as 'every 30m' (up to 7 days)."
  );
export const automationInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  prompt: z.string().trim().min(1).max(1000),
  schedule: scheduleSchema,
  enabled: z.boolean().default(true),
});
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export const commandSchema = z.object({
  input: z.string().trim().min(1).max(4000),
  granted: z.enum(["read", "write"]).default("write"),
  coordinates: coordinatesSchema.optional(),
});
export const workspaceSchema = z.object({
  version: z.literal(1),
  memory: z
    .array(
      memoryInputSchema.extend({
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    )
    .max(1000),
  timers: z
    .array(
      z.object({
        id,
        title: z.string().min(1).max(200),
        dueAt: timestamp,
        createdAt: timestamp,
        status: z.enum(["active", "completed", "cancelled"]),
      })
    )
    .max(200),
  automations: z
    .array(
      automationInputSchema.extend({
        id,
        permission: permissionSchema,
        nextRun: timestamp.optional(),
        lastRun: timestamp.optional(),
      })
    )
    .max(100),
  audit: z
    .array(
      z.object({
        id,
        actor: z.string().max(100),
        action: z.string().max(100),
        permission: z.string().max(30),
        ok: z.boolean(),
        createdAt: timestamp,
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .max(500),
  notifications: z
    .array(
      z.object({
        id,
        sourceId: id,
        text: z.string().max(1000),
        createdAt: timestamp,
        read: z.boolean(),
      })
    )
    .max(200),
  conversation: z
    .array(
      z.object({
        id,
        sender: z.enum(["user", "nexo"]),
        text: z.string().max(16000),
        createdAt: timestamp,
      })
    )
    .max(200),
  traces: z
    .array(
      z.object({
        id,
        state: z.enum([
          "idle",
          "planning",
          "executing",
          "verifying",
          "speaking",
          "error",
        ]),
        intent: z.string().max(100),
        toolCalls: z
          .array(
            z.object({
              id,
              tool: z.string().max(100),
              input: z.unknown(),
              permission: permissionSchema,
              verified: z.boolean().optional(),
            })
          )
          .max(20),
        startedAt: timestamp,
        completedAt: timestamp.optional(),
        error: z.string().max(1000).optional(),
      })
    )
    .max(50),
}) satisfies z.ZodType<Workspace>;
