import { Redis } from "@upstash/redis";
import type { ExtractedTranscript } from "./transcript";

export const TRANSCRIPT_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

function cacheKey(videoId: string) {
  return `transcript:v1:${videoId}`;
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

export async function getCachedTranscript(videoId: string): Promise<ExtractedTranscript | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  return (await redis.get<ExtractedTranscript>(cacheKey(videoId))) ?? null;
}

export async function setCachedTranscript(videoId: string, transcript: ExtractedTranscript) {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.set(cacheKey(videoId), transcript, { ex: TRANSCRIPT_CACHE_TTL_SECONDS });
}
