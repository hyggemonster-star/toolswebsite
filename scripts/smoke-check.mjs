const baseInput = process.argv[2] || process.env.SMOKE_BASE_URL || "http://106.12.81.63";
const baseUrl = baseInput.replace(/\/+$/, "");

try {
  const parsed = new URL(baseUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('只支持 http 或 https 地址');
} catch (error) {
  console.error(`FAIL invalid base URL: ${error instanceof Error ? error.message : '地址无效'}`);
  process.exit(1);
}

const routes = [
  "/",
  "/tools",
  "/categories/pdf-office",
  "/categories/image",
  "/categories/video-audio",
  "/categories/creator",
  "/categories/ai",
  "/categories/developer",
  "/categories/daily",
  "/tools/json-format",
  "/tools/image-compress",
  "/tools/pdf-to-word",
  "/tools/xhs-title-generator",
  "/pdf.worker.min.mjs",
  "/robots.txt",
  "/sitemap.xml",
  "/api/ai/health",
];

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { redirect: "manual", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

let failures = 0;
for (const route of routes) {
  const url = `${baseUrl}${route}`;
  try {
    const response = await fetchWithTimeout(url);
    const body = route === "/api/ai/health" ? await response.text() : "";
    const statusOk = response.status >= 200 && response.status < 300;
    const healthOk = route !== "/api/ai/health" || /"arkConfigured"\s*:\s*true/.test(body);
    const workerType = route === "/pdf.worker.min.mjs" ? response.headers.get("content-type") || "" : "";
    const workerOk = route !== "/pdf.worker.min.mjs" || /javascript|ecmascript/i.test(workerType);
    const passed = statusOk && healthOk && workerOk;
    console.log(`${passed ? "PASS" : "FAIL"} ${response.status} ${route}${workerType ? ` (${workerType.split(";")[0]})` : ""}`);
    if (!passed) failures += 1;
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${(error instanceof Error && error.name === "AbortError") ? "TIMEOUT" : "NETWORK"} ${route}`);
  }
}

console.log(failures ? `\n${failures} smoke check(s) failed for ${baseUrl}` : `\nAll smoke checks passed for ${baseUrl}`);
process.exitCode = failures ? 1 : 0;
