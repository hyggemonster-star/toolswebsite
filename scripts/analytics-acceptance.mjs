import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:net";

const requireAnalytics = createRequire(new URL("../ai-api/analytics.mjs", import.meta.url));
const Database = requireAnalytics("better-sqlite3");

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "tools-hub-analytics-"));
const databasePath = path.join(temporaryDirectory, "analytics.sqlite");
const username = "test-admin";
const password = randomBytes(32).toString("base64url");
const analyticsSecret = randomBytes(32).toString("hex");
const dayMs = 24 * 60 * 60 * 1000;
const shanghaiToday = Date.parse(`${new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)}T00:00:00+08:00`);
const legacyVisitAt = shanghaiToday - 8 * dayMs + 60_000;

const legacyDb = new Database(databasePath);
legacyDb.exec(`
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
  PRAGMA user_version = 1;
`);
const legacySessionId = randomUUID();
legacyDb.prepare("INSERT INTO analytics_visits VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
  .run(randomUUID(), legacySessionId, legacyVisitAt, "/tools/image-compress", "image-compress", "图片压缩", "直接访问", 1800, "电脑", "Chrome", "Windows", "1400x900", "zh-CN", "unknown", "b".repeat(64));
legacyDb.prepare("INSERT INTO analytics_tool_usage VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
  .run(randomUUID(), legacySessionId, "image-compress", "图片压缩", legacyVisitAt + 1000, "电脑", 1, 2200, "b".repeat(64));
legacyDb.prepare("INSERT INTO analytics_sessions VALUES (?, ?, ?, ?, ?, ?, ?)")
  .run(legacySessionId, "b".repeat(64), legacyVisitAt, legacyVisitAt, "/tools/image-compress", "电脑", "直接访问");
legacyDb.close();

const portProbe = createServer();
const port = await new Promise((resolve, reject) => {
  portProbe.once("error", reject);
  portProbe.listen(0, "127.0.0.1", () => {
    const address = portProbe.address();
    resolve(typeof address === "object" && address ? address.port : 0);
    portProbe.close();
  });
});

const child = spawn(process.execPath, ["ai-api/analytics-server.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    ANALYTICS_DB_PATH: databasePath,
    ANALYTICS_IP_HASH_SECRET: analyticsSecret,
    ANALYTICS_ALLOW_INSECURE_ADMIN: "true",
    ADMIN_USERNAME: username,
    ADMIN_PASSWORD: password,
  },
  stdio: "ignore",
});
let database;

const baseUrl = `http://127.0.0.1:${port}`;
const origin = baseUrl;
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForServer() {
  const end = Date.now() + 10000;
  while (Date.now() < end) {
    try {
      const response = await fetch(`${baseUrl}/api/analytics/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "probe", sessionId: randomUUID() }),
      });
      if (response.status === 204) return;
    } catch {
      await sleep(100);
    }
  }
  throw new Error("analytics test server did not start");
}

function userAgent(index) {
  if (index < 50) {
    return index % 2 === 0
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36";
  }
  return index < 85
    ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    : "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
}

async function collect(event, index) {
  const response = await fetch(`${baseUrl}/api/analytics/collect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "X-Forwarded-For": `198.51.100.${index + 1}`,
      "User-Agent": userAgent(index),
    },
    body: JSON.stringify(event),
  });
  assert.equal(response.status, 204, "collection must not block or expose failure state");
}

let output = "";
const assertions = [];
try {
  child.stderr?.on("data", (chunk) => { output += chunk.toString(); });
  await waitForServer();

  const unauthorized = await fetch(`${baseUrl}/api/analytics/admin/dashboard?days=1`);
  assert.equal(unauthorized.status, 401, "dashboard must reject unauthenticated requests");
  const unauthenticatedSession = await fetch(`${baseUrl}/api/analytics/admin/session`);
  assert.equal(unauthenticatedSession.status, 401, "session status endpoint must not be public");
  assertions.push("Unauthenticated dashboard API rejected");

  const csrf = await fetch(`${baseUrl}/api/analytics/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(csrf.status, 403, "admin login must reject cross-origin or origin-less POSTs");
  assertions.push("Admin login requires same-origin request");

  const badLogin = await fetch(`${baseUrl}/api/analytics/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ username, password: "incorrect-password" }),
  });
  assert.equal(badLogin.status, 401, "invalid credentials must fail");

  const login = await fetch(`${baseUrl}/api/analytics/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(login.status, 200, "configured administrator must be able to sign in");
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("tools_hub_admin="), "login must issue an HttpOnly session cookie");
  assertions.push("Admin login, invalid password, and session cookie verified");

  const fixtures = Array.from({ length: 100 }, (_, index) => ({
    index,
    sessionId: randomUUID(),
    visitorId: randomUUID(),
    toolId: index < 60 ? "image-compress" : "json-format",
    toolName: index < 60 ? "图片压缩" : "JSON 格式化",
    ip: `198.51.100.${index + 1}`,
  }));
  database = new Database(databasePath);
  const seedReturning = database.prepare("INSERT INTO analytics_visitors(visitor_hash, first_seen_at, last_seen_at) VALUES (?, ?, ?)");
  for (const fixture of fixtures.slice(0, 30)) {
    const visitorHash = createHmac("sha256", analyticsSecret).update(`visitor-id\0${fixture.visitorId}`).digest("hex");
    seedReturning.run(visitorHash, shanghaiToday - dayMs + 60_000, shanghaiToday - dayMs + 60_000);
  }

  for (const fixture of fixtures) {
    const pages = [
      {
        path: "/",
        sourcePage: fixture.index < 25 ? "https://www.baidu.com/s?wd=fixture" : fixture.index < 50 ? "https://weixin.qq.com/open" : fixture.index < 75 ? "https://partner.example/ref" : "",
        toolId: null,
        toolName: null,
      },
      { path: fixture.toolId === "image-compress" ? "/categories/image" : "/categories/developer", sourcePage: "/", toolId: null, toolName: null },
      { path: `/tools/${fixture.toolId}`, sourcePage: fixture.toolId === "image-compress" ? "/categories/image" : "/categories/developer", toolId: fixture.toolId, toolName: fixture.toolName },
    ];
    for (const [pageIndex, page] of pages.entries()) {
      const visitId = randomUUID();
      await collect({
        type: "page_view",
        visitId,
        sessionId: fixture.sessionId,
        visitorId: fixture.visitorId,
        path: page.path,
        toolId: page.toolId,
        toolName: page.toolName,
        sourcePage: page.sourcePage,
        screenSize: fixture.index < 50 ? "390x844" : "1440x900",
        language: fixture.index % 3 === 0 ? "zh-CN" : "en-US",
        // Deliberately sent as an unrecognized property; the server must ignore it.
        privateInputSentinel: "NEVER_STORE_THIS",
      }, fixture.index);
      await collect({ type: "page_duration", visitId, sessionId: fixture.sessionId, durationMs: 1200 + pageIndex * 100 }, fixture.index);
      await sleep(2);
    }
    await collect({
      type: "tool_usage",
      eventId: randomUUID(),
      sessionId: fixture.sessionId,
      visitorId: fixture.visitorId,
      toolId: fixture.toolId,
      toolName: fixture.toolName,
      success: fixture.index % 25 !== 0,
      durationMs: fixture.toolId === "image-compress" ? 3200 : 800,
    }, fixture.index);
    if ((fixture.index < 63 && fixture.index !== 62 && fixture.index % 25 !== 0) || fixture.index === 99) {
      await collect({
        type: "tool_download",
        eventId: randomUUID(),
        sessionId: fixture.sessionId,
        visitorId: fixture.visitorId,
        toolId: fixture.toolId,
        toolName: fixture.toolName,
      }, fixture.index);
    }
  }
  assertions.push("100 simulated users sent 300 page views, 100 tool runs, and 60 result downloads across mobile and desktop profiles");

  const dashboardResponse = await fetch(`${baseUrl}/api/analytics/admin/dashboard?days=1`, { headers: { Cookie: cookie } });
  assert.equal(dashboardResponse.status, 200);
  const dashboard = (await dashboardResponse.json()).data;
  assert.equal(dashboard.metrics.todayVisitors, 100);
  assert.equal(dashboard.metrics.todayPv, 300);
  assert.equal(dashboard.metrics.todayToolUses, 100);
  assert.equal(dashboard.metrics.todaySuccessCount, 96);
  assert.equal(dashboard.metrics.todayAverageStayMs, 1300);
  assert.equal(dashboard.metrics.todayNewUsers, 70);
  assert.equal(dashboard.metrics.todayReturningUsers, 30);
  assert.equal(dashboard.online, 100);
  assert.equal(dashboard.topTools[0].toolId, "image-compress");
  assert.equal(dashboard.topTools[0].uses, 60);
  assert.equal(dashboard.topTools[0].successCount, 57);
  assert.equal(dashboard.topTools[0].failureCount, 3);
  assert.equal(dashboard.topTools[0].visits, 60);
  assert.equal(dashboard.topTools[0].successRate, 0.95);
  assert.equal(dashboard.topTools[0].averageDurationMs, 3200);
  assert.ok(dashboard.topTools[0].valueScore >= 0 && dashboard.topTools[0].valueScore <= 5);
  assert.equal(dashboard.topTools[1].toolId, "json-format");
  assert.equal(dashboard.topTools[1].uses, 40);
  assert.equal(dashboard.topTools[1].successCount, 39);
  assert.equal(dashboard.topTools[1].failureCount, 1);
  assert.deepEqual(Object.fromEntries(dashboard.devices.map((item) => [item.label, item.count])), { "手机": 150, "电脑": 150 });
  assert.deepEqual(Object.fromEntries(dashboard.operatingSystems.map((item) => [item.label, item.count])), { Android: 75, iOS: 75, Windows: 105, macOS: 45 });
  assert.deepEqual(Object.fromEntries(dashboard.browsers.map((item) => [item.label, item.count])), { "Chrome": 180, "Safari": 120 });
  assert.deepEqual(Object.fromEntries(dashboard.screenSizes.map((item) => [item.label, item.count])), { "400x800": 150, "1400x900": 150 });
  assert.deepEqual(dashboard.countries, [{ label: "未知地区", count: 300 }]);
  assert.deepEqual(Object.fromEntries(dashboard.sources.map((item) => [item.label, item.count])), { "站内导航": 200, "搜索引擎": 25, "社交平台": 25, "外链": 25, "直接访问": 25 });
  assert.deepEqual(dashboard.funnel.map((item) => item.count), [100, 100, 100, 100, 96, 60]);
  assert.equal(dashboard.paths.reduce((total, item) => total + item.count, 0), 100);
  assert.ok(dashboard.paths.some((item) => item.label.includes("图片处理分类")));
  assert.equal(dashboard.exitPages[0].path, "图片压缩");
  assert.ok(dashboard.activity.some((item) => item.label.includes("处理成功 · JSON 格式化")));
  assert.ok(dashboard.activity.some((item) => item.kind === "download" && item.page === "JSON 格式化"));
  assertions.push("Dashboard KPIs, new/returning users, tool score, funnel, source, device/OS/browser/screen, paths, and activity match the fixture");

  const columns = database.prepare("PRAGMA table_info(analytics_visits)").all().map((column) => column.name);
  assert.ok(columns.includes("ip_hash"));
  assert.ok(columns.includes("visitor_hash") && columns.includes("source_category"));
  assert.ok(!columns.includes("ip") && !columns.includes("user_agent") && !columns.includes("visitor_id"));
  assert.equal(database.pragma("user_version", { simple: true }), 2);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE page_path = 'NEVER_STORE_THIS'").get().count, 0);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE length(ip_hash) = 64").get().count, 301);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE duration_ms > 0").get().count, 301);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE visit_id IS NOT NULL AND visitor_hash IS NOT NULL").get().count, 300);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_downloads").get().count, 60);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE source_page LIKE '%wd=fixture%'").get().count, 0);
  const rangeDashboardResponse = await fetch(`${baseUrl}/api/analytics/admin/dashboard?days=7`, { headers: { Cookie: cookie } });
  const rangeDashboard = (await rangeDashboardResponse.json()).data;
  assert.equal(rangeDashboard.rangeDays, 7);
  assert.equal(rangeDashboard.topTools[0].trendPercent, 5900);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visitors WHERE length(visitor_hash) = 64").get().count, 100);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE visit_id = (SELECT visit_id FROM analytics_visits WHERE visited_at = ? LIMIT 1)").get(legacyVisitAt).count, 1);
  assertions.push("SQLite migration from schema v1 preserved legacy rows; identifiers are hashed, query strings and private fields are absent");

  const logout = await fetch(`${baseUrl}/api/analytics/admin/logout`, { method: "POST", headers: { Cookie: cookie, Origin: origin } });
  assert.equal(logout.status, 200);
  const invalidated = await fetch(`${baseUrl}/api/analytics/admin/dashboard?days=1`, { headers: { Cookie: cookie } });
  assert.equal(invalidated.status, 401, "logout must invalidate the session");
  assertions.push("Logout invalidates the admin session");

  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
  const { createAnalyticsService } = await import("../ai-api/analytics.mjs");
  const cleanupService = createAnalyticsService({ dbPath: databasePath, env: { ANALYTICS_IP_HASH_SECRET: "temporary-cleanup-key" } });
  database.prepare("INSERT OR IGNORE INTO analytics_visits(visit_id, session_id, visited_at, page_path, source_page, duration_ms, device_type, browser, operating_system, screen_size, language, country_code, ip_hash) VALUES (?, ?, ?, '/', '直接访问', 0, '电脑', 'Chrome', 'Linux', '1000x700', 'zh-CN', 'unknown', ?)")
    .run(randomUUID(), randomUUID(), Date.now() - 100 * 24 * 60 * 60 * 1000, "a".repeat(64));
  cleanupService.cleanup();
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM analytics_visits WHERE visited_at < ?").get(Date.now() - 90 * 24 * 60 * 60 * 1000).count, 0);
  cleanupService.close();
  database.close();
  database = undefined;
  assertions.push("Retention cleanup removes records older than 90 days");

  console.log(`100-user analytics acceptance: PASS`);
  for (const assertion of assertions) console.log(`- ${assertion.trim()}`);
  console.log("- Exact totals: 100 visitors, 300 page views, 100 tool runs, 96 success, 60 downloads, 70 new and 30 returning users; 50 mobile and 50 desktop sessions");
} catch (error) {
  if (child.exitCode === null) child.kill("SIGTERM");
  if (child.exitCode === null) await new Promise((resolve) => child.once("exit", resolve));
  if (database?.open) database.close();
  console.error(error instanceof Error ? error.stack : "analytics acceptance failed");
  if (output.trim()) console.error(output.trim());
  process.exitCode = 1;
} finally {
  if (database?.open) database.close();
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
