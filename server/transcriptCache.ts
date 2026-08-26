import { Redis } from "@upstash/redis";
import type { ExtractedTranscript } from "./transcript";

export const TRANSCRIPT_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

function cacheKey(videoId: string, languageCode?: string) {
  return `transcript:v3:${videoId}:${languageCode?.trim().toLowerCase() || "original"}`;
}

let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

export function isTranscriptCacheConfigured() {
  return Boolean(getRedisClient());
}

export async function getCachedTranscript(videoId: string, languageCode?: string): Promise<ExtractedTranscript | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  return (await redis.get<ExtractedTranscript>(cacheKey(videoId, languageCode))) ?? null;
}

export async function setCachedTranscript(videoId: string, transcript: ExtractedTranscript, languageCode?: string) {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.set(cacheKey(videoId, languageCode), transcript, { ex: TRANSCRIPT_CACHE_TTL_SECONDS });
}
