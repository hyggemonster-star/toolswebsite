"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ANALYTICS_PREFERENCE_EVENT, readAnalyticsPreference } from "@/lib/analytics-preferences";

type PageVisit = {
  path: string;
  visitId: string;
  sessionId: string;
  startedAt: number;
  sourcePage: string;
  sent: boolean;
  finished: boolean;
};

function id() {
  try {
    return crypto.randomUUID();
  } catch {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
  }
}

function sessionId() {
  try {
    const valueKey = "tools-hub-analytics-session";
    const lastActiveKey = "tools-hub-analytics-session-last-active";
    const now = Date.now();
    let value = window.sessionStorage.getItem(valueKey);
    const lastActive = Number(window.sessionStorage.getItem(lastActiveKey));
    if (!value || !Number.isFinite(lastActive) || lastActive <= 0 || now - lastActive >= 8 * 60 * 60 * 1000) {
      value = id();
      window.sessionStorage.setItem(valueKey, value);
    }
    window.sessionStorage.setItem(lastActiveKey, String(now));
    return value;
  } catch {
    return id();
  }
}

function activeSessionId(session: { current: string }) {
  const value = sessionId();
  session.current = value;
  return value;
}

function visitorId() {
  try {
    const valueKey = "tools-hub-analytics-visitor";
    const createdKey = "tools-hub-analytics-visitor-created";
    const savedValue = window.localStorage.getItem(valueKey);
    const createdAt = Number(window.localStorage.getItem(createdKey));
    const expired = !Number.isFinite(createdAt) || createdAt <= 0 || Date.now() - createdAt >= 90 * 24 * 60 * 60 * 1000;
    const value = savedValue && !expired ? savedValue : id();
    if (value !== savedValue || expired) {
      window.localStorage.setItem(valueKey, value);
      window.localStorage.setItem(createdKey, String(Date.now()));
    }
    return value;
  } catch {
    return id();
  }
}

function safePath(path: string) {
  const pathname = path.split(/[?#]/, 1)[0];
  return pathname.startsWith("/") && pathname.length < 160 ? pathname : "/other";
}

function sourcePage() {
  try {
    if (!document.referrer) return "";
    const referrer = new URL(document.referrer);
    return `${referrer.origin}${referrer.pathname}`;
  } catch {
    return "";
  }
}

function send(payload: Record<string, unknown>) {
  if (!readAnalyticsPreference()) return;
  const base = (process.env.NEXT_PUBLIC_ANALYTICS_API_BASE || "/api/analytics").replace(/\/+$/, "");
  const body = JSON.stringify(payload);
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.(`${base}/collect`, blob)) return;
  } catch {
    // Analytics is best effort; failures must not affect tool use.
  }
  try {
    void fetch(`${base}/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics is best effort; failures must not affect tool use.
  }
}

function finishPage(page: PageVisit) {
  if (page.finished) return;
  page.finished = true;
  if (!page.sent || !readAnalyticsPreference()) return;
  send({
    type: "page_duration",
    visitId: page.visitId,
    sessionId: page.sessionId,
    durationMs: Math.round(performance.now() - page.startedAt),
  });
}

function screenSize() {
  const width = Math.max(0, Math.round((window.screen?.width || 0) / 100) * 100);
  const height = Math.max(0, Math.round((window.screen?.height || 0) / 100) * 100);
  return `${width}x${height}`;
}

function hasVisibleError(workspace: Element) {
  const error = workspace.querySelector(".field-error, [role='alert'], .ai-enhancement-error, .direct-ai-error");
  return Boolean(error?.textContent?.trim());
}

export function AnalyticsTracker() {
  const pathname = usePathname() || "/";
  const currentPage = useRef<PageVisit | null>(null);
  const session = useRef("");
  const visitor = useRef("");

  useEffect(() => {
    session.current = readAnalyticsPreference() ? activeSessionId(session) : "";
    if (!visitor.current && readAnalyticsPreference()) visitor.current = visitorId();
    const path = safePath(pathname || window.location.pathname);
    const previous = currentPage.current;
    if (previous) finishPage(previous);

    const page: PageVisit = {
      path,
      visitId: id(),
      sessionId: session.current,
      startedAt: performance.now(),
      sourcePage: previous?.path || sourcePage(),
      sent: false,
      finished: false,
    };
    currentPage.current = page;

    const sendPage = () => {
      if (page.sent || page.finished || path.startsWith("/admin") || !readAnalyticsPreference()) return;
      const tool = document.querySelector<HTMLElement>("[data-analytics-tool]");
      const toolId = tool?.dataset.analyticsTool || null;
      page.sent = true;
      send({
        type: "page_view",
        visitId: page.visitId,
        sessionId: activeSessionId(session),
        visitorId: visitor.current || visitorId(),
        path: page.path,
        toolId,
        toolName: toolId ? tool?.dataset.analyticsToolName || "未知工具" : null,
        sourcePage: page.sourcePage,
        screenSize: screenSize(),
        language: navigator.language || "未知",
      });
    };
    sendPage();

    const onPreferenceChange = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled;
      if (enabled) sendPage();
    };
    const onStorageChange = (event: StorageEvent) => {
      if (event.key === "tools-hub-analytics-disabled" && event.newValue === null) sendPage();
    };
    const onPageHide = () => finishPage(page);
    window.addEventListener(ANALYTICS_PREFERENCE_EVENT, onPreferenceChange);
    window.addEventListener("storage", onStorageChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      finishPage(page);
      window.removeEventListener(ANALYTICS_PREFERENCE_EVENT, onPreferenceChange);
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [pathname]);

  useEffect(() => {
    const active = new Set<() => void>();
    const liveTimers = new Set<number>();
    const liveStartedAt = new WeakMap<Element, number>();
    const livePending = new WeakMap<Element, number>();
    const liveStarted = new WeakSet<Element>();
    const liveRecorded = new WeakSet<Element>();
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button.primary-button");
      const scope = button?.closest<HTMLElement>("[data-analytics-tool]");
      if (!button || !scope || button.disabled || !readAnalyticsPreference()) return;

      const toolId = scope.dataset.analyticsTool || "";
      const toolName = scope.dataset.analyticsToolName || "未知工具";
      const workspace = button.closest<HTMLElement>(".workspace-card") || scope;
      const eventId = id();
      const startedAt = performance.now();
      let sawBusy = false;
      let finished = false;
      let pollTimer = 0;
      let timeoutTimer = 0;
      const cleanupObserver = () => {
        observer.disconnect();
        window.clearInterval(pollTimer);
        window.clearTimeout(timeoutTimer);
        active.delete(cancelAsFailure);
      };
      const finish = (success: boolean) => {
        if (finished) return;
        finished = true;
        cleanupObserver();
        send({
          type: "tool_usage",
          eventId,
          sessionId: session.current || sessionId(),
          visitorId: visitor.current || visitorId(),
          toolId,
          toolName,
          success,
          durationMs: Math.round(performance.now() - startedAt),
        });
      };
      const cancelAsFailure = () => finish(false);
      send({
        type: "tool_start",
        eventId,
        sessionId: activeSessionId(session),
        visitorId: visitor.current || visitorId(),
        toolId,
      });
      const busy = () => button.isConnected && (button.disabled || /正在|处理中|生成中|读取中|转换中|导出中|压缩中|解析中|提取中|等待中/.test(button.textContent || ""));
      const inspect = () => {
        if (busy()) {
          sawBusy = true;
          return;
        }
        if (sawBusy || performance.now() - startedAt >= 120) finish(!hasVisibleError(workspace));
      };
      const observer = new MutationObserver(inspect);
      observer.observe(workspace, { attributes: true, childList: true, characterData: true, subtree: true });
      active.add(cancelAsFailure);
      pollTimer = window.setInterval(inspect, 120);
      timeoutTimer = window.setTimeout(() => finish(false), 5 * 60 * 1000);
      window.setTimeout(inspect, 0);
    };
    const onLiveInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("input, textarea, select");
      const scope = control?.closest<HTMLElement>("[data-analytics-tool]");
      const workspace = control?.closest<HTMLElement>(".workspace-card");
      if (!scope || !workspace || workspace.querySelector("button.primary-button") || liveRecorded.has(workspace) || !readAnalyticsPreference()) return;
      liveStartedAt.set(workspace, performance.now());
      if (!liveStarted.has(workspace)) {
        liveStarted.add(workspace);
        send({
          type: "tool_start",
          eventId: id(),
          sessionId: activeSessionId(session),
          visitorId: visitor.current || visitorId(),
          toolId: scope.dataset.analyticsTool || "",
        });
      }
      const previousTimer = livePending.get(workspace);
      if (previousTimer) {
        window.clearTimeout(previousTimer);
        liveTimers.delete(previousTimer);
      }
      const timer = window.setTimeout(() => {
        liveTimers.delete(timer);
        if (!workspace.isConnected || liveRecorded.has(workspace) || !readAnalyticsPreference()) return;
        liveRecorded.add(workspace);
        send({
          type: "tool_usage",
          eventId: id(),
          sessionId: activeSessionId(session),
          visitorId: visitor.current || visitorId(),
          toolId: scope.dataset.analyticsTool || "",
          toolName: scope.dataset.analyticsToolName || "未知工具",
          success: !hasVisibleError(workspace),
          durationMs: Math.max(0, Math.round(performance.now() - (liveStartedAt.get(workspace) || performance.now()))),
        });
      }, 500);
      livePending.set(workspace, timer);
      liveTimers.add(timer);
    };
    const onDownload = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !readAnalyticsPreference()) return;
      const link = target.closest<HTMLAnchorElement>("a[download]");
      const scope = link?.closest<HTMLElement>("[data-analytics-tool]");
      if (!link || !scope) return;
      send({
        type: "tool_download",
        eventId: id(),
        sessionId: activeSessionId(session),
        visitorId: visitor.current || visitorId(),
        toolId: scope.dataset.analyticsTool || "",
        toolName: scope.dataset.analyticsToolName || "未知工具",
      });
    };
    const onPageHide = () => active.forEach((cancel) => cancel());
    const recordPageError = () => {
      const page = currentPage.current;
      if (!page || page.path.startsWith("/admin") || !readAnalyticsPreference()) return;
      const tool = document.querySelector<HTMLElement>("[data-analytics-tool]");
      send({
        type: "page_error",
        errorType: "page_error",
        eventId: id(),
        sessionId: activeSessionId(session),
        visitorId: visitor.current || visitorId(),
        path: page.path,
        toolId: tool?.dataset.analyticsTool || null,
      });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("click", onDownload, true);
    document.addEventListener("input", onLiveInput, true);
    document.addEventListener("change", onLiveInput, true);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("error", recordPageError);
    window.addEventListener("unhandledrejection", recordPageError);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("click", onDownload, true);
      document.removeEventListener("input", onLiveInput, true);
      document.removeEventListener("change", onLiveInput, true);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("error", recordPageError);
      window.removeEventListener("unhandledrejection", recordPageError);
      active.forEach((cancel) => cancel());
      liveTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const sendHeartbeat = () => {
      const page = currentPage.current;
      if (!page || page.path.startsWith("/admin") || !readAnalyticsPreference() || document.visibilityState !== "visible") return;
      page.sessionId = activeSessionId(session);
      send({ type: "heartbeat", sessionId: page.sessionId, path: page.path });
    };
    const timer = window.setInterval(sendHeartbeat, 60_000);
    document.addEventListener("visibilitychange", sendHeartbeat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sendHeartbeat);
    };
  }, []);

  return null;
}
