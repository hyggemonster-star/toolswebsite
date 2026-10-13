import { randomUUID } from "node:crypto";

const baseInput = process.argv[2] || process.env.SMOKE_BASE_URL || "http://106.12.81.63:39090";
const baseUrl = baseInput.replace(/\/+$/, "");

let parsedBase;
try {
  parsedBase = new URL(baseUrl);
  if (!["http:", "https:"].includes(parsedBase.protocol)) throw new Error("只支持 http 或 https 地址");
} catch (error) {
  console.error(`FAIL invalid base URL: ${error instanceof Error ? error.message : "地址无效"}`);
  process.exit(1);
}

const protectedStatus = parsedBase.protocol === "https:" ? 401 : 403;
const checks = [
  { path: "/", expected: 200 },
  { path: "/tools", expected: 200 },
  { path: "/categories/pdf-office", expected: 200 },
  { path: "/categories/image", expected: 200 },
  { path: "/categories/video-audio", expected: 200 },
  { path: "/categories/creator", expected: 200 },
  { path: "/categories/developer", expected: 200 },
  { path: "/categories/daily", expected: 200 },
  { path: "/privacy", expected: 200 },
  { path: "/terms", expected: 200 },
  { path: "/disclaimer", expected: 200 },
  { path: "/contact", expected: 200 },
  { path: "/file-processing", expected: 200 },
  { path: "/tools/json-format", expected: 200 },
  { path: "/tools/image-compress", expected: 200 },
  { path: "/tools/pdf-to-word", expected: 200 },
  { path: "/pdf.worker.min.mjs", expected: 200, checkWorker: true },
  { path: "/admin", expected: 200, contains: "正在检查登录状态" },
  { path: "/robots.txt", expected: 200, contains: "/admin" },
  { path: "/sitemap.xml", expected: 200, excludes: ["/admin", "ai-rewrite", "xhs-title-generator"] },
  { path: "/api/analytics/admin/session", expected: protectedStatus },
  { path: "/api/analytics/admin/dashboard?days=1", expected: protectedStatus },
  { path: "/api/ai/health", expected: 404 },
  { path: "/tools/ai-rewrite", expected: 404 },
  { path: "/tools/xhs-title-generator", expected: 404 },
  { path: "/generation-notice", expected: 404 },
  { path: "/api/analytics/collect", expected: 204, method: "POST" },
];

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { redirect: "manual", signal: controller.signal, ...options });
  } finally {
    clearTimeout(timeout);
  }
}

let failures = 0;
for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const response = await fetchWithTimeout(url, check.method === "POST" ? {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ type: "smoke_probe", sessionId: randomUUID() }),
    } : {});
    const body = ["/robots.txt", "/sitemap.xml", "/admin"].includes(check.path) ? await response.text() : "";
    const statusOk = response.status === check.expected;
    const textOk = !check.contains || body.includes(check.contains);
    const excludedOk = !check.excludes || check.excludes.every((term) => !body.includes(term));
    const workerType = check.checkWorker ? response.headers.get("content-type") || "" : "";
    const workerOk = !check.checkWorker || /javascript|ecmascript/i.test(workerType);
    const passed = statusOk && textOk && excludedOk && workerOk;
    console.log(`${passed ? "PASS" : "FAIL"} ${response.status} ${check.path}${workerType ? ` (${workerType.split(";")[0]})` : ""}`);
    if (!passed) failures += 1;
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${(error instanceof Error && error.name === "AbortError") ? "TIMEOUT" : "NETWORK"} ${check.path}`);
  }
}

console.log(failures ? `\n${failures} smoke check(s) failed for ${baseUrl}` : `\nAll ${checks.length} smoke checks passed for ${baseUrl}`);
process.exitCode = failures ? 1 : 0;
