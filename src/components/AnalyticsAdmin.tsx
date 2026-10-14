"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, AlertCircle, AlertTriangle, BarChart3, CheckCircle2, ChevronRight,
  Clock3, Download, Eye, Globe2, LogOut, MousePointer2, RefreshCw, Route,
  Settings2, ShieldCheck, Timer, Users, Wrench, XCircle,
} from "lucide-react";
import { tools } from "@/data/tools";

type CountItem = { label: string; count: number };
type ToolItem = { toolId: string; visits: number; uses: number; successes: number; failures: number; downloads: number; averageDurationMs: number; successRate: number; failureRate: number };
type FunnelItem = { id: string; label: string; count: number; dropoffPercent: number | null };
type EventItem = { eventType: string; at: number; page: string; deviceType: string };
type VisitorItem = { visitorRef: string; visitorLabel: string; firstSeenAt: number; lastActiveAt: number; sessions: number; pageViews: number; toolUses: number; successes: number; failures: number; downloads: number; segment: string };
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
  paths: CountItem[];
  errors: Array<{ errorCode: string; page: string; toolId: string | null; count: number; lastOccurredAt: number }>;
  errorGroups: { byPage: CountItem[]; byTool: CountItem[] };
  online: { count: number; sessions: Array<{ visitorLabel: string; currentPage: string; lastActiveAt: number; deviceType: string }> };
  activity: EventItem[];
  liveActivity: EventItem[];
  retentionDays: number;
};
type VisitorList = { total: number; groupCounts: Record<string, number>; visitors: VisitorItem[] };
type Timeline = { visitor: VisitorItem; eventCount: number; truncated: boolean; events: Array<{ at: number; sessionLabel: string; eventType: string; action: string; page: string; durationMs: number; deviceType: string; operatingSystem: string; browser: string; country: string; province: string }> };
type Settings = { retentionDays: number; retentionChoices: number[] };
type Section = "overview" | "visitors" | "behavior" | "tools" | "funnel" | "realtime" | "errors" | "settings";
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
function queryFor(preset: RangePreset, start: string, end: string) {
  const params = new URLSearchParams();
  if (preset === "custom") { params.set("start", start); params.set("end", end); }
  else params.set("preset", preset);
  return params.toString();
}
async function requestVisitors(range: string, group: string): Promise<VisitorList> {
  const params = new URLSearchParams(range);
  params.set("group", group);
  const data = await requestJson(`${API_BASE}/admin/v3/visitors?${params}`);
  return data.data as VisitorList;
}
function Empty({ title = "暂无真实使用数据", detail = "等待用户产生行为后，这里会展示匿名汇总结果。" }: { title?: string; detail?: string }) {
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
    <h1>管理员登录</h1><p className="analytics-login-intro">登录后查看匿名访客、工具表现与服务质量。</p>
    <form onSubmit={submit} className="analytics-login-form">
      <label>管理员账号<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
      <label>管理员密码<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {(error || message) && <p className="analytics-form-error" role="alert">{error || message}</p>}
      <button type="submit" className="analytics-primary-button" disabled={busy}>{busy ? "正在登录…" : "登录后台"}</button>
    </form>
    <p className="analytics-login-footnote">后台只提供匿名运营数据；登录状态使用短时安全 Cookie。</p>
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
  const [section, setSection] = useState<Section>("overview");
  const [rangePreset, setRangePreset] = useState<RangePreset>("7d");
  const [rangeStart, setRangeStart] = useState(() => dateToday());
  const [rangeEnd, setRangeEnd] = useState(() => dateToday());
  const [visitorGroup, setVisitorGroup] = useState("all");
  const [updatedAt, setUpdatedAt] = useState(0);

  const rangeQuery = queryFor(rangePreset, rangeStart, rangeEnd);
  const loadDashboard = useCallback(async () => {
    const data = await requestJson(`${API_BASE}/admin/v3/dashboard?${rangeQuery}`);
    setDashboard(data.data as DashboardData);
    setUpdatedAt(data.data.generatedAt as number);
  }, [rangeQuery]);
  const loadVisitors = useCallback(async () => {
    setVisitors(await requestVisitors(rangeQuery, visitorGroup));
  }, [rangeQuery, visitorGroup]);
  const refresh = useCallback(async () => {
    setBusy(true); setMessage("");
    try {
      await loadDashboard();
      if (section === "visitors") await loadVisitors();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "数据刷新失败，请稍后重试"); }
    finally { setBusy(false); }
  }, [loadDashboard, loadVisitors, section]);

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
      const updates = section === "visitors" ? [loadDashboard(), loadVisitors()] : [loadDashboard()];
      void Promise.all(updates).then(() => setMessage("")).catch((reason) => setMessage(reason instanceof Error ? reason.message : "自动更新失败，请手动刷新"));
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [authenticated, loadDashboard, loadVisitors, section]);

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
    setAuthenticated(false); setDashboard(null); setVisitors(null); setTimeline(null);
  }
  async function openTimeline(visitor: VisitorItem) {
    setTimeline(null); setMessage(""); setSection("visitors");
    try {
      const data = await requestJson(`${API_BASE}/admin/v3/visitors/${visitor.visitorRef}?${rangeQuery}`);
      setTimeline(data.data as Timeline);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "匿名访客行为暂时不可用"); }
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
  function changePreset(value: RangePreset) {
    setRangePreset(value);
    setTimeline(null);
    setBusy(true); setMessage("");
    const query = queryFor(value, rangeStart, rangeEnd);
    void requestJson(`${API_BASE}/admin/v3/dashboard?${query}`).then(async (data) => {
      setDashboard(data.data as DashboardData); setUpdatedAt(data.data.generatedAt as number);
      if (section === "visitors") setVisitors(await requestVisitors(query, visitorGroup));
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
      <div><p className="analytics-kicker">TOOLS HUB · ANALYTICS V3</p><h1>运营分析</h1><p>理解匿名使用行为、产品价值与服务质量。</p></div>
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
    <nav className="analytics-v3-nav" aria-label="后台模块">{NAV.map((item) => <button key={item.id} type="button" className={section === item.id ? "is-active" : ""} onClick={() => { setSection(item.id); if (item.id === "visitors") void loadVisitors().catch((reason) => setMessage(reason instanceof Error ? reason.message : "访客列表暂时不可用")); else setTimeline(null); }} aria-current={section === item.id ? "page" : undefined}>{item.icon}<span>{item.label}</span></button>)}</nav>
    <div className="analytics-v3-range-caption"><span>{dashboard.range.start} 至 {dashboard.range.end}</span><small>数据更新时间：{fullTimestamp(updatedAt)} · 时间范围同步应用于所有统计模块</small></div>

    {section === "overview" && <>
      <section className="analytics-v3-metrics">
        <Metric label="访问人数" value={number(metrics.visitors)} detail="匿名浏览器标识估算" icon={<Users size={18} />} />
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
        <Panel title="访问来源" note="来源只保留网站域名，不保留完整地址"><Bars items={dashboard.sources} emptyDetail="等待匿名访问来源数据。" />{dashboard.sourceWebsites.length > 0 && <div className="analytics-v3-sublist"><strong>来源网站</strong><Bars items={dashboard.sourceWebsites} emptyDetail="暂无外部来源网站。" /></div>}</Panel>
      </div>
      <div className="analytics-v3-grid analytics-v3-grid-three">
        <Panel title="设备类型"><Bars items={dashboard.devices} /></Panel><Panel title="系统与浏览器"><Bars items={[...dashboard.operatingSystems, ...dashboard.browsers].slice(0, 10)} /></Panel><Panel title="访问地区"><Bars items={[...dashboard.countries, ...dashboard.provinces].slice(0, 10)} emptyDetail="可信地区数据源未配置时会显示未知。" /></Panel>
      </div>
    </>}

    {section === "visitors" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="匿名访客分组" note="只按所选范围内的汇总行为划分">
        <div className="analytics-v3-group-filter"><label>查看分组<select value={visitorGroup} onChange={(event) => { const group = event.target.value; setVisitorGroup(group); void requestVisitors(rangeQuery, group).then(setVisitors).catch((reason) => setMessage(reason instanceof Error ? reason.message : "访客列表暂时不可用")); }}><option value="all">全部访客</option><option>新访客</option><option>回访访客</option><option>活跃访客</option><option>高价值访客</option><option>流失访客</option></select></label>
          <div>{Object.entries(visitors?.groupCounts || {}).map(([label, count]) => <span key={label}>{label}<b>{number(count)}</b></span>)}</div></div>
        {visitors?.visitors.length ? <DataTable minWidth="820px"><tr><th>匿名访客</th><th>分组</th><th>访问次数</th><th>页面</th><th>工具使用</th><th>成功 / 失败</th><th>下载</th><th>最近活动</th></tr>
          {visitors.visitors.map((visitor) => <tr key={visitor.visitorRef}><td><button type="button" className="analytics-v3-visitor-link" onClick={() => void openTimeline(visitor)}>{visitor.visitorLabel}<ChevronRight size={14} /></button></td><td>{visitor.segment}</td><td>{number(visitor.sessions)} 次</td><td>{number(visitor.pageViews)}</td><td>{number(visitor.toolUses)}</td><td>{number(visitor.successes)} / {number(visitor.failures)}</td><td>{number(visitor.downloads)}</td><td>{timestamp(visitor.lastActiveAt)}</td></tr>)}</DataTable> : <Empty detail="所选时间范围内没有访客行为。" />}
        <p className="analytics-v3-footnote">高价值：至少 3 次工具操作、完成下载且跨 2 个匿名会话；流失：查看工具页但未开始处理；活跃：5 次页面浏览或 2 次工具操作。</p>
      </Panel>
      {timeline && <Panel title={`${timeline.visitor.visitorLabel} · 匿名行为路径`} note={`${number(timeline.eventCount)} 个事件 · 仅展示页面、操作和设备类别`}>
        <ol className="analytics-v3-timeline">{timeline.events.map((event, index) => <li key={`${event.at}-${event.eventType}-${index}`}><time>{timestamp(event.at)}</time><span className="analytics-v3-timeline-dot" /><div><strong>{event.action}</strong><p>{event.page} · {event.deviceType}</p><small>{event.sessionLabel}{event.durationMs ? ` · ${duration(event.durationMs)}` : ""}</small></div></li>)}</ol>
        {timeline.truncated && <p className="analytics-v3-footnote">此访客在所选时间范围内的事件较多，仅显示最近 500 条。</p>}
      </Panel>}
    </div>}

    {section === "behavior" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="常见匿名访问路径" note="最多展示每个会话的前 8 个页面">{dashboard.paths.length ? <ol className="analytics-v3-ranked">{dashboard.paths.map((item, index) => <li key={item.label}><b>{String(index + 1).padStart(2, "0")}</b><span>{item.label}</span><strong>{number(item.count)} 个会话</strong></li>)}</ol> : <Empty detail="等待用户产生多页面访问行为。" />}</Panel>
      <Panel title="行为设备分布"><Bars items={dashboard.devices} /><div className="analytics-v3-sublist"><strong>操作系统</strong><Bars items={dashboard.operatingSystems} /></div><div className="analytics-v3-sublist"><strong>浏览器</strong><Bars items={dashboard.browsers} /></div><div className="analytics-v3-sublist"><strong>屏幕尺寸（约 100px 分档）</strong><Bars items={dashboard.screenSizes} /></div></Panel>
      <Panel title="访问地区" note="仅国家和省级粗略区域"><Bars items={[...dashboard.countries, ...dashboard.provinces]} emptyDetail="未配置可信地区来源时显示未知。" /></Panel>
      <Panel title="来源网站" note="只保存来源主机名，不保留 URL 路径或参数"><Bars items={dashboard.sourceWebsites} emptyDetail="暂无可统计的外部来源网站。" /></Panel>
    </div>}

    {section === "tools" && <div className="analytics-v3-grid">
      <Panel title="工具表现 · 热门 TOP 10" note="使用次数按开始处理统计；成功/失败率以全部开始次数为分母">{toolTable(dashboard.hotTools, "等待工具操作数据。")}</Panel>
      <Panel title="高成功率工具" note="至少 3 次操作后纳入排行">{toolTable(dashboard.highSuccessTools, "样本量达到 3 次后会显示，避免小样本误读。")}</Panel>
      <Panel title="高失败量工具" note="优先排查失败次数较多的功能">{toolTable(dashboard.highFailureTools, "当前时间范围内没有工具失败记录。")}</Panel>
    </div>}

    {section === "funnel" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="转化漏斗" note="首页 → 分类 → 工具 → 开始 → 成功 → 下载">
        {dashboard.funnel.some((item) => item.count) ? <ol className="analytics-v3-funnel">{dashboard.funnel.map((step, index) => {
          const max = Math.max(1, dashboard.funnel[0]?.count || 0);
          return <li key={step.id}><div><span>{index + 1}</span><strong>{step.label}</strong><b>{number(step.count)}</b><small>{step.dropoffPercent === null ? "起始环节" : `流失 ${step.dropoffPercent}%`}</small></div><i><b style={{ width: `${Math.max(1, step.count / max * 100)}%` }} /></i></li>;
        })}</ol> : <Empty detail="等待访客从首页进入分类、打开工具并完成处理。" />}
      </Panel>
      <Panel title="转化说明"><div className="analytics-v3-note"><MousePointer2 size={19} /><p>漏斗按匿名 Session 统计，不尝试跨设备拼接。访客可能直接打开工具页，因此分类前置漏斗会显示自然流失。</p></div><div className="analytics-v3-note"><ShieldCheck size={19} /><p>只记录每一步是否发生及时间，不保存用户填写内容、文件或生成结果。</p></div></Panel>
    </div>}

    {section === "realtime" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="当前在线匿名 Session" note="最近 5 分钟仍有心跳的访问会话">
        <div className="analytics-v3-online"><Activity size={20} /><strong>{number(dashboard.online.count)}</strong><span>个匿名 Session 在线</span></div>
        {dashboard.online.sessions.length ? <DataTable minWidth="520px"><tr><th>匿名访客</th><th>当前页面</th><th>设备</th><th>最近活动</th></tr>{dashboard.online.sessions.map((item, index) => <tr key={`${item.visitorLabel}-${item.lastActiveAt}-${index}`}><td>{item.visitorLabel}</td><td>{item.currentPage}</td><td>{item.deviceType}</td><td>{timestamp(item.lastActiveAt)}</td></tr>)}</DataTable> : <Empty detail="当前没有活跃访问会话。" />}
      </Panel>
      <Panel title="最近活动" note="近 5 分钟内的匿名事件，每 20 秒更新"><ul className="analytics-v3-activity">{dashboard.liveActivity.slice(0, 30).map((item, index) => <li key={`${item.at}-${item.eventType}-${index}`}><time>{timestamp(item.at)}</time><span>{({ page_view: "访问页面", tool_start: "开始处理", tool_success: "处理成功", tool_fail: "处理失败", download: "下载结果", page_error: "页面异常", api_error: "接口异常" } as Record<string, string>)[item.eventType] || "匿名事件"}</span><small>{toolName(item.page)}</small></li>)}</ul></Panel>
    </div>}

    {section === "errors" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="错误概况" note="只保留错误类型、发生页面和工具 slug"><div className="analytics-v3-error-summary"><span><XCircle size={19} /><strong>{number(metrics.failures)}</strong><small>工具失败</small></span><span><AlertTriangle size={19} /><strong>{number(metrics.errorCount)}</strong><small>页面与服务异常合计</small></span></div>
        {dashboard.errors.length ? <DataTable minWidth="660px"><tr><th>类别</th><th>发生页面</th><th>工具</th><th>次数</th><th>最近发生</th></tr>{dashboard.errors.map((item, index) => <tr key={`${item.errorCode}-${item.page}-${index}`}><td>{item.errorCode === "tool_failure" ? "工具失败" : item.errorCode === "api_error" ? "接口异常" : item.errorCode === "page_error" ? "页面异常" : "工具处理异常"}</td><td>{item.page}</td><td>{item.toolId ? toolName(item.toolId) : "—"}</td><td>{number(item.count)}</td><td>{timestamp(item.lastOccurredAt)}</td></tr>)}</DataTable> : <Empty detail="当前时间范围内没有记录到服务或页面异常。" />}
      </Panel>
      <Panel title="异常页面 TOP 10"><Bars items={dashboard.errorGroups.byPage} emptyDetail="暂无页面异常聚合。" /></Panel>
      <Panel title="异常工具 TOP 10"><Bars items={dashboard.errorGroups.byTool.map((item) => ({ ...item, label: toolName(item.label) }))} emptyDetail="暂无工具异常聚合。" /></Panel>
      <Panel title="数据边界"><div className="analytics-v3-note"><ShieldCheck size={19} /><p>错误日志不保存原始错误消息、堆栈、请求体、用户输入、上传文件或生成结果，只保存固定错误类别、匿名页面路径与工具标识。</p></div></Panel>
    </div>}

    {section === "settings" && <div className="analytics-v3-grid analytics-v3-grid-wide">
      <Panel title="数据保留周期" note="后台管理员可调整，定时任务每 6 小时清理一次">
        <div className="analytics-v3-setting"><div><strong>匿名事件保留</strong><p>到期后自动删除事件、页面访问、工具操作、下载和过期 Session。</p></div><label><select value={settings.retentionDays} disabled={busy} onChange={(event) => void saveRetention(Number(event.target.value))}>{settings.retentionChoices.map((days) => <option key={days} value={days}>{days} 天</option>)}</select></label></div>
      </Panel>
      <Panel title="隐私保护原则"><ul className="analytics-v3-privacy-list"><li><ShieldCheck size={16} />匿名 ID 使用随机值并在服务端做带密钥哈希；不关联登录身份。</li><li><ShieldCheck size={16} />不采集用户输入、文件内容、文件名或处理结果。</li><li><ShieldCheck size={16} />不保存原始 IP；粗略地区仅在可信服务器代理头明确启用时读取。</li><li><ShieldCheck size={16} />设备统计只使用类别、浏览器类别与约 100px 分档屏幕尺寸，不进行设备指纹识别。</li><li><ShieldCheck size={16} />管理员数据接口均要求已登录的短时安全会话。</li></ul></Panel>
    </div>}

    <footer className="analytics-v3-footer"><span><ShieldCheck size={15} />仅供产品优化、服务质量排查和运营决策使用</span><span><Clock3 size={15} />最近更新 {fullTimestamp(updatedAt)}</span><span><Globe2 size={15} />来源网站只保留域名，地区精度到国家和省份</span></footer>
  </main>;
}
