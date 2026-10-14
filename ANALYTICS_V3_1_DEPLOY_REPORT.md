# Analytics V3.1 商业运营增强与生产部署报告

- **项目：** tools-hub-100
- **部署日期：** 2026-10-14（Asia/Shanghai，约 15:45）
- **生产入口：** [https://starai.asia/admin](https://starai.asia/admin)
- **状态：** 已部署；服务、管理员 API 与公网 smoke 验证通过；真实浏览器交互验收仍待完成。

## 完成内容

- Analytics V3.1 已发布到生产。新增匿名访客价值评分与行为原因、匿名访问路径 TOP 10、工具商业价值评分和星级、五分钟异常访问聚合、每日运营报告，以及九项后台左侧导航。
- 访客价值按工具使用 30%、下载 25%、访问频率 20%、停留时间 15%、成功完成 10% 计算。分数只从所选范围的匿名事件派生，后台以 A 编号展示，不返回 visitor hash 或原始 Session ID。
- 工具价值排行展示匿名访问人数、使用人数、成功数、下载数、成功率、平均处理耗时和评分。使用不足 5 次时不显示星级，降低小样本误读。
- 异常规则按匿名 Session 的五分钟窗口检测：页面浏览 ≥30、工具开始 ≥20、工具或 API 失败 ≥5。接口输出只包含时间、类别、页面/工具及聚合数量；命中是筛查信号，不是恶意访问结论。
- 运营日报根据现有事件动态汇总，不保存额外访客画像或日报副本，不生成演示数据。

## 数据库与隐私

- V3.1 沿用 SQLite schema v3，没有新增表或列。评分、路径、商业价值、异常和日报均实时从现有匿名事件计算。
- 生产数据库 `PRAGMA user_version=3`，`analytics_events` 表存在；备份快照和部署后数据库的 `PRAGMA integrity_check` 均返回 `ok`。
- 未新增姓名、邮箱、手机号、原始 IP、精确位置、设备唯一标识、工具输入、上传文件或生成结果字段。地区与设备采集边界沿用 V3。
- 生产模式启动时要求固定 `ANALYTICS_IP_HASH_SECRET` 至少 32 字节。本次确认该值已在服务进程和 PM2 保存环境中配置，没有输出或写入其内容；PM2 状态文件权限为 600。

## Git 与部署记录

- 功能提交：`67c86a1 feat: upgrade analytics dashboard v3.1`。
- 公网 smoke 断言修正：`d73ded1 test: align analytics admin smoke marker`。
- 视口 smoke 路由修正：`6659d09 test: refresh viewport smoke routes`。以上提交已推送至 `origin/main`，工作区保持干净。
- 发布文档提交：`4e3bf70 docs: record analytics v3.1 production deployment`；随后整理提交：`1551bfc docs: remove report whitespace`。上述提交均已推送至 `origin/main`。
- 部署前回滚备份：`/www/backup/tools-hub-before-analytics-v31-20261014-154116`。包含静态站、Analytics API 与配置、Nginx 配置、PM2 状态和一致性 SQLite 快照。备份目录权限 700，备份文件权限 600。
- 本地 Next.js 静态构建生成 94 个页面、494 个导出文件。494 个静态文件已追加同步至 `/www/wwwroot/tools-hub-100`，保留原哈希资源；Analytics 服务目录只更新 `analytics.mjs` 与 `analytics-v3.mjs`。
- 后端依赖未变更；服务器 Node.js 为 22.23.2，已安装的 `better-sqlite3@13.0.3` 核验通过，因此没有执行无必要的依赖重装。
- 未修改 Nginx、80/443、域名、AI API 代码或其他 PM2 服务。只重启 `tools-hub-100-analytics`，保留原进程环境并设为 `NODE_ENV=production`。

## 测试与线上验收

- `npm test`：通过。隔离测试数据库模拟 1,000 个匿名访客、1,001 个 Session 和 10,000 个事件；覆盖评分权重、路径占比、价值榜、异常门槛、日报日期校验、管理员鉴权和隐私字段过滤。模拟数据仅在本地临时测试库中使用，不进入生产库。
- `npm run lint`：通过。
- `npm run build`：通过，Next.js 生成 94 个静态页面。
- `npm run smoke -- https://starai.asia`：27/27 通过，覆盖首页、工具库、分类、代表工具、PDF worker、后台、robots、sitemap、Analytics 鉴权、公开 AI 路由关闭状态和 collector 端点。
- `npm run viewport-smoke -- https://starai.asia`：20/20 HTTP fallback 检查通过，检查 390×844、768×1024、1280×800、1440×900 四种目标尺寸及五个页面路由。该脚本检查路由与 HTML 返回，不代表真实浏览器的 DOM 几何或点击验收。
- 通过 HTTPS 公网入口进行管理员 API 认证：登录 200；Secure、HttpOnly Cookie 通过；Dashboard 200；日报 200；登出 200；登出后 Session 401。Dashboard 响应未发现内部 visitor hash 或 Session ID。未登录访问返回 401。
- 公网 HTTPS `/admin` 返回 200；公网 IP 的静态 `/admin` 也返回 200。Analytics 与 AI API 分别 online 且只监听 `127.0.0.1:39101` 与 `127.0.0.1:39100`；Nginx active，`nginx -t` 通过；站点仍监听 39090。
- HTTPS smoke 的 `/api/analytics/collect` 探针返回预期 204；探针事件类型不属于采集白名单，不产生生产统计数据。因此本次没有插入生产模拟事件，也没有将其当作“事件成功写入”的证据。

## 尚未完成的验收

- 本次 Computer Use 无法可靠确定活动浏览器 URL，浏览器控制工具停止运行。因此没有完成真实 Chrome、Edge 或手机浏览器的登录界面、移动布局、点击工具、处理文件和下载闭环；20/20 只是 HTTP fallback。
- 没有用真实浏览器执行一次工具行为来确认生产事件计数实时变化。生产 API 登录和 Dashboard 已通过服务端 HTTPS 真实认证，但这不替代浏览器交互与真实行为写入验收。
- Analytics 管理后台要求 HTTPS。`http://106.12.81.63:39090/admin` 页面可打开，但其 Analytics Session API 被 Nginx 返回 403；请从 `https://starai.asia/admin` 登录。公网 IP 普通工具页入口仍然可用。

## 当前结论与下一步

- Analytics V3.1 已部署，数据库完整性、Analytics API、管理员鉴权和 HTTPS 公网 smoke 正常。
- 暂不把这次结果表述为完整的浏览器端生产验收。下一步需在 Chrome、Edge 和真实手机上访问 HTTPS 后台，检查登录、左侧导航、移动排版；再用一个真实匿名浏览器会话访问工具、执行操作并下载结果，确认生产统计随真实行为更新。
- 本报告没有记录服务器密码、管理员账号/密码、API Key、`.env` 内容、SSH 私钥或哈希密钥值。

## 安全审计 IP 例外策略更新（2026-10-14，约 19:03 Asia/Shanghai）

### 实施与数据边界

- V3.1 后续更新已部署。常规产品分析继续保持匿名；原始 IP 仅在安全阈值触发后写入独立 SQLite `analytics_security_events` 表，不关联访客或 Session。安全规则为五分钟页面访问 ≥60、工具开始 ≥40、失败事件 ≥10、无效统计请求 ≥20，以及同一来源与采集 Session 超过 300 次/分钟的速率限制告警。
- 记录只含 IP、发生时间/窗口、规则、清理后的页面/工具标识及命中次数；后台接口要求 HTTPS 管理员会话。固定保留 30 天，最多 50,000 条，过期自动删除。后台提供复制 IP，由管理员人工评估后决定是否封禁；不自动执行封禁。
- Analytics SQLite schema 升至 v4。生产 `integrity_check=ok`，目录权限 `700`、主库及 WAL/SHM 权限 `600`，服务进程 `umask 077`。安全事件表当前为 0 条真实记录，没有插入生产演示数据。
- 隐私页说明此安全例外、用途、规则、期限与管理员范围。没有采集输入、文件、生成结果、身份、Session 或设备指纹。

### 访问日志与生产变更

- 关闭 Tools Hub 的 39090、`starai.asia` HTTPS 主站及 HTTP 跳转虚拟主机的普通 access log；端口、路由、证书和代理目标保持原状。专属全量访问日志 `/www/wwwlogs/starai-tools.access.log` 已在重载后删除。
- Tools Hub 专属 Nginx 错误日志权限收紧为 `600`，按 7 天轮转。其他站点和共享日志配置未更改。共享 `/var/log/nginx/access.log` 的历史记录按原有每日 14 份策略自然过期；新 Tools Hub 请求不再写入对应虚拟主机 access log。
- 部署前备份：`/www/backup/tools-hub-before-ip-security-20261014-1900`，目录 `700`、文件 `600`；包括静态站、Analytics 源文件、Nginx 配置及一致性 SQLite 快照。备份数据库 `integrity_check=ok`。
- Analytics PM2 online，仍只监听 `127.0.0.1:39101`；AI API 未改且只监听 `127.0.0.1:39100`。Nginx 配置校验与平滑重载通过。

### 验证与限制

- Git 提交 `ec58536 feat: add restricted IP security audit` 已推送到 `origin/main`。`npm test`、`npm run lint`、`npm run build` 均通过；构建生成 94 个静态页面。自动测试模拟 1,000 个匿名访客、10,000 条事件，并验证五类安全规则、管理员鉴权、IP 与匿名时间线分离及 30 天清理。
- `npm run smoke -- https://starai.asia` 27/27 通过；未登录安全事件接口返回 401。首页、后台、隐私页在公网 IP:39090 返回 200，域名 HTTP 维持原有 HTTPS 跳转。四种尺寸的 HTTP fallback 路由检查 20/20 通过。
- Computer Use 尝试打开桌面 Chrome 视觉检查时，运行时无法可靠识别当前浏览器 URL 并停止；没有自动输入管理员凭证。因此这轮未完成登录后的安全表格交互、Edge 或真实手机验收。多视口 fallback 不代表真实 DOM 布局。
- 共享 Nginx access log 的历史记录可能在其 14 日保留周期内继续含有旧 IP；由于它服务其他站点，本轮没有读取或清除该共享文件。所有文档不含服务器密码、管理员凭证、API Key、`.env` 或访客 IP。
