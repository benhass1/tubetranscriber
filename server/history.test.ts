import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getHistoryEntries: vi.fn(),
  removeHistoryEntry: vi.fn(),
  clearHistoryEntries: vi.fn(),
  saveHistoryEntry: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function contextFor(userId: number): TrpcContext {
  return {
    user: { id: userId, openId: `user-${userId}`, name: "Test User", email: null, loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("history router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes the authenticated user ID when listing history", async () => {
    dbMocks.getHistoryEntries.mockResolvedValue([]);
    const result = await appRouter.createCaller(contextFor(42)).history.list();
    expect(result).toEqual([]);
    expect(dbMocks.getHistoryEntries).toHaveBeenCalledWith(42);
  });

  it("passes the authenticated user ID when deleting a history item", async () => {
    await appRouter.createCaller(contextFor(42)).history.remove({ id: 7 });
    expect(dbMocks.removeHistoryEntry).toHaveBeenCalledWith(42, 7);
  });
});
