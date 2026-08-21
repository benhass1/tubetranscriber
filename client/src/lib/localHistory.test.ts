import { beforeEach, describe, expect, it, vi } from "vitest";

const memory = new Map<string, string>();
vi.stubGlobal("window", {
  localStorage: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) },
  dispatchEvent: vi.fn(),
});

import { clearLocalHistory, deleteLocalHistoryEntry, readLocalHistory, saveLocalHistoryEntry } from "./localHistory";

describe("browser-local transcript history", () => {
  beforeEach(() => { memory.clear(); vi.clearAllMocks(); });

  it("stores a lookup and refreshes an existing video instead of duplicating it", () => {
    saveLocalHistoryEntry({ videoId: "dQw4w9WgXcQ", title: "First title", channel: "Channel", thumbnailUrl: "image-a" });
    saveLocalHistoryEntry({ videoId: "dQw4w9WgXcQ", title: "Updated title", channel: "Channel", thumbnailUrl: "image-b" });
    expect(readLocalHistory()).toHaveLength(1);
    expect(readLocalHistory()[0]).toMatchObject({ title: "Updated title", thumbnailUrl: "image-b" });
  });

  it("removes one item or clears the browser history", () => {
    saveLocalHistoryEntry({ videoId: "dQw4w9WgXcQ", title: "One", channel: "Channel", thumbnailUrl: "image-a" });
    saveLocalHistoryEntry({ videoId: "M7lc1UVf-VE", title: "Two", channel: "Channel", thumbnailUrl: "image-b" });
    deleteLocalHistoryEntry("dQw4w9WgXcQ");
    expect(readLocalHistory().map(item => item.videoId)).toEqual(["M7lc1UVf-VE"]);
    clearLocalHistory();
    expect(readLocalHistory()).toEqual([]);
  });
});
