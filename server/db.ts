import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, transcriptHistory, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function saveHistoryEntry(input: { userId: number; videoId: string; title: string; channel: string; thumbnailUrl: string }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: transcriptHistory.id }).from(transcriptHistory)
    .where(and(eq(transcriptHistory.userId, input.userId), eq(transcriptHistory.videoId, input.videoId))).limit(1);
  if (existing[0]) {
    await db.update(transcriptHistory).set({ title: input.title, channel: input.channel, thumbnailUrl: input.thumbnailUrl, updatedAt: new Date() }).where(eq(transcriptHistory.id, existing[0].id));
    return;
  }
  await db.insert(transcriptHistory).values(input);
}

export async function getHistoryEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transcriptHistory).where(eq(transcriptHistory.userId, userId)).orderBy(desc(transcriptHistory.updatedAt));
}

export async function removeHistoryEntry(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(transcriptHistory).where(and(eq(transcriptHistory.userId, userId), eq(transcriptHistory.id, id)));
}

export async function clearHistoryEntries(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(transcriptHistory).where(eq(transcriptHistory.userId, userId));
}
