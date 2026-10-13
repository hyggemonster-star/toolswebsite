"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  LogOut,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Timer,
  UserPlus,
  UserRoundCheck,
  Users,
  Wrench,
} from "lucide-react";

type CountItem = { label: string; count: number };
type ToolItem = {
  toolId: string;
  toolName: string;
  visits: number;
  uses: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageDurationMs: number;
  averageStayMs: number;
  trendPercent: number | null;
  trendNew: boolean;
  valueScore: number;
};
type FunnelItem = { id: string; label: string; count: number; dropoffPercent: number | null };
type ActivityItem = { kind: "visit" | "tool" | "download"; occurredAt: number; label: string; page: string };
type DashboardData = {
  generatedAt: number;
  rangeDays: number;
  online: number;
  metrics: {
    todayVisitors: number;
    todayPv: number;
    yesterdayPv: number;
    todayToolUses: number;
    todaySuccessCount: number;
    todayAverageStayMs: number;
    todayNewUsers: number;
    todayReturningUsers: number;
    pvChangePercent: number | null;
  };
  topTools: ToolItem[];
  devices: CountItem[];
  operatingSystems: CountItem[];
  browsers: CountItem[];
  screenSizes: CountItem[];
  countries: CountItem[];
  sources: CountItem[];
  paths: CountItem[];
  funnel: FunnelItem[];
  exitPages: Array<{ label: string; path: string; count: number }>;
  activity: ActivityItem[];
};

const API_BASE = (process.env.NEXT_PUBLIC_ANALYTICS_API_BASE || "/api/analytics").replace(/\/+$/, "");

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "后台暂时不可用，请稍后重试");
  return data;
}

function number(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function time(value: number) {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(value);
}

function fullTime(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}

function duration(value: number) {
  if (!value) return "—";
  if (value < 1000) return `${value} 毫秒`;
  const seconds = value / 1000;
  return seconds >= 60 ? `${Math.floor(seconds / 60)} 分 ${Math.round(seconds % 60)} 秒` : `${seconds.toFixed(1)} 秒`;
}

function EmptyState({ detail = "等待用户产生行为后，这里会自动展示。" }: { detail?: string }) {
  return <div className="analytics-empty-state"><span><BarChart3 size={18} /></span><strong>暂无真实使用数据</strong><p>{detail}</p></div>;
}

function BarList({ title, items, detail }: { title: string; items: CountItem[]; detail?: string }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return <section className="analytics-panel">
    <h2>{title}</h2>
    {items.length ? <ul className="analytics-bar-list">{items.map((item) => <li key={item.label}>
      <div><span>{item.label || "其他"}</span><strong>{number(item.count)}</strong></div>
      <span className="analytics-bar-track"><span style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }} /></span>
    </li>)}</ul> : <EmptyState detail={detail} />}
  </section>;
}

function Metric({ label, value, hint, icon }: { label: string; value: string; hint: ReactNode; icon: ReactNode }) {
  return <article className="analytics-metric">
    <span className="analytics-metric-icon">{icon}</span>
    <div><p>{label}</p><strong>{value}</strong><small>{hint}</small></div>
  </article>;
}

function Trend({ value, isNew }: { value: number | null; isNew: boolean }) {
  if (isNew) return <span className="analytics-trend is-new">新出现</span>;
  if (value === null) return <span className="analytics-trend is-neutral">等待对比</span>;
  return <span className={`analytics-trend ${value >= 0 ? "is-up" : "is-down"}`}>
    {value >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(value)}%
  </span>;
}

function ValueRating({ value }: { value: number }) {
  const filled = Math.round(value);
  return <span className="analytics-rating" title={`工具价值评分 ${value.toFixed(1)} / 5`}>
    <span aria-hidden="true">{"★".repeat(filled)}<span className="analytics-star-empty">{"★".repeat(5 - filled)}</span></span>
    <small>{value.toFixed(1)}</small>
  </span>;
}

function Login({ onLogin, message, busy }: { onLogin: (username: string, password: string) => Promise<void>; message: string; busy: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
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
      <p className="analytics-login-intro">登录后查看匿名访问、工具表现与用户路径。</p>
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

function LoadingDashboard() {
  return <main className="analytics-admin-page analytics-skeleton-page" aria-label="正在加载运营数据" aria-busy="true">
    <div className="analytics-skeleton-heading"><span /><i /><i /></div>
    <div className="analytics-skeleton-metrics">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div>
    <div className="analytics-skeleton-panels"><span /><span /><span /></div>
  </main>;
}

export function AnalyticsAdmin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(7);
  const [updatedAt, setUpdatedAt] = useState(0);

  const loadDashboard = useCallback(async (range = days) => {
    const data = await requestJson(`${API_BASE}/admin/dashboard?days=${range}`);
    const result = data.data as DashboardData;
    setDashboard(result);
    setUpdatedAt(result.generatedAt);
  }, [days]);

  useEffect(() => {
    let active = true;
    requestJson(`${API_BASE}/admin/session`).then(async (data) => {
      if (!active || !data.authenticated) return;
      setDashboardLoading(true);
      const result = await requestJson(`${API_BASE}/admin/dashboard?days=7`);
      if (!active) return;
      setDashboard(result.data as DashboardData);
      setUpdatedAt(result.data.generatedAt);
      setDays(7);
      setAuthenticated(true);
    }).catch((reason) => {
      const text = reason instanceof Error ? reason.message : "后台暂时不可用，请稍后重试";
      if (active && text !== "请先登录") setMessage(text);
    }).finally(() => {
      if (active) {
        setChecking(false);
        setDashboardLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => {
      void loadDashboard().then(() => setMessage("")).catch((reason) => {
        setMessage(reason instanceof Error ? reason.message : "自动更新失败，请手动刷新");
      });
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [authenticated, loadDashboard]);

  async function login(username: string, password: string) {
    setBusy(true);
    setDashboardLoading(true);
    setMessage("");
    try {
      await requestJson(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      await loadDashboard();
      setAuthenticated(true);
    } catch (reason) {
      setAuthenticated(false);
      throw reason;
    } finally {
      setBusy(false);
      setDashboardLoading(false);
    }
  }

  async function logout() {
    try {
      await requestJson(`${API_BASE}/admin/logout`, { method: "POST" });
    } catch {
      // Clearing the local view is safe even when the server is unreachable.
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
      setMessage(reason instanceof Error ? reason.message : "数据刷新失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  if (checking || dashboardLoading) return <LoadingDashboard />;
  if (!authenticated) return <Login onLogin={login} message={message} busy={busy} />;
  if (!dashboard) return <LoadingDashboard />;

  const metrics = dashboard.metrics;
  const pvChange = metrics.pvChangePercent;
  const pvHint = pvChange === null
    ? "暂无昨日对比数据"
    : <span className={pvChange >= 0 ? "analytics-positive" : "analytics-negative"}>{pvChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(pvChange)}% 较昨日</span>;
  const funnelMax = Math.max(1, ...dashboard.funnel.map((step) => step.count));

  return <main className="analytics-admin-page">
    <header className="analytics-dashboard-header">
      <div><p className="analytics-kicker">TOOLS HUB · ANALYTICS</p><h1>运营分析</h1><p>用真实使用数据了解工具价值与用户体验。</p></div>
      <div className="analytics-header-actions">
        <label className="analytics-range-label">工具统计范围<select value={days} onChange={(event) => void refresh(Number(event.target.value))}><option value={1}>今日</option><option value={7}>近 7 天</option><option value={30}>近 30 天</option></select></label>
        <button type="button" className={`analytics-icon-button ${busy ? "is-refreshing" : ""}`} onClick={() => void refresh()} disabled={busy} aria-label="刷新数据"><RefreshCw size={17} /></button>
        <button type="button" className="analytics-logout-button" onClick={() => void logout()}><LogOut size={16} />退出</button>
      </div>
    </header>

    {message && <p className="analytics-dashboard-message" role="alert"><AlertCircle size={16} />{message}</p>}

    <section className="analytics-section-heading"><div><span>今天</span><h2>核心指标</h2></div><small>访客按匿名浏览器标识估算；不用于跨设备识别</small></section>
    <section className="analytics-metrics-grid analytics-v2-metrics">
      <Metric label="访问人数" value={number(metrics.todayVisitors)} hint="今日独立访客" icon={<Users size={19} />} />
      <Metric label="页面浏览量 PV" value={number(metrics.todayPv)} hint={pvHint} icon={<Eye size={19} />} />
      <Metric label="工具调用次数" value={number(metrics.todayToolUses)} hint="今日执行操作" icon={<Wrench size={19} />} />
      <Metric label="成功处理次数" value={number(metrics.todaySuccessCount)} hint="今日成功完成" icon={<CheckCircle2 size={19} />} />
      <Metric label="平均停留时间" value={metrics.todayAverageStayMs ? duration(metrics.todayAverageStayMs) : "等待数据"} hint={metrics.todayAverageStayMs ? "今日页面停留均值" : "等待用户产生行为"} icon={<Timer size={19} />} />
      <Metric label="新用户" value={number(metrics.todayNewUsers)} hint="近 90 日首次访问的匿名浏览器" icon={<UserPlus size={19} />} />
      <Metric label="回访用户" value={number(metrics.todayReturningUsers)} hint="90 日内此前访问过的匿名浏览器" icon={<UserRoundCheck size={19} />} />
    </section>

    <section className="analytics-dashboard-grid analytics-v2-grid analytics-tool-section">
      <div className="analytics-panel">
        <div className="analytics-panel-heading"><div><p className="analytics-kicker">TOOL PERFORMANCE</p><h2>工具排行 TOP10</h2></div><span>价值评分综合访问、使用、成功率与停留时间</span></div>
        {dashboard.topTools.length ? <div className="analytics-table-scroll"><table className="analytics-tools-table analytics-v2-tools-table"><thead><tr><th>工具名称</th><th>访问次数</th><th>使用次数</th><th>成功次数</th><th>成功率</th><th>平均耗时</th><th>趋势变化</th><th>价值评分</th></tr></thead><tbody>{dashboard.topTools.map((tool) => <tr key={tool.toolId}>
          <td><strong>{tool.toolName}</strong><small>{tool.toolId}</small></td>
          <td>{number(tool.visits)}</td>
          <td>{number(tool.uses)}</td>
          <td>{number(tool.successCount)}</td>
          <td>{tool.uses ? `${(tool.successRate * 100).toFixed(1)}%` : "等待使用"}</td>
          <td>{tool.uses ? duration(tool.averageDurationMs) : "—"}</td>
          <td><Trend value={tool.trendPercent} isNew={tool.trendNew} /></td>
          <td><ValueRating value={tool.valueScore} /></td>
        </tr>)}</tbody></table></div> : <EmptyState detail="工具访问和执行后，排行、趋势与评分会自动生成。" />}
      </div>
    </section>

    <section className="analytics-dashboard-grid analytics-v2-grid">
      <div className="analytics-panel analytics-funnel-panel">
        <div className="analytics-panel-heading"><div><p className="analytics-kicker">USER JOURNEY</p><h2>用户行为路径</h2></div><span>按同一匿名会话顺序统计</span></div>
        {dashboard.funnel.some((step) => step.count > 0) ? <ol className="analytics-funnel-list">{dashboard.funnel.map((step, index) => <li key={step.id}>
          <div className="analytics-funnel-meta"><span className="analytics-funnel-index">{index + 1}</span><strong>{step.label}</strong><b>{number(step.count)} 个会话</b><small>{step.dropoffPercent === null ? "起始步骤" : `流失 ${step.dropoffPercent}%`}</small></div>
          <span className="analytics-bar-track"><span style={{ width: `${Math.max(2, (step.count / funnelMax) * 100)}%` }} /></span>
        </li>)}</ol> : <EmptyState detail="等待用户从首页进入分类、打开工具并完成操作。" />}
      </div>
      <div className="analytics-panel analytics-realtime-panel">
        <div className="analytics-panel-heading"><div><p className="analytics-kicker">LIVE ACTIVITY</p><h2>实时访客</h2></div><span className="analytics-live-indicator"><i />近 5 分钟</span></div>
        <div className="analytics-online-count"><Users size={20} /><strong>{number(dashboard.online)}</strong><span>当前在线会话</span></div>
        <div className="analytics-activity-heading"><strong>最近活动</strong><small>每 20 秒更新</small></div>
        {dashboard.activity.length ? <ul className="analytics-activity-list analytics-v2-activity-list">{dashboard.activity.map((item, index) => <li key={`${item.occurredAt}-${item.kind}-${index}`}><time>{time(item.occurredAt)}</time><span className={item.kind === "tool" ? "is-tool" : item.kind === "download" ? "is-download" : ""}>{item.label}</span><small>{item.page}</small></li>)}</ul> : <EmptyState detail="等待用户产生页面访问、工具操作或下载行为。" />}
      </div>
    </section>

    <section className="analytics-section-heading analytics-section-spaced"><div><span>访问质量</span><h2>设备与来源</h2></div><small>近 {days === 1 ? "今日" : `${days} 天`}</small></section>
    <section className="analytics-dashboard-grid analytics-v2-grid analytics-device-grid">
      <BarList title="设备类型" items={dashboard.devices} detail="用户访问后展示设备分布。" />
      <BarList title="操作系统" items={dashboard.operatingSystems} detail="等待用户访问后识别操作系统。" />
      <BarList title="浏览器" items={dashboard.browsers} detail="等待用户访问后识别浏览器。" />
      <BarList title="屏幕尺寸（约 100px 分档）" items={dashboard.screenSizes} detail="等待用户访问后展示屏幕尺寸分布。" />
    </section>
    <section className="analytics-dashboard-grid analytics-v2-grid">
      <BarList title="访问来源" items={dashboard.sources} detail="来源分类为搜索引擎、直接访问、外链与社交平台。" />
      <BarList title="访问地区" items={dashboard.countries} detail="可信地区数据源启用后，会展示粗略地区分布。" />
    </section>

    <section className="analytics-dashboard-grid analytics-v2-grid">
      <div className="analytics-panel">
        <h2>常见访问路径</h2>
        {dashboard.paths.length ? <ol className="analytics-ranked-list">{dashboard.paths.map((item, index) => <li key={item.label}><span>{index + 1}</span><div><strong>{item.label}</strong><small>{number(item.count)} 个会话</small></div></li>)}</ol> : <EmptyState detail="等待形成可分析的多页面访问路径。" />}
      </div>
      <div className="analytics-panel">
        <h2>常见离开页面</h2>
        {dashboard.exitPages.length ? <ol className="analytics-ranked-list">{dashboard.exitPages.map((item, index) => <li key={item.path}><span>{index + 1}</span><div><strong>{item.label}</strong><small>{number(item.count)} 个会话</small></div></li>)}</ol> : <EmptyState detail="有用户访问后，这里会显示最常见的最后访问页面。" />}
      </div>
    </section>

    <footer className="analytics-dashboard-footer">
      <div><Clock3 size={15} /><span>数据更新于 {updatedAt ? fullTime(updatedAt) : "等待首次更新"}</span><button type="button" onClick={() => void refresh()} disabled={busy} aria-label="立即更新数据"><RefreshCw size={14} /></button></div>
      <p><ShieldCheck size={14} />仅统计匿名汇总信息 · IP 使用每日变化的 HMAC 哈希 · 数据自动保留 90 天</p>
      <p><Smartphone size={14} /><Monitor size={14} />访问人数按本浏览器生成的匿名标识估算，不跨设备关联</p>
      <p><Download size={14} />评分公式：访问 25%、使用 30%、成功率 30%、页面停留 15%。</p>
      <p><Activity size={14} />页面停留时长可能受浏览器关闭方式影响，为估算值。</p>
    </footer>
  </main>;
}
