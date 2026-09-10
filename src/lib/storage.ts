const RECENT_KEY = "tools-hub-100:recent-tools";
const MAX_RECENT = 6;

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
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("tools-hub-recent-updated"));
}
