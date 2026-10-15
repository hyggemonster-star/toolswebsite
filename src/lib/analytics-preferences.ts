export const ANALYTICS_PREFERENCE_EVENT = "tools-hub:analytics-preference-changed";
const ANALYTICS_CONSENT_KEY = "tools-hub-analytics-consent-v2";

export function isAnalyticsEnabled() {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAnalyticsEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new CustomEvent(ANALYTICS_PREFERENCE_EVENT, { detail: { enabled } }));
  } catch {
    window.dispatchEvent(new CustomEvent(ANALYTICS_PREFERENCE_EVENT, { detail: { enabled: false } }));
  }
}

export function readAnalyticsPreference() {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function readAnalyticsChoice() {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch {
    return "0";
  }
}
