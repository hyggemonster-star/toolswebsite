"use client";

import { Fragment, useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, AlertCircle, AlertTriangle, BarChart3, CheckCircle2, ChevronRight, Copy,
  Clock3, Download, Eye, FileText, Globe2, LogOut, MousePointer2, RefreshCw, Route,
  Settings2, ShieldAlert, ShieldCheck, Timer, TrendingUp, Users, Wrench, XCircle,
} from "lucide-react";
import { tools } from "@/data/tools";

type CountItem = { label: string; count: number };
type ToolItem = { toolId: string; visits: number; visitorCount: number; userCount: number; uses: number; successes: number; failures: number; downloads: number; averageDurationMs: number; successRate: number; failureRate: number; valueScore: number; stars: number | null };
type FunnelItem = { id: string; label: string; count: number; dropoffPercent: number | null };
type EventItem = { eventType: string; at: number; page: string; deviceType: string; ipAddress?: string | null };
type VisitorItem = { visitorRef: string; visitorLabel: string; ipAddress: string | null; firstSeenAt: number; lastActiveAt: number; sessions: number; pageViews: number; toolUses: number; successes: number; failures: number; downloads: number; segment: string; valueScore: number; valueLevel: string; valueReasons: string[] };
type JourneyStep = { kind: string; label: string; toolId?: string | null; categoryId?: string };
type PathItem = { steps: JourneyStep[]; count: number; sharePercent: number };
type AnomalyItem = { at: number; type: string; rule: string; page: string; toolId: string | null; count: number; peakCount: number };
type DailyReport = { reportDate: string; previousDate: string; generatedAt: number; metrics: DashboardData["metrics"]; previousMetrics: DashboardData["metrics"]; changes: Record<string, number | null>; hotTools: ToolItem[]; failureTools: ToolItem[]; anomalyCount: number; anomalies: AnomalyItem[]; insights: string[] };
type DashboardData = {
  generatedAt: number;
  range: { start: string; end: string; days: number };
  metrics: { visitors: number; pageViews: number; toolUses: number; successes: number; downloads: number; averageStayMs: number; failures: number; successRate: number; errorCount: number };
  dailyTrend: Array<{ day: string; visitors: number; pageViews: number; toolUses: number; successes: number; failures: number; successRate: number }>;
  hotTools: ToolItem[];
  highSuccessTools: ToolItem[];
  highFailureTools: ToolItem[];
  devices: CountItem[];
  operatingSystems: CountItem[];
  browsers: CountItem[];
  screenSizes: CountItem[];
  countries: CountItem[];
  provinces: CountItem[];
  sources: CountItem[];
  sourceWebsites: CountItem[];
  funnel: FunnelItem[];
  paths: PathItem[];
  errors: Array<{ errorCode: string; page: string; toolId: string | null; count: number; lastOccurredAt: number }>;
  errorGroups: { byPage: CountItem[]; byTool: CountItem[] };
  anomalies: AnomalyItem[];
  anomalyCount: number;
  toolValueRankings: ToolItem[];
  online: { count: number; sessions: Array<{ visitorLabel: string; currentPage: string; lastActiveAt: number; deviceType: string; ipAddress: string | null }> };
  activity: EventItem[];
  liveActivity: EventItem[];
  retentionDays: number;
};
type VisitorList = { total: number; groupCounts: Record<string, number>; visitors: VisitorItem[] };
type Timeline = { visitor: VisitorItem; eventCount: number; truncated: boolean; events: Array<{ at: number; sessionLabel: string; eventType: string; action: string; page: string; durationMs: number; deviceType: string; operatingSystem: string; browser: string; country: string; province: string; ipAddress: string | null }> };
type SecurityEvent = { eventId: string; occurredAt: number; ipAddress: string; ruleCode: string; ruleLabel: string; pagePath: string; toolId: string | null; hitCount: number };
type Settings = { retentionDays: number; retentionChoices: number[] };
type Section = "overview" | "visitors" | "behavior" | "tools" | "funnel" | "realtime" | "errors" | "security" | "report" | "settings";
type RangePreset = "today" | "yesterday" | "7d" | "30d" | "custom";

const API_BASE = (process.env.NEXT_PUBLIC_ANALYTICS_API_BASE || "/api/analytics").replace(/\/+$/, "");
const NAV: Array<{ id: Section; label: string; icon: ReactNode }> = [
  { id: "overview", label: "运营总览", icon: <BarChart3 size={17} /> },
  { id: "visitors", label: "访客分析", icon: <Users size={17} /> },
  { id: "behavior", label: "用户行为", icon: <Route size={17} /> },
  { id: "tools", label: "工具分析", icon: <Wrench size={17} /> },
  { id: "funnel", label: "转化漏斗", icon: <MousePointer2 size={17} /> },
  { id: "realtime", label: "实时访问", icon: <Activity size={17} /> },
  { id: "errors", label: "错误监控", icon: <AlertTriangle size={17} /> },
  { id: "security", label: "安全审计", icon: <ShieldAlert size={17} /> },
  { id: "report", label: "运营日报", icon: <FileText size={17} /> },
  { id: "settings", label: "系统设置", icon: <Settings2 size={17} /> },
];
const TOOL_NAMES = new Map(tools.map((tool) => [tool.slug, tool.name]));

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "后台暂时不可用，请稍后重试");
  return data;
}

function number(value: number) { return new Intl.NumberFormat("zh-CN").format(value || 0); }
function toolName(slug: string | null | undefined) { return slug ? TOOL_NAMES.get(slug) || slug : "非工具页面"; }
function timestamp(value: number) { return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(value); }
function fullTimestamp(value: number) { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(value); }
function duration(value: number) {
  if (!value) return "暂无数据";
  if (value < 1000) return `${value} 毫秒`;
  const seconds = value / 1000;
  return seconds >= 60 ? `${Math.floor(seconds / 60)} 分 ${Math.round(seconds % 60)} 秒` : `${seconds.toFixed(1)} 秒`;
}
function dateToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}
function dateYesterday() {
  const today = dateToday();
  return new Date(Date.parse(`${today}T00:00:00+08:00`) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function queryFor(preset: RangePreset, start: string, end: string) {
  const params = new URLSearchParams();
  if (preset === "custom") { params.set("start", start); params.set("end", end); }
  else params.set("preset", preset);
  return params.toString();
}
async function requestVisitors(range: string, group: string, ipAddress = ""): Promise<VisitorList> {
  const params = new URLSearchParams(range);
  params.set("group", group);
  if (ipAddress.trim()) params.set("ip", ipAddress.trim());
  const data = await requestJson(`${API_BASE}/admin/v3/visitors?${params}`);
  return data.data as VisitorList;
}
function Empty({ title = "暂无真实使用数据", detail = "等待用户产生行为后，这里会展示汇总结果。" }: { title?: string; detail?: string }) {
  return <div className="analytics-v3-empty"><span><BarChart3 size={18} /></span><strong>{title}</strong><p>{detail}</p></div>;
}
function Panel({ title, note, children, className = "" }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return <section className={`analytics-v3-panel ${className}`}><header><h2>{title}</h2>{note && <small>{note}</small>}</header>{children}</section>;
}
function Bars({ items, emptyDetail }: { items: CountItem[]; emptyDetail?: string }) {
  if (!items.length) return <Empty detail={emptyDetail} />;
  const max = Math.max(1, ...items.map((item) => item.count));
  return <ul className="analytics-v3-bars">{items.map((item) => <li key={item.label}>
    <div><span>{item.label || "未知"}</span><strong>{number(item.count)}</strong></div>
    <span className="analytics-v3-track"><i style={{ width: `${Math.max(2, item.count / max * 100)}%` }} /></span>
  </li>)}</ul>;
}
function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <article className="analytics-v3-metric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}
function DataTable({ children, minWidth = "700px" }: { children: ReactNode; minWidth?: string }) {
  return <div className="analytics-v3-table-scroll"><table style={{ minWidth }}><tbody>{children}</tbody></table></div>;
}
function Login({ onLogin, message, busy }: { onLogin: (username: string, password: string) => Promise<void>; message: string; busy: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try { await onLogin(username, password); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "登录失败，请稍后重试"); setPassword(""); }
  }
  return <main className="analytics-admin-page analytics-login-wrap"><section className="analytics-login-card">
    <span className="analytics-brand-mark"><ShieldCheck size={22} /></span><p className="analytics-kicker">TOOLS HUB · PRIVATE</p>
    <h1>管理员登录</h1><p className="analytics-login-intro">登录后查看运营统计、工具表现、服务质量与安全告警。</p>
    <form onSubmit={submit} className="analytics-login-form">
      <label>管理员账号<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
      <label>管理员密码<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {(error || message) && <p className="analytics-form-error" role="alert">{error || message}</p>}
      <button type="submit" className="analytics-primary-button" disabled={busy}>{busy ? "正在登录…" : "登录后台"}</button>
    </form>
    <p className="analytics-login-footnote">访问与工具事件记录来源 IP，最多保留 30 天；仅管理员可查看。</p>
  </section></main>;
}

export function AnalyticsAdmin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [visitors, setVisitors] = useState<VisitorList | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [settings, setSettings] = useState<Settings>({ retentionDays: 90, retentionChoices: [30, 60, 90, 180, 365] });
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[] | null>(null);
  const [copiedSecurityIp, setCopiedSecurityIp] = useState("");
  const [reportDate, setReportDate] = useState(() => dateYesterday());
  const [section, setSection] = useState<Section>("overview");
  const [rangePreset, setRangePreset] = useState<RangePreset>("7d");
  const [rangeStart, setRangeStart] = useState(() => dateToday());
  const [rangeEnd, setRangeEnd] = useState(() => dateToday());
  const [visitorGroup, setVisitorGroup] = useState("all");
  const [ipQuery, setIpQuery] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [updatedAt, setUpdatedAt] = useState(0);

  const rangeQuery = queryFor(rangePreset, rangeStart, rangeEnd);
  const loadDashboard = useCallback(async () => {
    const data = await requestJson(`${API_BASE}/admin/v3/dashboard?${rangeQuery}`);
    setDashboard(data.data as DashboardData);
    setUpdatedAt(data.data.generatedAt as number);
  }, [rangeQuery]);
  const loadVisitors = useCallback(async () => {
    setVisitors(await requestVisitors(rangeQuery, visitorGroup, ipFilter));
  }, [rangeQuery, visitorGroup, ipFilter]);
  const loadDailyReport = useCallback(async () => {
    setBusy(true); setMessage(""); setDailyReport(null);
    try {
      const data = await requestJson(`${API_BASE}/admin/v3/daily-report?date=${encodeURIComponent(reportDate)}`);
      setDailyReport(data.data as DailyReport);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "日报暂时无法生成"); }
    finally { setBusy(false); }
  }, [reportDate]);
  const loadSecurityEvents = useCallback(async () => {
    const data = await requestJson(`${API_BASE}/admin/v3/security-events?limit=100`);
    setSecurityEvents((data.data as { events: SecurityEvent[] }).events);
  }, []);
  const refresh = useCallback(async () => {
    setBusy(true); setMessage("");
    try {
      await loadDashboard();
      if (section === "visitors") await loadVisitors();
      if (section === "security") await loadSecurityEvents();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "数据刷新失败，请稍后重试"); }
    finally { setBusy(false); }
  }, [loadDashboard, loadSecurityEvents, loadVisitors, section]);

  useEffect(() => {
    let active = true;
    requestJson(`${API_BASE}/admin/session`).then(async (data) => {
      if (!active || !data.authenticated) return;
      setLoading(true);
      const [dashboardResult, settingsResult] = await Promise.all([
        requestJson(`${API_BASE}/admin/v3/dashboard?${queryFor("7d", dateToday(), dateToday())}`),
        requestJson(`${API_BASE}/admin/v3/settings`),
      ]);
      if (!active) return;
      setDashboard(dashboardResult.data as DashboardData);
      setUpdatedAt(dashboardResult.data.generatedAt as number);
      setSettings(settingsResult.data as Settings);
      setAuthenticated(true);
    }).catch((reason) => {
      const text = reason instanceof Error ? reason.message : "后台暂时不可用，请稍后重试";
      if (active && text !== "请先登录") setMessage(text);
    }).finally(() => { if (active) { setChecking(false); setLoading(false); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => {
      const updates = section === "visitors" ? [loadDashboard(), loadVisitors()] : section === "report" ? [loadDashboard(), loadDailyReport()] : section === "security" ? [loadDashboard(), loadSecurityEvents()] : [loadDashboard()];
      void Promise.all(updates).then(() => setMessage("")).catch((reason) => setMessage(reason instanceof Error ? reason.message : "自动更新失败，请手动刷新"));
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [authenticated, loadDashboard, loadDailyReport, loadSecurityEvents, loadVisitors, section]);

  async function login(username: string, password: string) {
    setBusy(true); setLoading(true); setMessage("");
    try {
      await requestJson(`${API_BASE}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await requestJson(`${API_BASE}/admin/v3/dashboard?${queryFor(rangePreset, rangeStart, rangeEnd)}`);
      setDashboard(data.data as DashboardData); setUpdatedAt(data.data.generatedAt as number); setAuthenticated(true);
    } catch (reason) { setAuthenticated(false); throw reason; }
    finally { setBusy(false); setLoading(false); }
  }
  async function logout() {
    try { await requestJson(`${API_BASE}/admin/logout`, { method: "POST" }); } catch { /* Clear local data even if the connection is down. */ }
    setAuthenticated(false); setDashboard(null); setVisitors(null); setTimeline(null); setSecurityEvents(null); setCopiedSecurityIp("");
  }
  async function openTimeline(visitor: VisitorItem) {
    setTimeline(null); setMessage(""); setSection("visitors");
    try {
      const data = await requestJson(`${API_BASE}/admin/v3/visitors/${visitor.visitorRef}?${rangeQuery}`);
      setTimeline(data.data as Timeline);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "访客行为暂时不可用"); }
  }
  async function saveRetention(value: number) {
    setBusy(true); setMessage("");
    try {
      const data = await requestJson(`${API_BASE}/admin/v3/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retentionDays: value }) });
      setSettings(data.data as Settings); setMessage("数据保留周期已更新，清理任务会在下一轮自动执行。");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "设置保存失败"); }
    finally { setBusy(false); }
  }
  function applyRange() { void refresh(); }
  async function copySecurityIp(ipAddress: string) {
    try {
      await navigator.clipboard.writeText(ipAddress);
      setCopiedSecurityIp(ipAddress);
      window.setTimeout(() => setCopiedSecurityIp((current) => current === ipAddress ? "" : current), 1800);
    } catch {
      setMessage("浏览器未允许复制，请选中 IP 地址手动复制。");
    }
  }
  function changePreset(value: RangePreset) {
    setRangePreset(value);
    setTimeline(null);
    setBusy(true); setMessage("");
    const query = queryFor(value, rangeStart, rangeEnd);
    void requestJson(`${API_BASE}/admin/v3/dashboard?${query}`).then(async (data) => {
      setDashboard(data.data as DashboardData); setUpdatedAt(data.data.generatedAt as number);
      if (section === "visitors") setVisitors(await requestVisitors(query, visitorGroup, ipFilter));
    }).catch((reason) => setMessage(reason instanceof Error ? reason.message : "时间范围加载失败")).finally(() => setBusy(false));
  }

  if (checking || loading) return <main className="analytics-admin-page analytics-v3-loading" aria-busy="true"><span /><i /><i /><i /></main>;
  if (!authenticated) return <Login onLogin={login} message={message} busy={busy} />;
  if (!dashboard) return <main className="analytics-admin-page"><Empty title="后台暂时不可用" detail={message || "刷新页面后重试。"} /></main>;

  const metrics = dashboard.metrics;
  const errorMessage = message && <p className={`analytics-v3-message ${message.includes("已更新") ? "is-success" : ""}`} role="status"><AlertCircle size={16} />{message}</p>;
  const toolTable = (items: ToolItem[], empty: string) => items.length ? <DataTable minWidth="850px">
    <tr><th>工具</th><th>访问</th><th>使用</th><th>成功</th><th>成功率</th><th>失败率</th><th>平均耗时</th><th>下载</th></tr>
    {items.map((item) => <tr key={item.toolId}><td><strong>{toolName(item.toolId)}</strong><small>{item.toolId}</small></td><td>{number(item.visits)}</td><td>{number(item.uses)}</td><td>{number(item.successes)}</td><td>{(item.successRate * 100).toFixed(1)}%</td><td>{(item.failureRate * 100).toFixed(1)}%</td><td>{duration(item.averageDurationMs)}</td><td>{number(item.downloads)}</td></tr>)}
  </DataTable> : <Empty detail={empty} />;

  return <main className="analytics-admin-page analytics-v3-page">
    <header className="analytics-v3-header">
      <div><p className="analytics-kicker">TOOLS HUB · ANALYTICS</p><h1>运营分析</h1><p>访问与工具操作可按来源 IP 查看；IP 最多保留 30 天。</p></div>
      <div className="analytics-v3-controls">
        <label>时间范围<select value={rangePreset} onChange={(event) => changePreset(event.target.value as RangePreset)}>
          <option value="today">今天</option><option value="yesterday">昨天</option><option value="7d">最近 7 天</option><option value="30d">最近 30 天</option><option value="custom">自定义</option>
        </select></label>
        {rangePreset === "custom" && <div className="analytics-v3-date-range"><input aria-label="开始日期" type="date" value={rangeStart} max={dateToday()} onChange={(event) => setRangeStart(event.target.value)} /><span>至</span><input aria-label="结束日期" type="date" value={rangeEnd} max={dateToday()} onChange={(event) => setRangeEnd(event.target.value)} /><button type="button" onClick={applyRange} disabled={busy}>应用</button></div>}
        <button className="analytics-icon-button" type="button" onClick={() => void refresh()} disabled={busy} aria-label="刷新数据"><RefreshCw size={16} /></button>
        <button className="analytics-logout-button" type="button" onClick={() => void logout()}><LogOut size={15} />退出</button>
      </div>
    </header>
    {errorMessage}
    <div className="analytics-v3-layout">
    <nav className="analytics-v3-nav" aria-label="后台模块">{NAV.map((item) => <button key={item.id} type="button" className={section === item.id ? "is-active" : ""} onClick={() => { setSection(item.id); if (item.id === "visitors") void loadVisitors().catch((reason) => setMessage(reason instanceof Error ? reason.message : "访客列表暂时不可用")); else if (item.id === "report") void loadDailyReport(); else if (item.id === "security") void loadSecurityEvents().catch((reason) => setMessage(reason instanceof Error ? reason.message : "安全审计记录暂时不可用")); else setTimeline(null); }} aria-current={section === item.id ? "page" : undefined}>{item.icon}<span>{item.label}</span></button>)}</nav>
    <div className="analytics-v3-content">
    <div className="analytics-v3-range-caption"><span>{dashboard.range.start} 至 {dashboard.range.end}</span><small>数据更新时间：{fullTimestamp(updatedAt)} · 时间范围同步应用于所有统计模块</small></div>

    {section === "overview" && <>
      <section className="analytics-v3-metrics">
        <Metric label="访问人数" value={number(metrics.visitors)} detail="浏览器访客标识估算" icon={<Users size={18} />} />
        <Metric label="页面浏览量" value={number(metrics.pageViews)} detail="所选时间范围" icon={<Eye size={18} />} />
        <Metric label="工具使用" value={number(metrics.toolUses)} detail="开始处理次数" icon={<Wrench size={18} />} />
        <Metric label="成功处理" value={number(metrics.successes)} detail={`整体成功率 ${metrics.successRate}%`} icon={<CheckCircle2 size={18} />} />
        <Metric label="结果下载" value={number(metrics.downloads)} detail="下载事件数" icon={<Download size={18} />} />
        <Metric label="平均停留" value={duration(metrics.averageStayMs)} detail="页面停留时间估值" icon={<Timer size={18} />} />
        <Metric label="失败次数" value={number(metrics.failures)} detail={`${number(metrics.errorCount)} 条服务/页面异常`} icon={<XCircle size={18} />} />
      </section>
      <div className="analytics-v3-grid analytics-v3-grid-wide">
        <Panel title="每日访问与工具使用趋势" note="按中国标准时间统计">
          {dashboard.dailyTrend.some((item) => item.pageViews || item.toolUses || item.visitors) ? <div className="analytics-v3-trend">{dashboard.dailyTrend.map((item) => {
            const max = Math.max(1, ...dashboard.dailyTrend.map((row) => Math.max(row.pageViews, row.toolUses)));
            const visitorMax = Math.max(1, ...dashboard.dailyTrend.map((row) => row.visitors));
            return <div key={item.day} title={`${item.day} · 访客 ${item.visitors} · PV ${item.pageViews} · 使用 ${item.toolUses}`}><span style={{ height: `${Math.max(3, item.pageViews / max * 100)}%` }} /><i style={{ height: `${Math.max(2, item.toolUses / max * 100)}%` }} /><b style={{ height: `${Math.max(2, item.visitors / visitorMax * 100)}%` }} /><small>{item.day.slice(5)}</small></div>;
          })}</div> : <Empty detail="等待访问和工具操作形成趋势。" />}
          <p className="analytics-v3-legend"><i />页面浏览 <i />工具使用 <i />访问人数</p>
        </Panel>
        <Panel title="成功率趋势" note="成功处理 ÷ 工具开始次数">
          {dashboard.dailyTrend.some((item) => item.toolUses) ? <div className="analytics-v3-rate-list">{dashboard.dailyTrend.map((item) => <div key={item.day}><span>{item.day}</span><i><b style={{ width: `${item.successRate}%` }} /></i><strong>{item.successRate}%</strong></div>)}</div> : <Empty detail="有工具操作后会展示每日成功率变化。" />}
        </Panel>
      </div>
      <div className="analytics-v3-grid">
        <Panel title="热门工具 TOP 10" note="使用次数按开始处理统计；成功/失败率以全部开始次数为分母">{toolTable(dashboard.hotTools, "等待用户开始使用工具。")}</Panel>
        <Panel title="访问来源" note="来源只保留网站域名，不保留完整地址"><Bars items={dashboard.sources} emptyDetail="等待访问来源数据。" />{dashboard.sourceWebsites.length > 0 && <div className="analytics-v3-sublist"><strong>来源网站</strong><Bars items={dashboard.sourceWebsites} emptyDetail="暂无外部来源网站。" /></div>}</Panel>
      </div>
      <div className="analytics-v3-grid analytics-v3-grid-three">
        <Panel title="设备类型"><Bars items={dashboard.devices} /></Panel><Panel title="系统与浏览器"><Bars items={[...dashboard.operatingSystems, ...dashboard.browsers].slice(0, 10)} /></Panel><Panel title="访问地区"><Bars items={[...dashboard.countries, ...dashboard.provinces].slice(0, 10)} emptyDetail="可信地区数据源未配置时会显示未知。" /></Panel>
      </div>
    </>}

    {section === "visitors" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="访客分组" note="按所选范围内的汇总行为划分；IP 仅保留 30 天">
        <form className="analytics-v3-ip-filter" onSubmit={(event) => { event.preventDefault(); setIpFilter(ipQuery.trim()); setTimeline(null); void requestVisitors(rangeQuery, visitorGroup, ipQuery.trim()).then(setVisitors).catch((reason) => setMessage(reason instanceof Error ? reason.message : "来源 IP 查询失败")); }}><label>按来源 IP 查询<input type="text" inputMode="text" value={ipQuery} onChange={(event) => setIpQuery(event.target.value)} placeholder="输入 IPv4 或 IPv6 地址" /></label><button type="submit">查询 IP</button>{ipFilter && <button type="button" onClick={() => { setIpQuery(""); setIpFilter(""); void requestVisitors(rangeQuery, visitorGroup).then(setVisitors).catch((reason) => setMessage(reason instanceof Error ? reason.message : "访客列表暂时不可用")); }}>清除</button>}</form>
        <div className="analytics-v3-group-filter"><label>查看分组<select value={visitorGroup} onChange={(event) => { const group = event.target.value; setVisitorGroup(group); void requestVisitors(rangeQuery, group, ipFilter).then(setVisitors).catch((reason) => setMessage(reason instanceof Error ? reason.message : "访客列表暂时不可用")); }}><option value="all">全部访客</option><option>新访客</option><option>回访访客</option><option>活跃访客</option><option>高价值访客</option><option>流失访客</option></select></label>
          <div>{Object.entries(visitors?.groupCounts || {}).map(([label, count]) => <span key={label}>{label}<b>{number(count)}</b></span>)}</div></div>
        {visitors?.visitors.length ? <DataTable minWidth="1160px"><tr><th>访客编号</th><th>最近来源 IP</th><th>价值评分 / 等级</th><th>行为原因</th><th>分组</th><th>访问次数</th><th>页面</th><th>工具使用</th><th>成功 / 失败</th><th>下载</th><th>最近活动</th></tr>
          {visitors.visitors.map((visitor) => <tr key={visitor.visitorRef}><td><button type="button" className="analytics-v3-visitor-link" onClick={() => void openTimeline(visitor)}>{visitor.visitorLabel}<ChevronRight size={14} /></button></td><td><code className="analytics-v3-security-ip">{visitor.ipAddress || "未记录或已过期"}</code></td><td><span className="analytics-v3-score-pill">{visitor.valueScore} · {visitor.valueLevel}</span></td><td className="analytics-v3-value-cell"><small title={visitor.valueReasons.join("；")}>{visitor.valueReasons.join("；")}</small></td><td>{visitor.segment}</td><td>{number(visitor.sessions)} 次</td><td>{number(visitor.pageViews)}</td><td>{number(visitor.toolUses)}</td><td>{number(visitor.successes)} / {number(visitor.failures)}</td><td>{number(visitor.downloads)}</td><td>{timestamp(visitor.lastActiveAt)}</td></tr>)}</DataTable> : <Empty detail="所选时间范围内没有访客行为。" />}
        <p className="analytics-v3-footnote">评分按行为加权：工具使用 30%、下载 25%、活跃天数 20%、累计停留 15%、成功完成 10%；使用封顶 10 次、下载 5 次、活跃 7 天、停留 15 分钟、成功 5 次。0–39 普通、40–69 活跃、70–100 高价值。评分仅用于产品运营。</p>
        <p className="analytics-v3-footnote">分组规则：高价值访客至少 3 次工具操作、完成下载且跨 2 个会话；流失访客查看工具页但未开始处理；活跃访客达到 5 次页面浏览或 2 次工具操作。</p>
      </Panel>
      {timeline && <Panel title={`${timeline.visitor.visitorLabel} · 访问路径`} note={`${number(timeline.eventCount)} 个事件 · 来源 IP 最多保留 30 天`}>
        <ol className="analytics-v3-timeline">{timeline.events.map((event, index) => <li key={`${event.at}-${event.eventType}-${index}`}><time>{timestamp(event.at)}</time><span className="analytics-v3-timeline-dot" /><div><strong>{event.action}</strong><p>{event.page} · {event.deviceType}</p><small>{event.sessionLabel} · IP {event.ipAddress || "未记录或已过期"}{event.durationMs ? ` · ${duration(event.durationMs)}` : ""}</small></div></li>)}</ol>
        {timeline.truncated && <p className="analytics-v3-footnote">此访客在所选时间范围内的事件较多，仅显示最近 500 条。</p>}
      </Panel>}
    </div>}

    {section === "behavior" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="访问路径 TOP 10" note="首页 → 分类 → 工具 → 执行 → 下载；占比以有路径的会话为分母">{dashboard.paths.length ? <ol className="analytics-v3-ranked analytics-v3-path-list">{dashboard.paths.map((item, index) => <li key={`${index}-${item.steps.map((step) => `${step.kind}:${step.toolId || step.categoryId || ""}`).join("/")}`}><b>{String(index + 1).padStart(2, "0")}</b><div className="analytics-v3-path-steps">{item.steps.map((step, stepIndex) => <Fragment key={`${step.kind}-${stepIndex}`}>{stepIndex > 0 && <i>→</i>}<span>{step.kind === "tool" ? toolName(step.toolId) : step.label}</span></Fragment>)}</div><div className="analytics-v3-path-meta"><strong>{number(item.count)} 个会话</strong><small>{item.sharePercent}%</small></div></li>)}</ol> : <Empty detail="等待用户产生多页面访问行为。" />}</Panel>
      <Panel title="行为设备分布"><Bars items={dashboard.devices} /><div className="analytics-v3-sublist"><strong>操作系统</strong><Bars items={dashboard.operatingSystems} /></div><div className="analytics-v3-sublist"><strong>浏览器</strong><Bars items={dashboard.browsers} /></div><div className="analytics-v3-sublist"><strong>屏幕尺寸（约 100px 分档）</strong><Bars items={dashboard.screenSizes} /></div></Panel>
      <Panel title="访问地区" note="仅国家和省级粗略区域"><Bars items={[...dashboard.countries, ...dashboard.provinces]} emptyDetail="未配置可信地区来源时显示未知。" /></Panel>
      <Panel title="来源网站" note="只保存来源主机名，不保留 URL 路径或参数"><Bars items={dashboard.sourceWebsites} emptyDetail="暂无可统计的外部来源网站。" /></Panel>
    </div>}

    {section === "tools" && <div className="analytics-v3-grid">
      <Panel title="工具表现 · 热门 TOP 10" note="使用次数按开始处理统计；成功/失败率以全部开始次数为分母">{toolTable(dashboard.hotTools, "等待工具操作数据。")}</Panel>
      <Panel title="高成功率工具" note="至少 3 次操作后纳入排行">{toolTable(dashboard.highSuccessTools, "样本量达到 3 次后会显示，避免小样本误读。")}</Panel>
      <Panel title="高失败量工具" note="优先排查失败次数较多的功能">{toolTable(dashboard.highFailureTools, "当前时间范围内没有工具失败记录。")}</Panel>
      <Panel title="工具商业价值 TOP 10" note="访客人数 25%（50 人封顶）、使用次数 25%（100 次封顶）、成功率 35%、下载行为 15%（30 次封顶）；操作少于 5 次不显示星级" className="analytics-v3-panel-wide">
        {dashboard.toolValueRankings.length ? <DataTable minWidth="980px"><tr><th>工具</th><th>访问人数</th><th>使用人数</th><th>使用次数</th><th>成功</th><th>下载</th><th>成功率</th><th>平均耗时</th><th>价值分</th><th>星级</th></tr>{dashboard.toolValueRankings.map((item) => <tr key={item.toolId}><td><strong>{toolName(item.toolId)}</strong><small>{item.toolId}</small></td><td>{number(item.visitorCount)}</td><td>{number(item.userCount)}</td><td>{number(item.uses)}</td><td>{number(item.successes)}</td><td>{number(item.downloads)}</td><td>{(item.successRate * 100).toFixed(1)}%</td><td>{duration(item.averageDurationMs)}</td><td>{item.valueScore}</td><td>{item.stars === null ? <small>样本不足</small> : <span className="analytics-v3-stars" aria-label={`${item.stars} 星`}>{"★".repeat(item.stars)}{"☆".repeat(5 - item.stars)}</span>}</td></tr>)}</DataTable> : <Empty detail="工具产生真实访问与操作后，将展示商业价值。" />}
      </Panel>
    </div>}

    {section === "funnel" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="转化漏斗" note="首页 → 分类 → 工具 → 开始 → 成功 → 下载">
        {dashboard.funnel.some((item) => item.count) ? <ol className="analytics-v3-funnel">{dashboard.funnel.map((step, index) => {
          const max = Math.max(1, dashboard.funnel[0]?.count || 0);
          return <li key={step.id}><div><span>{index + 1}</span><strong>{step.label}</strong><b>{number(step.count)}</b><small>{step.dropoffPercent === null ? "起始环节" : `流失 ${step.dropoffPercent}%`}</small></div><i><b style={{ width: `${Math.max(1, step.count / max * 100)}%` }} /></i></li>;
        })}</ol> : <Empty detail="等待访客从首页进入分类、打开工具并完成处理。" />}
      </Panel>
      <Panel title="转化说明"><div className="analytics-v3-note"><MousePointer2 size={19} /><p>漏斗按会话统计，不尝试跨设备拼接。访客可能直接打开工具页，因此分类前置漏斗会显示自然流失。</p></div><div className="analytics-v3-note"><ShieldCheck size={19} /><p>只记录每一步是否发生及时间，不保存用户填写内容、文件或生成结果。</p></div></Panel>
    </div>}

    {section === "realtime" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="当前在线会话" note="最近 5 分钟仍有心跳的访问会话">
        <div className="analytics-v3-online"><Activity size={20} /><strong>{number(dashboard.online.count)}</strong><span>个会话在线</span></div>
        {dashboard.online.sessions.length ? <DataTable minWidth="650px"><tr><th>访客编号</th><th>来源 IP</th><th>当前页面</th><th>设备</th><th>最近活动</th></tr>{dashboard.online.sessions.map((item, index) => <tr key={`${item.visitorLabel}-${item.lastActiveAt}-${index}`}><td>{item.visitorLabel}</td><td><code className="analytics-v3-security-ip">{item.ipAddress || "未记录"}</code></td><td>{item.currentPage}</td><td>{item.deviceType}</td><td>{timestamp(item.lastActiveAt)}</td></tr>)}</DataTable> : <Empty detail="当前没有活跃访问会话。" />}
      </Panel>
      <Panel title="最近活动" note="近 5 分钟内的事件，每 20 秒更新"><ul className="analytics-v3-activity">{dashboard.liveActivity.slice(0, 30).map((item, index) => <li key={`${item.at}-${item.eventType}-${index}`}><time>{timestamp(item.at)}</time><span>{({ page_view: "访问页面", tool_start: "开始处理", tool_success: "处理成功", tool_fail: "处理失败", download: "下载结果", page_error: "页面异常", api_error: "接口异常" } as Record<string, string>)[item.eventType] || "访问事件"}</span><small>{toolName(item.page)} · IP {item.ipAddress || "未记录"}</small></li>)}</ul></Panel>
    </div>}

    {section === "errors" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="错误概况" note="只保留错误类型、发生页面和工具 slug"><div className="analytics-v3-error-summary"><span><XCircle size={19} /><strong>{number(metrics.failures)}</strong><small>工具失败</small></span><span><AlertTriangle size={19} /><strong>{number(metrics.errorCount)}</strong><small>页面与服务异常合计</small></span></div>
        {dashboard.errors.length ? <DataTable minWidth="660px"><tr><th>类别</th><th>发生页面</th><th>工具</th><th>次数</th><th>最近发生</th></tr>{dashboard.errors.map((item, index) => <tr key={`${item.errorCode}-${item.page}-${index}`}><td>{item.errorCode === "tool_failure" ? "工具失败" : item.errorCode === "api_error" ? "接口异常" : item.errorCode === "page_error" ? "页面异常" : "工具处理异常"}</td><td>{item.page}</td><td>{item.toolId ? toolName(item.toolId) : "—"}</td><td>{number(item.count)}</td><td>{timestamp(item.lastOccurredAt)}</td></tr>)}</DataTable> : <Empty detail="当前时间范围内没有记录到服务或页面异常。" />}
      </Panel>
      <Panel title="异常页面 TOP 10"><Bars items={dashboard.errorGroups.byPage} emptyDetail="暂无页面异常聚合。" /></Panel>
      <Panel title="异常工具 TOP 10"><Bars items={dashboard.errorGroups.byTool.map((item) => ({ ...item, label: toolName(item.label) }))} emptyDetail="暂无工具异常聚合。" /></Panel>
      <Panel title="异常访问检测" note="按会话的 5 分钟窗口聚合；来源 IP 可在访客路径查看">
        <div className="analytics-v3-error-summary"><span><ShieldAlert size={19} /><strong>{number(dashboard.anomalyCount)}</strong><small>异常窗口命中</small></span></div>
        {dashboard.anomalies.length ? <DataTable minWidth="760px"><tr><th>时间窗口</th><th>类型</th><th>页面</th><th>工具</th><th>规则</th><th>命中 Session 数</th></tr>{dashboard.anomalies.map((item, index) => <tr key={`${item.at}-${item.type}-${item.page}-${index}`}><td>{timestamp(item.at)}</td><td>{item.type}</td><td>{item.page}</td><td>{item.toolId ? toolName(item.toolId) : "—"}</td><td>{item.rule}（最高 {item.peakCount} 次）</td><td>{number(item.count)}</td></tr>)}</DataTable> : <Empty detail="所选时间范围内没有命中异常访问规则。" />}
        <p className="analytics-v3-footnote">规则：5 分钟内页面访问 ≥30 次、工具开始 ≥20 次或工具/接口失败 ≥5 次。规则命中只是筛查信号，不代表恶意访问；此聚合表不逐条显示 IP。</p>
      </Panel>
      <Panel title="数据边界"><div className="analytics-v3-note"><ShieldCheck size={19} /><p>错误事件不保存原始错误消息、堆栈、请求体、用户输入、上传文件或生成结果，只保存固定错误类别、页面路径、工具标识和限期保存的来源 IP。</p></div></Panel>
    </div>}

    {section === "security" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="异常访问安全审计" note="异常规则记录固定保留 30 天">
        <div className="analytics-v3-security-note"><ShieldAlert size={19} /><p>普通访问和工具操作的来源 IP 可在访客路径中查看，最多保留 30 天；这里单独列出命中异常规则的 IP、时间、页面/工具和命中次数。规则命中是排查信号，不代表恶意访问，也不会自动封禁。共享网络或动态 IP 可能造成误判。</p></div>
        {securityEvents === null ? <Empty title="正在读取安全记录" detail="仅从管理员保护的接口读取异常事件。" /> : securityEvents.length ? <DataTable minWidth="880px"><tr><th>触发时间</th><th>来源 IP</th><th>异常规则</th><th>页面</th><th>工具</th><th>命中数</th><th>处理</th></tr>{securityEvents.map((item) => <tr key={item.eventId}><td>{timestamp(item.occurredAt)}</td><td><code className="analytics-v3-security-ip">{item.ipAddress}</code></td><td>{item.ruleLabel}</td><td>{item.pagePath}</td><td>{item.toolId ? toolName(item.toolId) : "—"}</td><td>{number(item.hitCount)}</td><td><button className="analytics-v3-copy-button" type="button" onClick={() => void copySecurityIp(item.ipAddress)}><Copy size={14} />{copiedSecurityIp === item.ipAddress ? "已复制" : "复制 IP"}</button></td></tr>)}</DataTable> : <Empty title="暂无异常访问记录" detail="等待来源触发安全规则；普通访问的原始 IP 不会进入此列表。" />}
      </Panel>
      <Panel title="触发规则" note="按同一来源的 5 分钟窗口统计">
        <ul className="analytics-v3-security-rules"><li><strong>页面访问过多</strong><span>≥ 60 次</span></li><li><strong>工具开始处理过多</strong><span>≥ 40 次</span></li><li><strong>工具或页面失败过多</strong><span>≥ 10 次</span></li><li><strong>无效统计请求过多</strong><span>≥ 20 次</span></li><li><strong>统计接口速率限制</strong><span>超过 300 次/分钟</span></li></ul>
        <p className="analytics-v3-footnote">此处不收集用户输入、文件内容、生成结果、完整 User-Agent 或设备指纹。IP 只向登录管理员展示。</p>
      </Panel>
    </div>}

    {section === "report" && <>
      <div className="analytics-v3-report-toolbar"><label>日报日期<input type="date" value={reportDate} max={dateToday()} onChange={(event) => { setReportDate(event.target.value); setDailyReport(null); }} /></label><button type="button" onClick={() => void loadDailyReport()} disabled={busy}><TrendingUp size={15} />生成运营日报</button></div>
      {dailyReport ? <>
        <section className="analytics-v3-metrics">
          <Metric label="访问人数" value={number(dailyReport.metrics.visitors)} detail={dailyReport.changes.visitors === null ? "前一日无可比较基线" : `${dailyReport.changes.visitors >= 0 ? "↑" : "↓"}${Math.abs(dailyReport.changes.visitors)}% · 前一日 ${number(dailyReport.previousMetrics.visitors)}`} icon={<Users size={18} />} />
          <Metric label="页面浏览 PV" value={number(dailyReport.metrics.pageViews)} detail={dailyReport.changes.pageViews === null ? "前一日无可比较基线" : `${dailyReport.changes.pageViews >= 0 ? "↑" : "↓"}${Math.abs(dailyReport.changes.pageViews)}% · 前一日 ${number(dailyReport.previousMetrics.pageViews)}`} icon={<Eye size={18} />} />
          <Metric label="工具使用" value={number(dailyReport.metrics.toolUses)} detail={dailyReport.changes.toolUses === null ? "前一日无可比较基线" : `${dailyReport.changes.toolUses >= 0 ? "↑" : "↓"}${Math.abs(dailyReport.changes.toolUses)}% · 前一日 ${number(dailyReport.previousMetrics.toolUses)}`} icon={<Wrench size={18} />} />
          <Metric label="成功处理" value={number(dailyReport.metrics.successes)} detail={`成功率 ${dailyReport.metrics.successRate}%`} icon={<CheckCircle2 size={18} />} />
          <Metric label="结果下载" value={number(dailyReport.metrics.downloads)} detail="下载事件数" icon={<Download size={18} />} />
          <Metric label="异常窗口命中" value={number(dailyReport.anomalyCount)} detail="5 分钟行为阈值聚合" icon={<ShieldAlert size={18} />} />
        </section>
        <div className="analytics-v3-range-caption"><span>{dailyReport.reportDate} 运营日报</span><small>对比日期：{dailyReport.previousDate} · 生成时间：{fullTimestamp(dailyReport.generatedAt)} · 数据按事件实时汇总</small></div>
        <div className="analytics-v3-grid analytics-v3-grid-wide">
          <Panel title="运营摘要"><ul className="analytics-v3-report-insights">{dailyReport.insights.map((item, index) => <li key={index}><TrendingUp size={15} />{item}</li>)}</ul></Panel>
          <Panel title="热门工具 TOP 5">{dailyReport.hotTools.length ? toolTable(dailyReport.hotTools, "暂无真实使用数据。") : <Empty detail="等待用户开始使用工具。" />}</Panel>
          <Panel title="需要关注的失败工具">{dailyReport.failureTools.length ? toolTable(dailyReport.failureTools, "当前没有达到关注阈值的失败工具。") : <Empty detail="没有工具达到失败关注阈值。" />}</Panel>
          <Panel title="异常访问信号">{dailyReport.anomalies.length ? <DataTable minWidth="650px"><tr><th>时间</th><th>类型</th><th>页面</th><th>工具</th><th>命中窗口</th></tr>{dailyReport.anomalies.map((item, index) => <tr key={`${item.at}-${item.type}-${index}`}><td>{timestamp(item.at)}</td><td>{item.type}</td><td>{item.page}</td><td>{item.toolId ? toolName(item.toolId) : "—"}</td><td>{number(item.count)}</td></tr>)}</DataTable> : <Empty detail="没有命中异常访问规则。" />}</Panel>
        </div>
      </> : <Empty title={busy ? "正在汇总真实事件" : "暂无日报"} detail={busy ? "请稍候，后台正在计算所选日期的数据。" : "选择日期并生成日报；没有行为数据时不会填充演示内容。"} />}
    </>}

    {section === "settings" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="数据保留周期" note="后台管理员可调整，定时任务每 6 小时清理一次">
        <div className="analytics-v3-setting"><div><strong>运营事件保留</strong><p>来源 IP 固定 30 天；事件、页面访问、工具操作和下载按所选期限清理。</p></div><label><select value={settings.retentionDays} disabled={busy} onChange={(event) => void saveRetention(Number(event.target.value))}>{settings.retentionChoices.map((days) => <option key={days} value={days}>{days} 天</option>)}</select></label></div>
      </Panel>
      <Panel title="隐私与安全边界"><ul className="analytics-v3-privacy-list"><li><ShieldCheck size={16} />访客编号由随机浏览器标识生成，事件可关联来源 IP，但不关联登录身份。</li><li><ShieldCheck size={16} />不采集用户输入、文件内容、文件名或处理结果。</li><li><ShieldCheck size={16} />访问和工具事件的来源 IP 固定保留 30 天，到期自动清除。</li><li><ShieldCheck size={16} />设备统计只使用类别、浏览器类别与约 100px 分档屏幕尺寸，不进行设备指纹识别。</li><li><ShieldCheck size={16} />来源 IP 只通过已登录的管理员接口查看；页面不自动执行封禁。</li></ul></Panel>
    </div>}

    <footer className="analytics-v3-footer"><span><ShieldCheck size={15} />用于产品优化、服务质量排查和安全审计</span><span><Clock3 size={15} />最近更新 {fullTimestamp(updatedAt)}</span><span><Globe2 size={15} />来源网站只保留域名，地区精度到国家和省份</span></footer>
    </div>
    </div>
  </main>;
}
