import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { isIP } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { createAnalyticsV3, migrateAnalyticsV3 } from "./analytics-v3.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const MAX_BODY_BYTES = 8192;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const SESSION_COOKIE = "tools_hub_admin";

function cleanPath(value) {
  if (typeof value !== "string") return "/";
  const rawPath = value.split(/[?#]/, 1)[0];
  if (!rawPath.startsWith("/") || rawPath.length > 160 || !/^\/[A-Za-z0-9/_-]*$/.test(rawPath)) return "/other";
  return rawPath.replace(/\/{2,}/g, "/");
}

function cleanTool(value) {
  return typeof value === "string" && /^[a-z0-9-]{1,80}$/.test(value) ? value : null;
}

function cleanSessionId(value) {
  return typeof value === "string" && /^[a-f0-9-]{36}$/i.test(value) ? value.toLowerCase() : null;
}

function cleanVisitorId(value) {
  return cleanSessionId(value);
}

function cleanVisitId(value) {
  return typeof value === "string" && /^[a-f0-9-]{36}$/i.test(value) ? value.toLowerCase() : null;
}

function cleanScreenSize(value) {
  if (typeof value !== "string") return "未知";
  const match = value.match(/^(\d{2,5})x(\d{2,5})$/i);
  if (!match) return "未知";
  const width = Math.min(10000, Math.max(200, Math.round(Number(match[1]) / 100) * 100));
  const height = Math.min(10000, Math.max(200, Math.round(Number(match[2]) / 100) * 100));
  return `${width}x${height}`;
}

function cleanLanguage(value) {
  if (typeof value !== "string") return "未知";
  const language = value.trim().slice(0, 16);
  return /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(language) ? language : "未知";
}

function detectBrowser(userAgent) {
  if (/EdgA?\//i.test(userAgent)) return "Edge";
  if (/OPR\//i.test(userAgent)) return "Opera";
  if (/Firefox|FxiOS/i.test(userAgent)) return "Firefox";
  if (/CriOS|Chrome\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent)) return "Safari";
  return "其他";
}

function detectOperatingSystem(userAgent) {
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS";
  if (/CrOS/i.test(userAgent)) return "ChromeOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "其他";
}

function detectDevice(userAgent) {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return "平板";
  if (/Mobile|iPhone|iPod|Android/i.test(userAgent)) return "手机";
  return "电脑";
}

function normalizedIp(value) {
  if (typeof value !== "string") return null;
  const candidate = value.trim().replace(/^\[|\]$/g, "").split("%", 1)[0];
  if (!isIP(candidate)) return null;
  return candidate.toLowerCase();
}

function clientIp(request) {
  const peer = normalizedIp(request.socket.remoteAddress);
  if (!peer) return null;
  if (LOOPBACK_ADDRESSES.has(peer)) {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      const chain = forwarded.split(",").map(normalizedIp).filter(Boolean);
      for (let index = chain.length - 1; index >= 0; index -= 1) {
        if (!LOOPBACK_ADDRESSES.has(chain[index])) return chain[index];
      }
    }
  }
  return peer;
}

function sourcePage(value, request) {
  if (typeof value !== "string" || !value) return "直接访问";
  try {
    const url = new URL(value, `https://${request.headers.host || "localhost"}`);
    const host = String(request.headers.host || "").split(":", 1)[0].toLowerCase();
    if (url.hostname.toLowerCase() === host) return cleanPath(url.pathname);
    const labels = url.hostname.toLowerCase().replace(/[^a-z0-9.-]/g, "").split(".").filter(Boolean);
    const twoLevelSuffixes = new Set(["co.uk", "org.uk", "com.cn", "net.cn", "gov.cn", "com.au", "co.jp", "com.hk", "com.tw", "co.nz", "com.sg"]);
    const lastTwo = labels.slice(-2).join(".");
    const domain = labels.length >= 3 && twoLevelSuffixes.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo;
    return domain.slice(0, 120) || "外部来源";
  } catch {
    return "直接访问";
  }
}

function sourceCategory(value, request) {
  if (typeof value !== "string" || !value) return "直接访问";
  try {
    const url = new URL(value, `https://${request.headers.host || "localhost"}`);
    const currentHost = String(request.headers.host || "").split(":", 1)[0].toLowerCase();
    if (url.hostname.toLowerCase() === currentHost) return "站内导航";
    const host = url.hostname.toLowerCase();
    if (/baidu\.|google\.|bing\.|sogou\.|so\.com$|sm\.cn$|yandex\.|duckduckgo\./.test(host)) return "搜索引擎";
    if (/weixin\.|wechat\.|weibo\.|xiaohongshu\.|douyin\.|tiktok\.|zhihu\.|bilibili\.|qq\.com$|facebook\.|instagram\.|youtube\.|twitter\.|x\.com$|telegram\./.test(host)) return "社交平台";
    return "外链";
  } catch {
    return "直接访问";
  }
}

function localDayStart(timestamp) {
  const shanghaiDate = new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return Date.parse(`${shanghaiDate}T00:00:00+08:00`);
}

function labelPath(pathname, toolName) {
  if (toolName) return toolName;
  const labels = {
    "/": "首页",
    "/tools": "工具库",
    "/privacy": "隐私政策",
    "/terms": "使用条款",
    "/contact": "联系与关于",
    "/file-processing": "文件处理说明",
    "/disclaimer": "免责声明",
    "/admin": "管理后台",
  };
  if (labels[pathname]) return labels[pathname];
  if (pathname.startsWith("/categories/")) {
    const categoryLabels = {
      image: "图片处理分类",
      "pdf-office": "PDF办公工具",
      "video-audio": "视频音频分类",
      creator: "内容创作分类",
      developer: "开发工具分类",
      daily: "日常工具分类",
    };
    return categoryLabels[pathname.slice("/categories/".length)] || "工具分类";
  }
  if (pathname.startsWith("/tools/")) return "工具详情页";
  return "其他页面";
}

function createStore(dbPath, configuredRetentionDays) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 3000");

  const version = db.pragma("user_version", { simple: true });
  if (version < 1) {
    db.exec(`
      BEGIN;
      CREATE TABLE IF NOT EXISTS analytics_visits (
        visit_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        visited_at INTEGER NOT NULL,
        page_path TEXT NOT NULL,
        tool_id TEXT,
        tool_name TEXT,
        source_page TEXT NOT NULL,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        device_type TEXT NOT NULL,
        browser TEXT NOT NULL,
        operating_system TEXT NOT NULL,
        screen_size TEXT NOT NULL,
        language TEXT NOT NULL,
        country_code TEXT NOT NULL DEFAULT 'unknown',
        ip_hash TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS analytics_visits_time_idx ON analytics_visits(visited_at);
      CREATE INDEX IF NOT EXISTS analytics_visits_session_idx ON analytics_visits(session_id, visited_at);
      CREATE INDEX IF NOT EXISTS analytics_visits_tool_idx ON analytics_visits(tool_id, visited_at);

      CREATE TABLE IF NOT EXISTS analytics_tool_usage (
        event_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        tool_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        used_at INTEGER NOT NULL,
        device_type TEXT NOT NULL,
        success INTEGER NOT NULL CHECK(success IN (0, 1)),
        duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
        ip_hash TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS analytics_tool_usage_time_idx ON analytics_tool_usage(used_at);
      CREATE INDEX IF NOT EXISTS analytics_tool_usage_tool_idx ON analytics_tool_usage(tool_id, used_at);

      CREATE TABLE IF NOT EXISTS analytics_sessions (
        session_id TEXT PRIMARY KEY,
        visitor_hash TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        last_page TEXT NOT NULL,
        device_type TEXT NOT NULL,
        source_page TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS analytics_sessions_seen_idx ON analytics_sessions(last_seen_at);
      PRAGMA user_version = 1;
      COMMIT;
    `);
  }

  const migratedVersion = db.pragma("user_version", { simple: true });
  if (migratedVersion < 2) {
    const visitColumns = new Set(db.pragma("table_info(analytics_visits)").map((column) => column.name));
    db.exec("BEGIN;");
    try {
      if (!visitColumns.has("visitor_hash")) db.exec("ALTER TABLE analytics_visits ADD COLUMN visitor_hash TEXT");
      if (!visitColumns.has("source_category")) db.exec("ALTER TABLE analytics_visits ADD COLUMN source_category TEXT NOT NULL DEFAULT '直接访问'");
      db.exec(`
        CREATE INDEX IF NOT EXISTS analytics_visits_visitor_idx ON analytics_visits(visitor_hash, visited_at);
        CREATE TABLE IF NOT EXISTS analytics_visitors (
          visitor_hash TEXT PRIMARY KEY,
          first_seen_at INTEGER NOT NULL,
          last_seen_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS analytics_visitors_seen_idx ON analytics_visitors(last_seen_at);
        CREATE TABLE IF NOT EXISTS analytics_downloads (
          event_id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          tool_id TEXT NOT NULL,
          tool_name TEXT NOT NULL,
          downloaded_at INTEGER NOT NULL,
          device_type TEXT NOT NULL,
          ip_hash TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS analytics_downloads_time_idx ON analytics_downloads(downloaded_at);
        CREATE INDEX IF NOT EXISTS analytics_downloads_tool_idx ON analytics_downloads(tool_id, downloaded_at);
        PRAGMA user_version = 2;
      `);
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }
  }
  migrateAnalyticsV3(db, configuredRetentionDays);
  return db;
}

function safeEqual(left, right) {
  const leftBytes = Buffer.from(String(left ?? ""));
  const rightBytes = Buffer.from(String(right ?? ""));
  const padded = Buffer.alloc(rightBytes.length);
  leftBytes.copy(padded, 0, 0, Math.min(leftBytes.length, padded.length));
  const matches = timingSafeEqual(padded, rightBytes);
  return matches && leftBytes.length === rightBytes.length;
}

function responseJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(body));
}

function responseEmpty(response, status = 204) {
  response.statusCode = status;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end();
}

async function readJson(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error("body_too_large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function cookieValue(request, name) {
  const cookies = request.headers.cookie || "";
  for (const part of cookies.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return "";
}

export function createAnalyticsService(options = {}) {
  const env = options.env || process.env;
  const now = options.now || Date.now;
  const dbPath = options.dbPath || env.ANALYTICS_DB_PATH || path.join(MODULE_DIR, "data", "analytics.sqlite");
  const configuredHmacSecret = env.ANALYTICS_IP_HASH_SECRET;
  if (env.NODE_ENV === "production" && (typeof configuredHmacSecret !== "string" || Buffer.byteLength(configuredHmacSecret) < 32)) {
    throw new Error("Production Analytics requires a stable ANALYTICS_IP_HASH_SECRET of at least 32 bytes");
  }
  const hmacSecret = configuredHmacSecret || randomBytes(32).toString("hex");
  const db = createStore(dbPath, env.ANALYTICS_RETENTION_DAYS);
  const sessions = new Map();
  const collectionLimits = new Map();
  const loginLimits = new Map();

  function keyedHash(value, salt = "") {
    return createHmac("sha256", hmacSecret).update(`${salt}\0${value}`).digest("hex");
  }
  const analyticsV3 = createAnalyticsV3({ db, now, keyedHash });

  function ipHash(request, sessionId, timestamp) {
    const date = new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const address = clientIp(request);
    return keyedHash(address || `session:${sessionId}`, date);
  }

  function getCountry(request) {
    const headerName = String(env.ANALYTICS_COUNTRY_HEADER || "").toLowerCase();
    if (!headerName || env.ANALYTICS_TRUST_COUNTRY_HEADER !== "true") return "unknown";
    const value = request.headers[headerName];
    return typeof value === "string" && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : "unknown";
  }

  function getProvince(request) {
    const headerName = String(env.ANALYTICS_PROVINCE_HEADER || "").toLowerCase();
    if (!headerName || env.ANALYTICS_TRUST_COUNTRY_HEADER !== "true") return "未知";
    const value = request.headers[headerName];
    if (typeof value !== "string") return "未知";
    const province = value.trim().replace(/(省|市|壮族自治区|回族自治区|维吾尔自治区|自治区)$/, "");
    const allowed = new Set(["北京", "天津", "上海", "重庆", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "广西", "海南", "四川", "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆", "香港", "澳门", "台湾"]);
    return allowed.has(province) ? province : "未知";
  }

  function sourceWebsite(value, request) {
    if (typeof value !== "string" || !value) return "";
    try {
      const url = new URL(value);
      const currentHost = String(request.headers.host || "").split(":", 1)[0].toLowerCase();
      if (url.hostname.toLowerCase() === currentHost) return "";
      return sourcePage(value, request);
    } catch {
      return "";
    }
  }

  function registerSession(input) {
    analyticsV3.registerSession(input);
  }

  function rateAllowed(map, key, limit, windowMs, timestamp) {
    const recent = (map.get(key) || []).filter((value) => timestamp - value < windowMs);
    if (recent.length >= limit) {
      map.set(key, recent);
      return false;
    }
    recent.push(timestamp);
    map.set(key, recent);
    if (map.size > 10000) {
      for (const [entryKey, values] of map) {
        if (!values.length || timestamp - values.at(-1) > windowMs * 2) map.delete(entryKey);
      }
    }
    return true;
  }

  function collect(request, body) {
    const timestamp = now();
    const type = body?.type;
    const sessionId = cleanSessionId(body?.sessionId);
    if (!sessionId) return;
    const userHash = ipHash(request, sessionId, timestamp);
    const visitorId = cleanVisitorId(body?.visitorId);
    const visitorHash = visitorId ? keyedHash(visitorId, "visitor-id") : userHash;
    if (!rateAllowed(collectionLimits, userHash, 300, 60_000, timestamp)) return;
    const userAgent = String(request.headers["user-agent"] || "").slice(0, 512);
    const deviceType = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);
    const operatingSystem = detectOperatingSystem(userAgent);

    if (type === "page_view") {
      const visitId = cleanVisitId(body.visitId);
      if (!visitId) return;
      const pagePath = cleanPath(body.path);
      const toolId = cleanTool(body.toolId);
      const toolName = toolId;
      const source = sourcePage(body.sourcePage, request);
      const sourceKind = sourceCategory(body.sourcePage, request);
      const sourceDomain = sourceWebsite(body.sourcePage, request);
      const screenSize = cleanScreenSize(body.screenSize);
      const language = cleanLanguage(body.language);
      const countryCode = getCountry(request);
      const province = getProvince(request);
      const inserted = db.prepare(`
        INSERT OR IGNORE INTO analytics_visits(
          visit_id, session_id, visited_at, page_path, tool_id, tool_name, source_page, duration_ms,
          device_type, browser, operating_system, screen_size, language, country_code, ip_hash, visitor_hash, source_category, province, source_domain
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(visitId, sessionId, timestamp, pagePath, toolId, toolName, source, deviceType, browser, operatingSystem, screenSize, language, countryCode, userHash, visitorHash, sourceKind, province, sourceDomain);
      if (!inserted.changes) return;
      registerSession({ sessionId, visitorHash, timestamp, pagePath, deviceType, browser, operatingSystem, countryCode, province, sourceDomain, sourcePage: source });
      analyticsV3.recordEvent({
        eventId: "page:" + visitId, sessionId, visitorHash, createdAt: timestamp, eventType: "page_view",
        pagePath, toolId, deviceType, browser, operatingSystem, screenSize, countryCode, province, sourceDomain, sourceCategory: sourceKind,
      });
      return;
    }

    if (type === "page_duration") {
      const visitId = cleanVisitId(body.visitId);
      const duration = Number(body.durationMs);
      if (!visitId || !Number.isFinite(duration)) return;
      const durationMs = Math.min(30 * 60 * 1000, Math.max(0, Math.round(duration)));
      db.prepare("UPDATE analytics_visits SET duration_ms = ? WHERE visit_id = ? AND session_id = ?")
        .run(durationMs, visitId, sessionId);
      db.prepare("UPDATE analytics_events SET duration_ms = ? WHERE event_id = ? AND session_id = ? AND event_type = 'page_view'")
        .run(durationMs, `page:${visitId}`, sessionId);
      return;
    }

    if (type === "heartbeat") {
      const pagePath = cleanPath(body.path);
      db.prepare("UPDATE analytics_sessions SET last_seen_at = ?, last_page = ? WHERE session_id = ?")
        .run(timestamp, pagePath, sessionId);
      return;
    }

    if (type === "tool_start") {
      const eventId = cleanVisitId(body.eventId);
      const toolId = cleanTool(body.toolId);
      if (!eventId || !toolId) return;
      const pagePath = "/tools/" + toolId;
      registerSession({ sessionId, visitorHash, timestamp, pagePath, deviceType, browser, operatingSystem, countryCode: getCountry(request), province: getProvince(request), sourceDomain: "", sourcePage: "直接访问" });
      analyticsV3.recordEvent({
        eventId: "start:" + eventId, sessionId, visitorHash, createdAt: timestamp, eventType: "tool_start",
        pagePath, toolId, deviceType, browser, operatingSystem, countryCode: getCountry(request), province: getProvince(request),
      });
      return;
    }

    if (type === "tool_usage") {
      const eventId = cleanVisitId(body.eventId);
      const toolId = cleanTool(body.toolId);
      const duration = Number(body.durationMs);
      if (!eventId || !toolId || !Number.isFinite(duration) || typeof body.success !== "boolean") return;
      const toolName = toolId;
      const durationMs = Math.min(30 * 60 * 1000, Math.max(0, Math.round(duration)));
      const inserted = db.prepare(`
        INSERT OR IGNORE INTO analytics_tool_usage(event_id, session_id, tool_id, tool_name, used_at, device_type, success, duration_ms, ip_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(eventId, sessionId, toolId, toolName, timestamp, deviceType, body.success ? 1 : 0, durationMs, userHash);
      if (!inserted.changes) return;
      const pagePath = "/tools/" + toolId;
      const countryCode = getCountry(request);
      const province = getProvince(request);
      registerSession({ sessionId, visitorHash, timestamp, pagePath, deviceType, browser, operatingSystem, countryCode, province, sourceDomain: "", sourcePage: "直接访问" });
      analyticsV3.recordEvent({
        eventId: "tool:" + eventId, sessionId, visitorHash, createdAt: timestamp,
        eventType: body.success ? "tool_success" : "tool_fail", pagePath, toolId, durationMs,
        deviceType, browser, operatingSystem, countryCode, province,
      });
      return;
    }

    if (type === "tool_download") {
      const eventId = cleanVisitId(body.eventId);
      const toolId = cleanTool(body.toolId);
      if (!eventId || !toolId) return;
      const toolName = toolId;
      const inserted = db.prepare(`
        INSERT OR IGNORE INTO analytics_downloads(event_id, session_id, tool_id, tool_name, downloaded_at, device_type, ip_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(eventId, sessionId, toolId, toolName, timestamp, deviceType, userHash);
      if (!inserted.changes) return;
      const pagePath = "/tools/" + toolId;
      const countryCode = getCountry(request);
      const province = getProvince(request);
      registerSession({ sessionId, visitorHash, timestamp, pagePath, deviceType, browser, operatingSystem, countryCode, province, sourceDomain: "", sourcePage: "直接访问" });
      analyticsV3.recordEvent({
        eventId: "download:" + eventId, sessionId, visitorHash, createdAt: timestamp,
        eventType: "download", pagePath, toolId, deviceType, browser, operatingSystem, countryCode, province,
      });
      return;
    }

    if (type === "page_error") {
      const eventId = cleanVisitId(body.eventId);
      if (!eventId) return;
      const pagePath = cleanPath(body.path);
      const toolId = cleanTool(body.toolId);
      const countryCode = getCountry(request);
      const province = getProvince(request);
      registerSession({ sessionId, visitorHash, timestamp, pagePath, deviceType, browser, operatingSystem, countryCode, province, sourceDomain: "", sourcePage: "直接访问" });
      analyticsV3.recordEvent({
        eventId: "error:" + eventId, sessionId, visitorHash, createdAt: timestamp,
        eventType: body.errorType === "api_error" ? "api_error" : "page_error",
        errorCode: body.errorType === "api_error" ? "api_error" : "page_error",
        pagePath, toolId, deviceType, browser, operatingSystem, countryCode, province,
      });
    }
  }

  function getDashboard(days) {
    const timestamp = now();
    const todayStart = localDayStart(timestamp);
    const todayEnd = todayStart + DAY_MS;
    const yesterdayStart = todayStart - DAY_MS;
    const rangeStart = todayStart - (days - 1) * DAY_MS;
    const rangeEnd = todayEnd;
    const previousStart = rangeStart - days * DAY_MS;
    const todayPv = db.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE visited_at >= ? AND visited_at < ?").get(todayStart, todayEnd).count;
    const yesterdayPv = db.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE visited_at >= ? AND visited_at < ?").get(yesterdayStart, todayStart).count;
    const todayVisitors = db.prepare(`
      SELECT COUNT(DISTINCT COALESCE(visitor_hash, ip_hash)) AS count
      FROM analytics_visits WHERE visited_at >= ? AND visited_at < ?
    `).get(todayStart, todayEnd).count;
    const todayNewUsers = db.prepare(`
      SELECT COUNT(*) AS count FROM analytics_visitors
      WHERE first_seen_at >= ? AND first_seen_at < ? AND last_seen_at >= ?
    `).get(todayStart, todayEnd, todayStart).count;
    const todayReturningUsers = Math.max(0, todayVisitors - todayNewUsers);
    const todayToolUses = db.prepare("SELECT COUNT(*) AS count FROM analytics_tool_usage WHERE used_at >= ? AND used_at < ?").get(todayStart, todayEnd).count;
    const todaySuccessCount = db.prepare("SELECT COUNT(*) AS count FROM analytics_tool_usage WHERE used_at >= ? AND used_at < ? AND success = 1").get(todayStart, todayEnd).count;
    const averageStay = db.prepare("SELECT CAST(AVG(duration_ms) AS INTEGER) AS average FROM analytics_visits WHERE visited_at >= ? AND visited_at < ? AND duration_ms > 0").get(todayStart, todayEnd).average;

    const toolStats = new Map();
    const ensureTool = (row) => {
      if (!toolStats.has(row.toolId)) {
        toolStats.set(row.toolId, {
          toolId: row.toolId,
          toolName: row.toolName || "工具",
          visits: 0,
          uses: 0,
          successCount: 0,
          failureCount: 0,
          successRate: 0,
          averageDurationMs: 0,
          averageStayMs: 0,
          trendPercent: null,
          trendNew: false,
          valueScore: 0,
        });
      }
      const tool = toolStats.get(row.toolId);
      if (row.toolName) tool.toolName = row.toolName;
      return tool;
    };
    const toolVisits = db.prepare(`
      SELECT tool_id AS toolId, MAX(tool_name) AS toolName, COUNT(*) AS count
      FROM analytics_visits
      WHERE visited_at >= ? AND visited_at < ? AND tool_id IS NOT NULL AND page_path LIKE '/tools/%'
      GROUP BY tool_id
    `).all(rangeStart, rangeEnd);
    for (const row of toolVisits) ensureTool(row).visits = row.count;
    const toolUses = db.prepare(`
      SELECT tool_id AS toolId, MAX(tool_name) AS toolName, COUNT(*) AS count,
        SUM(success) AS successCount, COUNT(*) - SUM(success) AS failureCount,
        CAST(AVG(duration_ms) AS INTEGER) AS averageDurationMs
      FROM analytics_tool_usage WHERE used_at >= ? AND used_at < ?
      GROUP BY tool_id
    `).all(rangeStart, rangeEnd);
    for (const row of toolUses) {
      const tool = ensureTool(row);
      tool.uses = row.count;
      tool.successCount = row.successCount;
      tool.failureCount = row.failureCount;
      tool.successRate = row.count ? row.successCount / row.count : 0;
      tool.averageDurationMs = row.averageDurationMs || 0;
    }
    const toolStay = db.prepare(`
      SELECT tool_id AS toolId, CAST(AVG(duration_ms) AS INTEGER) AS averageStayMs
      FROM analytics_visits
      WHERE visited_at >= ? AND visited_at < ? AND tool_id IS NOT NULL AND duration_ms > 0
      GROUP BY tool_id
    `).all(rangeStart, rangeEnd);
    for (const row of toolStay) ensureTool(row).averageStayMs = row.averageStayMs || 0;
    const previousUses = db.prepare(`
      SELECT tool_id AS toolId, COUNT(*) AS count FROM analytics_tool_usage
      WHERE used_at >= ? AND used_at < ? GROUP BY tool_id
    `).all(previousStart, rangeStart);
    const previousUseCounts = new Map(previousUses.map((row) => [row.toolId, row.count]));
    for (const tool of toolStats.values()) {
      const previousCount = previousUseCounts.get(tool.toolId) || 0;
      if (previousCount > 0) tool.trendPercent = Math.round(((tool.uses - previousCount) / previousCount) * 100);
      else tool.trendNew = tool.uses > 0;
    }
    const toolValues = [...toolStats.values()];
    const maxVisits = Math.max(1, ...toolValues.map((tool) => tool.visits));
    const maxUses = Math.max(1, ...toolValues.map((tool) => tool.uses));
    const maxStay = Math.max(1, ...toolValues.map((tool) => Math.min(tool.averageStayMs, 300_000)));
    for (const tool of toolValues) {
      const reachScore = Math.log1p(tool.visits) / Math.log1p(maxVisits);
      const usageScore = Math.log1p(tool.uses) / Math.log1p(maxUses);
      const stayScore = Math.log1p(Math.min(tool.averageStayMs, 300_000)) / Math.log1p(maxStay);
      tool.valueScore = Math.round((5 * (reachScore * 0.25 + usageScore * 0.3 + tool.successRate * 0.3 + stayScore * 0.15)) * 10) / 10;
    }
    const topTools = toolValues.sort((left, right) => right.uses - left.uses || right.visits - left.visits || left.toolName.localeCompare(right.toolName, "zh-CN")).slice(0, 10);

    const groupedVisits = (column) => db.prepare(`
      SELECT ${column} AS label, COUNT(*) AS count FROM analytics_visits
      WHERE visited_at >= ? AND visited_at < ? GROUP BY ${column} ORDER BY count DESC LIMIT 12
    `).all(rangeStart, rangeEnd);
    const devices = groupedVisits("device_type");
    const operatingSystems = groupedVisits("operating_system");
    const browsers = groupedVisits("browser");
    const screenSizes = groupedVisits("screen_size").map((item) => ({ ...item, label: item.label === "未知" ? "其他屏幕" : item.label }));
    const countries = groupedVisits("country_code").map((item) => ({
      ...item,
      label: !item.label || item.label.toLowerCase() === "unknown" ? "未知地区" : ({ CN: "中国", US: "美国", HK: "中国香港", TW: "中国台湾", MO: "中国澳门" }[item.label] || item.label),
    }));
    const sources = db.prepare(`
      SELECT source_category AS label, COUNT(*) AS count FROM analytics_visits
      WHERE visited_at >= ? AND visited_at < ? GROUP BY source_category ORDER BY count DESC
    `).all(rangeStart, rangeEnd);
    const exits = db.prepare(`
      SELECT page_path AS path, tool_name AS toolName, COUNT(*) AS count FROM (
        SELECT page_path, tool_name, ROW_NUMBER() OVER(PARTITION BY session_id ORDER BY visited_at DESC, visit_id DESC) AS row_number
        FROM analytics_visits WHERE visited_at >= ? AND visited_at < ?
      ) WHERE row_number = 1 GROUP BY page_path, tool_name ORDER BY count DESC LIMIT 10
    `).all(rangeStart, rangeEnd).map((row) => ({ label: labelPath(row.path, row.toolName), path: labelPath(row.path, row.toolName), count: row.count }));
    const pathEvents = db.prepare(`
      SELECT session_id AS sessionId, page_path AS path, tool_name AS toolName, visited_at AS visitedAt
      FROM analytics_visits WHERE visited_at >= ? AND visited_at < ? ORDER BY session_id, visited_at, visit_id LIMIT 25000
    `).all(rangeStart, rangeEnd);
    const pathsBySession = new Map();
    for (const row of pathEvents) {
      const sequence = pathsBySession.get(row.sessionId) || [];
      if (sequence.length < 8) sequence.push(labelPath(row.path, row.toolName));
      pathsBySession.set(row.sessionId, sequence);
    }
    const pathCounts = new Map();
    for (const sequence of pathsBySession.values()) {
      if (!sequence.length) continue;
      const key = sequence.join(" → ");
      pathCounts.set(key, (pathCounts.get(key) || 0) + 1);
    }
    const paths = [...pathCounts.entries()].map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count).slice(0, 10);
    const online = db.prepare("SELECT COUNT(*) AS count FROM analytics_sessions WHERE last_seen_at >= ?").get(timestamp - ONLINE_WINDOW_MS).count;

    const funnelEvents = [
      ...db.prepare("SELECT session_id AS sessionId, page_path AS path, visited_at AS occurredAt FROM analytics_visits WHERE visited_at >= ? AND visited_at < ?").all(rangeStart, rangeEnd).map((row) => ({ ...row, kind: "page", success: false })),
      ...db.prepare("SELECT session_id AS sessionId, tool_id AS toolId, used_at AS occurredAt, success FROM analytics_tool_usage WHERE used_at >= ? AND used_at < ?").all(rangeStart, rangeEnd).map((row) => ({ ...row, kind: "execute", path: `/tools/${row.toolId}` })),
      ...db.prepare("SELECT session_id AS sessionId, tool_id AS toolId, downloaded_at AS occurredAt FROM analytics_downloads WHERE downloaded_at >= ? AND downloaded_at < ?").all(rangeStart, rangeEnd).map((row) => ({ ...row, kind: "download", path: `/tools/${row.toolId}` })),
    ].sort((left, right) => left.sessionId.localeCompare(right.sessionId) || left.occurredAt - right.occurredAt);
    const funnelSessions = new Map();
    for (const event of funnelEvents) {
      const funnel = funnelSessions.get(event.sessionId) || { step: 0 };
      if (event.kind === "page" && event.path === "/" && funnel.step === 0) funnel.step = 1;
      else if (event.kind === "page" && event.path.startsWith("/categories/") && funnel.step === 1) funnel.step = 2;
      else if (event.kind === "page" && event.path.startsWith("/tools/") && funnel.step === 2) funnel.step = 3;
      else if (event.kind === "execute" && funnel.step === 3) {
        funnel.step = 4;
        if (event.success) funnel.step = 5;
      } else if (event.kind === "download" && funnel.step === 5) funnel.step = 6;
      funnelSessions.set(event.sessionId, funnel);
    }
    const funnelSteps = [
      { id: "entry", label: "首页进入", field: 1 },
      { id: "category", label: "访问分类", field: 2 },
      { id: "tool", label: "打开工具", field: 3 },
      { id: "execute", label: "执行工具", field: 4 },
      { id: "complete", label: "处理成功", field: 5 },
      { id: "download", label: "下载结果", field: 6 },
    ];
    let previousFunnelCount = 0;
    const funnel = funnelSteps.map((step) => {
      const count = [...funnelSessions.values()].filter((session) => session.step >= step.field).length;
      const dropoffPercent = previousFunnelCount ? Math.round((1 - count / previousFunnelCount) * 100) : null;
      previousFunnelCount = count;
      return { id: step.id, label: step.label, count, dropoffPercent };
    });
    const activity = db.prepare(`
      SELECT kind, occurredAt, label, pagePath, toolName FROM (
        SELECT 'visit' AS kind, visited_at AS occurredAt,
          CASE WHEN tool_name IS NULL THEN '访问页面' ELSE '打开工具' END AS label,
          page_path AS pagePath, tool_name AS toolName
        FROM analytics_visits WHERE visited_at >= ? AND visited_at < ?
        UNION ALL
        SELECT 'tool' AS kind, used_at AS occurredAt,
          CASE WHEN success = 1 THEN '处理成功' ELSE '处理失败' END AS label,
          '/tools/' || tool_id AS pagePath, tool_name AS toolName
        FROM analytics_tool_usage WHERE used_at >= ? AND used_at < ?
        UNION ALL
        SELECT 'download' AS kind, downloaded_at AS occurredAt,
          '下载结果' AS label, '/tools/' || tool_id AS pagePath, tool_name AS toolName
        FROM analytics_downloads WHERE downloaded_at >= ? AND downloaded_at < ?
      ) ORDER BY occurredAt DESC LIMIT 20
    `).all(rangeStart, rangeEnd, rangeStart, rangeEnd, rangeStart, rangeEnd).map((item) => ({
      kind: item.kind,
      occurredAt: item.occurredAt,
      label: item.toolName ? `${item.label} · ${item.toolName}` : item.label,
      page: labelPath(item.pagePath, item.toolName),
    }));
    return {
      generatedAt: timestamp,
      rangeDays: days,
      online,
      metrics: {
        todayVisitors,
        todayPv,
        yesterdayPv,
        todayToolUses,
        todaySuccessCount,
        todayAverageStayMs: averageStay || 0,
        todayNewUsers,
        todayReturningUsers,
        pvChangePercent: yesterdayPv ? Math.round(((todayPv - yesterdayPv) / yesterdayPv) * 100) : null,
      },
      topTools,
      devices,
      operatingSystems,
      browsers,
      screenSizes,
      countries,
      sources,
      paths,
      funnel,
      exitPages: exits,
      activity,
    };
  }

  function cleanup() {
    return analyticsV3.cleanup();
  }

  function isHttps(request) {
    return request.socket.encrypted === true || String(request.headers["x-forwarded-proto"] || "").split(",", 1)[0].trim() === "https";
  }

  function sameOrigin(request) {
    const origin = request.headers.origin;
    if (typeof origin !== "string" || typeof request.headers.host !== "string") return false;
    try {
      return new URL(origin).host.toLowerCase() === request.headers.host.toLowerCase();
    } catch {
      return false;
    }
  }

  function adminConfigured() {
    return typeof env.ADMIN_USERNAME === "string" && env.ADMIN_USERNAME.length >= 1
      && typeof env.ADMIN_PASSWORD === "string" && env.ADMIN_PASSWORD.length >= 8;
  }

  function currentSession(request) {
    const token = cookieValue(request, SESSION_COOKIE);
    if (!token) return false;
    const digest = keyedHash(token, "admin-session");
    const expiry = sessions.get(digest);
    if (!expiry || expiry <= now()) {
      sessions.delete(digest);
      return false;
    }
    return digest;
  }

  function appendSessionCookie(response, token, secure, maxAge) {
    const securePart = secure ? "; Secure" : "";
    response.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/analytics/admin; Max-Age=${maxAge}${securePart}`);
  }

  async function handleAdmin(request, response, url) {
    if (!sameOrigin(request) && request.method !== "GET") {
      responseJson(response, 403, { ok: false, error: "请求来源无效" });
      return;
    }
    if (!isHttps(request) && env.ANALYTICS_ALLOW_INSECURE_ADMIN !== "true") {
      responseJson(response, 426, { ok: false, error: "请通过 HTTPS 登录后台" });
      return;
    }
    if (!adminConfigured()) {
      responseJson(response, 503, { ok: false, error: "管理员环境配置尚未完成" });
      return;
    }
    const sessionDigest = currentSession(request);
    if (request.method === "GET" && url.pathname === "/api/analytics/admin/session") {
      if (!sessionDigest) responseJson(response, 401, { ok: false, error: "请先登录" });
      else responseJson(response, 200, { ok: true, authenticated: true });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/analytics/admin/login") {
      const addressHash = keyedHash(clientIp(request) || "unknown", "admin-login-limit");
      if (!rateAllowed(loginLimits, addressHash, 5, 15 * 60 * 1000, now())) {
        responseJson(response, 429, { ok: false, error: "尝试次数过多，请稍后再试" });
        return;
      }
      let body;
      try {
        body = await readJson(request);
      } catch {
        responseJson(response, 400, { ok: false, error: "登录信息格式不正确" });
        return;
      }
      if (!safeEqual(body.username, env.ADMIN_USERNAME) || !safeEqual(body.password, env.ADMIN_PASSWORD)) {
        responseJson(response, 401, { ok: false, error: "账号或密码不正确" });
        return;
      }
      const token = randomBytes(32).toString("base64url");
      const digest = keyedHash(token, "admin-session");
      sessions.set(digest, now() + SESSION_TTL_MS);
      appendSessionCookie(response, token, isHttps(request), Math.floor(SESSION_TTL_MS / 1000));
      responseJson(response, 200, { ok: true, authenticated: true });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/analytics/admin/logout") {
      if (sessionDigest) sessions.delete(sessionDigest);
      appendSessionCookie(response, "", isHttps(request), 0);
      responseJson(response, 200, { ok: true });
      return;
    }
    if (!sessionDigest) {
      responseJson(response, 401, { ok: false, error: "请先登录" });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/analytics/admin/v3/dashboard") {
      try {
        const range = analyticsV3.parseRange(url.searchParams);
        responseJson(response, 200, { ok: true, data: analyticsV3.dashboard(range) });
      } catch (error) {
        responseJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "日期范围无效" });
      }
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/analytics/admin/v3/visitors") {
      try {
        const range = analyticsV3.parseRange(url.searchParams);
        const allowedGroups = new Set(["all", "新访客", "活跃访客", "高价值访客", "流失访客", "回访访客"]);
        const requestedGroup = url.searchParams.get("group") || "all";
        if (!allowedGroups.has(requestedGroup)) {
          responseJson(response, 400, { ok: false, error: "访客分组无效" });
          return;
        }
        const offset = Math.max(0, Math.min(50_000, Number(url.searchParams.get("offset")) || 0));
        const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit")) || 100));
        responseJson(response, 200, { ok: true, data: analyticsV3.visitors(range, requestedGroup, offset, limit) });
      } catch (error) {
        responseJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "日期范围无效" });
      }
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/analytics/admin/v3/daily-report") {
      try {
        responseJson(response, 200, { ok: true, data: analyticsV3.dailyReport(url.searchParams.get("date")) });
      } catch (error) {
        responseJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "日报暂时无法生成" });
      }
      return;
    }
    const visitorMatch = url.pathname.match(/^\/api\/analytics\/admin\/v3\/visitors\/([a-f0-9]{32})$/);
    if (request.method === "GET" && visitorMatch) {
      try {
        const range = analyticsV3.parseRange(url.searchParams);
        const data = analyticsV3.visitorTimeline(visitorMatch[1], range);
        responseJson(response, data ? 200 : 404, data ? { ok: true, data } : { ok: false, error: "该匿名访客在所选时间范围内没有行为记录" });
      } catch (error) {
        responseJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "日期范围无效" });
      }
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/analytics/admin/v3/settings") {
      responseJson(response, 200, { ok: true, data: analyticsV3.settings() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/analytics/admin/v3/settings") {
      let body;
      try {
        body = await readJson(request);
        analyticsV3.setRetentionDays(body.retentionDays);
        responseJson(response, 200, { ok: true, data: analyticsV3.settings() });
      } catch (error) {
        responseJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "设置保存失败" });
      }
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/analytics/admin/dashboard") {
      const requested = Number(url.searchParams.get("days") || 7);
      const days = [1, 7, 30].includes(requested) ? requested : 7;
      responseJson(response, 200, { ok: true, data: getDashboard(days) });
      return;
    }
    responseJson(response, 404, { ok: false, error: "Not found" });
  }

  async function handle(request, response) {
    const url = new URL(request.url || "/", "http://localhost");
    if (request.method === "POST" && url.pathname === "/api/analytics/collect") {
      try {
        const body = await readJson(request);
        collect(request, body);
      } catch {
        // Telemetry is best effort and never returns failure details to the visitor.
      }
      responseEmpty(response);
      return;
    }
    if (url.pathname.startsWith("/api/analytics/admin/")) {
      try {
        await handleAdmin(request, response, url);
      } catch {
        responseJson(response, 500, { ok: false, error: "后台暂时不可用" });
      }
      return;
    }
    responseJson(response, 404, { ok: false, error: "Not found" });
  }

  function close() {
    db.close();
  }

  return { handle, cleanup, close, getDashboard, analyticsV3 };
}
