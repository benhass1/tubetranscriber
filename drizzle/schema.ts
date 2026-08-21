import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const transcriptHistory = mysqlTable("transcript_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoId: varchar("videoId", { length: 32 }).notNull(),
  title: text("title").notNull(),
  channel: varchar("channel", { length: 255 }).notNull(),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("history_user_updated_idx").on(table.userId, table.updatedAt),
  index("history_user_video_idx").on(table.userId, table.videoId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type TranscriptHistory = typeof transcriptHistory.$inferSelect;
