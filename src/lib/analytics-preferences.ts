export const ANALYTICS_PREFERENCE_EVENT = "tools-hub:analytics-preference-changed";
const ANALYTICS_DISABLED_KEY = "tools-hub-analytics-disabled";

export function isAnalyticsEnabled() {
  try {
    return window.localStorage.getItem(ANALYTICS_DISABLED_KEY) !== "1";
  } catch {
    return false;
  }
}

export function setAnalyticsEnabled(enabled: boolean) {
  try {
    if (enabled) window.localStorage.removeItem(ANALYTICS_DISABLED_KEY);
    else window.localStorage.setItem(ANALYTICS_DISABLED_KEY, "1");
    window.dispatchEvent(new CustomEvent(ANALYTICS_PREFERENCE_EVENT, { detail: { enabled } }));
  } catch {
    window.dispatchEvent(new CustomEvent(ANALYTICS_PREFERENCE_EVENT, { detail: { enabled: false } }));
  }
}

export function readAnalyticsPreference() {
  try {
    return window.localStorage.getItem(ANALYTICS_DISABLED_KEY) !== "1";
  } catch {
    return false;
  }
}
