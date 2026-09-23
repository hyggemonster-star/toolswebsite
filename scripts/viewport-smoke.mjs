const baseInput = process.argv[2] || process.env.SMOKE_BASE_URL || "http://106.12.81.63";
const baseUrl = baseInput.replace(/\/+$/, "");
const viewports = [
  ["mobile", 390, 844],
  ["tablet", 768, 1024],
  ["laptop", 1280, 800],
  ["desktop", 1440, 900],
];
const routes = ["/", "/tools", "/tools/json-format", "/tools/image-compress", "/tools/xhs-title-generator"];

try {
  const parsed = new URL(baseUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('只支持 http 或 https 地址');
} catch (error) {
  console.error(`FAIL invalid base URL: ${error instanceof Error ? error.message : '地址无效'}`);
  process.exit(1);
}

console.log("Viewport matrix: 390x844, 768x1024, 1280x800, 1440x900");
console.log("Mode: HTTP fallback; no browser automation dependency is installed, so this verifies route delivery for each viewport target rather than claiming DOM geometry.");

let failures = 0;
for (const [name, width, height] of viewports) {
  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    try {
      const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
      const body = await response.text();
      const passed = response.status >= 200 && response.status < 300 && /<html[\s>]/i.test(body) && /<h1[\s>]/i.test(body);
      console.log(`${passed ? "PASS" : "FAIL"} ${name} ${width}x${height} ${response.status} ${route}`);
      if (!passed) failures += 1;
    } catch {
      failures += 1;
      console.log(`FAIL ${name} ${width}x${height} NETWORK ${route}`);
    }
  }
}

console.log(failures ? `\n${failures} viewport smoke check(s) failed for ${baseUrl}` : `\nHTTP fallback checks passed for ${baseUrl}`);
process.exitCode = failures ? 1 : 0;
