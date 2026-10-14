import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createAnalyticsService } from "../ai-api/analytics.mjs";

const require = createRequire(new URL("../ai-api/analytics.mjs", import.meta.url));
const Database = require("better-sqlite3");
const tempDir = mkdtempSync(path.join(tmpdir(), "tools-hub-analytics-v3-"));
const dbPath = path.join(tempDir, "analytics.sqlite");
const hmacSecret = randomBytes(32).toString("hex");
const adminPassword = randomBytes(32).toString("base64url");
const username = "analytics-test-admin";
const fixedNow = Date.now();
const shanghaiDate = new Date(fixedNow + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
const oldRecordAt = fixedNow - 3 * 24 * 60 * 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;
const assertions = [];
let database;
let server;
let service;

function seedVersionOneDatabase() {
  const legacy = new Database(dbPath);
  legacy.exec(`
    CREATE TABLE analytics_visits (
      visit_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, visited_at INTEGER NOT NULL,
      page_path TEXT NOT NULL, tool_id TEXT, tool_name TEXT, source_page TEXT NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0, device_type TEXT NOT NULL, browser TEXT NOT NULL,
      operating_system TEXT NOT NULL, screen_size TEXT NOT NULL, language TEXT NOT NULL,
      country_code TEXT NOT NULL DEFAULT 'unknown', ip_hash TEXT NOT NULL
    );
    CREATE TABLE analytics_tool_usage (
      event_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, tool_id TEXT NOT NULL, tool_name TEXT NOT NULL,
      used_at INTEGER NOT NULL, device_type TEXT NOT NULL, success INTEGER NOT NULL CHECK(success IN (0,1)),
      duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0), ip_hash TEXT NOT NULL
    );
    CREATE TABLE analytics_sessions (
      session_id TEXT PRIMARY KEY, visitor_hash TEXT NOT NULL, started_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL, last_page TEXT NOT NULL, device_type TEXT NOT NULL, source_page TEXT NOT NULL
    );
    CREATE TABLE analytics_downloads (
      event_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, tool_id TEXT NOT NULL, tool_name TEXT NOT NULL,
      downloaded_at INTEGER NOT NULL, device_type TEXT NOT NULL, ip_hash TEXT NOT NULL
    );
    CREATE INDEX analytics_visits_time_idx ON analytics_visits(visited_at);
    CREATE INDEX analytics_sessions_seen_idx ON analytics_sessions(last_seen_at);
    PRAGMA user_version = 1;
  `);
  const oldSession = randomUUID();
  const oldHash = "c".repeat(64);
  legacy.prepare("INSERT INTO analytics_visits VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(randomUUID(), oldSession, oldRecordAt, "/tools/json-format", "json-format", "OLD_TOOL_NAME_SENTINEL", "direct.example/path?email=private", 1800, "电脑", "Chrome", "Windows", "1400x900", "zh-CN", "unknown", oldHash);
  legacy.prepare("INSERT INTO analytics_tool_usage VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(randomUUID(), oldSession, "json-format", "OLD_USAGE_NAME_SENTINEL", oldRecordAt + 1000, "电脑", 1, 900, oldHash);
  legacy.prepare("INSERT INTO analytics_sessions VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(oldSession, oldHash, oldRecordAt, oldRecordAt, "/tools/json-format", "电脑", "direct.example");
  legacy.prepare("INSERT INTO analytics_downloads VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(randomUUID(), oldSession, "json-format", "OLD_DOWNLOAD_NAME_SENTINEL", oldRecordAt + 2000, "电脑", oldHash);
  legacy.close();
}

function deviceFor(index) {
  if (index % 4 === 0) return { deviceType: "手机", operatingSystem: "Android", browser: "Chrome", screenSize: "400x800" };
  if (index % 4 === 1) return { deviceType: "手机", operatingSystem: "iOS", browser: "Safari", screenSize: "400x800" };
  if (index % 4 === 2) return { deviceType: "电脑", operatingSystem: "Windows", browser: "Edge", screenSize: "1400x900" };
  return { deviceType: "平板", operatingSystem: "macOS", browser: "Safari", screenSize: "1200x800" };
}

function visitorHash(visitorId) {
  return createHmac("sha256", hmacSecret).update(`visitor-id\0${visitorId}`).digest("hex");
}

function simulateEvent({ visitorId, sessionId, toolId, type, pagePath, at, index, durationMs = 0, source = "直接访问" }) {
  const identity = visitorHash(visitorId);
  const device = deviceFor(index);
  service.analyticsV3.registerSession({
    sessionId, visitorHash: identity, timestamp: at, pagePath, deviceType: device.deviceType,
    operatingSystem: device.operatingSystem, browser: device.browser, countryCode: index % 3 === 0 ? "CN" : "unknown",
    province: index % 3 === 0 ? "湖北" : "未知", sourceDomain: index % 2 === 0 ? "partner.example" : "",
    sourcePage: source,
  });
  return service.analyticsV3.recordEvent({
    eventId: randomUUID(), sessionId, visitorHash: identity, createdAt: at, eventType: type,
    pagePath, toolId: pagePath.startsWith("/tools/") ? (toolId || null) : null, durationMs, deviceType: device.deviceType,
    operatingSystem: device.operatingSystem, browser: device.browser, screenSize: device.screenSize,
    countryCode: index % 3 === 0 ? "CN" : "unknown", province: index % 3 === 0 ? "湖北" : "未知",
    sourceDomain: index % 2 === 0 ? "partner.example" : "", sourceCategory: index % 2 === 0 ? "外链" : "直接访问",
  });
}

async function authenticate(baseUrl) {
  const response = await fetch(`${baseUrl}/api/analytics/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ username, password: adminPassword }),
  });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie")?.split(";")[0];
}

async function main() {
  try {
  assert.throws(() => createAnalyticsService({ dbPath: path.join(tempDir, "production-secret-check.sqlite"), env: { NODE_ENV: "production" } }), /stable ANALYTICS_IP_HASH_SECRET/);
  assertions.push("Production mode refuses to start without a fixed, sufficiently strong Analytics HMAC secret");
  seedVersionOneDatabase();
  service = createAnalyticsService({ dbPath, now: () => fixedNow, env: {
    ANALYTICS_IP_HASH_SECRET: hmacSecret,
    ANALYTICS_ALLOW_INSECURE_ADMIN: "true",
    ADMIN_USERNAME: username,
    ADMIN_PASSWORD: adminPassword,
  } });
  database = new Database(dbPath);
  assert.equal(database.pragma("user_version", { simple: true }), 3, "v1 data should migrate to schema v3");
  assert.equal(database.prepare("SELECT tool_name FROM analytics_visits WHERE page_path='/tools/json-format'").get().tool_name, "json-format");
  assert.equal(database.prepare("SELECT tool_name FROM analytics_tool_usage").get().tool_name, "json-format");
  assert.equal(database.prepare("SELECT tool_name FROM analytics_downloads").get().tool_name, "json-format");
  assert.equal(database.prepare("SELECT source_page FROM analytics_visits").get().source_page, "外部来源", "legacy referrer URLs must be stripped during migration");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='tool_start'").get().count, 1, "v2 tool runs should backfill start events");
  assertions.push("Schema v1 automatically migrated to v3; historical tool labels were reduced to slugs and tool starts backfilled");

  const { server: httpServer, address } = await new Promise((resolve, reject) => {
    const candidate = createServer((request, response) => {
      void service.handle(request, response).catch((error) => {
        console.error("Analytics HTTP test handler failed:", error instanceof Error ? error.message : "unknown error");
        response.destroy();
      });
    });
    candidate.keepAliveTimeout = 120_000;
    candidate.headersTimeout = 130_000;
    candidate.on("clientError", (error) => console.error("Analytics HTTP test client error:", error.message));
    candidate.once("error", reject);
    candidate.listen(0, "127.0.0.1", () => resolve({ server: candidate, address: candidate.address() }));
  });
  server = httpServer;
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;
  const unauthenticated = await fetch(`${baseUrl}/api/analytics/admin/v3/dashboard?preset=today`);
  assert.equal(unauthenticated.status, 401, "V3 dashboard must be login protected");
  const unauthenticatedVisitors = await fetch(`${baseUrl}/api/analytics/admin/v3/visitors?preset=today`);
  assert.equal(unauthenticatedVisitors.status, 401, "V3 visitor details must be login protected");
  const unauthenticatedReport = await fetch(`${baseUrl}/api/analytics/admin/v3/daily-report`);
  assert.equal(unauthenticatedReport.status, 401, "daily report must be login protected");
  const cookie = await authenticate(baseUrl);
  assert.ok(cookie?.startsWith("tools_hub_admin="));
  assertions.push("V3 dashboard and anonymous behavior APIs reject requests without admin login");

  const today = service.analyticsV3.parseRange(new URLSearchParams("preset=today"));
  for (let index = 0; index < 1000; index += 1) {
    const anonId = randomUUID();
    const toolId = index === 0 ? "json-format" : index === 1 ? "base64-codec" : index % 2 === 0 ? "json-format" : "base64-codec";
    const sessionA = randomUUID();
    const sessionB = index === 0 ? randomUUID() : sessionA;
    const startAt = Math.max(today.startAt, fixedNow - 120_000 + index * 10);
    const common = { visitorId: anonId, toolId, index };
    if (index === 0) {
      const pages = ["/", "/categories/developer", `/tools/${toolId}`, `/tools/${toolId}`];
      pages.forEach((pagePath, eventIndex) => simulateEvent({ ...common, sessionId: sessionA, type: "page_view", pagePath, at: startAt + eventIndex, durationMs: 1200 + eventIndex * 100 }));
      [sessionA, sessionA, sessionB].forEach((sessionId, eventIndex) => simulateEvent({ ...common, sessionId, type: "tool_start", pagePath: `/tools/${toolId}`, at: startAt + 4 + eventIndex }));
      simulateEvent({ ...common, sessionId: sessionB, type: "tool_success", pagePath: `/tools/${toolId}`, at: startAt + 7, durationMs: 2200 });
      simulateEvent({ ...common, sessionId: sessionB, type: "download", pagePath: `/tools/${toolId}`, at: startAt + 8 });
      simulateEvent({ ...common, sessionId: sessionB, type: "page_error", pagePath: `/tools/${toolId}`, at: startAt + 9, source: "page_error" });
      continue;
    }
    const sessionId = sessionA;
    const pageCount = index === 1 ? 9 : 6;
    const pages = ["/", "/categories/developer", `/tools/${toolId}`, ...Array.from({ length: pageCount - 3 }, () => `/tools/${toolId}`)];
    pages.forEach((pagePath, eventIndex) => simulateEvent({ ...common, sessionId, type: "page_view", pagePath, at: startAt + eventIndex, durationMs: 1000 + eventIndex * 100 }));
    if (index === 1) {
      simulateEvent({ ...common, sessionId, type: "page_error", pagePath: `/tools/${toolId}`, at: startAt + 9, source: "page_error" });
      continue;
    }
    simulateEvent({ ...common, sessionId, type: "tool_start", pagePath: `/tools/${toolId}`, at: startAt + 6 });
    simulateEvent({ ...common, sessionId, type: index % 2 === 0 ? "tool_fail" : "tool_success", pagePath: `/tools/${toolId}`, at: startAt + 7, durationMs: 800 + index });
    simulateEvent({ ...common, sessionId, type: "download", pagePath: `/tools/${toolId}`, at: startAt + 8 });
    simulateEvent({ ...common, sessionId, type: "page_error", pagePath: `/tools/${toolId}`, at: startAt + 9, source: "page_error" });
  }
  const eventCount = database.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE created_at>=? AND created_at<?").get(today.startAt, today.endAt).count;
  assert.equal(eventCount, 10_000, "simulation must contain exactly 10,000 events");
  const dashboard = service.analyticsV3.dashboard(today);
  assert.equal(dashboard.metrics.visitors, 1000);
  assert.equal(dashboard.metrics.pageViews, 6001);
  assert.equal(dashboard.metrics.toolUses, 1001);
  assert.equal(dashboard.metrics.successes, 500);
  assert.equal(dashboard.metrics.failures, 499);
  assert.equal(dashboard.metrics.downloads, 999);
  assert.equal(dashboard.metrics.errorCount, 1499);
  assert.equal(dashboard.online.count, 1001, "online counts all sessions, not only the displayed first 50");
  assert.ok(dashboard.metrics.averageStayMs > 0);
  assert.equal(dashboard.hotTools.reduce((sum, item) => sum + item.uses, 0), 1001);
  assert.equal(dashboard.hotTools.reduce((sum, item) => sum + item.downloads, 0), 999);
  assert.equal(dashboard.highFailureTools.reduce((sum, item) => sum + item.failures, 0), 499);
  assert.ok(dashboard.sources.some((item) => item.label === "外链"));
  assert.ok(dashboard.sourceWebsites.some((item) => item.label === "partner.example"));
  assert.ok(dashboard.provinces.some((item) => item.label === "湖北"));
  assert.ok(dashboard.dailyTrend.some((item) => item.toolUses === 1001));
  const mainJourney = dashboard.paths.find((item) => item.steps.map((step) => step.kind).join(",") === "home,category,tool,execute,download");
  assert.ok(mainJourney, "anonymous journey should show home → category → tool → execute → download");
  assert.ok(mainJourney.sharePercent > 0 && mainJourney.sharePercent <= 100);
  const valuedTool = dashboard.toolValueRankings.find((item) => item.toolId === "json-format");
  assert.ok(valuedTool && valuedTool.visitorCount > 0 && valuedTool.userCount > 0 && valuedTool.valueScore > 0);
  assert.ok(valuedTool.stars !== null, "tool rating should require the minimum sample size");
  const yesterday = service.analyticsV3.dashboard(service.analyticsV3.parseRange(new URLSearchParams("preset=yesterday")));
  assert.deepEqual(yesterday.metrics, { visitors: 0, pageViews: 0, toolUses: 0, successes: 0, downloads: 0, averageStayMs: 0, failures: 0, successRate: 0, errorCount: 0 });
  assert.throws(() => service.analyticsV3.parseRange(new URLSearchParams("preset=other")), /时间范围无效/);
  assert.throws(() => service.analyticsV3.parseRange(new URLSearchParams(`start=${shanghaiDate}&end=2026-02-31`)), /有效的开始和结束日期/);
  assert.throws(() => service.analyticsV3.parseRange(new URLSearchParams(`start=${shanghaiDate}&end=2027-01-01`)), /日期范围无效/);
  assertions.push("1,000 anonymous visitors and exactly 10,000 events aggregate to correct PV, tools, success/failure, downloads, regions, sources, trends and online sessions");
  assertions.push("Today/yesterday/custom range parsing and synchronized dashboard filters return expected results");

  const todayResponse = await fetch(`${baseUrl}/api/analytics/admin/v3/dashboard?preset=today`, { headers: { Cookie: cookie } });
  assert.equal(todayResponse.status, 200);
  const apiDashboard = (await todayResponse.json()).data;
  assert.equal(apiDashboard.metrics.visitors, 1000);
  const badRange = await fetch(`${baseUrl}/api/analytics/admin/v3/dashboard?start=${shanghaiDate}&end=2026-02-31`, { headers: { Cookie: cookie } });
  assert.equal(badRange.status, 400);

  const visitorResponse = await fetch(`${baseUrl}/api/analytics/admin/v3/visitors?preset=today&group=all&offset=900&limit=200`, { headers: { Cookie: cookie } });
  assert.equal(visitorResponse.status, 200);
  const visitorData = (await visitorResponse.json()).data;
  assert.equal(visitorData.groupCounts["高价值访客"], 0);
  assert.equal(visitorData.groupCounts["流失访客"], 1);
  assert.equal(visitorData.groupCounts["新访客"], 999);
  assert.equal(visitorData.total, 1000);
  const visitor = visitorData.visitors.find((item) => item.sessions === 2);
  assert.ok(visitor);
  assert.equal(visitor.sessions, 2, "multiple sessions should aggregate under one anonymous visitor");
  const timelineResponse = await fetch(`${baseUrl}/api/analytics/admin/v3/visitors/${visitor.visitorRef}?preset=today`, { headers: { Cookie: cookie } });
  assert.equal(timelineResponse.status, 200);
  const timeline = (await timelineResponse.json()).data;
  assert.equal(timeline.visitor.visitorLabel, visitor.visitorLabel);
  assert.ok(timeline.events.some((item) => item.action === "开始处理"));
  assert.ok(timeline.events.some((item) => item.action === "下载结果"));
  const publicJson = JSON.stringify({ apiDashboard, visitorData, timeline });
  assert.ok(!publicJson.includes("visitorHash") && !publicJson.includes("visitor_hash"));
  assert.ok(!publicJson.includes("sessionId") && !publicJson.includes("session_id"));
  assert.ok(!publicJson.includes(hmacSecret));
  assertions.push("Authenticated visitor list and timeline aggregate repeat Sessions; API responses omit raw visitor hashes and Session IDs");

  const scoreVisitorId = randomUUID();
  const scoreSessionId = randomUUID();
  for (let day = 0; day < 7; day += 1) {
    const at = fixedNow - day * dayMs - 60_000;
    simulateEvent({ visitorId: scoreVisitorId, sessionId: scoreSessionId, toolId: "json-format", type: "page_view", pagePath: "/", at, index: 0, durationMs: day === 0 ? 180_000 : 120_000 });
  }
  for (let index = 0; index < 10; index += 1) {
    const at = fixedNow - (6 - index % 7) * dayMs - 50_000 + index * 100;
    simulateEvent({ visitorId: scoreVisitorId, sessionId: scoreSessionId, toolId: "json-format", type: "tool_start", pagePath: "/tools/json-format", at, index: 0 });
    if (index < 5) {
      simulateEvent({ visitorId: scoreVisitorId, sessionId: scoreSessionId, toolId: "json-format", type: "tool_success", pagePath: "/tools/json-format", at: at + 10, index: 0, durationMs: 1500 });
      simulateEvent({ visitorId: scoreVisitorId, sessionId: scoreSessionId, toolId: "json-format", type: "download", pagePath: "/tools/json-format", at: at + 20, index: 0 });
    }
  }
  const scoreData = service.analyticsV3.visitors(service.analyticsV3.parseRange(new URLSearchParams("preset=30d")), "all", 0, 5000);
  const scoredVisitor = scoreData.visitors.find((item) => item.toolUses === 10 && item.downloads === 5);
  assert.ok(scoredVisitor, "visitor value scoring should aggregate anonymous behavior across the selected date range");
  assert.equal(scoredVisitor.valueScore, 100, "score must honor the configured 30/25/20/15/10 weights at their caps");
  assert.equal(scoredVisitor.valueLevel, "高价值访客");
  assert.equal(scoredVisitor.segment, "高价值访客");
  assert.ok(scoredVisitor.valueReasons.some((reason) => reason.includes("使用工具 10 次")));
  assert.ok(!JSON.stringify(scoredVisitor).includes("visitorHash") && !JSON.stringify(scoredVisitor).includes("sessionId"));
  assertions.push("Anonymous visitor value score matches 30/25/20/15/10 component weights and returns explainable behavior reasons without session identifiers");

  const anomalyVisitorId = randomUUID();
  const anomalySessionId = randomUUID();
  const anomalyAt = fixedNow - 40_000;
  for (let index = 0; index < 30; index += 1) simulateEvent({ visitorId: anomalyVisitorId, sessionId: anomalySessionId, toolId: "json-format", type: "page_view", pagePath: "/tools/json-format", at: anomalyAt + index * 100, index: 2 });
  for (let index = 0; index < 20; index += 1) simulateEvent({ visitorId: anomalyVisitorId, sessionId: anomalySessionId, toolId: "json-format", type: "tool_start", pagePath: "/tools/json-format", at: anomalyAt + 4000 + index * 100, index: 2 });
  for (let index = 0; index < 5; index += 1) simulateEvent({ visitorId: anomalyVisitorId, sessionId: anomalySessionId, toolId: "json-format", type: "tool_fail", pagePath: "/tools/json-format", at: anomalyAt + 7000 + index * 100, index: 2, durationMs: 10 });
  const apiAnomalyVisitorId = randomUUID();
  const apiAnomalySessionId = randomUUID();
  for (let index = 0; index < 5; index += 1) simulateEvent({ visitorId: apiAnomalyVisitorId, sessionId: apiAnomalySessionId, toolId: "json-format", type: "api_error", pagePath: "/tools/json-format", at: anomalyAt + 8000 + index * 100, index: 2 });
  const anomalyDashboard = service.analyticsV3.dashboard(today);
  assert.equal(anomalyDashboard.anomalyCount, 4, "all three aggregate rules should trigger and tool/API failures should aggregate safely");
  assert.ok(anomalyDashboard.anomalies.every((item) => item.count > 0 && item.page && item.type));
  assert.ok(!JSON.stringify(anomalyDashboard.anomalies).includes(anomalySessionId));
  const dailyReport = service.analyticsV3.dailyReport(shanghaiDate);
  assert.equal(dailyReport.reportDate, shanghaiDate);
  assert.ok(dailyReport.metrics.pageViews >= 6031);
  assert.equal(dailyReport.anomalyCount, 4);
  assert.ok(dailyReport.hotTools.length > 0 && dailyReport.insights.length > 0);
  assert.throws(() => service.analyticsV3.dailyReport("2026-02-31"), /日报日期格式无效/);
  const reportResponse = await fetch(`${baseUrl}/api/analytics/admin/v3/daily-report?date=${shanghaiDate}`, { headers: { Cookie: cookie } });
  assert.equal(reportResponse.status, 200);
  assert.equal((await reportResponse.json()).data.reportDate, shanghaiDate);
  const invalidReport = await fetch(`${baseUrl}/api/analytics/admin/v3/daily-report?date=2026-02-31`, { headers: { Cookie: cookie } });
  assert.equal(invalidReport.status, 400);
  assertions.push("Anonymous journey TOP 10, share ratios, tool business-value ratings, five-minute aggregated anomaly rules and real-event daily report are validated");

  const invalidSetting = await fetch(`${baseUrl}/api/analytics/admin/v3/settings`, { method: "POST", headers: { Cookie: cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ retentionDays: 45 }) });
  assert.equal(invalidSetting.status, 400);
  const savedSetting = await fetch(`${baseUrl}/api/analytics/admin/v3/settings`, { method: "POST", headers: { Cookie: cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ retentionDays: 30 }) });
  assert.equal(savedSetting.status, 200);
  assert.equal((await savedSetting.json()).data.retentionDays, 30);
  const ancientHash = visitorHash(randomUUID());
  const ancientSession = randomUUID();
  const ancientAt = fixedNow - 45 * dayMs;
  service.analyticsV3.registerSession({ sessionId: ancientSession, visitorHash: ancientHash, timestamp: ancientAt, pagePath: "/", deviceType: "电脑", operatingSystem: "Windows", browser: "Chrome", countryCode: "unknown", province: "未知", sourceDomain: "", sourcePage: "直接访问" });
  service.analyticsV3.recordEvent({ eventId: randomUUID(), sessionId: ancientSession, visitorHash: ancientHash, createdAt: ancientAt, eventType: "page_view", pagePath: "/", deviceType: "电脑", operatingSystem: "Windows", browser: "Chrome" });
  const staleSession = randomUUID();
  const staleVisitorHash = visitorHash(randomUUID());
  const staleAt = fixedNow - 10 * 60 * 60 * 1000;
  service.analyticsV3.registerSession({ sessionId: staleSession, visitorHash: staleVisitorHash, timestamp: staleAt, pagePath: "/", deviceType: "电脑", operatingSystem: "Windows", browser: "Chrome", countryCode: "unknown", province: "未知", sourceDomain: "", sourcePage: "直接访问" });
  service.analyticsV3.recordEvent({ eventId: randomUUID(), sessionId: staleSession, visitorHash: staleVisitorHash, createdAt: staleAt, eventType: "page_view", pagePath: "/", deviceType: "电脑", operatingSystem: "Windows", browser: "Chrome" });
  service.cleanup();
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE created_at<?").get(fixedNow - 30 * dayMs).count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_sessions WHERE session_id=?").get(staleSession).count, 0, "inactive Session state should expire after 8 hours");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE session_id=?").get(staleSession).count, 1, "pseudonymous behavior events remain only within the configured retention period");
  assertions.push("Retention settings accept only supported periods; inactive Session state expires after 8 hours and event history follows the configured retention");

  const sourceSession = randomUUID();
  const sourceVisitor = randomUUID();
  const collectorResponse = await fetch(`${baseUrl}/api/analytics/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl, "X-Forwarded-For": "198.51.100.77", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0" },
    body: JSON.stringify({
      type: "page_view", visitId: randomUUID(), sessionId: sourceSession, visitorId: sourceVisitor,
      path: "/tools/json-format", toolId: "json-format", toolName: "COLLECTOR_INPUT_SENTINEL",
      sourcePage: "https://partner.example/story?email=PRIVATE_SOURCE_SENTINEL",
      screenSize: "1440x900", language: "zh-CN", userInput: "PRIVATE_INPUT_SENTINEL",
      fileContent: "PRIVATE_FILE_SENTINEL", generatedResult: "PRIVATE_RESULT_SENTINEL",
    }),
  });
  assert.equal(collectorResponse.status, 204, "analytics collection must remain best-effort");
  const sentinelScan = database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE tool_name LIKE '%SENTINEL%' OR source_page LIKE '%SENTINEL%' OR page_path LIKE '%SENTINEL%'").get().count;
  assert.equal(sentinelScan, 0, "collector must not persist tool labels, query strings, or private body fields");
  assert.equal(database.prepare("SELECT source_domain FROM analytics_visits WHERE session_id=?").get(sourceSession).source_domain, "partner.example");
  assert.equal(database.prepare("SELECT ip_hash FROM analytics_visits WHERE session_id=?").get(sourceSession).ip_hash.length, 64);
  const columns = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'analytics_%'").all().flatMap(({ name }) => database.prepare(`PRAGMA table_info(${name})`).all().map((column) => column.name.toLowerCase()));
  for (const forbidden of ["ip", "user_agent", "visitor_id", "password", "email", "phone", "file_content", "user_input", "generated_result"]) assert.ok(!columns.includes(forbidden), `schema must not contain ${forbidden}`);
  const storedText = [
    database.prepare("SELECT group_concat(page_path || ' ' || COALESCE(tool_name,'') || ' ' || source_page, '|') AS text FROM analytics_visits").get().text,
    database.prepare("SELECT group_concat(tool_name || ' ' || tool_id, '|') AS text FROM analytics_tool_usage").get().text,
    database.prepare("SELECT group_concat(tool_name || ' ' || tool_id, '|') AS text FROM analytics_downloads").get().text,
    database.prepare("SELECT group_concat(source_page || ' ' || last_page, '|') AS text FROM analytics_sessions").get().text,
    database.prepare("SELECT group_concat(page_path || ' ' || COALESCE(tool_id,'') || ' ' || source_domain || ' ' || COALESCE(error_code,''), '|') AS text FROM analytics_events").get().text,
  ].filter(Boolean).join("|");
  for (const sentinel of ["OLD_TOOL_NAME_SENTINEL", "OLD_USAGE_NAME_SENTINEL", "OLD_DOWNLOAD_NAME_SENTINEL", "COLLECTOR_INPUT_SENTINEL", "PRIVATE_SOURCE_SENTINEL", "PRIVATE_INPUT_SENTINEL", "PRIVATE_FILE_SENTINEL", "PRIVATE_RESULT_SENTINEL", "198.51.100.77"]) assert.ok(!storedText.includes(sentinel), `stored data must not contain ${sentinel}`);
  assert.ok(!storedText.includes("email=PRIVATE_SOURCE_SENTINEL"));
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE ip_hash IS NOT NULL AND length(ip_hash)<>64").get().count, 0);
  assertions.push("Privacy scan found no raw IP or sensitive identity/input/file/output fields; source host only is retained and hash columns are fixed-length");

  const sessionCheck = await fetch(`${baseUrl}/api/analytics/admin/session`, { headers: { Cookie: cookie } });
  assert.equal(sessionCheck.status, 200);
  const logout = await fetch(`${baseUrl}/api/analytics/admin/logout`, { method: "POST", headers: { Cookie: cookie, Origin: baseUrl } });
  assert.equal(logout.status, 200);
  const rejectedAfterLogout = await fetch(`${baseUrl}/api/analytics/admin/v3/dashboard?preset=today`, { headers: { Cookie: cookie } });
  assert.equal(rejectedAfterLogout.status, 401);
  assertions.push("Admin session and logout protection continue to work with the V3 API");

  console.log("Analytics V3 test: PASS");
  for (const item of assertions) console.log(`- ${item}`);
  console.log("- Simulation totals: 1,000 anonymous visitors, 1,001 anonymous Sessions, 10,000 events");
  } finally {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  if (database?.open) database.close();
  service?.close();
  rmSync(tempDir, { recursive: true, force: true });
}
}

await main();
