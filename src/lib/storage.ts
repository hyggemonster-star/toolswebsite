const RECENT_KEY = "tools-hub-100:recent-tools";
const MAX_RECENT = 6;
const FAVORITES_KEY = "tools-hub-100:favorite-tools";
const MAX_FAVORITES = 100;

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
