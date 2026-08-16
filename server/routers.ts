/**
 * Nexo Jarvis tRPC contract.
 * Public live telemetry is read-only; calendar connections remain separately authorized.
 */
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getCurrentWeather, getLatestHeadlines } from "./liveData";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  live: router({
    weather: publicProcedure
      .input(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }))
      .query(({ input }) => getCurrentWeather(input.latitude, input.longitude)),
    headlines: publicProcedure.query(() => getLatestHeadlines()),
    calendarStatus: publicProcedure.query(() => ({
      connected: false,
      provider: null as "google" | "outlook" | null,
      message: "Calendar authorization is required before events can be displayed.",
      events: [] as Array<{ id: string; title: string; startAt: string; provider: "google" | "outlook" }>,
    })),
  }),
});

export type AppRouter = typeof appRouter;
