const DAY_MS = 24 * 60 * 60 * 1000;
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const SESSION_IDLE_MS = 8 * 60 * 60 * 1000;
const RETENTION_CHOICES = [30, 60, 90, 180, 365];
const EVENT_TYPES = new Set(["page_view", "tool_start", "tool_success", "tool_fail", "download", "page_error", "api_error"]);
const PAGE_LABELS = {
  "/": "首页",
  "/tools": "工具库",
  "/privacy": "隐私政策",
  "/terms": "使用条款",
  "/contact": "联系与关于",
  "/file-processing": "文件处理说明",
  "/disclaimer": "免责声明",
};
const COUNTRY_LABELS = { CN: "中国", US: "美国", HK: "中国香港", TW: "中国台湾", MO: "中国澳门" };

function dateLabel(timestamp) {
  return new Date(timestamp + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

function startOfDate(value) {
  return Date.parse(value + "T00:00:00+08:00");
}

function cleanDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = startOfDate(value);
  return Number.isFinite(timestamp) && dateLabel(timestamp) === value ? value : null;
}

function addDays(date, days) {
  return dateLabel(startOfDate(date) + days * DAY_MS);
}

function rangeFromParams(params, timestamp) {
  const today = dateLabel(timestamp);
  const preset = params.get("preset") || "";
  if (preset && !["today", "yesterday", "7d", "30d"].includes(preset)) throw new Error("时间范围无效");
  let start;
  let end;
  if (preset === "today") start = end = today;
  else if (preset === "yesterday") start = end = addDays(today, -1);
  else if (preset === "7d") { start = addDays(today, -6); end = today; }
  else if (preset === "30d") { start = addDays(today, -29); end = today; }
  else {
    const requestedStart = params.get("start");
    const requestedEnd = params.get("end");
    start = cleanDate(requestedStart);
    end = cleanDate(requestedEnd);
    if (requestedStart || requestedEnd) {
      if (!start || !end) throw new Error("请选择有效的开始和结束日期");
    } else {
      start = addDays(today, -6);
      end = today;
    }
  }
  if (start > end || end > today) throw new Error("日期范围无效");
  const startAt = startOfDate(start);
  const endAt = startOfDate(end) + DAY_MS;
  const days = Math.round((endAt - startAt) / DAY_MS);
  if (days < 1 || days > 365) throw new Error("日期范围最多支持 365 天");
  return { start, end, startAt, endAt, days };
}

function addColumn(db, table, name, definition) {
  const columns = new Set(db.pragma("table_info(" + table + ")").map((column) => column.name));
  if (!columns.has(name)) db.exec("ALTER TABLE " + table + " ADD COLUMN " + name + " " + definition);
}

export function migrateAnalyticsV3(db, configuredRetentionDays = 90) {
  if (db.pragma("user_version", { simple: true }) >= 3) return;
  const requestedRetention = Number(configuredRetentionDays);
  const retention = RETENTION_CHOICES.includes(requestedRetention) ? requestedRetention : 90;
  const migrate = db.transaction(() => {
    for (const [name, definition] of [
      ["session_count", "INTEGER NOT NULL DEFAULT 0"],
      ["page_view_count", "INTEGER NOT NULL DEFAULT 0"],
      ["tool_use_count", "INTEGER NOT NULL DEFAULT 0"],
      ["success_count", "INTEGER NOT NULL DEFAULT 0"],
      ["failure_count", "INTEGER NOT NULL DEFAULT 0"],
      ["download_count", "INTEGER NOT NULL DEFAULT 0"],
    ]) addColumn(db, "analytics_visitors", name, definition);
    for (const [name, definition] of [
      ["page_views", "INTEGER NOT NULL DEFAULT 0"],
      ["tool_uses", "INTEGER NOT NULL DEFAULT 0"],
      ["success_count", "INTEGER NOT NULL DEFAULT 0"],
      ["failure_count", "INTEGER NOT NULL DEFAULT 0"],
      ["downloads", "INTEGER NOT NULL DEFAULT 0"],
      ["operating_system", "TEXT NOT NULL DEFAULT '其他'"],
      ["browser", "TEXT NOT NULL DEFAULT '其他'"],
      ["country_code", "TEXT NOT NULL DEFAULT 'unknown'"],
      ["province", "TEXT NOT NULL DEFAULT '未知'"],
      ["source_domain", "TEXT NOT NULL DEFAULT ''"],
    ]) addColumn(db, "analytics_sessions", name, definition);
    addColumn(db, "analytics_visits", "province", "TEXT NOT NULL DEFAULT '未知'");
    addColumn(db, "analytics_visits", "source_domain", "TEXT NOT NULL DEFAULT ''");
    db.exec([
      "CREATE TABLE IF NOT EXISTS analytics_events (",
      "event_id TEXT PRIMARY KEY,",
      "session_id TEXT NOT NULL,",
      "visitor_hash TEXT NOT NULL,",
      "created_at INTEGER NOT NULL,",
      "event_type TEXT NOT NULL CHECK(event_type IN ('page_view','tool_start','tool_success','tool_fail','download','page_error','api_error')),",
      "page_path TEXT NOT NULL,",
      "tool_id TEXT,",
      "duration_ms INTEGER NOT NULL DEFAULT 0,",
      "success INTEGER CHECK(success IN (0,1)),",
      "device_type TEXT NOT NULL,",
      "operating_system TEXT NOT NULL,",
      "browser TEXT NOT NULL,",
      "screen_size TEXT NOT NULL,",
      "country_code TEXT NOT NULL DEFAULT 'unknown',",
      "province TEXT NOT NULL DEFAULT '未知',",
      "source_domain TEXT NOT NULL DEFAULT '',",
      "source_category TEXT NOT NULL DEFAULT '直接访问',",
      "error_code TEXT",
      ");",
      "CREATE INDEX IF NOT EXISTS analytics_events_time_idx ON analytics_events(created_at);",
      "CREATE INDEX IF NOT EXISTS analytics_events_visitor_idx ON analytics_events(visitor_hash, created_at);",
      "CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events(session_id, created_at);",
      "CREATE INDEX IF NOT EXISTS analytics_events_tool_idx ON analytics_events(tool_id, created_at);",
      "CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events(event_type, created_at);",
      "CREATE TABLE IF NOT EXISTS analytics_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL);",
      "INSERT OR IGNORE INTO analytics_settings(setting_key, setting_value) VALUES ('retention_days', '" + retention + "');",
      "INSERT OR IGNORE INTO analytics_events(event_id,session_id,visitor_hash,created_at,event_type,page_path,tool_id,duration_ms,success,device_type,operating_system,browser,screen_size,country_code,province,source_domain,source_category) ",
      "SELECT 'page:' || visit_id, session_id, COALESCE(visitor_hash, ip_hash), visited_at, 'page_view', page_path, tool_id, duration_ms, NULL, device_type, operating_system, browser, screen_size, country_code, province, source_domain, source_category FROM analytics_visits;",
      "INSERT OR IGNORE INTO analytics_events(event_id,session_id,visitor_hash,created_at,event_type,page_path,tool_id,duration_ms,device_type,operating_system,browser,screen_size,country_code,province,source_domain,source_category) ",
      "SELECT 'start:' || u.event_id, u.session_id, COALESCE(s.visitor_hash,u.ip_hash), u.used_at, 'tool_start', '/tools/' || u.tool_id, u.tool_id, u.duration_ms, u.device_type, COALESCE(v.operating_system,'其他'), COALESCE(v.browser,'其他'), COALESCE(v.screen_size,'未知'), COALESCE(v.country_code,'unknown'), COALESCE(v.province,'未知'), COALESCE(v.source_domain,''), COALESCE(v.source_category,'直接访问') FROM analytics_tool_usage u LEFT JOIN analytics_sessions s ON s.session_id=u.session_id LEFT JOIN analytics_visits v ON v.session_id=u.session_id;",
      "INSERT OR IGNORE INTO analytics_events(event_id,session_id,visitor_hash,created_at,event_type,page_path,tool_id,duration_ms,success,device_type,operating_system,browser,screen_size,country_code,province,source_domain,source_category) ",
      "SELECT 'tool:' || u.event_id, u.session_id, COALESCE(s.visitor_hash,u.ip_hash), u.used_at, CASE WHEN u.success=1 THEN 'tool_success' ELSE 'tool_fail' END, '/tools/' || u.tool_id, u.tool_id, u.duration_ms, u.success, u.device_type, COALESCE(v.operating_system,'其他'), COALESCE(v.browser,'其他'), COALESCE(v.screen_size,'未知'), COALESCE(v.country_code,'unknown'), COALESCE(v.province,'未知'), COALESCE(v.source_domain,''), COALESCE(v.source_category,'直接访问') FROM analytics_tool_usage u LEFT JOIN analytics_sessions s ON s.session_id=u.session_id LEFT JOIN analytics_visits v ON v.session_id=u.session_id;",
      "INSERT OR IGNORE INTO analytics_events(event_id,session_id,visitor_hash,created_at,event_type,page_path,tool_id,device_type,operating_system,browser,screen_size,country_code,province,source_domain,source_category) ",
      "SELECT 'download:' || d.event_id, d.session_id, COALESCE(s.visitor_hash,d.ip_hash), d.downloaded_at, 'download', '/tools/' || d.tool_id, d.tool_id, d.device_type, COALESCE(v.operating_system,'其他'), COALESCE(v.browser,'其他'), COALESCE(v.screen_size,'未知'), COALESCE(v.country_code,'unknown'), COALESCE(v.province,'未知'), COALESCE(v.source_domain,''), COALESCE(v.source_category,'直接访问') FROM analytics_downloads d LEFT JOIN analytics_sessions s ON s.session_id=d.session_id LEFT JOIN analytics_visits v ON v.session_id=d.session_id;",
      "INSERT INTO analytics_visitors(visitor_hash,first_seen_at,last_seen_at) SELECT visitor_hash,MIN(created_at),MAX(created_at) FROM analytics_events GROUP BY visitor_hash ON CONFLICT(visitor_hash) DO UPDATE SET first_seen_at=MIN(analytics_visitors.first_seen_at,excluded.first_seen_at),last_seen_at=MAX(analytics_visitors.last_seen_at,excluded.last_seen_at);",
      "UPDATE analytics_visitors SET",
      "session_count=(SELECT COUNT(*) FROM analytics_sessions s WHERE s.visitor_hash=analytics_visitors.visitor_hash),",
      "page_view_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='page_view'),",
      "tool_use_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='tool_start'),",
      "success_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='tool_success'),",
      "failure_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='tool_fail'),",
      "download_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='download');",
      "UPDATE analytics_sessions SET",
      "page_views=(SELECT COUNT(*) FROM analytics_events e WHERE e.session_id=analytics_sessions.session_id AND e.event_type='page_view'),",
      "tool_uses=(SELECT COUNT(*) FROM analytics_events e WHERE e.session_id=analytics_sessions.session_id AND e.event_type='tool_start'),",
      "success_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.session_id=analytics_sessions.session_id AND e.event_type='tool_success'),",
      "failure_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.session_id=analytics_sessions.session_id AND e.event_type='tool_fail'),",
      "downloads=(SELECT COUNT(*) FROM analytics_events e WHERE e.session_id=analytics_sessions.session_id AND e.event_type='download');",
      "UPDATE analytics_visits SET tool_name=COALESCE(tool_id,'未知工具');",
      "UPDATE analytics_tool_usage SET tool_name=tool_id;",
      "UPDATE analytics_downloads SET tool_name=tool_id;",
      "UPDATE analytics_visits SET source_page=CASE WHEN source_page IN ('直接访问','站内导航','搜索引擎','社交平台','外链','未知') THEN source_page WHEN substr(source_page,1,1)='/' AND instr(source_page,'?')=0 AND instr(source_page,'#')=0 THEN substr(source_page,1,160) ELSE '外部来源' END;",
      "UPDATE analytics_sessions SET source_page=CASE WHEN source_page IN ('直接访问','站内导航','搜索引擎','社交平台','外链','未知') THEN source_page WHEN substr(source_page,1,1)='/' AND instr(source_page,'?')=0 AND instr(source_page,'#')=0 THEN substr(source_page,1,160) ELSE '外部来源' END;",
      "PRAGMA user_version = 3;",
    ].join("\n"));
  });
  migrate();
}

export function createAnalyticsV3({ db, now, keyedHash }) {
  const insertEvent = db.prepare("INSERT OR IGNORE INTO analytics_events(event_id,session_id,visitor_hash,created_at,event_type,page_path,tool_id,duration_ms,success,device_type,operating_system,browser,screen_size,country_code,province,source_domain,source_category,error_code) VALUES (@eventId,@sessionId,@visitorHash,@createdAt,@eventType,@pagePath,@toolId,@durationMs,@success,@deviceType,@operatingSystem,@browser,@screenSize,@countryCode,@province,@sourceDomain,@sourceCategory,@errorCode)");
  const touchVisitor = db.prepare("INSERT INTO analytics_visitors(visitor_hash,first_seen_at,last_seen_at) VALUES (?,?,?) ON CONFLICT(visitor_hash) DO UPDATE SET first_seen_at=MIN(analytics_visitors.first_seen_at,excluded.first_seen_at),last_seen_at=MAX(analytics_visitors.last_seen_at,excluded.last_seen_at)");

  function registerSession(input) {
    const previous = db.prepare("SELECT 1 FROM analytics_sessions WHERE session_id=?").get(input.sessionId);
    touchVisitor.run(input.visitorHash, input.timestamp, input.timestamp);
    db.prepare("INSERT INTO analytics_sessions(session_id,visitor_hash,started_at,last_seen_at,last_page,device_type,source_page,operating_system,browser,country_code,province,source_domain) VALUES (@sessionId,@visitorHash,@timestamp,@timestamp,@pagePath,@deviceType,@sourcePage,@operatingSystem,@browser,@countryCode,@province,@sourceDomain) ON CONFLICT(session_id) DO UPDATE SET last_seen_at=MAX(analytics_sessions.last_seen_at,excluded.last_seen_at),last_page=excluded.last_page,device_type=excluded.device_type,operating_system=excluded.operating_system,browser=excluded.browser,country_code=excluded.country_code,province=excluded.province,source_domain=CASE WHEN analytics_sessions.source_domain='' THEN excluded.source_domain ELSE analytics_sessions.source_domain END")
      .run(input);
    if (!previous) db.prepare("UPDATE analytics_visitors SET session_count=session_count+1 WHERE visitor_hash=?").run(input.visitorHash);
  }

  function recordEvent(input) {
    if (!EVENT_TYPES.has(input.eventType)) return false;
    const result = insertEvent.run({
      eventId: input.eventId,
      sessionId: input.sessionId,
      visitorHash: input.visitorHash,
      createdAt: input.createdAt || now(),
      eventType: input.eventType,
      pagePath: input.pagePath,
      toolId: input.toolId || null,
      durationMs: Math.max(0, Math.min(1_800_000, Math.round(input.durationMs || 0))),
      success: input.eventType === "tool_success" ? 1 : input.eventType === "tool_fail" ? 0 : null,
      deviceType: input.deviceType || "电脑",
      operatingSystem: input.operatingSystem || "其他",
      browser: input.browser || "其他",
      screenSize: input.screenSize || "未知",
      countryCode: input.countryCode || "unknown",
      province: input.province || "未知",
      sourceDomain: input.sourceDomain || "",
      sourceCategory: input.sourceCategory || "直接访问",
      errorCode: input.errorCode || null,
    });
    if (!result.changes) return false;
    touchVisitor.run(input.visitorHash, input.createdAt || now(), input.createdAt || now());
    const counter = {
      page_view: ["page_view_count", "page_views"],
      tool_start: ["tool_use_count", "tool_uses"],
      tool_success: ["success_count"],
      tool_fail: ["failure_count"],
      download: ["download_count", "downloads"],
    }[input.eventType];
    if (counter) {
      db.prepare("UPDATE analytics_visitors SET " + counter.filter((name) => ["page_view_count", "tool_use_count", "success_count", "failure_count", "download_count"].includes(name)).map((name) => name + "=" + name + "+1").join(",") + " WHERE visitor_hash=?").run(input.visitorHash);
      db.prepare("UPDATE analytics_sessions SET " + counter.filter((name) => ["page_views", "tool_uses", "success_count", "failure_count", "downloads"].includes(name)).map((name) => name + "=" + name + "+1").join(",") + " WHERE session_id=?").run(input.sessionId);
    }
    return true;
  }

  function retentionDays() {
    const row = db.prepare("SELECT setting_value FROM analytics_settings WHERE setting_key='retention_days'").get();
    const days = Number(row?.setting_value);
    return RETENTION_CHOICES.includes(days) ? days : 90;
  }

  function setRetentionDays(value) {
    if (!RETENTION_CHOICES.includes(Number(value))) throw new Error("保留周期只支持 30、60、90、180 或 365 天");
    db.prepare("INSERT INTO analytics_settings(setting_key,setting_value) VALUES ('retention_days',?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value").run(String(Number(value)));
    return retentionDays();
  }

  function settings() {
    return { retentionDays: retentionDays(), retentionChoices: RETENTION_CHOICES };
  }

  function cleanup() {
    const cutoff = now() - retentionDays() * DAY_MS;
    const prune = db.transaction(() => {
      db.prepare("DELETE FROM analytics_events WHERE created_at < ?").run(cutoff);
      db.prepare("DELETE FROM analytics_visits WHERE visited_at < ?").run(cutoff);
      db.prepare("DELETE FROM analytics_tool_usage WHERE used_at < ?").run(cutoff);
      db.prepare("DELETE FROM analytics_downloads WHERE downloaded_at < ?").run(cutoff);
      db.prepare("DELETE FROM analytics_sessions WHERE last_seen_at < ?").run(now() - SESSION_IDLE_MS);
      db.prepare("DELETE FROM analytics_visitors WHERE last_seen_at < ?").run(cutoff);
      db.prepare("UPDATE analytics_visitors SET first_seen_at=? WHERE first_seen_at < ? AND last_seen_at >= ?").run(cutoff, cutoff, cutoff);
      db.prepare("UPDATE analytics_visitors SET session_count=(SELECT COUNT(DISTINCT e.session_id) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash),page_view_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='page_view'),tool_use_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='tool_start'),success_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='tool_success'),failure_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='tool_fail'),download_count=(SELECT COUNT(*) FROM analytics_events e WHERE e.visitor_hash=analytics_visitors.visitor_hash AND e.event_type='download')").run();
    });
    prune();
    db.exec("PRAGMA optimize;");
    return { retentionDays: retentionDays(), cutoff };
  }

  function parseRange(params) { return rangeFromParams(params, now()); }
  function dashboard(range) { return buildDashboard(db, range, now()); }
  function visitors(range, group = "all", offset = 0, limit = 100) {
    return buildVisitors(db, range, keyedHash, group, offset, limit);
  }
  function visitorTimeline(ref, range) {
    return buildVisitorTimeline(db, range, keyedHash, ref);
  }

  return { registerSession, recordEvent, parseRange, dashboard, visitors, visitorTimeline, settings, setRetentionDays, cleanup, retentionDays };
}

function pathLabel(pathname, toolId) {
  if (toolId) return toolId;
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (pathname.startsWith("/categories/")) return "分类：" + pathname.slice("/categories/".length);
  if (pathname.startsWith("/tools/")) return "工具：" + pathname.slice("/tools/".length);
  return "其他页面";
}

function segment(row, range) {
  const newVisitor = row.firstSeenAt >= range.startAt && row.firstSeenAt < range.endAt;
  if (row.toolUses >= 3 && row.downloads >= 1 && row.sessions >= 2) return "高价值访客";
  if (row.toolPageViews > 0 && row.toolUses === 0) return "流失访客";
  if (newVisitor) return "新访客";
  if (row.pageViews >= 5 || row.toolUses >= 2) return "活跃访客";
  return "回访访客";
}

function getVisitorRows(db, range, keyedHash) {
  const rows = db.prepare("SELECT e.visitor_hash AS visitorHash,MIN(v.first_seen_at) AS firstSeenAt,MAX(e.created_at) AS lastActiveAt,COUNT(DISTINCT e.session_id) AS sessions,SUM(CASE WHEN e.event_type='page_view' THEN 1 ELSE 0 END) AS pageViews,SUM(CASE WHEN e.event_type='tool_start' THEN 1 ELSE 0 END) AS toolUses,SUM(CASE WHEN e.event_type='tool_success' THEN 1 ELSE 0 END) AS successes,SUM(CASE WHEN e.event_type='tool_fail' THEN 1 ELSE 0 END) AS failures,SUM(CASE WHEN e.event_type='download' THEN 1 ELSE 0 END) AS downloads,SUM(CASE WHEN e.event_type='page_view' AND e.page_path LIKE '/tools/%' THEN 1 ELSE 0 END) AS toolPageViews,COUNT(DISTINCT date(e.created_at/1000+28800,'unixepoch')) AS activeDays FROM analytics_events e LEFT JOIN analytics_visitors v ON v.visitor_hash=e.visitor_hash WHERE e.created_at>=? AND e.created_at<? GROUP BY e.visitor_hash ORDER BY lastActiveAt DESC LIMIT 50000").all(range.startAt, range.endAt);
  return rows.map((row, index) => ({
    visitorRef: keyedHash(row.visitorHash, "analytics-v3-ref").slice(0, 32),
    visitorHash: row.visitorHash,
    visitorLabel: "A" + String(index + 1).padStart(3, "0"),
    firstSeenAt: row.firstSeenAt || row.lastActiveAt,
    lastActiveAt: row.lastActiveAt,
    sessions: row.sessions || 0,
    pageViews: row.pageViews || 0,
    toolUses: row.toolUses || 0,
    successes: row.successes || 0,
    failures: row.failures || 0,
    downloads: row.downloads || 0,
    toolPageViews: row.toolPageViews || 0,
    activeDays: row.activeDays || 0,
  })).map((row) => ({ ...row, segment: segment(row, range) }));
}

function publicVisitor(row) {
  const safe = { ...row };
  delete safe.visitorHash;
  delete safe.toolPageViews;
  delete safe.activeDays;
  return safe;
}

function buildVisitors(db, range, keyedHash, group, offset, limit) {
  const allRows = getVisitorRows(db, range, keyedHash);
  const groups = ["新访客", "活跃访客", "高价值访客", "流失访客", "回访访客"];
  const groupCounts = Object.fromEntries(groups.map((name) => [name, allRows.filter((row) => row.segment === name).length]));
  const filtered = group === "all" ? allRows : allRows.filter((row) => row.segment === group);
  const start = Math.max(0, Math.min(filtered.length, Number(offset) || 0));
  const size = Math.max(1, Math.min(200, Number(limit) || 100));
  return { range: { start: range.start, end: range.end }, total: filtered.length, groupCounts, visitors: filtered.slice(start, start + size).map(publicVisitor) };
}

function buildVisitorTimeline(db, range, keyedHash, ref) {
  const rows = getVisitorRows(db, range, keyedHash);
  const visitor = rows.find((row) => row.visitorRef === ref);
  if (!visitor) return null;
  const events = db.prepare("SELECT session_id AS sessionId,created_at AS createdAt,event_type AS eventType,page_path AS pagePath,tool_id AS toolId,duration_ms AS durationMs,success,device_type AS deviceType,operating_system AS operatingSystem,browser,country_code AS countryCode,province FROM analytics_events WHERE visitor_hash=? AND created_at>=? AND created_at<? ORDER BY created_at ASC LIMIT 500").all(visitor.visitorHash, range.startAt, range.endAt);
  const sessions = new Map();
  for (const row of events) {
    if (!sessions.has(row.sessionId)) sessions.set(row.sessionId, "会话 " + String(sessions.size + 1).padStart(2, "0"));
  }
  return {
    visitor: publicVisitor(visitor),
    eventCount: events.length,
    truncated: events.length >= 500,
    events: events.map((row) => ({
      at: row.createdAt,
      sessionLabel: sessions.get(row.sessionId),
      eventType: row.eventType,
      action: ({ page_view: row.toolId ? "打开工具" : "访问页面", tool_start: "开始处理", tool_success: "处理成功", tool_fail: "处理失败", download: "下载结果", page_error: "页面异常", api_error: "接口异常" })[row.eventType],
      page: pathLabel(row.pagePath, row.toolId),
      durationMs: row.durationMs || 0,
      deviceType: row.deviceType,
      operatingSystem: row.operatingSystem,
      browser: row.browser,
      country: row.countryCode === "unknown" ? "未知" : (COUNTRY_LABELS[row.countryCode] || row.countryCode),
      province: row.province || "未知",
    })),
  };
}

function groupCounts(db, range, column, expression = "e." + column) {
  return db.prepare("SELECT " + expression + " AS label,COUNT(*) AS count FROM analytics_events e WHERE e.event_type='page_view' AND e.created_at>=? AND e.created_at<? GROUP BY label ORDER BY count DESC LIMIT 12").all(range.startAt, range.endAt).map((row) => ({ label: row.label || "未知", count: row.count }));
}

function buildDashboard(db, range, timestamp) {
  const count = (sql, args = [range.startAt, range.endAt]) => db.prepare(sql).get(...args).count || 0;
  const pageViews = count("SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='page_view' AND created_at>=? AND created_at<?");
  const visitors = count("SELECT COUNT(DISTINCT visitor_hash) AS count FROM analytics_events WHERE created_at>=? AND created_at<?");
  const toolUses = count("SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='tool_start' AND created_at>=? AND created_at<?");
  const successes = count("SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='tool_success' AND created_at>=? AND created_at<?");
  const failures = count("SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='tool_fail' AND created_at>=? AND created_at<?");
  const downloads = count("SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='download' AND created_at>=? AND created_at<?");
  const averageStay = db.prepare("SELECT CAST(AVG(duration_ms) AS INTEGER) AS value FROM analytics_events WHERE event_type='page_view' AND created_at>=? AND created_at<? AND duration_ms>0").get(range.startAt, range.endAt).value || 0;

  const dailyRows = db.prepare("SELECT date(created_at/1000+28800,'unixepoch') AS day,COUNT(DISTINCT CASE WHEN event_type='page_view' THEN visitor_hash END) AS visitors,SUM(CASE WHEN event_type='page_view' THEN 1 ELSE 0 END) AS pageViews,SUM(CASE WHEN event_type='tool_start' THEN 1 ELSE 0 END) AS toolUses,SUM(CASE WHEN event_type='tool_success' THEN 1 ELSE 0 END) AS successes,SUM(CASE WHEN event_type='tool_fail' THEN 1 ELSE 0 END) AS failures FROM analytics_events WHERE created_at>=? AND created_at<? GROUP BY day ORDER BY day").all(range.startAt, range.endAt);
  const dailyMap = new Map(dailyRows.map((row) => [row.day, row]));
  const dailyTrend = Array.from({ length: range.days }, (_, index) => {
    const day = addDays(range.start, index);
    const row = dailyMap.get(day) || {};
    return { day, visitors: row.visitors || 0, pageViews: row.pageViews || 0, toolUses: row.toolUses || 0, successes: row.successes || 0, failures: row.failures || 0, successRate: row.toolUses ? Math.round((row.successes / row.toolUses) * 1000) / 10 : 0 };
  });

  const toolRows = db.prepare("SELECT tool_id AS toolId,SUM(CASE WHEN event_type='page_view' AND page_path LIKE '/tools/%' THEN 1 ELSE 0 END) AS visits,SUM(CASE WHEN event_type='tool_start' THEN 1 ELSE 0 END) AS uses,SUM(CASE WHEN event_type='tool_success' THEN 1 ELSE 0 END) AS successes,SUM(CASE WHEN event_type='tool_fail' THEN 1 ELSE 0 END) AS failures,SUM(CASE WHEN event_type='download' THEN 1 ELSE 0 END) AS downloads,CAST(AVG(CASE WHEN event_type IN ('tool_success','tool_fail') THEN duration_ms END) AS INTEGER) AS averageDurationMs FROM analytics_events WHERE tool_id IS NOT NULL AND created_at>=? AND created_at<? GROUP BY tool_id").all(range.startAt, range.endAt).map((row) => ({ ...row, visits: row.visits || 0, uses: row.uses || 0, successes: row.successes || 0, failures: row.failures || 0, downloads: row.downloads || 0, averageDurationMs: row.averageDurationMs || 0, successRate: row.uses ? row.successes / row.uses : 0, failureRate: row.uses ? row.failures / row.uses : 0 }));
  const hotTools = [...toolRows].sort((a, b) => b.uses - a.uses || b.visits - a.visits).slice(0, 10);
  const highSuccessTools = toolRows.filter((item) => item.uses >= 3).sort((a, b) => b.successRate - a.successRate || b.uses - a.uses).slice(0, 10);
  const highFailureTools = toolRows.filter((item) => item.failures > 0).sort((a, b) => b.failures - a.failures || b.failureRate - a.failureRate).slice(0, 10);
  const devices = groupCounts(db, range, "device_type");
  const operatingSystems = groupCounts(db, range, "operating_system");
  const browsers = groupCounts(db, range, "browser");
  const screenSizes = groupCounts(db, range, "screen_size");
  const sources = db.prepare("SELECT source_category AS label,COUNT(*) AS count FROM analytics_events WHERE event_type='page_view' AND created_at>=? AND created_at<? GROUP BY source_category ORDER BY count DESC").all(range.startAt, range.endAt);
  const sourceWebsites = db.prepare("SELECT source_domain AS label,COUNT(*) AS count FROM analytics_events WHERE event_type='page_view' AND source_domain<>'' AND created_at>=? AND created_at<? GROUP BY source_domain ORDER BY count DESC LIMIT 10").all(range.startAt, range.endAt);
  const countries = groupCounts(db, range, "country_code").map((item) => ({ label: item.label === "unknown" ? "未知" : (COUNTRY_LABELS[item.label] || item.label), count: item.count }));
  const provinces = groupCounts(db, range, "province");

  const eventRows = db.prepare("SELECT session_id,event_type,page_path,tool_id,created_at FROM analytics_events WHERE event_type IN ('page_view','tool_start','tool_success','tool_fail','download') AND created_at>=? AND created_at<? ORDER BY session_id,created_at,event_id").all(range.startAt, range.endAt);
  const sessions = new Map();
  for (const event of eventRows) {
    const state = sessions.get(event.session_id) || { step: 0, pages: [] };
    if (event.event_type === "page_view") {
      if (state.pages.length < 8) state.pages.push(pathLabel(event.page_path, event.tool_id));
      if (event.page_path === "/" && state.step === 0) state.step = 1;
      else if (event.page_path.startsWith("/categories/") && state.step === 1) state.step = 2;
      else if (event.page_path.startsWith("/tools/") && state.step === 2) state.step = 3;
    } else if (event.event_type === "tool_start" && state.step >= 3) state.step = Math.max(state.step, 4);
    else if (event.event_type === "tool_success" && state.step >= 3) state.step = Math.max(state.step, 5);
    else if (event.event_type === "download" && state.step >= 5) state.step = 6;
    sessions.set(event.session_id, state);
  }
  const funnelDefinitions = [["entry", "首页访问", 1], ["category", "进入分类", 2], ["tool", "打开工具", 3], ["start", "开始处理", 4], ["success", "成功完成", 5], ["download", "下载结果", 6]];
  let previous = 0;
  const funnel = funnelDefinitions.map(([id, label, step]) => {
    const value = [...sessions.values()].filter((item) => item.step >= step).length;
    const dropoffPercent = previous ? Math.round((1 - value / previous) * 100) : null;
    previous = value;
    return { id, label, count: value, dropoffPercent };
  });
  const pathCounts = new Map();
  for (const item of sessions.values()) {
    if (!item.pages.length) continue;
    const key = item.pages.join(" → ");
    pathCounts.set(key, (pathCounts.get(key) || 0) + 1);
  }
  const paths = [...pathCounts.entries()].map(([label, value]) => ({ label, count: value })).sort((a, b) => b.count - a.count).slice(0, 10);

  const errors = db.prepare("SELECT error_code AS errorCode,page_path AS pagePath,tool_id AS toolId,COUNT(*) AS count,MAX(created_at) AS lastOccurredAt FROM analytics_events WHERE event_type IN ('tool_fail','page_error','api_error') AND created_at>=? AND created_at<? GROUP BY error_code,page_path,tool_id ORDER BY count DESC,lastOccurredAt DESC LIMIT 100").all(range.startAt, range.endAt).map((row) => ({ errorCode: row.errorCode || "tool_failure", page: pathLabel(row.pagePath, row.toolId), toolId: row.toolId, count: row.count, lastOccurredAt: row.lastOccurredAt }));
  const errorCount = errors.reduce((total, item) => total + item.count, 0);

  const onlineCount = db.prepare("SELECT COUNT(*) AS count FROM analytics_sessions WHERE last_seen_at>=?").get(timestamp - 5 * 60 * 1000).count;
  const onlineRows = db.prepare("SELECT session_id AS sessionId,visitor_hash AS visitorHash,last_seen_at AS lastActiveAt,last_page AS currentPage,device_type AS deviceType FROM analytics_sessions WHERE last_seen_at>=? ORDER BY last_seen_at DESC LIMIT 50").all(timestamp - 5 * 60 * 1000);
  const liveVisitors = onlineRows.map((row, index) => ({ visitorLabel: "A" + String(index + 1).padStart(3, "0"), currentPage: pathLabel(row.currentPage, row.currentPage.startsWith("/tools/") ? row.currentPage.slice(7) : null), lastActiveAt: row.lastActiveAt, deviceType: row.deviceType }));
  const activity = db.prepare("SELECT event_type AS eventType,created_at AS createdAt,page_path AS pagePath,tool_id AS toolId,device_type AS deviceType FROM analytics_events WHERE created_at>=? AND created_at<? ORDER BY created_at DESC LIMIT 50").all(range.startAt, range.endAt).map((row) => ({ eventType: row.eventType, at: row.createdAt, page: pathLabel(row.pagePath, row.toolId), deviceType: row.deviceType }));
  const liveActivity = db.prepare("SELECT event_type AS eventType,created_at AS createdAt,page_path AS pagePath,tool_id AS toolId,device_type AS deviceType FROM analytics_events WHERE created_at>=? ORDER BY created_at DESC LIMIT 50").all(timestamp - 5 * 60 * 1000).map((row) => ({ eventType: row.eventType, at: row.createdAt, page: pathLabel(row.pagePath, row.toolId), deviceType: row.deviceType }));
  const errorGroups = {
    byPage: aggregateErrors(errors, "page"),
    byTool: aggregateErrors(errors, "toolId"),
  };
  return {
    generatedAt: timestamp,
    range: { start: range.start, end: range.end, days: range.days },
    metrics: { visitors, pageViews, toolUses, successes, downloads, averageStayMs: averageStay, failures, successRate: toolUses ? Math.round((successes / toolUses) * 1000) / 10 : 0, errorCount },
    dailyTrend,
    hotTools,
    highSuccessTools,
    highFailureTools,
    devices,
    operatingSystems,
    browsers,
    screenSizes,
    countries,
    provinces,
    sources,
    sourceWebsites,
    funnel,
    paths,
    errors,
    errorGroups,
    online: { count: onlineCount, sessions: liveVisitors },
    activity,
    liveActivity,
    retentionDays: Number(db.prepare("SELECT setting_value FROM analytics_settings WHERE setting_key='retention_days'").get()?.setting_value) || 90,
  };
}

function aggregateErrors(rows, key) {
  const values = new Map();
  for (const row of rows) {
    const label = row[key] || (key === "toolId" ? "非工具页面" : "其他页面");
    values.set(label, (values.get(label) || 0) + row.count);
  }
  return [...values.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 10);
}
