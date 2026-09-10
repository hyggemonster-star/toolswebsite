const RECENT_KEY = "tools-hub-100:recent-tools";
const MAX_RECENT = 6;
const FAVORITES_KEY = "tools-hub-100:favorite-tools";
const MAX_FAVORITES = 100;
const HISTORY_KEY = "tools-hub-100:tool-history";
const MAX_HISTORY = 20;
const MAX_HISTORY_CONTENT = 12000;

export type ToolHistoryEntry = {
  id: string;
  toolSlug: string;
  title: string;
  content: string;
  createdAt: number;
};

export function getRecentSlugs() {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((slug): slug is string => typeof slug === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export function recordRecentTool(slug: string) {
  if (typeof window === "undefined") return;

  const next = [slug, ...getRecentSlugs().filter((item) => item !== slug)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("tools-hub-recent-updated"));
  } catch {
    // Private browsing or a full storage quota should not block tool usage.
  }
}

export function getFavoriteSlugs() {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((slug): slug is string => typeof slug === "string").slice(0, MAX_FAVORITES)
      : [];
  } catch {
    return [];
  }
}

export function isFavoriteTool(slug: string) {
  return getFavoriteSlugs().includes(slug);
}

export function toggleFavoriteTool(slug: string) {
  if (typeof window === "undefined") return false;

  const favorites = getFavoriteSlugs();
  const next = favorites.includes(slug)
    ? favorites.filter((item) => item !== slug)
    : [slug, ...favorites].slice(0, MAX_FAVORITES);

  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("tools-hub-favorites-updated"));
  } catch {
    // Keep the UI usable when local storage is unavailable.
  }

  return next.includes(slug);
}

export function getToolHistory(slug?: string): ToolHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    const entries = value.filter((entry): entry is ToolHistoryEntry => Boolean(entry) && typeof entry === "object" && typeof entry.id === "string" && typeof entry.toolSlug === "string" && typeof entry.title === "string" && typeof entry.content === "string" && typeof entry.createdAt === "number");
    return (slug ? entries.filter((entry) => entry.toolSlug === slug) : entries).slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function saveToolHistory(toolSlug: string, title: string, content: string) {
  if (typeof window === "undefined" || !content.trim()) return;

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const entry: ToolHistoryEntry = { id, toolSlug, title: title.trim().slice(0, 80) || "本次结果", content: content.slice(0, MAX_HISTORY_CONTENT), createdAt: Date.now() };
  const next = [entry, ...getToolHistory().filter((item) => item.toolSlug !== toolSlug || item.content !== entry.content)].slice(0, MAX_HISTORY);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("tools-hub-history-updated"));
  } catch {
    // Keep the tool usable when private browsing or storage quota blocks persistence.
  }
}

export function deleteToolHistory(id: string) {
  if (typeof window === "undefined") return;

  try {
    const next = getToolHistory().filter((entry) => entry.id !== id);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("tools-hub-history-updated"));
  } catch {
    // Keep the tool usable when local storage is unavailable.
  }
}
