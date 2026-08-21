import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { clearHistoryEntries, getHistoryEntries, removeHistoryEntry, saveHistoryEntry } from "./db";
import { extractTranscript } from "./transcript";
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
      const result = await extractTranscript(input.url);
      if (ctx.user) {
        try {
          await saveHistoryEntry({ userId: ctx.user.id, videoId: result.metadata.videoId, title: result.metadata.title, channel: result.metadata.channel, thumbnailUrl: result.metadata.thumbnailUrl });
        } catch (error) { console.error("[History] Unable to save lookup", error); }
      }
      return result;
    }),
  }),
  history: router({
    list: protectedProcedure.query(({ ctx }) => getHistoryEntries(ctx.user.id)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => removeHistoryEntry(ctx.user.id, input.id)),
    clear: protectedProcedure.mutation(({ ctx }) => clearHistoryEntries(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
