/**
 * Nexo Jarvis tRPC contract.
 * Public live telemetry is read-only; calendar connections remain separately authorized.
 */
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getCurrentWeather, getLatestHeadlines } from "./liveData";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { listTools } from "./nexo2";
import { assistantFor } from "./nexo2/runtime";
import {
  automationInputSchema,
  commandSchema,
  memoryInputSchema,
  timerInputSchema,
} from "../shared/nexo/schemas";
import type { Assistant } from "../shared/nexo/assistant";

async function performTool(assistant: Assistant, tool: string, input: unknown) {
  const result = await assistant.executeTool(tool, input);
  return {
    result,
    workspace: assistant.store.read(),
    status: assistant.status(),
    tools: assistant.listTools(),
  };
}

const nexoProcedure = publicProcedure.use(({ ctx, next }) => {
  const actor = ctx.user
    ? `user:${ctx.user.id}`
    : ctx.workspaceId
      ? `guest:${ctx.workspaceId}`
      : undefined;
  if (!actor)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "A workspace session is required",
    });
  return next({ ctx: { ...ctx, assistant: assistantFor(actor) } });
});
const idInput = z.object({ id: z.string().min(1).max(100) });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  live: router({
    weather: publicProcedure
      .input(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
      )
      .query(({ input }) => getCurrentWeather(input.latitude, input.longitude)),
    headlines: publicProcedure.query(() => getLatestHeadlines()),
    calendarStatus: publicProcedure.query(() => ({
      connected: false,
      provider: null as "google" | "outlook" | null,
      message:
        "Calendar authorization is required before events can be displayed.",
      events: [] as Array<{
        id: string;
        title: string;
        startAt: string;
        provider: "google" | "outlook";
      }>,
    })),
  }),
  nexo2: router({
    workspace: router({
      snapshot: nexoProcedure.query(({ ctx }) => {
        ctx.assistant.tick();
        return {
          workspace: ctx.assistant.store.read(),
          status: ctx.assistant.status(),
          tools: ctx.assistant.listTools(),
        };
      }),
    }),
    tools: router({
      list: publicProcedure.query(() => listTools()),
    }),
    agent: router({
      run: nexoProcedure
        .input(commandSchema)
        .mutation(async ({ ctx, input }) => {
          const result = await ctx.assistant.runAgent(
            input.input,
            input.granted,
            { coordinates: input.coordinates }
          );
          return {
            ...result,
            workspace: ctx.assistant.store.read(),
            status: ctx.assistant.status(),
            tools: ctx.assistant.listTools(),
          };
        }),
    }),
    memory: router({
      list: nexoProcedure
        .input(
          z
            .object({ limit: z.number().int().min(1).max(100).default(50) })
            .optional()
        )
        .query(({ ctx, input }) => ctx.assistant.listMemory(input?.limit)),
      search: nexoProcedure
        .input(
          z.object({
            query: z.string().trim().min(1).max(1000),
            limit: z.number().int().min(1).max(50).default(10),
          })
        )
        .query(({ ctx, input }) =>
          ctx.assistant.searchMemory(input.query, input.limit)
        ),
      create: nexoProcedure
        .input(memoryInputSchema)
        .mutation(({ ctx, input }) =>
          performTool(ctx.assistant, "memory.capture", input)
        ),
      delete: nexoProcedure
        .input(idInput)
        .mutation(({ ctx, input }) =>
          performTool(ctx.assistant, "memory.delete", input)
        ),
    }),
    timers: router({
      list: nexoProcedure.query(({ ctx }) => {
        ctx.assistant.tick();
        return ctx.assistant.listTimers();
      }),
      create: nexoProcedure
        .input(timerInputSchema)
        .mutation(({ ctx, input }) =>
          performTool(ctx.assistant, "task.timer", input)
        ),
      cancel: nexoProcedure
        .input(idInput)
        .mutation(({ ctx, input }) =>
          performTool(ctx.assistant, "task.cancel", input)
        ),
    }),
    automations: router({
      list: nexoProcedure.query(({ ctx }) => ctx.assistant.listAutomations()),
      create: nexoProcedure
        .input(automationInputSchema)
        .mutation(({ ctx, input }) =>
          performTool(ctx.assistant, "automation.create", input)
        ),
      setEnabled: nexoProcedure
        .input(idInput.extend({ enabled: z.boolean() }))
        .mutation(({ ctx, input }) =>
          performTool(ctx.assistant, "automation.toggle", input)
        ),
      delete: nexoProcedure
        .input(idInput)
        .mutation(({ ctx, input }) =>
          performTool(ctx.assistant, "automation.delete", input)
        ),
    }),
    notifications: router({
      acknowledge: nexoProcedure.mutation(({ ctx }) =>
        performTool(ctx.assistant, "notification.ack", {})
      ),
    }),
    audit: router({
      recent: nexoProcedure
        .input(
          z
            .object({ limit: z.number().int().min(1).max(100).default(50) })
            .optional()
        )
        .query(({ ctx, input }) => ctx.assistant.recentAudit(input?.limit)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
