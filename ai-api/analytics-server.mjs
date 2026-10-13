import http from "node:http";
import { createAnalyticsService } from "./analytics.mjs";

const PORT = Number(process.env.PORT || 39101);
const service = createAnalyticsService();
try {
  service.cleanup();
} catch {
  // A cleanup failure must not prevent the collector from starting.
}
const cleanupTimer = setInterval(() => {
  try {
    service.cleanup();
  } catch {
    // Retention cleanup is best effort; collection remains available.
  }
}, 6 * 60 * 60 * 1000);
cleanupTimer.unref();
const server = http.createServer((request, response) => {
  void service.handle(request, response).catch(() => {
    if (!response.headersSent) {
      response.statusCode = 503;
      response.setHeader("Cache-Control", "no-store");
      response.end();
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`tools-hub-100-analytics listening on 127.0.0.1:${PORT}`);
});

function closeServer() {
  clearInterval(cleanupTimer);
  server.close(() => {
    service.close();
    process.exit(0);
  });
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
