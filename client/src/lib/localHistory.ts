import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tubetranscriber-history-v1";
const UPDATE_EVENT = "tubetranscriber-history-update";
const MAX_ENTRIES = 40;

export type LocalHistoryEntry = {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  createdAt: number;
  updatedAt: number;
};

function isBrowser() { return typeof window !== "undefined"; }

export function readLocalHistory(): LocalHistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isValidEntry).sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch { return []; }
}

function isValidEntry(value: unknown): value is LocalHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LocalHistoryEntry>;
  return typeof item.videoId === "string" && typeof item.title === "string" && typeof item.channel === "string" && typeof item.thumbnailUrl === "string" && typeof item.createdAt === "number" && typeof item.updatedAt === "number";
}

function writeLocalHistory(entries: LocalHistoryEntry[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function saveLocalHistoryEntry(entry: Omit<LocalHistoryEntry, "createdAt" | "updatedAt">) {
  const now = Date.now();
  const previous = readLocalHistory();
  const existing = previous.find(item => item.videoId === entry.videoId);
  const next = [{ ...entry, createdAt: existing?.createdAt ?? now, updatedAt: now }, ...previous.filter(item => item.videoId !== entry.videoId)].slice(0, MAX_ENTRIES);
  writeLocalHistory(next);
}

export function deleteLocalHistoryEntry(videoId: string) {
  writeLocalHistory(readLocalHistory().filter(item => item.videoId !== videoId));
}

export function clearLocalHistory() { writeLocalHistory([]); }

export function useLocalHistory() {
  const [entries, setEntries] = useState<LocalHistoryEntry[]>([]);
  const refresh = useCallback(() => setEntries(readLocalHistory()), []);
  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(UPDATE_EVENT, refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener(UPDATE_EVENT, refresh); };
  }, [refresh]);
  return { entries, remove: deleteLocalHistoryEntry, clear: clearLocalHistory };
}
