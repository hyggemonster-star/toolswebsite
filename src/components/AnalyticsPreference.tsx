"use client";

import { useSyncExternalStore } from "react";
import { ANALYTICS_PREFERENCE_EVENT, readAnalyticsPreference, setAnalyticsEnabled } from "@/lib/analytics-preferences";

function subscribe(callback: () => void) {
  window.addEventListener(ANALYTICS_PREFERENCE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(ANALYTICS_PREFERENCE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function AnalyticsPreference() {
  const enabled = useSyncExternalStore(subscribe, readAnalyticsPreference, () => false);

  function update(value: boolean) {
    setAnalyticsEnabled(value);
  }

  return <div className="analytics-preference">
    <div>
      <strong>访问与工具统计</strong>
      <p>开启后记录访问、工具操作及来源 IP；IP 最多保留 30 天。关闭后，此浏览器不再发送新的统计事件。</p>
    </div>
    <button
      type="button"
      className={`analytics-switch ${enabled ? "is-on" : ""}`}
      role="switch"
      aria-checked={enabled}
      onClick={() => update(!enabled)}
    >
      <span aria-hidden="true" />
      <span>{enabled ? "已开启" : "已关闭"}</span>
    </button>
  </div>;
}
