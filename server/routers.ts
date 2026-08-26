import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { extractTranscript, parseYoutubeId } from "./transcript";
import { getCachedTranscript, isTranscriptCacheConfigured, setCachedTranscript } from "./transcriptCache";
import { COOKIE_NAME } from "@shared/const";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  transcript: router({
    lookup: publicProcedure.input(z.object({ url: z.string().min(1).max(2048) })).mutation(async ({ input, ctx }) => {
      const videoId = parseYoutubeId(input.url);
      const cacheEnabled = isTranscriptCacheConfigured();

      if (!videoId || !cacheEnabled) {
        ctx.res.setHeader("X-Cache-Status", cacheEnabled ? "MISS" : "DISABLED");
        return extractTranscript(input.url);
      }

      try {
        const cached = await getCachedTranscript(videoId);
        if (cached) {
          ctx.res.setHeader("X-Cache-Status", "HIT");
          return cached;
        }
      } catch (error) {
        console.warn("[TranscriptCache] read failed; continuing to YouTube", error instanceof Error ? error.message : "unknown error");
      }

      ctx.res.setHeader("X-Cache-Status", "MISS");
      const result = await extractTranscript(input.url);
      try {
        await setCachedTranscript(videoId, result);
      } catch (error) {
        console.warn("[TranscriptCache] write failed; transcript still returned", error instanceof Error ? error.message : "unknown error");
      }
      return result;
    }),
  }),
});

export type AppRouter = typeof appRouter;
