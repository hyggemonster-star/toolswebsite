"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ANALYTICS_PREFERENCE_EVENT, readAnalyticsChoice, setAnalyticsEnabled } from "@/lib/analytics-preferences";

function subscribe(callback: () => void) {
  window.addEventListener(ANALYTICS_PREFERENCE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(ANALYTICS_PREFERENCE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function AnalyticsConsent() {
  const choice = useSyncExternalStore(subscribe, readAnalyticsChoice, () => "0");
  if (choice !== null) return null;

  return <aside className="analytics-consent" aria-label="访问统计设置">
    <p>为了解工具使用情况并排查故障，本站希望记录访问页面、工具操作、设备类别和来源 IP。IP 最多保留 30 天；不收集工具输入、上传文件或处理结果。你可以随时在<Link href="/privacy">隐私政策</Link>中关闭统计。</p>
    <div><button type="button" onClick={() => setAnalyticsEnabled(false)}>暂不开启</button><button type="button" onClick={() => setAnalyticsEnabled(true)}>同意开启</button></div>
  </aside>;
}
