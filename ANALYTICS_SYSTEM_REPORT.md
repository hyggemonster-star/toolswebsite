# 匿名使用统计与管理员数据分析系统报告

更新时间：2026-10-13（Asia/Shanghai）
项目：tools-hub-100
当前状态：已部署，可通过正式 HTTPS 域名进入管理员后台。

## 1. 部署架构

- 前台仍为静态导出站点；`/admin` 是静态后台壳，未登录时不返回分析数据。
- 前端以 `sendBeacon` 优先、`fetch keepalive` 兜底，异步发送匿名事件。采集失败会被吞掉，不阻断页面或工具。
- 分析服务作为独立 Node 进程运行，只监听服务器回环地址 `127.0.0.1:39101`。Nginx 将 HTTPS 域名下的 `/api/analytics/` 转发给它；AI API 仍独立监听 `127.0.0.1:39100`。
- 管理员接口要求 HTTPS、同源 POST 和有效后台会话；登录 Cookie 设置 `HttpOnly`、`SameSite=Strict`、`Secure`。公网 IP 的 39090 入口不开放管理员 API，访问会被拒绝。
- 管理员用户名和密码由服务器环境变量 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 读取，不写入前端构建产物或本报告。登录失败按来源哈希限速。

## 2. 数据库结构与迁移

使用本机 SQLite，开启 WAL、外键和 busy timeout。启动时依据 `PRAGMA user_version` 自动创建/迁移表。生产数据库存放在 `/var/lib/tools-hub-100-analytics/analytics.sqlite`，目录限制为服务器本机访问。

| 表 | 主要字段 | 用途 |
|---|---|---|
| `analytics_visits` | `visit_id`, `session_id`, `visited_at`, `page_path`, `tool_id`, `tool_name`, `source_page`, `duration_ms`, `device_type`, `browser`, `operating_system`, `screen_size`, `language`, `country_code`, `ip_hash` | 页面访问、页面停留和匿名访问维度 |
| `analytics_tool_usage` | `event_id`, `session_id`, `tool_id`, `tool_name`, `used_at`, `device_type`, `success`, `duration_ms`, `ip_hash` | 工具操作成功/失败和耗时 |
| `analytics_sessions` | `session_id`, `visitor_hash`, `started_at`, `last_seen_at`, `last_page`, `device_type`, `source_page` | 访问路径和在线状态计算 |

时间、工具、会话字段建有查询索引。保留期默认 90 天；服务启动时清理一次，随后每 6 小时清理过期访问、工具和会话记录。

## 3. 接口

| 接口 | 访问范围 | 说明 |
|---|---|---|
| `POST /api/analytics/collect` | 公开、限速 | 接收 `page_view`、`page_duration`、`tool_usage` 和 `heartbeat`；无论采集是否成功均返回 204，不回传分析内容 |
| `GET /api/analytics/admin/session` | HTTPS 后台 | 检查当前登录状态 |
| `POST /api/analytics/admin/login` | HTTPS、同源 | 校验环境变量中的管理员凭据，成功后发放短期会话 Cookie |
| `POST /api/analytics/admin/logout` | HTTPS、同源 | 使当前后台会话失效 |
| `GET /api/analytics/admin/dashboard?days=1\|7\|30` | HTTPS、后台会话 | 返回统计卡片、排行、来源、路径、流失页、在线人数及最近活动 |

生产 Nginx 对分析路由关闭访问日志。后台端点在未登录时返回 401；通过公网 IP 的 HTTP 入口访问后台 API 会被拒绝。

## 4. 隐私与数据处理

- 原始 IP 只在服务内存中短暂读取，用服务器密钥生成按日变化的 HMAC-SHA256；SQLite 仅保存 HMAC 哈希。访客去重仅用于当日统计，同一网络出口的多人可能合并计算。
- 不收集工具输入、工具输出、文件内容、文件名、查询参数或完整 User-Agent。浏览器、操作系统和设备类型在服务端由 User-Agent 即时归类后保存分类结果。
- 屏幕宽高按约 100 像素分档；语言仅保存有限长度的语言标识；来源只保留站内路径或外部域名，不保留来源 URL 查询参数。
- 随机标签页会话 ID 用于计算访问路径，不关联登录账号，不用于跨标签页识别。隐私页提供关闭匿名统计的开关，关闭状态保存在当前浏览器。
- 国家/地区字段和后台分布图已预留，但生产环境目前没有配置可信离线 GeoIP 数据库或受信任的代理国家头，因此当前值为“未知”。不会把原始 IP 发送给外部定位服务。若要展示地区，需要后续配置经核验、可本地查询的数据源。
- 隐私说明已更新至 `/privacy`，列明匿名统计范围、哈希、保留期和关闭方式。

## 5. 后台指标

`/admin` 提供今日独立访客数、今日 PV、昨日 PV 对比、今日工具操作数、热门工具 TOP10（成功/失败数及平均耗时）、设备与浏览器分布、来源排行、访问路径排行、最后访问页排行、近 5 分钟在线人数和最近活动。后台每 20 秒刷新一次；前台在线心跳每 60 秒发送一次。

独立访客使用每日 IP HMAC 统计；路径基于匿名标签页会话。实时人数是近 5 分钟内发送心跳的会话数，是估算值，不等同于精确同时在线人数。

## 6. 验收结果

### 100 会话模拟

使用隔离的临时 SQLite 数据库模拟 100 个会话（50 个移动设备、50 个桌面设备），发送 300 次页面访问和 100 次工具操作，并对照预设数据验证后台汇总：

- 独立访客：100；页面访问：300；工具操作：100。
- 工具结果：成功 96、失败 4；图片压缩 60 次、JSON 格式化 40 次。
- 移动/桌面会话数、Chrome/Safari 浏览器访问数、访问路径、最后访问页、耗时和最近活动均与测试数据一致。
- 验证了未登录拒绝、登录限速与同源检查、退出登录、SQLite 无原始 IP 字段、90 天历史清理。
- 结果：`npm run analytics:acceptance` 通过。

此模拟覆盖采集与聚合接口，不代表 100 台真实设备的长时间负载测试。

### 构建与公网检查

- `npm run lint`：通过。
- `npm run build`：通过，包含 `/admin` 静态页面。
- `npm run smoke -- https://starai.asia`：27/27 检查通过。
- `npm run smoke -- http://106.12.81.63:39090`：27/27 检查通过。
- 两个入口的首页、工具库、分类、代表工具、PDF worker、隐私/条款页、`robots.txt`、`sitemap.xml`、后台页面和采集接口均符合预期。HTTPS 下未登录后台 API 为 401；公网 IP 下管理员 API 被拒绝；AI 公共路由仍为 404。
- 浏览器自动化在打开后台后发生超时，因此本次没有确认登录后的实际浏览器视觉效果及真机触控体验；接口和静态页面检查均已通过。

## 7. 当前结论与后续建议

匿名采集、SQLite 持久化、登录保护、后台聚合和 90 天清理已部署，可供受限运营分析使用。地区分布当前不可用（显示“未知”），管理员页面仍建议人工做一次真实浏览器登录和手机尺寸检查。其余分析失败不会影响公开工具。
