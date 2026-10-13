"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Clock3, LogOut, RefreshCw, ShieldCheck, Users, Wrench } from "lucide-react";

type CountItem = { label: string; count: number };
type ToolItem = {
  toolId: string;
  toolName: string;
  count: number;
  successCount: number;
  failureCount: number;
  averageDurationMs: number;
};
type DashboardData = {
  generatedAt: number;
  rangeDays: number;
  online: number;
  metrics: { todayVisitors: number; todayPv: number; yesterdayPv: number; todayToolUses: number; pvChangePercent: number | null };
  topTools: ToolItem[];
  devices: CountItem[];
  browsers: CountItem[];
  countries: CountItem[];
  sources: CountItem[];
  paths: CountItem[];
  exitPages: Array<{ label: string; path: string; count: number }>;
  activity: Array<{ kind: "visit" | "tool"; occurredAt: number; label: string }>;
};

const API_BASE = (process.env.NEXT_PUBLIC_ANALYTICS_API_BASE || "/api/analytics").replace(/\/+$/, "");

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "后台暂时不可用");
  return data;
}

function number(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function time(value: number) {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(value);
}

function duration(value: number) {
  if (!value) return "—";
  return value < 1000 ? `${value} 毫秒` : `${(value / 1000).toFixed(1)} 秒`;
}

function BarList({ title, items, empty }: { title: string; items: CountItem[]; empty?: string }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return <section className="analytics-panel">
    <h2>{title}</h2>
    {items.length ? <ul className="analytics-bar-list">{items.map((item) => <li key={item.label}>
      <div><span>{item.label || "直接访问"}</span><strong>{number(item.count)}</strong></div>
      <span className="analytics-bar-track"><span style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }} /></span>
    </li>)}</ul> : <p className="analytics-empty">{empty || "还没有统计数据"}</p>}
  </section>;
}

function Metric({ label, value, hint, icon }: { label: string; value: string; hint?: React.ReactNode; icon: React.ReactNode }) {
  return <article className="analytics-metric"><span className="analytics-metric-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong>{hint && <small>{hint}</small>}</div></article>;
}

function Login({ onLogin, message, busy }: { onLogin: (username: string, password: string) => Promise<void>; message: string; busy: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onLogin(username, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败，请稍后重试");
      setPassword("");
    }
  }

  return <main className="analytics-admin-page analytics-login-wrap">
    <section className="analytics-login-card">
      <span className="analytics-brand-mark"><ShieldCheck size={22} /></span>
      <p className="analytics-kicker">TOOLS HUB · PRIVATE</p>
      <h1>管理员登录</h1>
      <p className="analytics-login-intro">登录后查看匿名访问和工具使用汇总。</p>
      <form onSubmit={submit} className="analytics-login-form">
        <label>管理员账号<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
        <label>管理员密码<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {(error || message) && <p className="analytics-form-error" role="alert">{error || message}</p>}
        <button type="submit" className="analytics-primary-button" disabled={busy}>{busy ? "正在登录…" : "登录后台"}</button>
      </form>
      <p className="analytics-login-footnote">后台数据仅限管理员查看；登录状态使用短时安全 Cookie。</p>
    </section>
  </main>;
}

export function AnalyticsAdmin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(7);
  const [updatedAt, setUpdatedAt] = useState(0);

  const loadDashboard = useCallback(async (range = days) => {
    const data = await requestJson(`${API_BASE}/admin/dashboard?days=${range}`);
    setDashboard(data.data as DashboardData);
    setUpdatedAt(Date.now());
  }, [days]);

  useEffect(() => {
    let active = true;
    requestJson(`${API_BASE}/admin/session`).then(async (data) => {
      if (!active || !data.authenticated) return;
      const result = await requestJson(`${API_BASE}/admin/dashboard?days=7`);
      if (!active) return;
      setDashboard(result.data as DashboardData);
      setUpdatedAt(Date.now());
      setDays(7);
      setAuthenticated(true);
    }).catch((reason) => {
      const text = reason instanceof Error ? reason.message : "后台暂时不可用";
      if (active && text !== "请先登录") setMessage(text);
    }).finally(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => { void loadDashboard().catch(() => undefined); }, 20_000);
    return () => window.clearInterval(timer);
  }, [authenticated, loadDashboard]);

  async function login(username: string, password: string) {
    setBusy(true);
    setMessage("");
    try {
      await requestJson(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      setAuthenticated(true);
      await loadDashboard();
    } catch (reason) {
      setAuthenticated(false);
      throw reason;
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await requestJson(`${API_BASE}/admin/logout`, { method: "POST" });
    } catch {
      // Clearing the view is safe even when the server is unreachable.
    }
    setAuthenticated(false);
    setDashboard(null);
  }

  async function refresh(range = days) {
    setDays(range);
    setBusy(true);
    setMessage("");
    try {
      await loadDashboard(range);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "数据刷新失败");
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <main className="analytics-admin-page"><p className="analytics-loading">正在检查登录状态…</p></main>;
  if (!authenticated) return <Login onLogin={login} message={message} busy={busy} />;

  const change = dashboard?.metrics.pvChangePercent;
  const changeHint = change === null || change === undefined
    ? "暂无昨日数据"
    : <span className={change >= 0 ? "analytics-positive" : "analytics-negative"}>{change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(change)}% 较昨日</span>;

  return <main className="analytics-admin-page">
    <header className="analytics-dashboard-header">
      <div><p className="analytics-kicker">TOOLS HUB · ANALYTICS</p><h1>使用情况</h1><p>匿名汇总数据，用于了解访问趋势和功能表现。</p></div>
      <div className="analytics-header-actions">
        <label className="analytics-range-label">统计范围<select value={days} onChange={(event) => void refresh(Number(event.target.value))}><option value={1}>今天</option><option value={7}>近 7 天</option><option value={30}>近 30 天</option></select></label>
        <button type="button" className="analytics-icon-button" onClick={() => void refresh()} disabled={busy} aria-label="刷新数据"><RefreshCw size={17} /></button>
        <button type="button" className="analytics-logout-button" onClick={() => void logout()}><LogOut size={16} />退出</button>
      </div>
    </header>

    {message && <p className="analytics-dashboard-message" role="status">{message}</p>}
    <section className="analytics-metrics-grid">
      <Metric label="今日访客" value={number(dashboard?.metrics.todayVisitors || 0)} hint="按匿名 IP 哈希估算" icon={<Users size={19} />} />
      <Metric label="今日页面访问" value={number(dashboard?.metrics.todayPv || 0)} hint={changeHint} icon={<Activity size={19} />} />
      <Metric label="今日工具使用" value={number(dashboard?.metrics.todayToolUses || 0)} hint="含成功与失败" icon={<Wrench size={19} />} />
      <Metric label="当前在线" value={number(dashboard?.online || 0)} hint="最近 5 分钟有活动的会话" icon={<BarChart3 size={19} />} />
    </section>

    <section className="analytics-dashboard-grid analytics-wide-first">
      <div className="analytics-panel">
        <h2>工具使用排行 <span>近 {days} 天</span></h2>
        {dashboard?.topTools.length ? <div className="analytics-table-scroll"><table className="analytics-tools-table"><thead><tr><th>工具</th><th>使用</th><th>成功</th><th>失败</th><th>平均耗时</th></tr></thead><tbody>{dashboard.topTools.map((tool) => <tr key={tool.toolId}><td><strong>{tool.toolName}</strong><small>{tool.toolId}</small></td><td>{number(tool.count)}</td><td>{number(tool.successCount)}</td><td>{number(tool.failureCount)}</td><td>{duration(tool.averageDurationMs)}</td></tr>)}</tbody></table></div> : <p className="analytics-empty">还没有工具使用数据</p>}
      </div>
      <BarList title="用户设备" items={dashboard?.devices || []} />
    </section>

    <section className="analytics-dashboard-grid">
      <BarList title="浏览器" items={dashboard?.browsers || []} />
      <BarList title="访问地区" items={dashboard?.countries || []} empty="未配置可信地区来源时显示未知" />
      <BarList title="访问来源" items={dashboard?.sources || []} />
      <div className="analytics-panel">
        <h2>常见访问路径</h2>
        {dashboard?.paths.length ? <ol className="analytics-ranked-list">{dashboard.paths.map((item, index) => <li key={item.label}><span>{index + 1}</span><div><strong>{item.label}</strong><small>{number(item.count)} 个会话</small></div></li>)}</ol> : <p className="analytics-empty">还没有足够的路径数据</p>}
      </div>
      <BarList title="常见离开页面" items={dashboard?.exitPages.map((item) => ({ label: item.label, count: item.count })) || []} />
    </section>

    <section className="analytics-dashboard-grid analytics-activity-grid">
      <div className="analytics-panel">
        <h2>最近活动 <span>每 20 秒更新</span></h2>
        {dashboard?.activity.length ? <ul className="analytics-activity-list">{dashboard.activity.map((item, index) => <li key={`${item.occurredAt}-${item.kind}-${index}`}><time>{time(item.occurredAt)}</time><span className={item.kind === "tool" ? "is-tool" : ""}>{item.label}</span></li>)}</ul> : <p className="analytics-empty">暂无近期活动</p>}
      </div>
      <div className="analytics-panel analytics-update-panel"><Clock3 size={20} /><div><h2>数据更新</h2><p>{updatedAt ? `刚刚更新于 ${time(updatedAt)}` : "等待第一次更新"}</p><small>统计在浏览器后台发送；工具本身不会等待统计结果。</small></div></div>
    </section>
    <p className="analytics-admin-footnote">访问人数按每日变化的 IP 哈希估算，同一网络的多人可能计为一位访客。统计数据自动保留 90 天。</p>
  </main>;
}
