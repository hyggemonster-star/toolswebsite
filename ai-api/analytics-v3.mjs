const DAY_MS = 24 * 60 * 60 * 1000;
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const SESSION_IDLE_MS = 8 * 60 * 60 * 1000;
const ANOMALY_WINDOW_MS = 5 * 60 * 1000;
const ANOMALY_THRESHOLDS = { pageViews: 30, toolStarts: 20, toolFailures: 5 };
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
const CATEGORY_LABELS = {
  "pdf-office": "PDF办公工具",
  image: "图片处理分类",
  "video-audio": "视频音频工具",
  creator: "内容创作工具",
  developer: "开发者工具",
  daily: "日常工具",
};

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
  const insertEvent = db.prepare("INSERT OR IGNORE INTO analytics_events(event_id,session_id,visitor_hash,created_at,event_type,page_path,tool_id,duration_ms,success,device_type,operating_system,browser,screen_size,country_code,province,source_domain,source_category,error_code,ip_address) VALUES (@eventId,@sessionId,@visitorHash,@createdAt,@eventType,@pagePath,@toolId,@durationMs,@success,@deviceType,@operatingSystem,@browser,@screenSize,@countryCode,@province,@sourceDomain,@sourceCategory,@errorCode,@ipAddress)");
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
      ipAddress: input.ipAddress || null,
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
      db.prepare("UPDATE analytics_events SET ip_address=NULL WHERE ip_address IS NOT NULL AND created_at < ?").run(now() - 30 * DAY_MS);
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
  function visitors(range, group = "all", offset = 0, limit = 100, ipFilter = null) {
    return buildVisitors(db, range, keyedHash, group, offset, limit, ipFilter);
  }
  function visitorTimeline(ref, range) {
    return buildVisitorTimeline(db, range, keyedHash, ref);
  }
  function dailyReport(date) {
    return buildDailyReport(db, date, now());
  }

  return { registerSession, recordEvent, parseRange, dashboard, visitors, visitorTimeline, dailyReport, settings, setRetentionDays, cleanup, retentionDays };
}

function pathLabel(pathname, toolId) {
  if (toolId) return toolId;
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (pathname.startsWith("/categories/")) {
    const categoryId = pathname.slice("/categories/".length);
    return CATEGORY_LABELS[categoryId] || "工具分类";
  }
  if (pathname.startsWith("/tools/")) return "工具：" + pathname.slice("/tools/".length);
  return "其他页面";
}

function visitorValue(row) {
  const useScore = Math.min(1, row.toolUses / 10) * 30;
  const downloadScore = Math.min(1, row.downloads / 5) * 25;
  const frequencyScore = Math.min(1, row.activeDays / 7) * 20;
  const stayScore = Math.min(1, row.stayMs / (15 * 60 * 1000)) * 15;
  const successScore = Math.min(1, row.successes / 5) * 10;
  const score = Math.max(0, Math.min(100, Math.round(useScore + downloadScore + frequencyScore + stayScore + successScore)));
  const reasons = [];
  if (row.toolUses) reasons.push(`使用工具 ${row.toolUses} 次`);
  if (row.downloads) reasons.push(`下载结果 ${row.downloads} 次`);
  if (row.activeDays) reasons.push(`访问 ${row.activeDays} 天`);
  if (row.stayMs) reasons.push(`累计停留 ${Math.round(row.stayMs / 60_000)} 分钟`);
  if (row.successes) reasons.push(`成功完成 ${row.successes} 次`);
  return {
    valueScore: score,
    valueLevel: score >= 70 ? "高价值访客" : score >= 40 ? "活跃访客" : "普通访客",
    valueReasons: reasons.length ? reasons : ["暂未形成足够行为数据"],
  };
}

function segment(row, range) {
  const newVisitor = row.firstSeenAt >= range.startAt && row.firstSeenAt < range.endAt;
  if (row.valueScore >= 70) return "高价值访客";
  if (row.toolPageViews > 0 && row.toolUses === 0) return "流失访客";
  if (newVisitor) return "新访客";
  if (row.pageViews >= 5 || row.toolUses >= 2) return "活跃访客";
  return "回访访客";
}

function getVisitorRows(db, range, keyedHash) {
  const rows = db.prepare("SELECT e.visitor_hash AS visitorHash,MIN(v.first_seen_at) AS firstSeenAt,MAX(e.created_at) AS lastActiveAt,COUNT(DISTINCT e.session_id) AS sessions,SUM(CASE WHEN e.event_type='page_view' THEN 1 ELSE 0 END) AS pageViews,SUM(CASE WHEN e.event_type='tool_start' THEN 1 ELSE 0 END) AS toolUses,SUM(CASE WHEN e.event_type='tool_success' THEN 1 ELSE 0 END) AS successes,SUM(CASE WHEN e.event_type='tool_fail' THEN 1 ELSE 0 END) AS failures,SUM(CASE WHEN e.event_type='download' THEN 1 ELSE 0 END) AS downloads,SUM(CASE WHEN e.event_type='page_view' AND e.page_path LIKE '/tools/%' THEN 1 ELSE 0 END) AS toolPageViews,COUNT(DISTINCT date(e.created_at/1000+28800,'unixepoch')) AS activeDays,SUM(CASE WHEN e.event_type='page_view' THEN e.duration_ms ELSE 0 END) AS stayMs,(SELECT ip_address FROM analytics_events ip WHERE ip.visitor_hash=e.visitor_hash AND ip.ip_address IS NOT NULL AND ip.created_at>=? AND ip.created_at<? ORDER BY ip.created_at DESC LIMIT 1) AS ipAddress FROM analytics_events e LEFT JOIN analytics_visitors v ON v.visitor_hash=e.visitor_hash WHERE e.created_at>=? AND e.created_at<? GROUP BY e.visitor_hash ORDER BY lastActiveAt DESC LIMIT 50000").all(range.startAt, range.endAt, range.startAt, range.endAt);
  return rows.map((row, index) => ({
    visitorRef: keyedHash(row.visitorHash, "analytics-v3-ref").slice(0, 32),
    visitorHash: row.visitorHash,
    visitorLabel: "A" + String(index + 1).padStart(3, "0"),
    ipAddress: row.ipAddress || null,
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
    stayMs: row.stayMs || 0,
  })).map((row) => {
    const value = visitorValue(row);
    return { ...row, ...value, segment: segment({ ...row, ...value }, range) };
  });
}

function publicVisitor(row) {
  const safe = { ...row };
  delete safe.visitorHash;
  delete safe.toolPageViews;
  delete safe.activeDays;
  delete safe.stayMs;
  return safe;
}

function buildVisitors(db, range, keyedHash, group, offset, limit, ipFilter) {
  const allRows = getVisitorRows(db, range, keyedHash);
  const groups = ["新访客", "活跃访客", "高价值访客", "流失访客", "回访访客"];
  const groupCounts = Object.fromEntries(groups.map((name) => [name, allRows.filter((row) => row.segment === name).length]));
  let filtered = group === "all" ? allRows : allRows.filter((row) => row.segment === group);
  if (ipFilter) {
    const matchingVisitors = new Set(db.prepare("SELECT DISTINCT visitor_hash FROM analytics_events WHERE ip_address=? AND created_at>=? AND created_at<?").all(ipFilter, range.startAt, range.endAt).map((row) => row.visitor_hash));
    filtered = filtered.filter((row) => matchingVisitors.has(row.visitorHash));
  }
  const start = Math.max(0, Math.min(filtered.length, Number(offset) || 0));
  const size = Math.max(1, Math.min(200, Number(limit) || 100));
  return { range: { start: range.start, end: range.end }, total: filtered.length, groupCounts, visitors: filtered.slice(start, start + size).map(publicVisitor) };
}

function buildVisitorTimeline(db, range, keyedHash, ref) {
  const rows = getVisitorRows(db, range, keyedHash);
  const visitor = rows.find((row) => row.visitorRef === ref);
  if (!visitor) return null;
  const events = db.prepare("SELECT session_id AS sessionId,created_at AS createdAt,event_type AS eventType,page_path AS pagePath,tool_id AS toolId,duration_ms AS durationMs,success,device_type AS deviceType,operating_system AS operatingSystem,browser,country_code AS countryCode,province,ip_address AS ipAddress FROM analytics_events WHERE visitor_hash=? AND created_at>=? AND created_at<? ORDER BY created_at ASC LIMIT 500").all(visitor.visitorHash, range.startAt, range.endAt);
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
      ipAddress: row.ipAddress || null,
    })),
  };
}

function groupCounts(db, range, column, expression = "e." + column) {
  return db.prepare("SELECT " + expression + " AS label,COUNT(*) AS count FROM analytics_events e WHERE e.event_type='page_view' AND e.created_at>=? AND e.created_at<? GROUP BY label ORDER BY count DESC LIMIT 12").all(range.startAt, range.endAt).map((row) => ({ label: row.label || "未知", count: row.count }));
}

function toolValue(row) {
  const visitorPoints = Math.min(1, row.visitorCount / 50) * 25;
  const usagePoints = Math.min(1, row.uses / 100) * 25;
  const successPoints = row.uses >= 5 ? row.successRate * 35 : 0;
  const downloadPoints = Math.min(1, row.downloads / 30) * 15;
  const score = Math.max(0, Math.min(100, Math.round(visitorPoints + usagePoints + successPoints + downloadPoints)));
  return { valueScore: score, stars: row.uses >= 5 ? Math.round(score / 20) : null };
}

function buildAnomalies(db, range) {
  const eventRows = db.prepare("SELECT session_id AS sessionId,CAST(created_at/300000 AS INTEGER) AS bucket,event_type AS eventType,page_path AS pagePath,tool_id AS toolId,COUNT(*) AS count,MAX(created_at) AS lastAt FROM analytics_events WHERE event_type IN ('page_view','tool_start','tool_fail','api_error') AND created_at>=? AND created_at<? GROUP BY session_id,bucket,event_type,page_path,tool_id ORDER BY lastAt DESC").all(range.startAt, range.endAt);
  const windows = new Map();
  for (const row of eventRows) {
    const key = `${row.sessionId}:${row.bucket}`;
    const window = windows.get(key) || { bucket: row.bucket, sessionId: row.sessionId, pageViews: 0, toolStarts: 0, failures: 0, lastAt: 0, pagePath: "其他页面", toolCounts: new Map() };
    if (row.eventType === "page_view") window.pageViews += row.count;
    else if (row.eventType === "tool_start") window.toolStarts += row.count;
    else if (row.eventType === "tool_fail" || row.eventType === "api_error") window.failures += row.count;
    if (row.toolId) window.toolCounts.set(row.toolId, (window.toolCounts.get(row.toolId) || 0) + row.count);
    if (row.lastAt > window.lastAt) {
      window.lastAt = row.lastAt;
      window.pagePath = row.pagePath;
    }
    windows.set(key, window);
  }

  const grouped = new Map();
  const checks = [
    ["短时访问峰值", "pageViews", ANOMALY_THRESHOLDS.pageViews, "页面访问达到 5 分钟阈值"],
    ["工具调用峰值", "toolStarts", ANOMALY_THRESHOLDS.toolStarts, "工具开始达到 5 分钟阈值"],
    ["失败集中", "failures", ANOMALY_THRESHOLDS.toolFailures, "工具或接口失败达到 5 分钟阈值"],
  ];
  for (const window of windows.values()) {
    const topTool = [...window.toolCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    for (const [type, field, threshold, rule] of checks) {
      if (window[field] < threshold) continue;
      const bucketAt = window.bucket * ANOMALY_WINDOW_MS;
      const key = `${bucketAt}:${type}:${window.pagePath}:${topTool || ""}`;
      const anomaly = grouped.get(key) || { at: bucketAt, type, rule, page: pathLabel(window.pagePath, null), toolId: topTool, count: 0, peakCount: 0 };
      anomaly.count += 1;
      anomaly.peakCount = Math.max(anomaly.peakCount, window[field]);
      grouped.set(key, anomaly);
    }
  }
  const anomalies = [...grouped.values()].sort((a, b) => b.at - a.at || b.count - a.count).slice(0, 100);
  return { count: [...grouped.values()].reduce((sum, item) => sum + item.count, 0), items: anomalies };
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
    return { day, visitors: row.visitors || 0, pageViews: row.pageViews || 0, toolUses: row.toolUses || 0, successes: row.successes || 0, failures: row.failures || 0, successRate: row.toolUses ? Math.round(Math.min(1, row.successes / row.toolUses) * 1000) / 10 : 0 };
  });

  const toolRows = db.prepare("SELECT tool_id AS toolId,SUM(CASE WHEN event_type='page_view' AND page_path LIKE '/tools/%' THEN 1 ELSE 0 END) AS visits,COUNT(DISTINCT CASE WHEN event_type='page_view' AND page_path LIKE '/tools/%' THEN visitor_hash END) AS visitorCount,COUNT(DISTINCT CASE WHEN event_type='tool_start' THEN visitor_hash END) AS userCount,SUM(CASE WHEN event_type='tool_start' THEN 1 ELSE 0 END) AS uses,SUM(CASE WHEN event_type='tool_success' THEN 1 ELSE 0 END) AS successes,SUM(CASE WHEN event_type='tool_fail' THEN 1 ELSE 0 END) AS failures,SUM(CASE WHEN event_type='download' THEN 1 ELSE 0 END) AS downloads,CAST(AVG(CASE WHEN event_type IN ('tool_success','tool_fail') THEN duration_ms END) AS INTEGER) AS averageDurationMs FROM analytics_events WHERE tool_id IS NOT NULL AND created_at>=? AND created_at<? GROUP BY tool_id").all(range.startAt, range.endAt).map((row) => {
    const item = { ...row, visits: row.visits || 0, visitorCount: row.visitorCount || 0, userCount: row.userCount || 0, uses: row.uses || 0, successes: row.successes || 0, failures: row.failures || 0, downloads: row.downloads || 0, averageDurationMs: row.averageDurationMs || 0, successRate: row.uses ? row.successes / row.uses : 0, failureRate: row.uses ? row.failures / row.uses : 0 };
    item.successRate = Math.min(1, item.successRate);
    item.failureRate = Math.min(1, item.failureRate);
    return { ...item, ...toolValue(item) };
  });
  const hotTools = [...toolRows].sort((a, b) => b.uses - a.uses || b.visits - a.visits).slice(0, 10);
  const highSuccessTools = toolRows.filter((item) => item.uses >= 3).sort((a, b) => b.successRate - a.successRate || b.uses - a.uses).slice(0, 10);
  const highFailureTools = toolRows.filter((item) => item.failures > 0).sort((a, b) => b.failures - a.failures || b.failureRate - a.failureRate).slice(0, 10);
  const toolValueRankings = [...toolRows].filter((item) => item.visits || item.uses).sort((a, b) => b.valueScore - a.valueScore || b.uses - a.uses).slice(0, 10);
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
    const state = sessions.get(event.session_id) || { step: 0, pages: [], sequence: [] };
    if (event.event_type === "page_view") {
      if (state.pages.length < 8) state.pages.push(pathLabel(event.page_path, event.tool_id));
      let journeyStep = null;
      if (event.page_path === "/") {
        journeyStep = { kind: "home", label: "首页" };
        if (state.step === 0) state.step = 1;
      } else if (event.page_path.startsWith("/categories/")) {
        const categoryId = event.page_path.slice("/categories/".length);
        journeyStep = { kind: "category", label: CATEGORY_LABELS[categoryId] || "工具分类", categoryId };
        if (state.step === 1) state.step = 2;
      } else if (event.page_path.startsWith("/tools/")) {
        const toolId = event.tool_id || event.page_path.slice("/tools/".length);
        journeyStep = { kind: "tool", label: "工具详情", toolId };
        if (state.step === 2) state.step = 3;
      }
      if (journeyStep && JSON.stringify(state.sequence.at(-1)) !== JSON.stringify(journeyStep)) state.sequence.push(journeyStep);
    } else if (event.event_type === "tool_start") {
      const journeyStep = { kind: "execute", label: "执行", toolId: event.tool_id || null };
      if (JSON.stringify(state.sequence.at(-1)) !== JSON.stringify(journeyStep)) state.sequence.push(journeyStep);
      if (state.step >= 3) state.step = Math.max(state.step, 4);
    } else if (event.event_type === "tool_success" && state.step >= 3) state.step = Math.max(state.step, 5);
    else if (event.event_type === "download") {
      const journeyStep = { kind: "download", label: "下载", toolId: event.tool_id || null };
      if (JSON.stringify(state.sequence.at(-1)) !== JSON.stringify(journeyStep)) state.sequence.push(journeyStep);
      if (state.step >= 5) state.step = 6;
    }
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
  const pathSessionCount = [...sessions.values()].filter((item) => item.sequence.length).length;
  for (const item of sessions.values()) {
    if (!item.sequence.length) continue;
    const key = JSON.stringify(item.sequence);
    const group = pathCounts.get(key) || { steps: item.sequence, count: 0 };
    group.count += 1;
    pathCounts.set(key, group);
  }
  const paths = [...pathCounts.values()].map((item) => ({
    steps: item.steps,
    count: item.count,
    sharePercent: pathSessionCount ? Math.round(item.count / pathSessionCount * 1000) / 10 : 0,
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  const errors = db.prepare("SELECT error_code AS errorCode,page_path AS pagePath,tool_id AS toolId,COUNT(*) AS count,MAX(created_at) AS lastOccurredAt FROM analytics_events WHERE event_type IN ('tool_fail','page_error','api_error') AND created_at>=? AND created_at<? GROUP BY error_code,page_path,tool_id ORDER BY count DESC,lastOccurredAt DESC LIMIT 100").all(range.startAt, range.endAt).map((row) => ({ errorCode: row.errorCode || "tool_failure", page: pathLabel(row.pagePath, row.toolId), toolId: row.toolId, count: row.count, lastOccurredAt: row.lastOccurredAt }));
  const errorCount = errors.reduce((total, item) => total + item.count, 0);
  const anomalies = buildAnomalies(db, range);

  const onlineCount = db.prepare("SELECT COUNT(*) AS count FROM analytics_sessions WHERE last_seen_at>=?").get(timestamp - 5 * 60 * 1000).count;
  const onlineRows = db.prepare("SELECT session_id AS sessionId,visitor_hash AS visitorHash,last_seen_at AS lastActiveAt,last_page AS currentPage,device_type AS deviceType,(SELECT ip_address FROM analytics_events e WHERE e.session_id=analytics_sessions.session_id AND e.ip_address IS NOT NULL ORDER BY e.created_at DESC LIMIT 1) AS ipAddress FROM analytics_sessions WHERE last_seen_at>=? ORDER BY last_seen_at DESC LIMIT 50").all(timestamp - 5 * 60 * 1000);
  const liveVisitors = onlineRows.map((row, index) => ({ visitorLabel: "A" + String(index + 1).padStart(3, "0"), currentPage: pathLabel(row.currentPage, row.currentPage.startsWith("/tools/") ? row.currentPage.slice(7) : null), lastActiveAt: row.lastActiveAt, deviceType: row.deviceType, ipAddress: row.ipAddress || null }));
  const activity = db.prepare("SELECT event_type AS eventType,created_at AS createdAt,page_path AS pagePath,tool_id AS toolId,device_type AS deviceType FROM analytics_events WHERE created_at>=? AND created_at<? ORDER BY created_at DESC LIMIT 50").all(range.startAt, range.endAt).map((row) => ({ eventType: row.eventType, at: row.createdAt, page: pathLabel(row.pagePath, row.toolId), deviceType: row.deviceType }));
  const liveActivity = db.prepare("SELECT event_type AS eventType,created_at AS createdAt,page_path AS pagePath,tool_id AS toolId,device_type AS deviceType,ip_address AS ipAddress FROM analytics_events WHERE created_at>=? ORDER BY created_at DESC LIMIT 50").all(timestamp - 5 * 60 * 1000).map((row) => ({ eventType: row.eventType, at: row.createdAt, page: pathLabel(row.pagePath, row.toolId), deviceType: row.deviceType, ipAddress: row.ipAddress || null }));
  const errorGroups = {
    byPage: aggregateErrors(errors, "page"),
    byTool: aggregateErrors(errors, "toolId"),
  };
  return {
    generatedAt: timestamp,
    range: { start: range.start, end: range.end, days: range.days },
    metrics: { visitors, pageViews, toolUses, successes, downloads, averageStayMs: averageStay, failures, successRate: toolUses ? Math.round(Math.min(1, successes / toolUses) * 1000) / 10 : 0, errorCount },
    dailyTrend,
    hotTools,
    highSuccessTools,
    highFailureTools,
    toolValueRankings,
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
    anomalies: anomalies.items,
    anomalyCount: anomalies.count,
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

function buildDailyReport(db, requestedDate, timestamp) {
  const today = dateLabel(timestamp);
  const date = requestedDate ? cleanDate(requestedDate) : addDays(today, -1);
  if (!date) throw new Error("日报日期格式无效");
  if (date > today || date < addDays(today, -364)) throw new Error("日报日期最多查询最近 365 天且不能晚于今天");
  const previousDate = addDays(date, -1);
  const dayRange = (day) => ({ start: day, end: day, startAt: startOfDate(day), endAt: startOfDate(day) + DAY_MS, days: 1 });
  const current = buildDashboard(db, dayRange(date), timestamp);
  const previous = buildDashboard(db, dayRange(previousDate), timestamp);
  const trackedMetrics = ["visitors", "pageViews", "toolUses", "successes", "downloads", "failures"];
  const changes = Object.fromEntries(trackedMetrics.map((key) => {
    const before = previous.metrics[key];
    const after = current.metrics[key];
    return [key, before ? Math.round((after - before) / before * 1000) / 10 : null];
  }));
  const failureTools = current.highFailureTools.filter((item) => item.uses >= 5 && item.failures >= 3).slice(0, 5);
  const insights = [];
  if (current.hotTools[0]) insights.push(`最常使用的工具是 ${current.hotTools[0].toolId}，开始处理 ${current.hotTools[0].uses} 次。`);
  if (failureTools[0]) insights.push(`${failureTools[0].toolId} 出现 ${failureTools[0].failures} 次失败，失败率 ${(failureTools[0].failureRate * 100).toFixed(1)}%，建议优先排查。`);
  if (changes.visitors !== null) insights.push(`访客较前一日${changes.visitors >= 0 ? "增加" : "减少"} ${Math.abs(changes.visitors)}%。`);
  if (current.anomalyCount) insights.push(`异常访问规则命中 ${current.anomalyCount} 个会话时间窗口；这是自动筛查信号，建议结合服务状态复核。`);
  if (!insights.length) insights.push("所选日期暂无足够的真实使用事件生成运营结论。");
  return {
    reportDate: date,
    previousDate,
    generatedAt: timestamp,
    metrics: current.metrics,
    previousMetrics: previous.metrics,
    changes,
    hotTools: current.hotTools.slice(0, 5),
    failureTools,
    anomalyCount: current.anomalyCount,
    anomalies: current.anomalies.slice(0, 5),
    insights,
  };
}
