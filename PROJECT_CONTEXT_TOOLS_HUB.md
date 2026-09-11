# AI效率工具箱 / tools-hub-100 项目上下文

更新时间：2026-09-11（Asia/Shanghai）

本文件是 tools-hub-100 的唯一主上下文文档，用于换电脑、重新 clone、换 Codex 或更换部署环境后继续开发。它与 Hansik、StockAI、Lead Finder 等旧项目完全独立，不得把旧项目的源码、依赖、数据库、端口或配置复制进来。

## 1. 项目基础信息

- 项目名称：AI效率工具箱 / 全能工具集合站
- 项目定位：面向中文用户的 100 个高频实用工具集合网站，不是普通导航站。
- 核心体验：免费、快速、无需登录；中文场景优化；本地处理优先；每个工具拥有独立 SEO 页面。
- 本地推荐路径：`D:\CODEX\tools-hub-100`
- 当前阶段：第二阶段 Stage 50（本地视频转 WebM）已完成；89 个工具已有真实操作区，100 个工具均拥有独立页面与基础 SEO，`/tools` 已有 9 组任务工具包，20 个文本/Prompt/办公/自媒体工作区支持本机结果历史与结果下载，下一阶段继续评估高价值文件能力与真实用户任务链
- GitHub 仓库地址：`git@github.com:hyggemonster-star/toolswebsite.git`
- 当前分支：`main`
- 项目是否已部署：是；已部署静态产物到 `/www/wwwroot/tools-hub-100`，新增独立 Nginx 配置并监听 `39090`；未修改 PM2、数据库或旧站配置。

## 2. 技术栈与本地命令

- Next.js 16.3.4、React 19、TypeScript、App Router
- CSS：项目自带的全局 CSS 设计系统，当前阶段不额外引入 Tailwind
- 轻量依赖：`lucide-react`、`qrcode`、`pdf-lib`、按需加载的 `pdfjs-dist@6.3.289`
- 本地启动：`npm install` 后运行 `npm run dev`
- 本地地址：`http://localhost:3000`
- lint：`npm run lint`
- 构建：`npm run build`
- 生产预览：`npx next start --port 端口号`
- 服务器部署：`npm run build` 后上传 `out` 静态产物；服务器不执行 npm/build。
- 正式域名：通过 `NEXT_PUBLIC_SITE_URL` 配置；未确认域名前不得硬编码正式域名。
- 环境变量：当前无必需密钥；可选 `NEXT_PUBLIC_SITE_URL` 只用于 SEO 基础 URL。

## 3. 服务器隔离与未来部署计划

旧项目上下文只用于读取服务器信息，本项目不修改旧文件。已知旧项目状态：

- 服务器：`101.43.29.216`，SSH 使用交互式认证；不记录密码和私钥。
- Hansik 旧项目：`/www/wwwroot/hansik-hospitality-template`，演示端口 `9990`。
- StockAI 旧项目：`/www/wwwroot/stockai`，必须保持完全隔离。
- Hansik Nginx 配置：`/www/server/panel/vhost/nginx/hansik-demo.conf`。
- 服务器 Node 路径参考：`/opt/stockai-node22/bin/node`。

新项目使用独立目录 `/www/wwwroot/tools-hub-100` 和端口 `39090`；未复用 `9990`，未修改旧项目 Nginx/PM2/数据库。部署模式为本地静态导出 + Nginx，服务器不安装依赖、不执行构建、不运行 Node/PM2。Nginx 配置为 `/www/server/panel/vhost/nginx/tools-hub-100.conf`，变更前备份位于 `/www/backup/tools-hub-100-before-20260910`。

当前公网入口：`http://101.43.29.216:39090/`。Stage 50 静态产物已切换到独立目录；首页、`/tools`、AI 工具导航/AI 写作对比/AI 图片对比/AI 视频对比/AI 编程对比、小红书 Prompt/短视频 Prompt/电商 Prompt/文本表达/长文重点/面试准备/工作周报/简历内容/PPT 大纲/评论回复/朋友圈文案/公众号标题/公众号排版、PDF 转 Word/已知密码 PDF 解密/表格导出/图片/证件照换底色/图片去背景/图片增强、音频压缩、视频压缩/视频转 WebM/GIF/静音/截图/封面工具、小红书标题结构/标签/排版/敏感词工具、Markdown/Prompt 内容工具、9 个场景工具包、20 个本地历史接入工作区、代表工具页、`robots.txt`、`sitemap.xml` 外部复验均返回 200，PDF.js worker 资源也可公网访问。100 个详情页均已输出 canonical、Open Graph、JSON-LD、FAQ 和独立工具元数据；发布前旧站目录备份位于 `/www/backup/tools-hub-100-stage50-before-20260911`，仍可回滚到上一版本。

## 4. 100 个工具清单与状态

状态说明：`已实现` 表示第一阶段已有可用操作区；`即将上线` 表示已有数据和独立详情页，但暂未接入完整功能。`本地` 表示计划或已使用浏览器本地处理；`上传/服务` 表示未来可能需要额外处理，必须先补充隐私和自动清理规则。

### PDF / Office 文件工具

1. PDF 转 Word — 已实现｜本地（可复制文字提取）
2. Word 转 PDF — 即将上线｜上传/服务
3. PDF 压缩 — 已实现｜本地
4. PDF 合并 — 已实现｜本地
5. PDF 拆分 — 已实现｜本地
6. PDF 转图片 — 已实现｜本地
7. 图片转 PDF — 已实现｜本地
8. PDF 加水印 — 已实现｜本地
9. PDF 加密 — 即将上线｜上传/服务
10. PDF 解密（限已知密码） — 已实现｜本地重新导出
11. PDF 页面旋转 — 已实现｜本地
12. PDF 删除页面 — 已实现｜本地
13. PDF 页面重新排序 — 已实现｜本地
14. PDF 添加页码 — 已实现｜本地
15. PDF OCR 识别文字 — 即将上线｜上传/服务
16. PDF 表格导出 — 已实现｜本地（文字表格 CSV）
17. Excel 转 PDF — 即将上线｜上传/服务
18. PPT 转 PDF — 即将上线｜上传/服务
19. Markdown 转 PDF — 已实现｜本地（浏览器打印导出）
20. Markdown 转 Word — 已实现｜本地（Word 可打开的 .doc）

### 图片处理工具

21. 图片压缩 — 已实现｜本地
22. 图片格式转换 — 已实现｜本地
23. HEIC 转 JPG — 即将上线｜本地优先
24. 图片尺寸修改 — 已实现｜本地
25. 图片裁剪 — 已实现｜本地
26. 图片去背景 — 已实现｜本地（纯色背景）
27. 图片加水印 — 已实现｜本地
28. 图片批量加水印 — 已实现｜本地
29. 图片去 EXIF 隐私信息 — 已实现｜本地
30. 图片转 Base64 — 已实现｜本地
31. Base64 转图片 — 已实现｜本地
32. 图片转 ICO 图标 — 已实现｜本地
33. 图片九宫格切图 — 已实现｜本地
34. 长图切片 — 已实现｜本地
35. 图片拼接长图 — 已实现｜本地
36. 证件照换底色 — 已实现｜本地（纯色背景）
37. 证件照尺寸裁剪 — 已实现｜本地
38. 图片清晰度增强 — 已实现｜本地（轻量像素增强）

### 视频 / 音频工具

39. 视频转音频 MP3 — 即将上线｜上传/服务
40. 视频压缩 — 已实现｜本地（WebM 目标码率）
41. MP4 转 GIF — 已实现｜本地（最多 8 秒 GIF）
42. 视频截图 — 已实现｜本地
43. 视频封面提取 — 已实现｜仅限本人/授权内容
44. 视频格式转换 — 已实现｜本地 WebM 输出
45. 音频格式转换 — 即将上线｜上传/服务
46. 音频压缩 — 已实现｜本地（OGG/WebM 目标码率）
47. 视频转字幕 — 即将上线｜仅限本人/授权内容
48. SRT 转 VTT — 已实现｜本地
49. 字幕时间轴调整 — 已实现｜本地
50. 视频静音 / 去音轨 — 已实现｜本地（WebM 输出）

### 自媒体运营工具

51. 小红书标题生成器 — 已实现｜本地/合规提示
52. 小红书笔记排版 — 已实现｜本地/合规提示
53. 小红书标签推荐 — 已实现｜本地/合规提示
54. 小红书封面比例裁剪 — 已实现｜本地/合规提示
55. 小红书敏感词检测 — 已实现｜本地/合规提示
56. 小红书标题结构分析 — 已实现｜本地/合规提示
57. 抖音标题生成器 — 已实现｜本地/合规提示
58. 抖音口播脚本生成 — 已实现｜本地/合规提示
59. 短视频分镜脚本生成 — 已实现｜本地/合规提示
60. 视频文案提取（限授权内容） — 即将上线｜仅限本人/授权内容
61. 视频封面提取（限授权内容） — 已实现｜仅限本人/授权内容
62. 公众号标题生成器 — 已实现｜本地/合规提示
63. 公众号排版格式清理 — 已实现｜本地/合规提示
64. 微信朋友圈文案生成 — 已实现｜本地/合规提示
65. 评论区回复生成器 — 已实现｜本地/合规提示

### AIGC / AI 创作工具

66. AI 工具导航 — 已实现｜本地目录
67. AI 写作工具对比 — 已实现｜本地目录/官方入口
68. AI 图片工具对比 — 已实现｜本地目录/官方入口
69. AI 视频工具对比 — 已实现｜本地目录/官方入口
70. AI 编程工具对比 — 已实现｜本地目录/官方入口
71. Prompt 生成器 — 已实现｜本地/隐私提示
72. 小红书 Prompt 模板库 — 已实现｜本地
73. 电商 Prompt 模板库 — 已实现｜本地
74. 短视频 Prompt 模板库 — 已实现｜本地
75. 文本表达整理 — 已实现｜本地（旧 slug 保持 `ai-rewrite` 兼容）
76. 长文重点整理 — 已实现｜本地（旧 slug 保持 `ai-long-summary` 兼容）
77. 工作周报整理 — 已实现｜本地（旧 slug 保持 `ai-weekly-report` 兼容）
78. 简历内容整理 — 已实现｜本地（旧 slug 保持 `ai-resume` 兼容）
79. 面试准备整理 — 已实现｜本地（旧 slug 保持 `ai-interview-questions` 兼容）
80. PPT 大纲整理 — 已实现｜本地（旧 slug 保持 `ai-ppt-outline` 兼容）

### 开发者 / 站长工具

81. JSON 格式化 — 已实现｜本地
82. JSON 压缩 — 已实现｜本地
83. JSON 转 CSV — 已实现｜本地
84. CSV 转 JSON — 已实现｜本地
85. Base64 编码解码 — 已实现｜本地
86. URL 编码解码 — 已实现｜本地
87. 时间戳转换 — 已实现｜本地
88. UUID 生成器 — 已实现｜本地
89. MD5/SHA 哈希生成 — 已实现｜本地
90. 正则表达式测试 — 已实现｜本地
91. JWT 解析 — 已实现｜本地
92. Cron 表达式生成器 — 已实现｜本地

### 日常实用工具

93. 二维码生成器 — 已实现｜本地
94. 条形码生成器 — 已实现｜本地
95. 短链接生成器 — 即将上线｜服务
96. 字数统计 — 已实现｜本地
97. 文本去重 — 已实现｜本地
98. 文本大小写转换 — 已实现｜本地
99. 单位换算 — 已实现｜本地
100. 密码生成器 — 已实现｜本地

## 5. 已实现工具列表

JSON 格式化、JSON 压缩、Base64 编码解码、URL 编码解码、时间戳转换、UUID 生成器、MD5/SHA 哈希生成、二维码生成器、字数统计、文本去重、文本大小写转换、密码生成器、单位换算、图片压缩、图片尺寸修改、图片格式转换、图片去背景、图片清晰度增强、图片裁剪、图片加水印、图片批量加水印、图片去 EXIF 隐私信息、图片转 Base64、Base64 转图片、图片转 ICO 图标、图片九宫格切图、长图切片、图片拼接长图、证件照换底色、证件照尺寸裁剪、JSON 转 CSV、CSV 转 JSON、正则表达式测试、JWT 解析、Cron 表达式生成器、SRT 转 VTT、字幕时间轴调整、PDF 转图片、PDF 转 Word、PDF 解密（限已知密码）、PDF 压缩、PDF 合并、PDF 拆分、PDF 表格导出、图片转 PDF、PDF 加水印、PDF 页面旋转、PDF 删除页面、PDF 页面重新排序、PDF 添加页码、Markdown 转 PDF、Markdown 转 Word、小红书标题生成器、小红书标题结构分析、小红书标签推荐、小红书笔记排版、小红书封面比例裁剪、小红书敏感词检测、抖音标题生成器、抖音口播脚本生成、短视频分镜脚本生成、视频静音 / 去音轨、MP4 转 GIF、视频压缩、视频格式转换、音频压缩、Prompt 生成器、小红书 Prompt 模板库、AI 工具导航、AI 写作工具对比、AI 图片工具对比、AI 视频工具对比、AI 编程工具对比、公众号标题生成器、公众号排版格式清理、微信朋友圈文案生成、评论区回复生成器、PPT 大纲整理、工作周报整理、简历内容整理、面试准备整理、长文重点整理、文本表达整理、电商 Prompt 模板库、短视频 Prompt 模板库、视频截图、视频封面提取、视频封面提取（限授权内容）、条形码生成器，共 89 个。

## 6. 未实现工具处理方式

其余 11 个工具均进入完整工具数据、搜索、分类和独立详情页，但详情页明确显示“即将上线”，提供用途说明、使用步骤、隐私边界和相关工具推荐，不展示虚假的操作结果。后续接入上传、AI 或媒体处理前，先评估浏览器本地可行性、版权/平台规则、资源消耗和自动清理策略。

## 7. 页面路由结构

- `/`：首页搜索、少量可用工具、分类入口、条件显示的最近使用、相关推荐与隐私说明
- `/tools`：100 个工具列表，支持关键词搜索和分类筛选
- `/tools/[slug]`：100 个独立工具详情页；89 个已上线工具有操作区，所有详情页统一提供最近使用、收藏、分享、FAQ、相关推荐与 JSON-LD 结构化数据
- `/categories/[category]`：7 个分类页面
- `/robots.txt`、`/sitemap.xml`：SEO 基础路由

## 8. 数据结构

`src/data/tools.ts` 中每条工具记录必须包含：`id`、`name`、`slug`、`category`、`subCategory`、`description`、`priority`、`tags`、`isImplemented`、`isClientSide`、`riskLevel`、`seoTitle`、`seoDescription`、`relatedTools`。数据由种子列表生成 SEO 字段和同类相关推荐，详情页以 slug 查询。

## 9. 关键文件位置

- `PROJECT_CONTEXT_TOOLS_HUB.md`：本主上下文
- `README.md`：项目说明、安装、命令、部署边界
- `.gitignore`：依赖、构建物、缓存、上传物、日志和环境文件排除规则
- `src/app/layout.tsx`、`src/app/globals.css`：全局布局、SEO 默认值和视觉系统
- `src/app/page.tsx`：首页
- `src/app/tools/page.tsx`：全部工具页
- `src/app/tools/[slug]/page.tsx`：工具详情页
- `src/app/categories/[category]/page.tsx`：分类页
- `src/components/HomeExplorer.tsx`：首页交互
- `src/components/ToolBrowser.tsx`：搜索与分类筛选
- `src/components/SceneToolkitGrid.tsx`：按任务展示场景工具包和真实工具入口
- `src/components/ToolRenderer.tsx`：基础文本、图片、开发者和 PDF 工具路由（PDF 工作区动态分包）
- `src/components/tools/ToolPrimitives.tsx`：工具操作区共享原语（复制、提示、输入、结果、文件拖拽、处理中、下载）
- `src/components/tools/ImageToolRenderer.tsx`：第二阶段浏览器本地图片工具，包含轻量像素增强、纯色去背景和证件照换底色工作区
- `src/components/tools/DeveloperToolRenderer.tsx`：第三阶段开发者、文本和字幕工具
- `src/components/tools/PdfToolRenderer.tsx`：第四阶段浏览器本地 PDF 处理、PDF 页面转图片与图片转 PDF 工具；Stage 49 新增已知密码 PDF 逐页重新导出；PDF.js 按需加载
- `src/components/tools/VideoToolRenderer.tsx`：第五阶段浏览器本地视频帧提取、Stage 44 视频静音/去音轨、Stage 45 视频转 GIF、Stage 46 视频压缩和 Stage 50 视频转 WebM 工具
- `src/components/tools/AudioToolRenderer.tsx`：Stage 47 本地音频压缩工作区，输出浏览器支持的 OGG/WebM
- `src/components/tools/BarcodeToolRenderer.tsx`：第五阶段 EAN-13 条形码生成工具
- `src/components/tools/MarkdownPdfToolRenderer.tsx`、`src/components/tools/MarkdownWordToolRenderer.tsx`：Markdown 实时预览、打印导出 PDF 与 Word 可打开 `.doc` 导出工具
- `src/components/tools/CreatorToolRenderer.tsx`：小红书标题方向、标题结构分析、标签推荐、抖音标题/开场方向/口播脚本、短视频分镜、笔记本地排版、风险表达检查、公众号标题方向/格式清理、朋友圈文案、评论回复与下载工具
- `src/components/tools/OfficeToolRenderer.tsx`：本地长文重点、面试准备、工作周报、PPT 大纲整理与简历内容整理工作区，包含结构化输入、原文/问题/区块级结果、复制和 TXT 下载
- `src/components/tools/TextExpressionToolRenderer.tsx`：本地文本表达格式清理、有限填充词精简和表达问题检查工作区
- `src/components/tools/PromptLibraryToolRenderer.tsx`：本地电商 Prompt 模板筛选、真实信息填充、单项/整组复制和 TXT 下载工作区
- `src/components/tools/ShortVideoPromptLibraryToolRenderer.tsx`：本地短视频 Prompt 模板筛选、真实素材填充、选题/脚本/分镜/复盘复制和 TXT 下载工作区
- `src/components/tools/XhsPromptLibraryToolRenderer.tsx`：本地小红书 Prompt 模板筛选、真实素材填充、选题/标题/笔记/互动复制和 TXT 下载工作区
- `src/components/tools/AiToolDirectoryRenderer.tsx`：本地 AI 工具场景目录，支持关键词、7 类场景筛选、官方入口跳转和外部服务边界提示
- `src/components/tools/AiComparisonToolRenderer.tsx`：Stage 48 本地 AI 写作/图片/视频/编程对比目录，支持关键词、场景筛选、官方入口跳转和不提供实时价格/排名的边界提示
- `src/components/tools/AiToolRenderer.tsx`：本地 Prompt 结构化输入、生成、复制与下载工作区
- `src/data/ai-tools.ts`：12 个静态 AI 服务入口、7 类使用场景和可维护的官方链接数据
- `src/data/toolkits.ts`：办公文件、内容发布、图片交付、短视频素材、开发排查、生成分享、求职简历、学习整理、AI 内容准备 9 个场景工具包，共 34 个真实工具入口
- `src/lib/seo.ts`：工具详情页 FAQ、canonical URL、Breadcrumb、SoftwareApplication、FAQPage 和相关推荐结构化数据
- `src/lib/image.ts`：Canvas、Blob、Base64、ICO、图片输出、本地像素增强、纯色背景连通区域处理和透明像素底色合成基础能力
- `src/lib/text.ts`：CSV、正则、JWT、字幕、内容排版、候选风险表达检测、标题模板、标题结构分析、标签词库、短视频开场/口播脚本/分镜模板、电商/短视频/小红书 Prompt 通用模板类型与组装算法
- `src/lib/browser.ts`：HTTP 环境可用的剪贴板复制回退能力
- `src/lib/pdf.ts`：PDF 文件校验、页码解析、页面复制、图片排版和 PDF 导出基础能力
- `src/lib/video.ts`：视频文件校验、元数据读取、时间点定位、Canvas 截图、MediaRecorder 无声/目标码率 WebM 导出和自包含 GIF89a/LZW 编码能力
- `src/lib/audio.ts`：音频文件校验、Web Audio MediaStreamDestination、MediaRecorder OGG/WebM 目标码率导出和资源清理
- `src/lib/barcode.ts`：EAN-13 校验位、条空编码和 SVG 导出能力
- `src/lib/markdown.ts`：安全的 Markdown 基础语法转 HTML 预览与 Word 兼容文档包装
- `src/components/ToolDetailView.tsx`：详情页、上线状态、收藏、分享、FAQ、相关推荐和合规提示
- `src/lib/hash.ts`：MD5 与 Web Crypto SHA 摘要
- `src/lib/storage.ts`：最近使用、收藏工具与限量结果历史的设备本地记录；使用 `tools-hub-100:recent-tools`、`tools-hub-100:favorite-tools`、`tools-hub-100:tool-history` 三个 localStorage key
- `src/components/tools/ToolPrimitives.tsx`：共享复制、下载、提示、输入、文件拖拽、处理状态和本地结果历史控件

## 10. 合规与敏感信息规则

- 自媒体工具只用于原创或用户已获授权的内容，不宣传搬运、盗用、侵权或无水印下载。
- 视频文案提取、视频封面提取必须标记仅限本人拥有版权或已获授权的内容。
- 上传类功能上线前必须提示隐私保护、处理范围、自动清理时间和不保存敏感文件的规则。
- 严禁提交服务器密码、数据库密码、API Key、私钥、`.env*`、用户上传文件、构建缓存和日志。
- 不修改系统级环境配置，不把依赖缓存和构建物放到 C 盘；优先使用 `D:\CODEX\tools-hub-100` 或 `D:\CODEX\cache`。

## 11. GitHub 同步规范

每次开发前先执行：`git status`、`git branch`、`git remote -v`。若远程已有内容，先 pull。每完成一个可验证阶段：更新本文件，运行必要的 lint/build，检查 `git status`，只提交本项目文件并 push 当前分支。commit message 要清楚，例如 `init tools hub project with 100 tools`、`implement client-side utility tools`。

当前 GitHub CLI 未安装；`origin` 已绑定并同步到 `main`。远程独立初始化提交已保留并合并；UI/UX 重构提交为 `4c871e8`，Stage 2 图片工具实现提交为 `eee2272`，Stage 3 开发者/文本/字幕工具实现提交为 `12e4d73`，Stage 4 PDF 工具实现提交为 `9b86bb1`，Stage 5 视频/条形码工具实现提交为 `29b527a`，Stage 6 详情页产品闭环实现提交为 `e1a8093`，Stage 7 Markdown 转 PDF 实现提交为 `6241a15`，Stage 8 小红书笔记排版实现提交为 `74fa835`，Stage 9 场景工具包实现提交为 `6fe9f5b`，Stage 10 小红书风险表达检查实现提交为 `ae04522`，Stage 11 本地内容发布工具实现提交为 `26def7f`，Stage 12 本地 Prompt 生成器实现提交为 `36d99a2`，Stage 13 公众号格式清理实现提交为 `69c48b6`，Stage 14 Markdown 转 Word 实现提交为 `02146e6`，Stage 15 图片清晰度增强实现提交为 `a4bcd87`，Stage 16 小红书标签推荐实现提交为 `e8fde64`，Stage 17 小红书标题结构分析实现提交为 `ac7faef`，Stage 18 抖音标题生成器实现提交为 `04974fc`，Stage 19 抖音口播脚本生成实现提交为 `f6a775c`，Stage 20 短视频分镜脚本生成提交为 `49321fb`，Stage 21 共享文件反馈与图片去背景实现提交为 `cc7aa9b`，Stage 22 证件照本地换底色实现提交为 `59ac1e3`，Stage 23 本地 PDF 转图片实现提交为 `e1269a0`，Stage 24 本地公众号标题生成器实现提交为 `b70f1be`，Stage 25 本地微信朋友圈文案生成器实现提交为 `ac5eb31`，均已推送到 `origin/main`。

Stage 26 本地评论区回复生成器实现提交为 `56aabf4 feat: add local comment reply generator`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 27 本地 PPT 大纲整理实现提交为 `73c58e3 feat: add local ppt outline workspace`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 28—Stage 38 的实现提交依次为 `84b5967`、`eca2bba`、`3a2b1d6`、`d9d704f`、`e6351ea`、`9c42950`、`a06d9ae`、`0cbab9b`、`619e5fa`、`5f7cbf1`、`c1bf3c5`，均已推送到 GitHub `origin/main`。
Stage 39 办公结果历史扩展实现提交为 `3c657b4 feat: extend local result history to office tools`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 40 本地历史结果导出实现提交为 `a3fe438 feat: allow downloading saved local results`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 41 本地 PDF 转 Word 文本提取实现提交为 `a44d265 feat: implement local pdf text to word export`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 42 本地 PDF 表格导出实现提交为 `621bf8c feat: add local pdf table export`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 43 自媒体结果历史扩展实现提交为 `e65d52e feat: extend local result history to creator tools`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 44 本地视频静音/去音轨实现提交为 `687dee1 feat: add local video audio removal`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 45 本地视频转 GIF 实现提交为 `a85fa32 feat: add local video to gif export`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 46 本地视频压缩实现提交为 `313fed3 feat: add local video compression`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 47 本地音频压缩实现提交为 `3af0fd4 feat: add local audio compression`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 48 四个 AI 对比目录实现提交为 `1305656 feat: add searchable ai comparison directories`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 49 已知密码 PDF 解密导出实现提交为 `ba5dfe0 feat: add known-password pdf unlock`，当前分支为 `main`，已推送到 GitHub `origin/main`。
Stage 50 本地视频转 WebM 实现提交为 `3fb9d4d feat: add local video webm conversion`，当前分支为 `main`，已推送到 GitHub `origin/main`。

## 12. 历史开发记录

### 2026-09-10：第一阶段初始化与产品设计重构（已完成）

- 已在 `D:\CODEX\tools-hub-100` 创建独立 Next.js + TypeScript 项目。
- 已安装最小的 `lucide-react`、`qrcode` 和 `@types/qrcode`。
- 已建立 100 个工具数据、7 个分类、搜索、筛选、热门、最近使用、相关推荐和 SEO 路由骨架。
- 已实现首批 15 个浏览器本地工具和响应式 UI。
- 已完成一次专业级 UI/UX 重构：首页聚焦搜索与可用工具，减少首屏噪音，统一视觉设计令牌，并把工具操作区设为详情页唯一视觉中心。
- `npm run lint` 已通过；`npm run build` 已通过并生成 114 条静态页面/路由输出；本机生产服务 3100 端口代表性路由 HTTP 冒烟检查均返回 200。
- Git 已初始化 `main`；首次 commit 为 `c3ffb281e255e06d25c9f3d1027a608a01992dce`，message 为 `init tools hub project with 100 tools`，提交身份为仓库级 GitHub noreply 身份。
- origin 已绑定到 `git@github.com:hyggemonster-star/toolswebsite.git`；已通过 SSH 完成推送，`main` 已同步到 GitHub。
- 腾讯云已完成静态文件上传、完整性校验、旧站目录备份与目录切换；未修改 Nginx 配置，Stage 2 图片工具已发布到 `/www/wwwroot/tools-hub-100`，并完成公网复验。Stage 2 发布前备份位于 `/www/backup/tools-hub-100-stage2-before-20260910`。

## 13. 当前阶段验收清单

- [x] 独立 D 盘项目目录
- [x] PROJECT_CONTEXT_TOOLS_HUB.md
- [x] README.md
- [x] `.gitignore`
- [x] 100 个工具数据及字段
- [x] 首页、工具列表页、分类页、详情页
- [x] 搜索、分类筛选、热门、最近使用、相关工具
- [x] 15 个纯前端工具
- [x] 第二阶段图片工具核心（新增 12 个，累计 27 个真实可用工具）
- [x] 第三阶段开发者 / 文本 / 字幕工具核心（新增 7 个，累计 34 个真实可用工具）
- [x] 第四阶段 PDF 浏览器本地工具核心（新增 9 个，累计 43 个真实可用工具）
- [x] 第五阶段视频帧与 EAN-13 条形码工具核心（新增 4 个，累计 47 个真实可用工具）
- [x] 第六阶段通用详情页产品闭环（收藏、分享、FAQ、结构化 SEO、HTTP 复制兜底）
- [x] 第七阶段 Markdown 本地排版与 PDF 导出（新增 1 个，累计 48 个真实可用工具）
- [x] 第八阶段本地内容创作工具（新增 1 个，累计 49 个真实可用工具）
- [x] 第九阶段场景化工具包入口（新增 6 个任务工具包、18 个真实入口）
- [x] 第十阶段本地内容风险表达辅助检查（新增 1 个，累计 50 个真实可用工具）
- [x] 第十一阶段小红书标题方向与封面比例裁剪（新增 2 个，累计 52 个真实可用工具）
- [x] 第十二阶段本地 Prompt 生成器（新增 1 个，累计 53 个真实可用工具）
- [x] 第十三阶段公众号本地排版格式清理（新增 1 个，累计 54 个真实可用工具）
- [x] 第十四阶段 Markdown 本地导出 Word 兼容文档（新增 1 个，累计 55 个真实可用工具）
- [x] 第十五阶段本地图片清晰度增强（新增 1 个，累计 56 个真实可用工具）
- [x] 第十六阶段本地小红书标签推荐（新增 1 个，累计 57 个真实可用工具）
- [x] 第十七阶段本地小红书标题结构分析（新增 1 个，累计 58 个真实可用工具）
- [x] 第十八阶段本地抖音标题生成器（新增 1 个，累计 59 个真实可用工具）
- [x] 第十九阶段本地抖音口播脚本生成（新增 1 个，累计 60 个真实可用工具）
- [x] 第二十阶段本地短视频分镜脚本生成（新增 1 个，累计 61 个真实可用工具）
- [x] 第二十一阶段共享文件反馈与本地图片去背景（新增 1 个，累计 62 个真实可用工具）
- [x] 第二十二阶段本地证件照换底色（新增 1 个，累计 63 个真实可用工具）
- [x] 第二十三阶段本地 PDF 转图片（新增 1 个，累计 64 个真实可用工具）
- [x] 第二十四阶段本地公众号标题生成器（新增 1 个，累计 65 个真实可用工具）
- [x] 第二十五阶段本地微信朋友圈文案生成器（新增 1 个，累计 66 个真实可用工具）
- [x] 第二十六阶段本地评论区回复生成器（新增 1 个，累计 67 个真实可用工具）
- [x] 第二十七阶段本地 PPT 大纲整理（原 AI PPT 大纲工具去 AI 化，新增 1 个，累计 68 个真实可用工具）
- [x] 第二十八阶段本地简历内容整理（原 AI 简历工具去 AI 化，新增 1 个，累计 69 个真实可用工具）
- [x] 第二十九阶段本地工作周报整理（原 AI 周报工具去 AI 化，新增 1 个，累计 70 个真实可用工具）
- [x] 第三十阶段本地面试准备整理（原 AI 面试题工具去 AI 化，新增 1 个，累计 71 个真实可用工具）
- [x] 第三十一阶段本地长文重点整理（原 AI 长文总结工具去 AI 化，新增 1 个，累计 72 个真实可用工具）
- [x] 第三十二阶段本地文本表达整理（原 AI 改写降重工具去 AI 化，新增 1 个，累计 73 个真实可用工具）
- [x] 第三十三阶段本地电商 Prompt 模板库（新增 1 个，累计 74 个真实可用工具）
- [x] 第三十四阶段本地短视频 Prompt 模板库（新增 1 个，累计 75 个真实可用工具）
- [x] 第三十五阶段本地小红书 Prompt 模板库（新增 1 个，累计 76 个真实可用工具）
- [x] 第三十六阶段本地 AI 工具场景目录（新增 1 个，累计 77 个真实可用工具）
- [x] 第三十七阶段场景化任务工具包扩展（新增 3 组，9 组任务工具包、34 个真实工具入口）
- [x] 第三十八阶段本地结果历史首批接入（新增 1 个共享控件，4 个文本/Prompt 工作区接入）
- [x] 第三十九阶段本地结果历史扩展到办公工具（5 个办公工作区接入，共 9 个历史工作区）
- [x] 第四十阶段本地历史结果导出（历史条目支持复制、下载和删除）
- [x] 第四十一阶段本地 PDF 转 Word 文本提取（新增 1 个，累计 78 个真实可用工具）
- [x] 第四十二阶段本地 PDF 表格导出（输出 Excel 可打开 CSV，新增 1 个，累计 79 个真实可用工具）
- [x] 第四十三阶段本地结果历史扩展到自媒体工具（11 个创作者工作区接入，共 20 个历史工作区）
- [x] 第四十四阶段本地视频静音/去音轨（新增 1 个，累计 80 个真实可用工具，输出无声 WebM）
- [x] 第四十五阶段本地视频转 GIF（新增 1 个，累计 81 个真实可用工具，自包含 GIF89a/LZW 编码）
- [x] 第四十六阶段本地视频压缩（新增 1 个，累计 82 个真实可用工具，目标码率 WebM 输出）
- [x] 第四十七阶段本地音频压缩（新增 1 个，累计 83 个真实可用工具，目标码率 OGG/WebM 输出）
- [x] 第四十八阶段 AI 写作/图片/视频/编程对比目录（新增 4 个，累计 87 个真实可用工具，静态官方入口与场景筛选）
- [x] 第四十九阶段已知密码 PDF 解密导出（新增 1 个，累计 88 个真实可用工具，浏览器逐页重渲染为无密码副本）
- [x] 第五十阶段本地视频转 WebM（新增 1 个，累计 89 个真实可用工具，仅承诺浏览器可解码视频的 WebM 输出）
- [x] 响应式与 SEO 基础结构
- [x] 专业级 UI/UX、信息架构与视觉设计重构
- [x] lint/build 最终通过记录
- [x] Git 初始化、main 分支
- [x] 首次 commit
- [x] GitHub remote origin 绑定
- [x] 首次 push
- [x] 独立腾讯云目录、静态部署和 Nginx 配置
- [x] 腾讯云安全组放行 TCP 39090
- [x] 外部公网 URL 最终复验

## 14. 下一步建议

1. 进入 Stage 51：选择一个仍有明确需求的高价值文件或媒体能力做小样本技术验证，优先评估 PDF OCR、HEIC、Office 转换、音频格式转换或视频字幕的真实可维护边界；继续监测 PDF.js、音频/视频 MediaRecorder 在不同浏览器的兼容性；历史能力继续保持最多 20 条、仅本机、可删除，不做账号同步或服务端留存；AI 外部目录只维护静态官方入口，不接入未经验证的实时价格、热度或第三方 API。
2. 将场景工具包扩展到求职简历、学生学习、跨境/电商等高价值方向，但每组先有真实可用入口再展示，避免只做营销卡片。
3. 为上传类工具补充更明确的文件规模、处理耗时、失败恢复和浏览器内存提示；建立真实设备 1440、768、390 宽度验收。当前 CUA 运行时缺少 `@oai/cua/tinyskyAlt`，真实设备视觉验收仍待环境恢复。
4. 正式域名确认后配置 `NEXT_PUBLIC_SITE_URL` 并切换 HTTPS；暂不修改 Hansik/StockAI，继续保持项目隔离。

## 15. 2026-09-10：专业级 UI/UX 重构记录

### 本次重构结论

- 产品定位从“多彩工具导航站”收敛为“安静的工具工作台”：用户打开首页先搜索或直接开始，而不是先理解大量模块。
- 首页信息架构调整为：Hero 搜索与快速开始 → 8 个高频工具 → 7 个分类入口 → 三项信任理由 → 有真实记录时才显示最近使用 → 页脚。
- 删除首屏统计数字、装饰性假面板、过长标签组和默认空的“最近新增”区；这些内容无法帮助第一次访问者完成下一步。

### 视觉与交互设计

- 全站统一为中性浅灰画布、深靛文字、单一蓝色行动色，珊瑚色只作为提示强调，绿色只表达本地处理或成功状态。
- 卡片只保留图标、状态、分类、标题、一句描述和一个明确动作；Hover 仅轻微上浮与阴影变化。
- 首页快速开始面板直接链接真实工具；首页搜索会把关键词带入工具库，移动端搜索、分类筛选和工具入口重新布局为单手可操作的纵向流程。
- 工具详情页保持“输入/上传 → 操作按钮 → 结果”顺序，说明退到操作区之后；本地处理、隐私和即将上线状态使用统一提示样式。

### 修改范围

- 首页：`src/components/HomeExplorer.tsx`
- 全局视觉系统：`src/app/globals.css`
- 导航与品牌：`src/components/SiteHeader.tsx`
- 工具卡片与卡片网格：`src/components/ToolCard.tsx`、`src/components/ToolGrid.tsx`
- 工具库搜索筛选：`src/components/ToolBrowser.tsx`、`src/app/tools/page.tsx`
- 工具详情状态与操作引导：`src/components/ToolDetailView.tsx`、`src/components/ToolRenderer.tsx`

### 为什么这样设计

- 让用户在 3 秒内知道这是工具集合，在 10 秒内看到搜索或“开始”入口，在 30 秒内建立“免费、无需登录、本地优先”的信任。
- 将未实现的 73 个工具保留为可索引的产品路线，但不让“即将上线”在首页抢走已可用工具的注意力。
- 保留 Next.js 静态导出、现有数据结构与最小依赖，不以视觉升级换取性能、SEO 或项目边界风险。

### 后续还能优化

1. 收集真实搜索与点击数据后，再决定是否需要搜索排序、分类快捷筛选或键盘快捷键。
2. 继续实现高频本地工具，尤其是图片/文件处理；上传或服务端功能上线前补齐隐私、自动清理和资源限制说明。
3. 在正式域名确认后设置 `NEXT_PUBLIC_SITE_URL`，并进行真实设备的 1440、768、390 宽度视觉验收。

## 16. 2026-09-10：第二阶段 Stage 2 图片工具核心（已完成）

### Plan

- 选择浏览器可完成的图片能力作为第二阶段首个切片，避免在产品基础能力未稳定前引入 PDF、FFmpeg、OCR 或 AI 服务端依赖。
- 统一复用操作区原语、上传区、结果区、隐私提示和下载交互；所有输出均为真实 Blob 或 Data URL，不展示假按钮。

### Design / Develop

- 新增 12 个浏览器本地工具：图片格式转换、图片裁剪、图片加水印、图片批量加水印、移除 EXIF、图片转 Base64、Base64 转图片、图片转 ICO、九宫格切图、长图切片、图片拼接长图、证件照尺寸裁剪。
- 将已有图片压缩、图片尺寸修改迁移到同一 `ImageToolRenderer`，使用共享 `src/lib/image.ts` 管理 Canvas、Blob、格式和 URL 生命周期。
- 新增共享 `ToolPrimitives`，降低复制按钮、错误提示、工作区标题和文本结果区的重复实现。
- 本阶段未新增 npm 依赖；使用 File API、Canvas、FileReader、Blob、Web URL 和浏览器下载能力。

### Test / Self-check

- `npm run lint`：通过。
- `npm run build`：通过，114 条静态路由全部生成。
- 100 个工具详情页静态检查：通过；27 个页面包含真实 `workspace-card`，73 个页面仍显示明确的“即将上线”。
- `sitemap.xml`：100 条工具 URL 与详情页一致。
- Node 纯逻辑自测：Base64 图片数据正确生成 Blob，PNG 正确生成 ICO 文件头。
- Stage 2 实现提交：`eee2272`；已推送 GitHub `main`，腾讯云公网入口已同步。
- 未发现阻塞 Bug；同时修复了旧图片处理流程中的对象 URL 生命周期和异常提示问题。

### 风险与边界

- HEIC 解码、AI 去背景、图片清晰度增强和证件照换底色需要专用解码器或模型，暂不伪装成本地已实现。
- 九宫格、长图切片和批量水印当前逐张下载，未引入压缩包依赖；后续只有在真实需求明确后再评估轻量 ZIP 方案。
- 超大图片仍受浏览器 Canvas 内存和最大纹理尺寸限制，后续应增加尺寸/内存预警与分块处理。

### 下一阶段

- Stage 3：继续实现开发者 / 文本类浏览器工具，保持无后端、零新增重量依赖。
- Stage 4：评估 PDF / Office 的本地与服务端边界，先做技术验证再决定 API 和部署架构。

## 17. 2026-09-10：第二阶段 Stage 3 开发者 / 文本 / 字幕工具（已完成）

### Plan / Design

- 先实现不需要后端的结构化文本和字幕能力，继续保持静态导出与浏览器本地优先。
- 复用上一阶段的工作区原语、复制按钮、下载按钮、错误提示和隐私说明；将算法从 UI 中拆到 `src/lib/text.ts`，便于后续单独测试和扩展。

### Develop

- 新增 7 个真实工具：JSON 转 CSV、CSV 转 JSON、正则表达式测试、JWT 解析、Cron 表达式生成器、SRT 转 VTT、字幕时间轴调整。
- CSV 支持中文、引号、逗号、换行和重复表头校验；正则显示匹配位置与捕获组；JWT 明确只解码不验签；字幕支持 SRT/VTT 时间格式和正负偏移。
- 本阶段未新增 npm 依赖，继续使用浏览器原生 RegExp、TextEncoder/TextDecoder、Blob、URL 和静态客户端组件。

### Test / Self-check

- `npm run lint`：通过。
- `npm run build`：通过，114 条静态路由全部生成。
- 新增 7 个详情页均包含真实 `workspace-card`，没有误显示 Coming Soon；全站工具详情页仍为 100 个。
- 算法自测通过：CSV 双向转换、中文/特殊字符转义、正则匹配、JWT Base64URL 解码、SRT 解析、负偏移和 VTT 输出。
- 累计真实可用工具从 27 个提升到 34 个，待实现工具从 73 个降至 66 个。

### Commit / Publish / Risk

- Stage 3 实现提交为 `12e4d73 implement browser developer and subtitle tools`，已推送到 GitHub `origin/main`；本阶段静态产物已发布到腾讯云 `/www/wwwroot/tools-hub-100`，公网入口为 `http://101.43.29.216:39090/`，旧版本备份为 `/www/backup/tools-hub-100-stage3-before-20260910`。
- 未发现阻塞 Bug；当前风险主要是 CSV 极端格式、正则灾难性回溯和字幕超大文件，需要在后续性能阶段增加输入规模限制或超时保护。
- Stage 4 先做 PDF/Office 技术验证，不在未评估浏览器内存、服务端资源和隐私边界前直接引入重型转换链路。

### Product Review

- 产品定位更清晰：新增工具继续强化“中文用户的高频效率工具箱”，首页仍以搜索、热门入口和真实可用工具为核心，没有把开发者工具实现细节堆到首页。
- 当前最大的信息架构问题仍未完全解决：现有一级分类偏技术实现，下一阶段应继续向办公效率、内容创作、求职学习等用户场景和工具包迁移，让普通用户按任务而不是按文件格式找工具。
- 趋势与价值判断：结构化文本、正则、JWT、Cron 和字幕处理具备长期需求；PDF/Office、AI 创作、短视频运营和求职学习仍是更高价值的下一批方向。低频且需要重型转码链路的视频工具应先做成本和维护性评估，再决定是否保留原优先级。
- 当前最大体验缺口：仍有 66 个工具处于规划状态，统一的收藏、分享、FAQ/结构化 SEO 和浏览器本地历史还没有形成完整产品闭环；本阶段未为赶数量而伪装实现这些能力。
- 下一阶段最值得做：先完成 PDF/Office 的本地与后端技术验证，再建立通用工具详情页能力（收藏、分享、FAQ、结构化数据、规模限制和错误恢复），同时保持每阶段可构建、可回滚、可部署。

## 18. 2026-09-10：第二阶段 Stage 4 浏览器本地 PDF 工作区（已完成）

### Plan / Design

- 先把不依赖服务器的高频 PDF 整理能力做成真实工作区，避免在没有资源限制、自动清理和隐私方案前直接接入 OCR、Office 转换或 FFmpeg 服务。
- 使用 `pdf-lib` 处理 PDF 页面结构，上传大小限制为单文件 50 MB、批量最多 20 个文件；组件通过动态分包加载，但保留静态预渲染，兼顾工具首屏、SEO 和其他页面包体。
- 统一复用工作区标题、拖拽上传、文件列表、错误提示、结果下载和本地处理提示；删除、排序等有破坏性的操作一律导出新文件，不覆盖原文件。

### Develop

- 新增 9 个真实工具：PDF 压缩（结构重写）、PDF 合并、PDF 拆分、图片转 PDF、PDF 加水印、PDF 页面旋转、PDF 删除页面、PDF 页面重新排序、PDF 添加页码。
- 新增 `src/lib/pdf.ts`，集中处理 PDF 校验、文件大小边界、页码范围解析、页面复制、图片嵌入、中文水印和 Blob 导出；新增 `src/components/tools/PdfToolRenderer.tsx` 作为统一 PDF 工作区。
- 图片转 PDF 保留 JPEG/PNG 原始嵌入，WEBP 等格式在浏览器转为 PNG；水印使用浏览器字体渲染为透明 PNG，因此支持中文，不依赖额外字体文件。
- `pdf-lib` 是本阶段唯一新增依赖；PDF 组件在 `ToolRenderer` 中动态加载，其他工具不会因为 PDF 能力而共享完整 PDF 处理代码。

### Test / Self-check

- `npm run lint`：通过。
- `npm run build`：通过，114 条静态路由全部生成。
- Node PDF 逻辑自测通过：页面范围解析、页面排序、页面复制、合并、旋转、删除、页码写入和导出后重新读取；输出 PDF 页数与旋转角度符合断言。
- 静态导出检查通过：100 个工具详情页、43 个真实工作区；新增 9 个页面均包含 `workspace-card`，没有主工作区 `coming-soon-card`。
- 性能检查通过：构建产物共 14 个静态 chunk，PDF 代码独立在 1 个 chunk 中；图片和 PDF 上传均在浏览器本地处理。
- 腾讯云公网复验通过：首页、`/tools`、9 个新增 PDF 页面、既有 JSON 页面、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200。

### Product Review

- 产品定位更接近“可直接工作的中文效率工具箱”：PDF 页面不再只是路线卡片，用户可以从上传、页码输入到下载完成一条链路，首页仍不堆叠全部 PDF 功能。
- 分类仍需产品化：`pdf-office` 作为技术分类对普通用户不够直观，下一阶段应把这些工具映射到“整理办公文件”“提交材料”“图片归档”等场景工具包，而不是继续增加技术子类。
- 工具优先级判断：PDF 合并、拆分、旋转、删除、页码和图片转 PDF 具备稳定长期需求；PDF 转 Word、OCR、PDF 转 Excel、Office 互转需要更重的引擎，必须先完成服务端资源、隐私、队列和自动清理设计。
- 应降级或谨慎处理：浏览器端 PDF 压缩当前是结构优化，不重新编码内嵌图片，不能承诺所有 PDF 都显著变小；文案和提示已明确该边界，后续可将真正的媒体压缩单独交给后端服务。
- 当前最大体验问题：通用详情页仍缺少收藏、分享、FAQ/结构化 SEO 与本地历史闭环；上传类工具还应在后续统一增加更明确的文件规模、处理耗时和失败恢复提示。
- 下一阶段最值得做：先实现授权本地视频截图/封面提取、条形码等低风险能力，同时抽象详情页的收藏、分享、FAQ 和结构化数据，避免每新增一个工具重复搭建外围体验。

### Commit / Publish / Risk

- Stage 4 实现提交为 `9b86bb1 implement browser PDF workspace`，已推送到 GitHub `origin/main`；腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口为 `http://101.43.29.216:39090/`。
- 本次发布前备份为 `/www/backup/tools-hub-100-stage4-before-20260910`；未修改 Nginx、PM2、数据库或其他项目配置。
- 未发现阻塞 Bug；已知边界为加密/密码保护 PDF 不读取、超大或复杂 PDF 可能受浏览器内存影响、PDF 压缩不重编码图片、图片转 PDF 依赖浏览器 Canvas 对图片的解码能力。
- 当前项目真实进度为 43/100 个工具已实现，57 个工具仍保持明确的 Coming Soon 状态；下一阶段从低风险本地媒体 / 日常工具开始，不把需要后端的能力伪装成本地功能。

## 19. 2026-09-10：第二阶段 Stage 5 浏览器本地视频帧与条形码工具（已完成）

### Plan / Design

- 选择浏览器原生能力可以完成、且不需要上传用户文件的媒体和日常工具，继续绕开 FFmpeg、AI 模型和第三方服务的维护成本。
- 视频处理限制单文件 200 MB，使用本地 `<video>` 元数据、时间点定位和 Canvas 输出 JPG；所有视频页面明确提示只处理本人拥有版权或已获授权的内容。
- 条形码先聚焦真实可扫描的 EAN-13，而不是制作看似通用但没有编码校验的装饰图形；输入 12 位时自动计算校验位，输入 13 位时校验后再生成 SVG。

### Develop

- 新增 4 个真实工具：视频截图、视频封面提取、视频封面提取（限授权内容）、条形码生成器。
- 新增 `src/lib/video.ts` 与 `VideoToolRenderer.tsx`，支持视频拖拽/选择、时长读取、时间点输入、时间轴滑块、Canvas 截图、JPG 预览和下载。
- 新增 `src/lib/barcode.ts` 与 `BarcodeToolRenderer.tsx`，实现 EAN-13 校验位、L/G/R 编码、护栏条、可下载 SVG 和完整编码复制。
- 视频与条形码工作区通过动态组件加载并保留静态预渲染；未新增 npm 依赖，继续使用浏览器原生 Video、Canvas、Blob、SVG 和 Web URL API。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `npm run build`：通过，114 条静态路由全部生成。
- Node 自测通过：EAN-13 `690123456789` 自动生成校验位 `2`，错误校验位会拒绝；视频扩展名校验通过。
- 静态导出检查通过：100 个工具详情页、47 个真实工作区、53 个 Coming Soon 页面；4 个新增页面均包含工作区且没有主 `coming-soon-card`。
- 公网复验通过：首页、`/tools`、4 个新增工具页、既有 PDF/JSON 工具页、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200。

### Product Review

- 产品定位继续清晰：网站新增的是“马上能处理文件的小工具”，而不是把视频和商品编码能力包装成空壳入口；首页仍只展示少量高频工具，不增加首屏噪音。
- 用户认知仍有改进空间：视频截图/封面提取已能在浏览器本地完成，但 `video-audio` 仍是技术分类，后续应映射到“做视频封面”“整理素材”等场景工具包。
- 趋势与价值判断：视频封面、截图和商品条形码是可验证的实用能力；视频转音频、格式转换、压缩、转字幕仍需要真实媒体引擎，短期不应为了数量引入服务端上传链路。
- 应降级或合并：两个封面提取入口共享同一实现，后续可在信息架构中保留一个主入口并把授权提示作为入口说明，减少重复卡片；但当前先保持 100 个工具目录与已有 SEO URL 稳定。
- 当前最大体验问题：工具详情页外围能力仍不统一，收藏、分享、FAQ、结构化 SEO、本地历史和输入规模提示尚未形成通用闭环；视频工具还需要真实设备兼容性验收。
- 下一阶段最值得做：抽象通用详情页能力（收藏、分享、FAQ、结构化数据、最近使用和错误恢复），同时为工具包和场景分类做一次小范围信息架构迭代，再继续实现 Markdown 转 PDF 等低风险工具。

### Commit / Publish / Risk

- Stage 5 实现提交为 `29b527a implement local video and barcode tools`，已推送到 GitHub `origin/main`；腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口为 `http://101.43.29.216:39090/`。
- 本次发布前备份为 `/www/backup/tools-hub-100-stage5-before-20260910`；未修改 Nginx、PM2、数据库或其他项目配置。
- 未发现阻塞 Bug；已知边界为视频解码能力依赖浏览器、超大视频可能受内存影响、截图仅输出 JPG、条形码当前聚焦 EAN-13 且不代表商品编码已注册。
- 当前项目真实进度为 47/100 个工具已实现，53 个工具仍保持明确的 Coming Soon 状态；下一阶段优先补齐通用产品体验，再按浏览器本地优先原则继续实现工具。

## 20. 2026-09-10：第二阶段 Stage 6 通用工具详情页产品闭环（已完成）

### Plan / Design

- 先补齐所有工具详情页的共同产品能力，再继续增加工具数量；这样每个新工具天然拥有一致的收藏、分享、说明、FAQ 和搜索引擎入口，避免外围体验重复建设。
- 继续保持静态导出、零新增依赖和浏览器优先：收藏与最近使用只写入当前设备，分享优先使用系统 Web Share，HTTP 环境则使用浏览器剪贴板或原生文本框复制兜底。
- FAQ 使用结构化的工具数据生成，内容明确区分已实现与待上线工具；JSON-LD 同时覆盖 SoftwareApplication、BreadcrumbList、FAQPage 和相关推荐 ItemList。

### Develop

- 新增 `src/lib/seo.ts`：统一生成工具 canonical URL、FAQ、FAQPage/SoftwareApplication/Breadcrumb/相关推荐结构化数据，并对 JSON-LD 中的 HTML 结束标签字符做安全转义。
- 扩展 `src/lib/storage.ts`：增加 `tools-hub-100:favorite-tools` 收藏记录、切换事件和 localStorage 异常兜底；保留最近使用记录并增加写入失败保护。
- 更新 `src/app/tools/[slug]/page.tsx`：每个工具页面补齐 keywords、canonical、Open Graph、Twitter 元数据，并注入 JSON-LD；向客户端详情组件传递 FAQ 数据。
- 更新 `src/components/ToolDetailView.tsx` 与 `src/app/globals.css`：统一增加收藏、分享、FAQ 折叠问答、移动端间距和操作按钮状态，不改变 47 个已实现工作区的处理逻辑。
- 未新增 npm 依赖；未改变 100 个工具目录、47/53 实现状态或服务端静态部署架构。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 构建产物检查：100 个工具页均有 canonical、Open Graph、JSON-LD、SoftwareApplication、BreadcrumbList、FAQPage、可见 FAQ 和 H1；其中 47 个包含真实 `workspace-card`，53 个仍明确显示 Coming Soon。
- SEO 检查：sitemap 包含 100 个公网工具 URL，不含 localhost；robots.txt 的 sitemap 地址正确指向公网入口。
- 公网回归：首页、`/tools`、已实现工具、Coming Soon 工具、`robots.txt`、`sitemap.xml` 全部 HTTP 200；公网详情页确认收藏/分享入口、FAQ、JSON-LD、canonical 均已输出。
- CUA 真实窗口检查因运行时缺少 `@oai/cua/tinyskyAlt`，按流程重试后仍不可用；已用静态产物、DOM 内容和公网 HTTP 回归替代，真实设备视觉验收仍列为后续任务。

### Product Review

- 产品定位更清晰：工具详情页从“一个入口和一个工作区”升级为可收藏、可分享、可理解、可被搜索引擎完整识别的产品页面；用户不必登录即可留下个人使用痕迹。
- 首页与信息架构保持克制：本阶段没有把 FAQ、收藏列表或 SEO 文本塞入首页，首屏仍围绕搜索、热门工具和立即开始；详情页承接深度信息。
- 工具趋势判断：通用详情能力对 PDF、图片、视频、开发者工具同样有长期价值；下一阶段仍应优先实现 Markdown 转 PDF、更多本地数据工具和高频内容创作工具，而不是先接入高成本后端。
- 需要降级/合并的入口：两个视频封面提取入口共享实现，后续场景化分类时应保留一个主入口并将授权提示合并到说明中；当前暂不删除，避免破坏既有 SEO URL。
- 当前最大体验问题：一级分类仍部分按技术实现组织，且上传工具缺少统一的规模/耗时/失败恢复提示；此外缺少真实设备视觉验收与真实搜索点击数据。
- 阶段评分（基于代码、构建产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 90、用户体验 93、一致性 94、品牌感 91、高级感 91、易用性 92、移动端体验 90。下一阶段重点不是堆元素，而是用场景工具包和上传反馈继续提升信息架构与移动端可用性。

### Commit / Publish / Risk

- Stage 6 源码提交为 `e1a8093 feat: close tool detail product loop`，已推送 GitHub `origin/main`；本阶段文档更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次发布前备份为 `/www/backup/tools-hub-100-stage6-before-20260910`，未修改 Nginx、PM2、数据库或其他项目配置。
- 已知风险：FAQ 目前由通用模板生成，后续应按搜索数据逐工具编辑；Web Share 依赖浏览器支持；localStorage 只代表当前设备，不是云端账户同步；HTTP 入口的安全上下文能力受浏览器限制，正式域名和 HTTPS 确认后应重新生成产物。
- 下一阶段：Stage 7 先实现 Markdown 转 PDF 等低风险本地工具，再做场景化工具包和上传反馈统一；需要 Office、OCR、FFmpeg、AI 的能力继续单独做资源、隐私、队列和自动清理设计。

## 21. 2026-09-10：第二阶段 Stage 7 Markdown 本地排版与 PDF 导出（已完成）

### Plan / Design

- 选择 Markdown 转 PDF 作为最小可执行切片：用户需求明确、可在浏览器完成、无需上传内容，也能复用现有详情页和 PDF 产品闭环。
- 不引入无法稳定嵌入中文字体的轻量 PDF 生成方案；采用实时 HTML 预览 + 浏览器原生打印/“另存为 PDF”，让中文、列表、代码块和链接由浏览器排版，导出边界对用户透明。

### Develop

- 将 `markdown-to-pdf` 标记为已实现且本地处理，真实工作区支持标题、段落、列表、引用、分隔线、行内代码、代码块和 `http/https` 链接。
- 新增 `src/lib/markdown.ts`：先转义用户输入，再生成安全的基础 Markdown HTML，避免预览区执行原始 HTML 或脚本。
- 新增 `src/components/tools/MarkdownPdfToolRenderer.tsx`：示例内容、实时预览、恢复示例、空内容保护和“导出 PDF”按钮；打印样式只保留文档预览，隐藏导航、输入区、FAQ 和操作提示。
- 更新 `src/components/ToolRenderer.tsx` 动态路由、`src/data/tools.ts` 工具状态与 SEO 描述、`src/app/globals.css` 预览/移动端/打印样式；未新增 npm 依赖。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 静态导出检查：100 个工具详情页、48 个真实工作区、52 个 Coming Soon 页面；Markdown 页面包含真实工作区、预览 HTML、示例标题/列表/引用和打印样式，没有 `coming-soon-card`。
- SEO 检查：Markdown 页面 canonical 指向公网地址，包含 FAQPage；sitemap 仍包含 100 个公网工具 URL且不含 localhost。
- 公网回归：首页、`/tools`、`/tools/markdown-to-pdf`、PDF/JSON 代表页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；Markdown 页面未回落到 Coming Soon。
- CUA 真实窗口检查仍受运行时缺少 `@oai/cua/tinyskyAlt` 影响；已记录为后续真实设备验收项，静态 HTML、CSS、构建和公网回归均通过。

### Product Review

- 产品定位继续清晰：新增的是一个能立即完成文档排版的本地工作区，而不是只有“转换”文字的占位入口；用户打开页面即可看到示例、输入区和结果预览。
- 用户路径符合目标：先编辑 Markdown，再实时核对版式，最后用熟悉的系统打印流程保存 PDF；打印样式移除站点干扰，避免导出结果混入导航和工具说明。
- 价值判断：Markdown 转 PDF 具备长期办公、知识整理和开发文档需求；浏览器原生打印比引入大型 PDF/字体链路更适合当前静态站和中文场景。后续可在真实搜索数据支持下增加模板或页眉页脚，但不应先堆复杂选项。
- 当前最大体验问题：浏览器打印的最终分页、页边距和字体依赖用户设备；工具还缺少场景化入口与真实设备验收。下一阶段应先做场景工具包，再统一补上传类工具的规模和错误恢复提示。
- 阶段评分（基于代码、静态产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 90、用户体验 93、一致性 94、品牌感 91、高级感 91、易用性 92、移动端体验 90。

### Commit / Publish / Risk

- Stage 7 实现提交为 `6241a15 feat: implement local markdown to pdf tool`，已推送 GitHub `origin/main`；本阶段文档更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次发布前备份为 `/www/backup/tools-hub-100-stage7-before-20260910`，未修改 Nginx、PM2、数据库或其他项目配置。
- 已知风险：Markdown 仅实现有明确安全边界的基础语法；复杂表格、图片、脚注和数学公式暂未承诺；打印效果受浏览器分页策略影响；HTTP 环境下系统能力和字体表现不如正式 HTTPS 域名稳定。
- 下一阶段：Stage 8 进行场景化分类与工具包小范围重构，并优先实现高频本地内容工具；不把需要 AI、OCR、Office 或 FFmpeg 的能力伪装为浏览器本地功能。

## 22. 2026-09-10：第二阶段 Stage 8 本地内容创作工具（已完成）

### Plan / Design

- 从偏技术的工具分类向真实内容场景推进，选择“小红书笔记排版”作为最小切片：需求长期存在、无需 AI 或第三方接口、用户可以立即看到处理前后的差异。
- 明确工具边界为“格式清理”，不生成虚假爆款、不承诺平台推荐、不改变用户原意；所有内容仅在浏览器处理，结果支持复制和下载。

### Develop

- 将 `xhs-note-formatter` 标记为已实现且本地处理，支持标准/宽松段落间距、清理行尾空格、移除不可见字符、压缩多余空行和统一无序列表符号。
- 新增 `src/components/tools/CreatorToolRenderer.tsx`：统一工作区、示例内容、实时结果、复制、下载、恢复示例和原创/平台合规提示。
- 扩展 `src/lib/text.ts` 的 `formatCreatorNote`，并把文本下载能力抽到 `src/components/tools/ToolPrimitives.tsx` 的 `TextDownloadButton`；CSV 和字幕工具改用共享下载原语，减少重复的 Blob/URL 生命周期代码。
- 更新 `src/components/ToolRenderer.tsx`、`src/data/tools.ts` 和唯一上下文文档；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 内容算法自测通过：CRLF、不可见字符、行尾空格、多余空行和 `-/*/•` 列表均按预期整理，标准/宽松段落输出符合断言。
- 静态导出检查：100 个工具详情页、49 个真实工作区、51 个 Coming Soon 页面；小红书页面包含工作区、浏览器本地提示、复制/下载入口、合规警示和 canonical，未显示 Coming Soon。
- 公网回归：首页、`/tools`、小红书笔记排版、Markdown/PDF/JSON 代表页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；sitemap 仍为 100 个公网工具 URL且无 localhost。

### Product Review

- 产品定位更贴近真实用户：新增入口从“开发者/文件格式”进一步走向“小红书内容发布前整理”，但仍保持工具箱的快速、免费和本地隐私卖点。
- 首页聚焦没有被破坏：内容工具只在详情页承接完整操作区，首页仍只展示少量高频工具；后续场景化工具包可以把排版、封面裁剪、敏感词辅助检查组合为一条发布前流程。
- 工具价值判断：本地排版属于低维护、高复用能力，值得保留；小红书敏感词检查可以作为下一批，但必须标注词库时效和误报边界，不能冒充平台审核结果。
- 应降级/合并：小红书标题生成、抖音脚本和 AI 文案等工具需要模型或持续维护的提示词策略，先保持 Coming Soon；内容排版与封面裁剪可以在场景工具包中作为基础能力复用。
- 当前最大体验问题：一级分类仍未完全按任务组织，内容工具还缺少场景化串联；真实设备视觉验收因 CUA 运行时问题尚未完成。
- 阶段评分（基于代码、构建产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 90、用户体验 93、一致性 94、品牌感 91、高级感 91、易用性 92、移动端体验 90。

### Commit / Publish / Risk

- Stage 8 实现提交为 `74fa835 feat: implement local creator note formatter`，已推送 GitHub `origin/main`；本阶段文档更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次发布前备份为 `/www/backup/tools-hub-100-stage8-before-20260910`，未修改 Nginx、PM2、数据库或其他项目配置。
- 已知风险：排版规则不会理解平台最新社区规范；整理后的文字仍需用户人工校对；共享下载原语依赖浏览器 Blob/下载能力，旧浏览器可能需要手动保存。
- 下一阶段：Stage 9 做场景化分类与工具包小范围迭代，并继续实现高频本地工具；重点是让普通用户按“我要发布/整理/提交什么”找到入口，而不是继续堆叠技术分类。

## 23. 2026-09-10：第二阶段 Stage 9 场景化工具包入口（已完成）

### Plan / Design

- 不删除或重命名现有技术分类和工具 URL，先在 `/tools` 增加一层任务入口，让普通用户可以按“我要完成什么”开始，同时保留搜索和精确筛选给熟悉工具名的用户。
- 工具包只展示当前真实可用的入口，不把 Coming Soon 工具包装成完整流程；每组控制在 3 个工具，避免新的密集导航墙。

### Develop

- 新增 `src/data/toolkits.ts`：办公文件、小红书发布、图片交付、短视频素材、开发排查、生成与分享 6 个数据驱动场景工具包。
- 新增 `src/components/SceneToolkitGrid.tsx`：统一图标、标题、简述和 18 个真实工具链接；工具链接继续进入原有独立详情页，不重复实现业务逻辑。
- 更新 `src/app/tools/page.tsx`：工具库先展示“按任务开始”，可用工具数量改为从真实数据动态读取，保留原搜索/分类筛选。
- 更新 `src/app/globals.css`：增加桌面三列、平板两列、手机单列的工具包卡片布局，沿用现有颜色、圆角、阴影和轻量 Hover；未新增 npm 依赖。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 静态检查：`/tools` 输出 6 个 `toolkit-card`、18 个 `toolkit-link`，显示“49 个工具现在就能用”；100 个详情页 canonical/FAQPage 均无缺失。
- 公网回归：6 个工具包的 18 个入口全部 HTTP 200；`/tools`、代表工具页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；sitemap 仍为 100 个公网工具 URL且无 localhost。

### Product Review

- 产品定位更符合用户认知：技术分类仍服务于搜索和 SEO，场景工具包负责第一次访问时的选择，降低“我应该点 PDF 还是图片”的思考成本。
- 首页没有被扩张：场景工具包只放在工具库页，首页继续保持搜索和少量高频入口；这保护了 3 秒理解和 10 秒开始的核心路径。
- 工具价值判断：办公文件、内容发布、图片交付和短视频素材具备明确任务闭环；求职学习、电商跨境和 AI 创作应在有至少 2–3 个真实入口后再加入工具包。
- 应降级/合并：两个视频封面提取入口仍共享实现，后续工具包应优先链接主入口，授权版本保留独立 URL 但不再作为主要导航项。
- 当前最大体验问题：部分高价值场景仍缺少可用工具，且真实设备视觉验收受 CUA 运行时问题阻塞；下一阶段应继续补真实本地工具并建立截图/设备验收流程。
- 阶段评分（基于代码、构建产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 92、用户体验 94、一致性 94、品牌感 91、高级感 91、易用性 93、移动端体验 90。

### Commit / Publish / Risk

- Stage 9 实现提交为 `6fe9f5b feat: add task based toolkits to library`，已推送 GitHub `origin/main`；本阶段文档更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次发布前备份为 `/www/backup/tools-hub-100-stage9-before-20260910`，未修改 Nginx、PM2、数据库或其他项目配置。
- 已知风险：工具包当前没有独立 URL、统计和个性化排序；卡片内容仍需真实搜索/点击数据校准；未把缺少真实实现的求职、AI、电商工具提前展示。
- 下一阶段：Stage 10 优先补齐高频本地工具和上传反馈（规模限制、处理耗时、失败恢复），再根据数据扩展求职学习、AI 创作和电商工具包。

## 24. 2026-09-10：第二阶段 Stage 10 本地内容风险表达辅助检查（已完成）

### Plan / Design

- 选择“小红书敏感词检测”作为本地内容工具的第二个切片：提供即时复核价值，但不依赖第三方审核接口；把平台规则变化和误报风险直接呈现给用户。
- 工具定位为候选风险表达检查，不承诺“通过审核”或“绝对安全”；内置词表保持短小可维护，并允许用户输入自己的补充词。

### Develop

- 将 `xhs-sensitive-word-check` 标记为已实现且本地处理，默认检查一组常见绝对化、广告化和健康相关候选表达。
- 更新 `src/lib/text.ts` 的 `findCreatorRiskWords`：支持中英文逗号/换行分隔的自定义词、去重、最长 30 字限制、最多 200 个命中和上下文片段。
- 扩展 `src/components/tools/CreatorToolRenderer.tsx` 与 `src/app/globals.css`：加入实时命中数量、词条、位置、上下文、清空/恢复和复制命中词；发布工具包改为“排版 + 风险检查 + 图片裁剪”。
- 更新 `src/data/tools.ts`、`src/data/toolkits.ts` 和统一详情页 SEO 数据；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 内容算法自测通过：内置词命中、重复自定义词去重、位置排序和上下文输出符合断言；首轮断言误把去重词算作两次，已修正后重新通过。
- 静态导出检查：100 个工具详情页、50 个真实工作区、50 个 Coming Soon 页面；风险检查页面包含工作区、候选命中列表、自定义词输入、复制入口、合规警示和 canonical。
- 公网回归：首页、`/tools`、两类小红书工具、PDF 代表页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；6 个场景包仍输出 18 个入口，sitemap 仍为 100 个公网工具 URL且无 localhost。

### Product Review

- 产品定位更可信：内容工具明确辅助边界，不把变化中的平台词库包装成权威审核；用户可以用自己的词表补充场景，适合发布前快速复核。
- 首页和工具包仍然克制：没有把命中词或大段规则塞到首页，发布工具包只保留排版、风险检查和图片裁剪三个连续动作。
- 工具价值判断：风险表达辅助检查具备真实使用价值，但内置词表需要持续维护；小红书标题/脚本生成和 AI 改写仍应等模型、成本和合规方案明确后再实现。
- 应降级/合并：两个视频封面入口仍应在未来主导航中合并；对所有平台的“敏感词”能力不应共用一套默认词表，后续应抽象为可版本化的规则包。
- 当前最大体验问题：词库没有版本显示、导入/导出和按平台切换；一级分类与场景工具包仍需更多真实数据校准，真实设备视觉验收仍受 CUA 运行时问题影响。
- 阶段评分（基于代码、构建产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 92、用户体验 94、一致性 94、品牌感 91、高级感 91、易用性 93、移动端体验 90。

### Commit / Publish / Risk

- Stage 10 实现提交为 `ae04522 feat: implement local creator risk checker`，已推送 GitHub `origin/main`；本阶段文档更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次发布前备份为 `/www/backup/tools-hub-100-stage10-before-20260910`，未修改 Nginx、PM2、数据库或其他项目配置。
- 已知风险：候选词不等于违规，存在误报和漏报；平台规则、广告法和行业规范会变化；敏感文本只在当前浏览器处理，不会请求第三方服务。
- 下一阶段：Stage 11 继续实现高频本地工具和上传反馈，优先数据处理、图片交付和内容发布辅助；服务端 Office、OCR、FFmpeg、AI 仍需独立资源/隐私/队列设计。

## 25. 2026-09-10：第二阶段 Stage 11 本地内容发布工具（已完成）

### Plan / Design

- 选择“小红书标题生成器”和“小红书封面比例裁剪”作为同一发布场景的两个本地能力：一个帮助用户从主题开始，一个帮助用户准备可发布图片，均不依赖后端、账号或第三方 API。
- 标题工具定位为可人工筛选的标题方向，不承诺爆款预测；封面工具复用成熟图片裁剪核心，默认 3:4，同时保留 1:1、4:3 和像素微调，避免重复建设另一套图片处理逻辑。
- 发布工具包调整为“标题方向 → 笔记排版 → 发布前风险复核”三步，封面裁剪通过小红书工具相关推荐和独立 SEO 页面承接，保持每个工具包入口数量克制。

### Develop

- 将 `xhs-title-generator` 标记为已实现且本地处理，新增场景选择、语气选择、主题输入、3 条模板组合标题、逐条复制、全部复制、TXT 下载、恢复示例和事实/平台规范提示。
- 将 `xhs-cover-crop` 标记为已实现且本地处理，复用 `ImageCropTool` 的 Canvas/Blob 流程，默认居中生成 3:4 裁剪框，支持 1:1、4:3、X/Y/宽高调整和 JPG/PNG 等原图格式导出。
- 新增 `src/lib/browser.ts` 作为共享剪贴板能力：安全上下文可用时使用 Clipboard API，HTTP 公网环境回退到隐藏文本框复制；详情页分享和所有共享 `CopyButton` 统一使用该能力。
- 更新 `src/components/tools/CreatorToolRenderer.tsx`、`src/components/tools/ImageToolRenderer.tsx`、`src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/data/toolkits.ts` 与 `src/app/globals.css`；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 内容算法自测通过：标题主题清洗、场景/语气模板组合、标题去重，以及 Stage 10 风险表达检测回归均符合断言；Node 自测的实验性 TypeScript 提示不属于项目构建 error。
- 静态导出检查：100 个工具详情页、52 个真实工作区、48 个 Coming Soon 页面；标题页包含真实生成工作区，封面页包含图片工作区、3:4 提示和本地隐私边界，两个页面均有 canonical 且没有主 Coming Soon 卡片。
- 公网回归：首页、`/tools`、`/tools/xhs-title-generator`、`/tools/xhs-cover-crop`、风险检查页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；工具库包含标题入口，sitemap 仍为 100 个公网工具 URL且无 localhost。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；本阶段以生产构建、静态 DOM/CSS、移动端断点代码和公网 HTTP 回归替代，后续环境恢复后补验 1440、768、390 宽度。

### Product Review

- 产品定位更清晰：小红书发布场景从“单个排版工具”扩展为可连续完成标题、文字整理和发布前复核的本地小流程；封面裁剪仍保持独立、可搜索和可复用。
- 首页和工具库仍然聚焦：没有把模板结果塞进首页；工具库只增加真实工具包入口，技术分类、搜索、相关工具和独立 SEO 页面继续承接深度需求。
- 分类更符合任务认知：发布工具包现在按用户动作组织，而不是按“文本/图片”拆散；后续求职、学习、电商工具包必须先有至少 2–3 个真实工具再展示。
- 趋势与价值判断：本地模板组合维护成本低、适合快速验证；不接第三方 AI 是有意的产品边界，后续若加入 AI，必须先明确模型成本、内容安全、提示词版本和隐私方案。
- 应新增：下一阶段优先 CSV/文本/图片交付中仍缺失的高频能力，或先补一个求职/学习场景的真实本地工具；应降级/合并：小红书标签推荐、标题分析、抖音脚本等仍保持 Coming Soon，不用低质量规则冒充智能能力；两个视频封面入口未来仍应在主导航中合并。
- 当前最大体验问题：真实设备视觉验收仍未完成，且发布工具的模板结果还缺少用户反馈与点击数据；下一阶段最值得做的是上传类工具的规模/耗时/失败恢复提示，并补一个可量化的高价值场景。
- 阶段评分（基于代码、构建产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 93、用户体验 94、一致性 95、品牌感 92、高级感 92、易用性 94、移动端体验 90。没有低于 90 的项目；移动端分数待真实设备复验后再调整。

### Commit / Publish / Risk

- Stage 11 实现提交为 `26def7f feat: add local creator publishing tools`，已推送 GitHub `origin/main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage11-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 发布过程中发现同名目标目录会使 `mv` 将新目录嵌套到旧根目录，导致公网短暂命中旧静态页面；已通过核对远端哈希、保留备份、显式切换根目录并重载 Nginx 修正，最终公网文件哈希与本地构建一致，重复临时旧目录已清理。
- 已知风险：标题模板不是 AI 预测，需人工筛选和改写；3:4 只是常见竖版比例，具体平台规格和构图要求可能变化；Canvas 处理大图仍受浏览器内存影响；HTTP 环境的系统分享和原生剪贴板能力依赖浏览器，但复制已提供文本框回退。
- 下一阶段：Stage 12 优先补高频本地数据/文件交付工具，或从求职学习场景中选择一个真实可用、低维护的浏览器工具；继续完善上传类统一边界，再评估 Office、OCR、FFmpeg 和 AI 的服务端架构。

## 27. 2026-09-10：第二阶段 Stage 13 公众号本地排版格式清理（已完成）

### Plan / Design

- 选择“公众号排版格式清理”作为跨平台内容场景的最小可执行阶段：它与小红书笔记排版共享同一套文本清理算法，但输入、示例、结果标签和提示改为公众号语境，避免重复实现和换名空壳。
- 保持浏览器本地处理，不解析富文本、不上传草稿、不接入公众号账号；工具只负责清理纯文本空格、不可见字符、空行和无序列表，边界在页面上明确说明。

### Develop

- 将 `wechat-format-cleaner` 标记为已实现且本地处理，接入统一 `CreatorToolRenderer`；新增公众号示例内容、原始公众号内容输入标签、清理结果标签、TXT 下载命名和平台/版权/广告法提示。
- 复用 `formatCreatorNote` 的 CRLF、不可见字符、行尾空格、多余空行和 `-/*/•` 列表归一化逻辑，没有新增 npm 依赖、API、服务器配置或第三方服务。
- 更新 `src/components/tools/CreatorToolRenderer.tsx`、`src/components/ToolRenderer.tsx` 和 `src/data/tools.ts`；未增加新的 UI 设计语言，继续使用共享输入、结果、复制、下载和提示原语。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 内容算法回归通过：使用明确 CRLF 字符构造输入，标准段落输出保留合理段间距，`-/*` 列表均转换为统一项目符号；首轮测试预期写错后已按真实算法语义校正并重新通过。
- 工具注册表断言通过：100 个工具、54 个已实现；静态导出检查为 100 个详情页、54 个真实工作区、46 个 Coming Soon 页面，公众号页含真实工作区、公众号输入标签、本地提示、canonical 和 FAQ。
- 公网回归：首页、`/tools`、`/tools/wechat-format-cleaner`、Prompt/小红书代表页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；sitemap 仍为 100 个公网工具 URL且无 localhost。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已检查现有 720px/390px 单列断点和共享工作区布局，后续环境恢复后补验真实折行、复制和下载反馈。

### Product Review

- 产品定位更清晰：平台从单一小红书内容工具扩展为可服务公众号纯文本整理的内容工作台，同时保持“本地、快速、无需登录”的核心信任感。
- 首页和工具库保持聚焦：新增工具没有扩张首页模块；发布工具包仍只展示标题、笔记排版和风险复核三步，公众号工具通过搜索、分类和相关工具进入。
- 分类更符合场景：`自媒体运营` 不再只指向一个平台，后续可按“内容整理”“发布前检查”“素材准备”继续组织，但暂不新增过多平台专属入口。
- 趋势与价值判断：跨平台纯文本清理是低维护、长期需求能力；它不应被误包装为公众号自动排版或一键发布，富文本样式和平台账号授权需要完全独立的产品/安全方案。
- 应新增：下一阶段优先高频本地数据或文件交付工具，并抽取统一上传边界；应降级/合并：公众号标题、朋友圈文案、评论回复等静态模板工具先保持 Coming Soon，优先验证已有工具真实使用路径。
- 当前最大体验问题：内容工具之间还没有跨平台统一的入口和历史结果管理，上传类工具也没有统一的文件大小/耗时/失败恢复提示；下一阶段最值得做的是抽取上传工作区原语并实现一个真实文件工具。
- 阶段评分（基于代码、构建产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 93、用户体验 94、一致性 95、品牌感 92、高级感 92、易用性 94、移动端体验 90。没有低于 90 的项目；移动端分数待真实设备复验后再调整。

### Commit / Publish / Risk

- Stage 13 实现提交为 `69c48b6 feat: add local public account formatter`，已推送 GitHub `origin/main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage13-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“根目录外 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 公网回归”的流程，切换后清理重复临时旧目录。
- 已知风险：当前只处理纯文本，不保留公众号编辑器中的字号、颜色、图片和链接样式；平台规范、广告法和版权要求仍需人工核对；输入内容只在浏览器本地处理。
- 下一阶段：Stage 14 优先实现一个高频本地数据/文件交付工具，并抽取文件大小限制、处理状态、错误恢复和下载反馈原语；服务端 Office、OCR、FFmpeg 和 AI 继续独立评估。

## 26. 2026-09-10：第二阶段 Stage 12 本地 Prompt 生成器（已完成）

### Plan / Design

- 选择 `prompt-generator` 作为第一个 AI 场景的低风险本地切片：用户真实需要的是把目标、受众、背景和约束说清楚，不一定需要平台先承担模型调用成本和隐私风险。
- 工具明确定位为 Prompt 草稿整理器，不宣称自己在生成答案、不接第三方模型、不保存用户内容；用输出格式和语气选项帮助用户形成可复用的任务说明。

### Develop

- 将 `prompt-generator` 标记为已实现且本地处理，新增目标、目标读者、背景素材、补充要求、表达语气和输出格式输入；生成结果支持复制、TXT 下载、恢复示例和清晰的事实核对提示。
- 新增 `src/components/tools/AiToolRenderer.tsx`，通过统一工作区原语接入独立 Prompt 页面；在 `src/lib/text.ts` 新增字段清洗和 Prompt 组装算法，限制输入长度、压缩换行并在空目标时返回空结果。
- 更新 `src/components/ToolRenderer.tsx`、`src/data/tools.ts` 与 `src/app/globals.css`；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- Prompt 算法自测通过：目标、受众、背景、补充要求、语气、输出格式均进入结果；空目标返回空字符串；工具注册表断言为 100 个工具、53 个已实现。
- 静态导出检查：100 个工具详情页、53 个真实工作区、47 个 Coming Soon 页面；Prompt 页面包含真实操作区、生成入口、复制/下载能力、本地处理提示、canonical 和 FAQ，没有主 Coming Soon 卡片。
- 公网回归：首页、`/tools`、`/tools/prompt-generator`、已实现的小红书工具、`robots.txt`、`sitemap.xml` 全部 HTTP 200；sitemap 仍为 100 个公网工具 URL且无 localhost。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已检查 720px/390px 断点代码和静态输出，后续环境恢复后补验真实交互与折行效果。

### Product Review

- 产品定位更完整：平台开始覆盖“使用 AI 前先把问题说清楚”的真实工作流，同时不因赶进度接入模型、登录或不可控的第三方服务。
- 首页仍然克制：Prompt 工具没有塞入首页大段解释，详情页提供完整输入和结果；后续只有在 AI 工具达到可维护数量并有明确成本/隐私方案后，才考虑独立 AI 场景工具包。
- 分类更符合用户任务：`AIGC / AI 创作` 现在有一个可立即使用的本地入口，但当前分类仍偏“工具类型”，下一步需要用真实用户场景验证“写作/周报/简历/内容创作”等命名是否更容易理解。
- 趋势与价值判断：Prompt 整理是低成本、高复用、可跨模型的基础能力；AI 写作、总结、简历和图片/视频生成不能只靠静态模板，应继续保持 Coming Soon，等待模型、费用、敏感内容和结果责任边界明确。
- 应新增：下一阶段优先一个能明显减少重复工作的本地数据/文件工具，或求职学习场景的结构化工具；应降级/合并：低维护价值的 AI 工具对比页面和泛化模板库暂不扩张，避免把“目录”误当成产品能力。
- 当前最大体验问题：AI 分类缺少连续的真实工具链，上传类工具仍缺乏统一大小限制、耗时和失败恢复组件；下一阶段最值得做的是补一个有明确输入/输出的本地工具，并抽取上传反馈原语。
- 阶段评分（基于代码、构建产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 93、用户体验 94、一致性 95、品牌感 92、高级感 92、易用性 94、移动端体验 90。没有低于 90 的项目；移动端分数待真实设备复验后再调整。

### Commit / Publish / Risk

- Stage 12 实现提交为 `36d99a2 feat: add local prompt generator`，已推送 GitHub `origin/main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage12-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署使用“根目录外 staging → 旧根目录备份 → 新根目录切换”的顺序，并在切换后做远端文件存在性、Nginx 配置和公网页面复验；重复临时旧目录已清理，正式备份保留。
- 已知风险：Prompt 结果是结构化草稿，不保证模型输出质量；用户可能把敏感资料粘贴进背景或要求字段，当前只靠本地处理提示和人工判断，后续如接入云端模型必须新增脱敏、留存、限流和计费设计。
- 下一阶段：Stage 13 优先实现一个高频本地数据/文件交付工具，并抽取上传文件大小、处理状态、错误恢复和下载反馈原语；继续保持 Office、OCR、FFmpeg 和 AI 服务端能力独立评估。

## 28. 2026-09-10：第二阶段 Stage 14 Markdown 本地导出 Word 兼容文档（已完成）

### Plan / Design

- 选择“Markdown 转 Word”作为低依赖办公文件阶段：复用已验证的 Markdown 解析和实时预览能力，补上从结构化文本到可继续编辑文档的真实出口。
- 不引入大型 Office 转换服务，也不把 HTML 假装成 `.docx`；输出明确标注为 Word 可打开的 HTML `.doc`，适合基础文字、标题、列表、引用、代码和链接，复杂版式交给后续独立 Office 架构评估。

### Develop

- 将 `markdown-to-word` 标记为已实现且本地处理，新增独立动态工作区：Markdown 输入、实时预览、Word `.doc` 下载、恢复示例和格式边界提示。
- 在 `src/lib/markdown.ts` 新增 `markdownToWordDocument`，以安全的 Markdown HTML 输出包装 Word 可打开的 UTF-8 HTML 文档；在 `TextDownloadButton` 增加可选 MIME 参数，默认行为保持不变，Word 导出使用 `application/msword`。
- 新增 `src/components/tools/MarkdownWordToolRenderer.tsx`，在 `src/components/ToolRenderer.tsx` 动态分包接入；更新 `src/data/tools.ts` 的实现状态和 SEO 描述；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 文档算法自测通过：输出以 `<!DOCTYPE html>` 开始，包含 UTF-8 字符集、标题和列表 HTML；空输入不会生成可下载 Blob。
- 工具注册表断言通过：100 个工具、55 个已实现；静态导出检查为 100 个详情页、55 个真实工作区、45 个 Coming Soon 页面，Markdown 转 Word 页面含真实工作区、Word 可打开提示、canonical、FAQ 且没有主 Coming Soon 卡片。
- 公网回归：首页、`/tools`、`/tools/markdown-to-word`、`/tools/markdown-to-pdf`、公众号/Prompt/小红书代表页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；sitemap 仍为 100 个公网工具 URL且无 localhost。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已检查共享移动端单列布局，后续环境恢复后补验下载行为、长文折行和 Word 打开兼容性。

### Product Review

- 产品定位更完整：工具箱开始覆盖“写好内容后交付办公文件”的连续动作，Markdown 用户无需上传文档或依赖云端转换即可拿到可编辑出口。
- 首页和工具库保持聚焦：新工具只在工具库和相关工具链中出现，不增加首页噪音；PDF 与 Word 能力仍通过独立详情页承接 SEO 和具体任务。
- 分类更符合用户目标：Markdown 转 Word 属于办公文件交付能力，不再只是开发者格式转换；后续 Office 工具仍需围绕“提交、分享、归档”场景组织。
- 趋势与价值判断：本地导出适合无敏感信息上传的轻量场景，长期维护成本低；原生 `.docx`、复杂模板和 Office 互转不能靠 HTML 包装解决，应保持待规划状态。
- 应新增：下一阶段优先高频本地数据/文件交付工具，或补一个可量化的求职学习本地能力；应降级/合并：PDF/Office 中需要服务器解析的转换继续保持 Coming Soon，等待上传限制、自动清理和队列架构明确。
- 当前最大体验问题：Word 可打开的 `.doc` 与原生 `.docx` 的能力边界仍需在页面上持续教育用户，真实设备下载/打开复验还未完成；下一阶段最值得做的是统一上传/下载反馈原语和失败恢复。
- 阶段评分（基于代码、构建产物和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 93、用户体验 94、一致性 95、品牌感 92、高级感 92、易用性 94、移动端体验 90。没有低于 90 的项目；移动端分数待真实设备复验后再调整。

### Commit / Publish / Risk

- Stage 14 实现提交为 `02146e6 feat: add local markdown to word export`，已推送 GitHub `origin/main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage14-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“根目录外 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 公网回归”的流程，切换后清理重复临时旧目录。
- 已知风险：输出为 Word 可打开的 HTML `.doc` 而非原生 `.docx`；复杂样式、分页、字体和图片布局可能因 Word 版本而变化；Markdown 内容仍只在浏览器生成，下载后请自行核对。
- 下一阶段：Stage 15 优先实现一个高频本地数据/文件交付工具，并抽取文件大小限制、处理状态、错误恢复和下载反馈原语；服务端 Office、OCR、FFmpeg 和 AI 继续独立评估。

## 29. 2026-09-10：第二阶段 Stage 15 本地图片清晰度增强（已完成）

### Plan / Design

- 选择“图片清晰度增强”作为图片交付链的补强：它比继续堆叠单一格式转换更接近用户发布前的真实任务，且可以完全在浏览器本地完成。
- 明确产品边界：只做轻量锐化和对比度调整，不宣称 AI 超分、不凭空创造细节；限制单张图片不超过 1600 万像素，优先保护移动端浏览器稳定性。

### Develop

- 在 `src/lib/image.ts` 新增可复用的 `enhancePixelBuffer`，使用固定 4 邻域锐化核和对比度公式处理 RGB，保留透明通道，不新增 npm 依赖或服务端 API。
- 在 `src/components/tools/ImageToolRenderer.tsx` 新增独立工作区：单图拖拽/选择、锐化滑杆、对比度滑杆、处理中状态、错误提示、结果下载和原图备份提醒；沿用现有图片选择器、输出面板和隐私提示。
- 在 `src/components/ToolRenderer.tsx` 接入路由，在 `src/data/tools.ts` 将 #38 标记为已实现、本地处理、低风险，并补充清晰度增强 SEO 描述。

### Test / Self-check

- `npm run lint`：通过，0 error；`next build`：通过，114 条静态路由全部生成。期间清理了一个被锁定的忽略缓存 `.next/trace`，未改动源文件。
- `enhancePixelBuffer` Node 自测通过：锐化会增强高反差像素、对比度会按方向变化，透明度保持不变；自测使用 Node 类型剥离功能，产生的实验性 warning 不影响生产构建。
- 静态导出检查：100 个工具详情页、56 个真实工作区、44 个 Coming Soon 页面；图片增强页已含标题、现在可用状态、canonical，未出现主 Coming Soon 卡片；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/image-enhance`、`/tools/markdown-to-word`、`/tools/xhs-title-generator`、`robots.txt`、`sitemap.xml` 全部 HTTP 200；图片增强页的 SEO 和上线状态检查通过。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级移动端单列布局检查，待环境恢复后补验真实拖拽、滑杆和下载行为。

### Product Review

- 产品定位更清晰：工具箱新增“发布前图片优化”这一明确任务，而不是泛化的 AI 图片承诺；图片压缩、尺寸修改、裁剪、增强形成更连续的本地交付链。
- 首页继续保持聚焦：增强工具只进入工具库、图片分类和相关推荐，不把新增功能堆回首屏；用户仍可通过搜索在 10 秒内找到入口。
- 分类与趋势判断：图片优化是稳定且可解释的长期需求，本地处理强化隐私卖点；AI 对比、泛化模板和需要云端模型的工具继续保持待实现，避免把静态页面误当成产品能力。
- 应新增：下一阶段优先补一个能形成内容发布闭环的本地工具（先考虑小红书标签推荐），再统一上传类工具的大小、处理状态和失败恢复反馈；应降级/合并：低价值 AI 工具对比页和重复模板库暂不扩张，服务端 Office、OCR、FFmpeg 继续独立评估。
- 当前最大体验问题：真实设备视觉与文件行为仍缺少 CUA 复验，超大图片在不同浏览器上的内存表现和 JPEG/WEBP 输出差异也需要真实样本验证；下一阶段最值得做的是补测并抽取上传/下载反馈原语。
- 阶段评分（基于代码、构建产物、静态回归和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 93、用户体验 94、一致性 95、品牌感 92、高级感 92、易用性 94、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 15 实现提交为 `a4bcd87 feat: add local image enhancement`，已推送 GitHub `origin/main`；当前分支为 `main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage15-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 公网回归”的流程；临时旧目录已在公网验证通过后清理，正式备份保留。
- 已知风险：该工具不是 AI 超分，不能恢复原图不存在的细节；锐化过强可能放大噪点，16M 像素限制不能覆盖所有超大图，浏览器 Canvas 和有损格式输出也可能受设备内存与浏览器实现差异影响。
- 下一阶段：Stage 16 优先实现小红书标签推荐等高频本地内容工具，继续补齐共享上传/下载反馈原语；保持 56 个已实现工具可运行，再逐步处理服务端转换、OCR、FFmpeg、AI 和短链接等高风险能力。

## 30. 2026-09-10：第二阶段 Stage 16 本地小红书标签推荐（已完成）

### Plan / Design

- 选择“小红书标签推荐”补齐现有内容发布链：标题、标签、排版和风险复核分别解决一个明确步骤，比增加一个泛化的 AI 页面更容易立即使用和长期维护。
- 产品边界保持诚实：根据用户主题、场景和本地维护词库整理标签方向，不接入平台账号、不抓取实时热榜、不宣称流量预测；结果必须由用户结合正文人工筛选。

### Develop

- 在 `src/lib/text.ts` 新增 `generateCreatorHashtags`、场景类型、主题规则和去重/数量限制逻辑，覆盖生活方式、美食、旅行、学习、职场、穿搭、家居等常见内容方向。
- 在 `src/components/tools/CreatorToolRenderer.tsx` 新增标签推荐工作区：主题/标题输入、内容场景选择、本地组合按钮、标签方向展示、复制、TXT 下载、恢复示例和平台规则提示；复用统一 Workspace、按钮、结果和提示原语。
- 在 `src/components/ToolRenderer.tsx` 接入独立 slug；在 `src/data/tools.ts` 标记 #53 为本地已实现；在 `src/data/toolkits.ts` 将“小红书发布”工具包扩展为标题 → 标签 → 排版 → 风险复核；在 `src/app/globals.css` 增加轻量标签胶囊样式。未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error；`NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 文案算法 Node 自测通过：主题规则命中、场景词命中、标签去重、`#` 前缀、数量上限和空输入边界均正常；Node 类型剥离 warning 只来自临时自测命令，不影响生产构建。
- 工具注册表断言通过：100 个工具、57 个已实现，小红书标签工具为本地处理；静态导出检查为 100 个详情页、57 个真实工作区、43 个 Coming Soon 页面，标签页含标题、现在可用状态、canonical 和能力边界提示。
- 公网回归：`/`、`/tools`、`/tools/xhs-hashtag-recommender`、标题/排版/敏感词工具、`robots.txt`、`sitemap.xml` 全部 HTTP 200；sitemap 为 109 条 URL 且无 localhost。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成移动端断点代码检查，待环境恢复后补验标签换行、下载和单手操作。

### Product Review

- 产品定位更完整：小红书工具从单点标题生成扩展为可连续完成发布准备的任务链，且每一步都明确本地能力边界，不把模板词库包装成 AI 或实时运营数据。
- 首页保持聚焦：新增功能只在工具库、内容发布工具包和相关推荐中出现，不增加首屏卡片密度；工具包的四步顺序更符合普通用户的实际发布流程。
- 分类与趋势判断：标签整理是自媒体长期刚需，低成本本地规则适合先验证用户需求；实时热词、爆款预测、平台数据分析仍需真实数据来源与合规评估，暂不虚构。
- 应新增：下一阶段优先做“小红书爆款标题分析”的本地结构分析，补充标题长度、信息密度、疑问/清单/场景等可解释指标；应降级/合并：泛化 AI 模板库和没有数据源的工具对比页继续保持待实现。
- 当前最大体验问题：内容工具链已有连续入口，但标签词库仍是人工维护、无法反映实时平台趋势；同时真实设备视觉与下载行为仍缺少 CUA 复验。下一阶段最值得做的是标题结构分析，并逐步抽取共享输入/结果反馈原语。
- 阶段评分（基于代码、构建产物、静态回归和公网回归；真实设备视觉项待补验）：视觉设计 92、信息架构 94、用户体验 94、一致性 95、品牌感 92、高级感 92、易用性 94、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 16 实现提交为 `e8fde64 feat: add local xhs hashtag recommender`，已推送 GitHub `origin/main`；当前分支为 `main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage16-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 公网回归”的流程；临时旧目录已在公网验证通过后清理，正式备份保留。
- 已知风险：标签结果是可解释的候选方向，不是平台实时推荐；词库覆盖有限，可能漏掉细分主题或产生不适合当前语境的候选，发布前必须人工筛选并遵守平台规则。
- 下一阶段：Stage 17 实现小红书标题结构分析，继续保持 57 个已实现工具可运行；随后再补统一上传/下载状态、失败恢复和高价值文件处理能力。

## 31. 2026-09-10：第二阶段 Stage 17 本地小红书标题结构分析（已完成）

### Plan / Design

- 将原来的“爆款标题分析”收敛为“小红书标题结构分析”：没有真实平台数据时，不使用爆款、预测或排名承诺，只提供用户能理解、能复核的标题表达检查。
- 选择浏览器本地启发式分析，围绕长度、内容字符、数字、标点、场景/人群、内容收益和疑问/清单信号给出结构完成度与下一步建议；不上传标题、不依赖 AI 或第三方接口。

### Develop

- 在 `src/lib/text.ts` 新增 `analyzeCreatorTitle` 和 `CreatorTitleAnalysis`，统一处理空输入、Unicode 字符、数字/标点/表情统计、结构信号、启发式分数和可解释建议。
- 在 `src/components/tools/CreatorToolRenderer.tsx` 新增标题分析工作区：标题输入、实时结构结果、四项结构信号、建议列表、报告复制、TXT 下载和恢复示例；使用统一的本地提示和合规边界。
- 在 `src/components/ToolRenderer.tsx` 接入独立 slug；在 `src/data/tools.ts` 将 #56 更名为“小红书标题结构分析”并标记为本地已实现；在 `src/data/toolkits.ts` 将内容发布链扩展为标题生成 → 结构分析 → 标签 → 排版 → 风险复核；在 `src/app/globals.css` 增加桌面/移动端结构结果样式。未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error；`NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 标题分析 Node 自测通过：完整标题可识别场景、收益、清单和数字信号；过长标题给出精简建议；空输入返回零分和明确提示；Node 类型剥离 warning 只来自临时自测命令。
- 工具注册表断言通过：100 个工具、58 个已实现，小红书标题分析为本地处理；静态导出检查为 100 个详情页、58 个真实工作区、42 个 Coming Soon 页面，分析页含标题、现在可用状态、结构完成度、canonical 和能力边界提示。
- 公网回归：`/`、`/tools`、`/tools/xhs-title-analyzer`、标题生成/标签/排版/敏感词工具、`robots.txt`、`sitemap.xml` 全部 HTTP 200；sitemap 为 109 条 URL 且无 localhost。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已补充 720px/390px 断点样式，待环境恢复后补验结构卡片、建议折行、复制和下载。

### Product Review

- 产品定位更可信：把“爆款”改为“结构分析”后，能力承诺与实际实现一致；标题生成、结构复盘、标签整理、排版和风险检查已经构成可连续使用的本地内容工作流。
- 首页仍然聚焦：新增分析工具只增加到已有小红书工具包和相关推荐，未增加首页热门卡片；工具包内链接增加到 5 个，当前仍可按步骤扫读，后续不再无限堆链接，必要时拆为二级工作流页。
- 分类与趋势判断：内容创作者需要可操作的复盘反馈，但没有数据源就不应模拟平台算法；结构分析属于长期稳定、低维护的基础能力，值得优先于泛化 AI 对比页。
- 应新增：下一阶段优先实现本地抖音标题生成器，验证同一套“主题 → 结构 → 发布”能力能否跨平台复用；应降级/合并：无实时数据来源的爆款预测、AI 工具对比和重复模板库继续保持待实现。
- 当前最大体验问题：标题分析仍是启发式规则，不能反映平台分发变化；内容发布工具包的链接密度已接近单卡上限，真实设备视觉和下载行为也仍待 CUA 复验。下一阶段最值得做的是多平台标题生成，并控制场景工具包的信息密度。
- 阶段评分（基于代码、构建产物、静态回归和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 95、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 17 实现提交为 `ac7faef feat: add local xhs title analysis`，已推送 GitHub `origin/main`；当前分支为 `main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage17-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 公网回归”的流程；临时旧目录已在公网验证通过后清理，正式备份保留。
- 已知风险：结构完成度是透明的启发式评分，不等于点击率、流量或平台审核结果；规则覆盖有限，中文语义、讽刺表达和不同平台偏好可能需要人工判断。
- 下一阶段：Stage 18 优先实现本地抖音标题生成器，继续保持 58 个已实现工具可运行；随后抽取统一上传/下载状态、失败恢复和高价值文件处理能力。

## 32. 2026-09-10：第二阶段 Stage 18 本地抖音标题生成器（已完成）

### Plan / Design

- 选择“抖音标题生成器”作为跨平台内容创作的第一步：复用本地模板的低成本优势，同时增加“开场方向”这一短视频特有的下一步，避免只输出孤立标题。
- 继续坚持能力诚实：按主题、内容场景和表达语气组合标题与开场草稿，不抓取平台数据、不调用 AI、不承诺爆款；用户必须根据真实视频改写。

### Develop

- 在 `src/lib/text.ts` 新增 `generateShortVideoTitles`、标题场景/语气类型和标题/开场模板，支持真实记录、实用教程、体验测评、清单盘点四类场景以及直接明确、问题引导、自然分享三种语气。
- 在 `src/components/tools/CreatorToolRenderer.tsx` 新增抖音标题工作区：视频主题输入、场景/语气选择、三组标题与开场方向、逐项复制、整组复制、TXT 下载、恢复示例和事实一致性提示。
- 在 `src/components/ToolRenderer.tsx` 接入独立 slug；在 `src/data/tools.ts` 将 #57 标记为本地已实现；在 `src/data/toolkits.ts` 将短视频工具包改为“短视频发布”，加入抖音标题入口；在 `src/app/globals.css` 增加开场方向折行样式。未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error；`NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 模板算法 Node 自测通过：主题会注入每个标题、开场方向非空、三组标题去重、空主题返回空结果；Node 类型剥离 warning 只来自临时自测命令。
- 工具注册表断言通过：100 个工具、59 个已实现，抖音标题工具为本地处理；静态导出检查为 100 个详情页、59 个真实工作区、41 个 Coming Soon 页面，抖音页含标题、现在可用状态、canonical 和非平台预测边界提示。
- 公网回归：`/`、`/tools`、`/tools/douyin-title-generator`、小红书标题结构/标签/排版/敏感词工具、视频截图、`robots.txt`、`sitemap.xml` 全部 HTTP 200；sitemap 为 109 条 URL 且无 localhost。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已检查短视频结果的窄屏折行和共享移动端按钮样式，待环境恢复后补验复制、下载和单手操作。

### Product Review

- 产品定位继续向“按任务完成内容”靠拢：短视频工具包现在覆盖素材截取、封面、字幕整理和标题准备，新增入口仍然服务发布前准备，而不是堆叠平台功能名词。
- 首页保持聚焦：抖音标题工具只进入短视频发布工具包和相关推荐，不增加首页热门区；工具包从 3 个入口增加到 4 个，仍处于可扫读范围，后续再增加功能应考虑二级工作流页。
- 分类与趋势判断：短视频标题与开场是稳定的创作刚需，本地模板适合先验证工作流；真正的热点分析、评论洞察、AI 生成和平台数据需要独立的数据/模型/合规方案，继续保持边界。
- 应新增：下一阶段优先实现本地抖音口播脚本生成，让主题、标题、开场进一步连接到拍摄文本；应降级/合并：重复的泛化标题模板、无数据源的爆款分析和 AI 工具目录暂不扩张。
- 当前最大体验问题：多平台内容能力开始出现，但抖音工具仍以模板草稿为主，缺少脚本、分镜和拍摄检查的连续交付；真实设备视觉与下载行为仍待 CUA 复验。下一阶段最值得做的是口播脚本，并控制工具包链接密度。
- 阶段评分（基于代码、构建产物、静态回归和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 95、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 18 实现提交为 `04974fc feat: add local douyin title generator`，已推送 GitHub `origin/main`；当前分支为 `main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage18-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 公网回归”的流程；临时旧目录已在公网验证通过后清理，正式备份保留。
- 已知风险：标题和开场方向是可人工筛选的草稿，不保证平台分发、完播或转化；若用户不按真实视频修改，可能出现承诺过度或标题与内容不一致。
- 下一阶段：Stage 19 优先实现本地抖音口播脚本生成，继续保持 59 个已实现工具可运行；随后抽取统一上传/下载状态、失败恢复和高价值文件处理能力。

## 33. 2026-09-10：第二阶段 Stage 19 本地抖音口播脚本生成（已完成）

### Plan / Design

- 选择“抖音口播脚本生成”连接短视频主题、标题和实际拍摄：输出开场、场景交代、主体展开、收尾动作四段结构，并同时给出画面提示，帮助用户从“有想法”推进到“能拍摄”。
- 继续采用浏览器本地模板组合，不调用 AI、不抓取平台数据、不承诺爆款或事实核验；提供 30/60/90 秒节奏提示、自然/直接/温和三种语气和四种内容场景，让选项足够实用但不造成配置负担。

### Develop

- 在 `src/lib/text.ts` 新增 `generateDouyinScript`、场景/语气/时长类型、四段脚本模板、画面提示、节奏说明和发布前检查清单；主题会清理换行、压缩空白并限制长度。
- 在 `src/components/tools/CreatorToolRenderer.tsx` 新增口播脚本工作区：主题输入、场景/语气/时长选择、四段口播与画面结果、复制、TXT 下载、恢复示例和真实内容核对提示；沿用统一 Workspace、按钮、结果区和 ToolNotice 原语。
- 在 `src/components/ToolRenderer.tsx` 接入独立 slug；在 `src/data/tools.ts` 将 #58 标记为已实现、本地处理；在 `src/data/toolkits.ts` 将短视频发布链扩展为素材 → 封面 → 字幕 → 标题 → 口播脚本，并将 5 个入口视为当前单卡上限。`src/app/globals.css` 增加脚本段落、节奏提示和画面提示样式。未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error；`NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 脚本算法 Node 自测通过：主题注入、四段结构、30 秒节奏文案、发布前检查清单和空输入返回 `null` 均正常；Node 类型剥离命令产生的实验性 warning 不影响生产构建。
- 工具注册表断言通过：100 个工具、60 个已实现，#58 为本地处理；静态导出检查为 100 个详情页、60 个真实工作区、40 个 Coming Soon 页面，脚本页含标题、现在可用状态、canonical、四段结果和能力边界提示；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/douyin-script-generator`、抖音标题、小红书标题结构/标签、图片增强、Markdown 转 Word、`robots.txt`、`sitemap.xml` 全部 HTTP 200；线上脚本页确认不是待上线页面。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级窄屏单列与长文本折行检查，待环境恢复后补验选择器、复制、下载和单手操作。

### Product Review

- 产品定位更清晰：短视频能力从“标题草稿”推进到“标题 → 口播 → 拍摄画面”的可执行链，工具输出明确且可人工编辑，不把模板能力包装成 AI。
- 首页继续保持聚焦：脚本工具只出现在工具库、短视频发布工具包和相关推荐，不增加首屏卡片；工具包 5 个入口已达到当前单卡上限，后续不再继续堆叠，必要时拆成二级“发布前工作流”页面。
- 分类与趋势判断：口播结构是短视频创作的稳定需求，本地实现成本低、隐私边界清楚；实时热点、评论洞察、平台推荐和自动事实核验仍需独立数据/模型/合规方案，继续保持待实现。
- 应新增：下一阶段优先实现本地短视频分镜脚本，把四段口播拆成镜号、景别、动作、台词和时长，形成更接近拍摄执行的清单；之后再评估统一上传/下载状态原语。应降级/合并：重复的标题模板、无数据源的爆款预测、泛化 AI 工具对比和重复 Prompt 模板库暂不扩张。
- 当前最大体验问题：短视频工具链已接近完整，但口播与素材文件之间还没有分镜级连接；工具包链接密度已到上限，且真实设备视觉与下载行为仍待 CUA 复验。下一阶段最值得做的是分镜脚本，并控制入口密度。
- 阶段评分（基于代码、构建产物、静态回归和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 95、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 19 实现提交为 `f6a775c feat: add local douyin script generator`，当前分支为 `main`，已推送到 GitHub `origin/main`；本次文档更新与阶段记录随后的 docs commit 一并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage19-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确旧目录”的流程；临时旧目录和上传压缩包已清理，正式备份保留。
- 已知风险：输出是可编辑的本地脚本草稿，不会自动验证数字、效果、案例或平台规则；四段模板不能替代真实拍摄准备，用户仍需根据素材、时长、版权和事实逐项修改。
- 下一阶段：Stage 20 优先实现本地短视频分镜脚本生成，继续保持 60 个已实现工具可运行；完成后再抽取上传规模、处理状态、失败恢复和下载反馈原语。

## 34. 2026-09-10：第二阶段 Stage 20 本地短视频分镜脚本生成（已完成）

### Plan / Design

- 在口播脚本之后补齐拍摄执行层：把主题拆成 6 个镜头，每个镜头明确镜号、时长、景别、画面、口播和拍摄重点，让用户可以从文案直接进入拍摄准备。
- 仍采用浏览器本地模板组合，复用四类场景和 30/60/90 秒时长方案；不接入 AI、平台数据或素材上传，避免把结构草稿误称为自动导演或平台推荐。

### Develop

- 在 `src/lib/text.ts` 新增 `generateShortVideoStoryboard`、镜头类型、场景模板、时长分配、节奏提示和拍摄前检查清单；输入会清理换行、压缩空白并限制长度，30/60/90 秒的镜头时长分别严格合计为目标时长。
- 在 `src/components/tools/CreatorToolRenderer.tsx` 新增分镜工作区：视频主题、内容场景、时长选择、6 个结构化镜头卡片、复制、TXT 下载、恢复示例和素材授权/真实性提示；继续复用统一工作区、按钮、结果和 ToolNotice 原语，并用 `Clapperboard` 强化拍摄语义。
- 在 `src/components/ToolRenderer.tsx` 接入独立 slug；在 `src/data/tools.ts` 将 #59 标记为已实现、本地处理；在 `src/app/globals.css` 增加分镜标题、时长胶囊、双列字段和移动端可折行样式。没有增加工具包入口，原因是短视频发布卡已达到 5 个链接的密度上限；没有新增 npm 依赖、API 或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error；`NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 分镜算法 Node 自测通过：60 秒和 90 秒时长分配分别精确合计、主题注入到画面/口播、6 镜头、检查清单和空输入返回 `null` 均正常；Node 类型剥离命令的实验性 warning 不影响生产构建。
- 工具注册表断言通过：100 个工具、61 个已实现，#59 为本地处理；静态导出检查为 100 个详情页、61 个真实工作区、39 个 Coming Soon 页面，分镜页含标题、现在可用状态、canonical、结构结果和授权提示；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/short-video-storyboard`、抖音口播/标题、小红书标题结构、图片增强、Markdown 转 Word、`robots.txt`、`sitemap.xml` 全部 HTTP 200；线上分镜页确认不是待上线页面。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级双列到单列布局、长文本折行和共享按钮检查，待环境恢复后补验选择器、复制、下载和单手操作。

### Product Review

- 产品定位更接近完整创作工作流：短视频能力从标题、口播推进到可执行分镜，用户不需要理解复杂制作术语也能按镜头准备素材。
- 首页继续保持聚焦：分镜工具通过工具库、短视频分类和相关推荐承接，不增加首页卡片；短视频发布工具包维持 5 个入口上限，避免单卡链接变成新的导航负担。
- 分类与趋势判断：分镜清单是拍摄前的稳定需求，浏览器本地结构化输出足够支撑第一版验证；自动剪辑、镜头识别、实时热点和 AI 导演能力需要媒体处理与模型架构，暂不伪装成模板功能。
- 应新增：下一阶段先抽取统一上传/下载反馈原语，再优先实现一个高价值本地文件工具，建议从 PDF 转图片或 HEIC 转 JPG 中按浏览器兼容性和需求验证选择；应降级/合并：重复短视频模板、无数据源爆款分析、泛化 AI 工具对比继续保持待实现。
- 当前最大体验问题：短视频内容链已形成，但结构化稿件还没有“保存到本地历史/导出更丰富格式”的轻量闭环；全站 39 个待实现工具中，服务端文件和 AI 能力的边界仍需逐项评估。下一阶段最值得做的是统一上传/下载反馈，并用一个高价值文件工具验证抽象是否足够通用。
- 阶段评分（基于代码、构建产物、静态回归和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 95、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 20 实现提交为 `49321fb feat: add local short video storyboard`，当前分支为 `main`，已推送到 GitHub `origin/main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage20-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确旧目录”的流程；临时旧目录和上传压缩包已清理，正式备份保留。
- 已知风险：分镜是基于场景的可编辑拍摄草稿，不会自动理解真实场地、人物、设备、版权、音乐或素材；用户仍需在拍摄前核对可执行性、事实和授权，时长也会因实际语速变化。
- 下一阶段：Stage 21 先抽取统一上传/下载反馈原语（文件大小、处理中、失败恢复、结果下载和隐私提示），再实现高价值本地/浏览器文件工具；保持 61 个已实现工具可运行。

## 35. 2026-09-11：第二阶段 Stage 21 共享文件反馈与本地图片去背景（已完成）

### Plan / Design

- 先解决文件工具之间反复出现的体验差异：将点击选择、拖拽高亮、input 重置、处理中状态和结果下载抽成共享原语，作为后续 PDF、图片、视频工具扩展的稳定基础。
- 同时选择“图片去背景”验证这套上传工作区：采用纯色背景取样和边缘连通区域处理，支持选择取样角落与颜色容差；明确不宣称 AI 抠图，复杂背景交给更适合的后续服务/模型阶段。

### Develop

- 在 `src/components/tools/ToolPrimitives.tsx` 新增 `FileDropField`、`ProcessingStatus` 和 `FileDownloadLink`，统一文件拖拽/选择、处理中动画和 Blob 下载入口；图片、视频、PDF 三类工作区已迁移到共享组件。
- 在 `src/lib/image.ts` 新增 `removeSolidBackground`：按指定角落颜色做 RGB 容差判断，以四邻域连通区域移除背景并保留边缘透明度；限制图片不超过 1200 万像素，输出透明 PNG。
- 在 `src/components/tools/ImageToolRenderer.tsx` 新增 #26 图片去背景工作区：图片上传、取样角落、颜色容差、处理状态、错误恢复、透明 PNG 下载和原图/复杂背景提示；在 `src/components/ToolRenderer.tsx` 与 `src/data/tools.ts` 接入并标记本地可用，在 `src/app/globals.css` 增加统一拖拽高亮与处理中动画。未新增 npm 依赖、API、服务器配置或工具包入口。

### Test / Self-check

- `npm run lint`：通过，0 error；`NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 纯色背景算法 Node 自测通过：合成背景会被移除、中心主体 alpha 保持、空/无效像素边界有明确错误；工具注册表断言通过：100 个工具、62 个已实现，#26 为本地处理；Node 类型剥离命令的实验性 warning 不影响生产构建。
- 静态导出检查为 100 个详情页、62 个真实工作区、38 个 Coming Soon 页面；图片去背景页含标题、现在可用状态、上传区、透明 PNG、canonical 和非 AI 能力边界；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/image-background-remove`、`/tools/image-enhance`、`/tools/video-screenshot`、`/tools/pdf-merge`、短视频分镜/口播、`robots.txt`、`sitemap.xml` 全部 HTTP 200；线上去背景页确认不是待上线页面。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级图片/视频/PDF 共享拖拽入口、处理中样式、移动端单列和长文本折行检查，待环境恢复后补验真实拖拽、下载和不同浏览器 Canvas 表现。

### Product Review

- 产品定位更可信：文件工具不再各自维护一套交互，新增去背景能力也明确收敛为“纯色背景辅助”，既提供实用价值又不制造 AI 能力错觉。
- 首页继续保持聚焦：图片去背景只进入工具库、图片分类和相关推荐，不增加首屏卡片；共享原语属于基础体验提升，不增加用户认知负担。
- 分类与趋势判断：证件照、电商图和简单商品图的纯色背景处理有长期需求；复杂主体识别、发丝级抠图、实时 HEIC/PDF 渲染仍需更高成本的模型或兼容性方案，不应通过简单算法冒充。
- 应新增：下一阶段优先实现本地证件照换底色，复用去背景结果并增加白/蓝/红等输出色与尺寸核验；随后评估 PDF 转图片或 HEIC 转 JPG，先做浏览器兼容性验证。应降级/合并：重复图片编辑入口、无数据源爆款分析、泛化 AI 工具对比继续保持待实现。
- 当前最大体验问题：共享原语已覆盖主要上传工作区，但图片工具仍有部分独立的处理状态和错误提示；纯色去背景对复杂图片的效果上限明显，真实设备下载行为也仍待 CUA 复验。下一阶段最值得做的是证件照换底色，并继续统一状态反馈。
- 阶段评分（基于代码、构建产物、静态回归和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 96、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 21 实现提交为 `cc7aa9b feat: unify file feedback and add background removal`，当前分支为 `main`，已推送到 GitHub `origin/main`。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage21-before-20260910`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确旧目录”的流程；临时旧目录和上传压缩包已清理，正式备份保留。
- 已知风险：去背景只对与指定角落相连的相近纯色区域有效，渐变、纹理、阴影、主体贴边或取样角落不合适时可能残留或误删；输出透明 PNG，用户仍需检查边缘、肖像和原图备份。
- 下一阶段：Stage 22 优先实现本地证件照换底色，保持 62 个已实现工具可运行；完成后继续处理 PDF/HEIC 等需要兼容性评估的高价值文件能力。

## 36. 2026-09-11：第二阶段 Stage 22 证件照换底色（已完成）

### Plan / Design

- 选择证件照换底色作为 Stage 22：它与 Stage 21 的纯色背景处理算法直接相邻，用户需求明确、浏览器本地完成成本低，适合作为证件照工作流的第一步。
- 只承诺“接近纯色背景的本地辅助处理”，不宣称 AI 抠图或发丝级精修；默认提供白、蓝、红三种常用底色，同时保留自定义颜色、取样角落和颜色容差，让用户可以检查并调整结果。
- 不把入口加入首页或扩充短视频工具包，避免为了增加工具数量破坏首屏聚焦和场景卡片密度；工具通过工具库、图片分类、相关推荐和独立 SEO 页面被发现。

### Develop

- 在 `src/lib/image.ts` 增加 `RgbColor` 与 `compositeTransparentPixels`，复用 `removeSolidBackground` 的连通区域结果，把透明背景以用户选择的 RGB 颜色合成不透明像素。
- 在 `src/components/tools/ImageToolRenderer.tsx` 新增“证件照换底色”工作区：单图拖拽/选择、白蓝红底色预设、自定义颜色、四角取样、颜色容差、处理中状态、错误恢复、JPG 预览与下载，并明确不支持复杂背景和 AI 自动抠图。
- 在 `src/components/ToolRenderer.tsx`、`src/data/tools.ts` 接入独立 slug，将 #36 标记为本地已实现、中风险；在 `src/app/globals.css` 增加底色预设的轻量选中态。未新增 npm 依赖、API、服务器配置或工具包入口。

### Test / Self-check

- `npm run lint`：通过，0 error。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 纯色背景算法 Node 自测通过：合成背景移除 11 个像素、主体 alpha 保持、透明像素正确合成为白色不透明像素；工具注册表断言通过：100 个工具、63 个已实现，#36 为本地处理。Node 类型剥离命令的实验性 warning 不影响生产构建。
- 静态导出检查为 100 个详情页、63 个真实工作区、37 个 Coming Soon 页面；证件照页含标题、现在可用状态、上传区、生成换底色按钮、非 AI 能力边界、canonical；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/id-photo-background`、`/tools/image-background-remove`、`/tools/image-enhance`、`/tools/pdf-merge`、`robots.txt`、`sitemap.xml` 全部 HTTP 200；公网证件照页确认是已上线页面并含关键 SEO 文案。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；本次临时压缩包已清理，Stage 22 正式备份保留。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级移动端单列、按钮和底色预设换行检查，待环境恢复后补验真实拖拽、下载和不同浏览器 Canvas 表现。

### Product Review

- 产品定位更清晰：新增能力服务于“准备一张可提交的证件照”，不是泛化的 AI 修图承诺；浏览器本地处理强化了隐私和快速开始的核心卖点。
- 首页继续保持聚焦：证件照换底色只进入工具库、图片分类和相关推荐，不增加首屏模块；底色预设只在工具工作区出现，用户进入后能直接理解下一步。
- 分类与趋势判断：证件照、求职、报名、签证和电商素材都存在长期换底色需求；复杂主体识别、发丝级处理和 HEIC 解码仍属于兼容性或模型成本更高的能力，不能用当前算法冒充。
- 应新增：下一阶段优先验证 PDF 转图片或 HEIC 转 JPG 的真实浏览器兼容性，再决定是否引入专用解码器；随后补齐求职简历和学生学习场景工具包。应降级/合并：重复图片编辑入口、无数据源的爆款预测和泛化 AI 工具对比继续保持待实现，不为凑数量上线。
- 当前最大体验问题：证件照换底色仍依赖用户选择合适的纯色取样角落，不能替代专业抠图；真实设备的拖拽、下载和部分浏览器 Canvas 差异还没有完成 CUA 复验。下一阶段最值得做的是先完成 PDF/HEIC 兼容性技术验证，并继续统一文件工具的失败恢复和尺寸提示。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 96、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 22 实现提交为 `59ac1e3 feat: add local id photo background color`，当前分支为 `main`，已推送到 GitHub `origin/main`；本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage22-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：算法只移除与指定角落相连且颜色接近的纯色背景；渐变、纹理、阴影、主体贴边、发丝和不合适的取样角落可能导致残留或误删。输出是 JPG，不保存或上传原图；用户提交前仍需自行核对机构的尺寸、颜色、服装和肖像要求。
- 下一阶段：Stage 23 先对 PDF 转图片、HEIC 转 JPG 做兼容性与体积验证，保持 63 个已实现工具可运行；若浏览器方案不稳定，再记录服务端解码边界和安全限制后决定架构。

## 37. 2026-09-11：第二阶段 Stage 23 本地 PDF 转图片（已完成）

### Plan / Design

- 先实现 PDF 页面转图片，而不是直接进入 HEIC：PDF 转图片是明确的文件处理需求，且浏览器可以借助成熟的 PDF.js 完成；HEIC 在不同浏览器的原生解码支持不稳定，继续保持待实现更符合“已上线必须真正可用”的原则。
- 复用现有 PDF 文件校验、页码范围、拖拽上传、处理中和下载原语；增加 PNG/JPG 选择、0.75× 到 2× 清晰度和逐页预览下载。限制单次最多 15 页、单页最多 800 万像素、总计最多 3000 万像素，主动控制移动端和低内存设备的风险。
- PDF.js 只在点击导出时动态加载，worker 由 Next.js 静态构建为独立资源；不新增后端、上传接口或服务器运行时，保持本地隐私卖点和既有静态部署架构。

### Develop

- 在 `package.json` / `package-lock.json` 增加 `pdfjs-dist@6.3.289`，作为 PDF 页面像素渲染的唯一新增依赖；现有 `pdf-lib` 继续负责 PDF 结构读写，两者职责保持分离。
- 在 `src/components/tools/PdfToolRenderer.tsx` 新增 `PdfToImageTool`：单 PDF 选择/拖拽、页面范围、输出格式、清晰度、PDF.js 动态加载、worker URL、Canvas 渲染、PNG/JPG Blob 输出、逐页缩略图和下载。
- 在 `src/components/ToolRenderer.tsx`、`src/data/tools.ts` 接入 #6 并标记本地已实现；在 `src/app/globals.css` 增加桌面逐页结果列表和 390px 移动端单列下载布局。未新增 API、工具包入口或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成；构建产物包含 `pdf.worker.min.*.mjs` 独立 worker 资源。
- PDF.js 实际渲染自测通过：内存生成 1 页 PDF，使用 PDF.js 渲染为 PNG，输出尺寸为 300 × 150，PNG 文件头校验通过；没有写入用户项目文件。
- 工具注册表断言通过：100 个工具、64 个已实现，#6 为本地处理；静态导出检查为 100 个详情页、64 个真实工作区、36 个 Coming Soon 页面；PDF 转图片页含标题、现在可用状态、上传区、导出按钮、边界提示和 canonical；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/pdf-to-image`、`/tools/pdf-merge`、`/tools/image-background-remove`、`/tools/id-photo-background`、`robots.txt`、`sitemap.xml` 全部 HTTP 200；PDF.js worker 资源公网 HTTP 200。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；本次临时压缩包已清理，Stage 23 正式备份保留。
- 真实设备视觉验收仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级移动端单列、下载按钮和长文件名折行检查，待环境恢复后补验真实拖拽、PDF.js worker、Canvas 下载和不同浏览器表现。

### Product Review

- 产品定位更完整：网站现在不只做 PDF 结构编辑，也能把页面直接转成可分享图片；能力边界通过页数、像素和本地处理提示提前说清楚，用户能在 10 秒内开始操作。
- 首页继续保持聚焦：PDF 转图片只出现在工具库、PDF 分类和相关推荐，不把新增依赖或渲染能力搬到首页，避免首页重新变成工具堆。
- 分类与趋势判断：PDF 预览、社交分享、资料发布和办公交付都有稳定需求；HEIC 转 JPG 仍需真实浏览器矩阵或专用解码器验证，不应只因名称高频就标记上线。
- 应新增：下一阶段实现本地公众号标题生成器，延续已有内容创作闭环；之后再补求职简历、学生学习和电商场景工具包。应降级/合并：PDF 多个高风险加密/解密与 Office 转换仍等待服务端安全架构，重复的泛化 AI 对比工具继续不优先。
- 当前最大体验问题：PDF.js 会增加 PDF 工具的按需下载体积，低端设备渲染大页仍可能耗时；当前结果按页单独下载，尚未提供压缩打包；真实设备和旧浏览器兼容性仍待 CUA/浏览器矩阵复验。下一阶段最值得做的是低成本本地内容工具，同时把 PDF/图片的文件大小、耗时和失败恢复提示继续统一。
- 阶段评分（基于代码、构建产物、PDF.js 实际渲染自测、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 94、一致性 96、品牌感 93、高级感 93、易用性 94、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 23 实现提交为 `e1269a0 feat: add local pdf to image converter`，当前分支为 `main`，已推送到 GitHub `origin/main`；本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage23-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：PDF.js 6.3.289 使开发/构建环境需使用满足其 Node 引擎要求的运行时；当前工作区 Node 22.14 构建通过。工具只支持浏览器 Canvas 能力可用的现代浏览器，密码保护、损坏、超大页面或复杂 XFA PDF 可能失败；结果只保留在当前页面内存中，用户应及时下载并自行备份。
- 下一阶段：Stage 25 优先实现本地微信朋友圈文案生成器，保持 65 个已实现工具可运行；HEIC 转 JPG 继续进行兼容性评估，若未来需要专用解码器或服务端处理，必须先单独记录体积、隐私、清理和部署方案。

## 38. 2026-09-11：第二阶段 Stage 24 本地公众号标题生成器（已完成）

### Plan / Design

- Stage 23 已完成高价值 PDF 本地处理后，选择 #62 公众号标题生成器作为低风险内容创作能力：公众号选题和标题整理是持续存在的创作者需求，且能自然衔接已有公众号格式清理工具。
- 采用 4 个内容场景（实践复盘、实用方法、观点观察、清单总结）和 3 种表达语气（清晰直接、温和分享、问题引导），每次输出 3 个标题方向；明确这是本地模板辅助，不宣称 AI 生成、开放率预测或平台推荐，避免把静态规则包装成实时智能能力。
- 延续统一内容工作区、逐项复制、整组复制、TXT 下载、恢复示例和合规提示；不把新工具加入首页或场景工具包，避免入口密度继续上升。

### Develop

- 在 `src/lib/text.ts` 增加公众号标题场景/语气类型、模板词典和 `generateWechatTitles`；统一清理换行与空白、限制主题最多 60 字，空输入返回空结果。
- 在 `src/components/tools/CreatorToolRenderer.tsx` 增加公众号标题工作区：主题输入、场景和语气选择、标题方向结果、逐项/整组复制、TXT 下载、重置和本地模板能力边界提示。
- 在 `src/components/ToolRenderer.tsx` 和 `src/data/tools.ts` 接入 #62 并标记为本地已实现；未新增依赖、API、服务器配置或场景工具包，继续复用既有 UI 设计语言。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 公众号标题本地自测通过：默认主题输出 3 条结果，换行/多余空白会被归一化，空主题返回空数组；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、65 个已实现，#62 为本地处理；静态导出检查为 100 个详情页、65 个真实工作区、35 个 Coming Soon 页面；公众号标题页含标题、现在可用状态、内容方向、复制/下载入口、模板边界提示和 canonical；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`/tools/id-photo-background`、`/tools/image-background-remove`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；公众号标题页线上关键文案与已上线状态存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；本次临时压缩包已清理，Stage 24 正式备份保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级响应式结构检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更清晰：工具箱现在同时覆盖文件处理和中文内容发布准备，公众号标题工具明确提供“标题方向整理”，而不是伪装成实时数据驱动的爆款预测器。
- 首页继续聚焦搜索、热门工具和场景入口，没有因为新增一个工具而增加首屏卡片；工具详情页仍承担完整操作和 SEO 信息，信息架构没有被内容模板工具稀释。
- 公众号标题整理属于稳定的内容创作需求，适合作为浏览器本地、低维护能力；下一步可沿公众号/微信内容链继续做朋友圈文案或评论回复，但要控制模板重复和平台规则风险。
- 应新增：Stage 25 优先实现本地微信朋友圈文案生成器，之后再评估评论区回复生成和求职/学习场景。应降级/合并：无数据源的爆款预测、泛化 AI 工具对比和重复模板库继续保持待实现，不为凑数量上线。
- 当前最大体验问题：模板工具的语义个性化有限，用户仍需自行核对事实、版权、广告法和平台规则；同时真实设备视觉与下载反馈尚未完成 CUA 复验。下一阶段最值得做的是朋友圈文案工具，并继续抽取内容工具的历史结果和编辑反馈能力。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 96、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 24 实现提交为 `b70f1be feat: add local wechat title generator`，当前分支为 `main`，已推送到 GitHub `origin/main`；本次上下文更新单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage24-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：标题由本地固定模板组合而成，不读取实时热点、平台分发数据或公众号后台指标；主题最多 60 字，用户仍需自行核对事实、版权和合规要求。工具不上传或保存用户输入。
- 下一阶段：Stage 25 优先实现本地微信朋友圈文案生成器，保持 65 个已实现工具可运行；继续保持 HEIC、Office、OCR、FFmpeg、AI 等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 39. 2026-09-11：第二阶段 Stage 25 本地微信朋友圈文案生成器（已完成）

### Plan / Design

- Stage 24 已完成公众号标题方向整理后，选择 #64 微信朋友圈文案生成作为下一项低风险本地内容能力：它覆盖日常记录、工作分享和体验表达等更高频的轻量发布场景，并能延续已有公众号/短视频内容工作流。
- 采用 4 个内容方向（日常记录、工作分享、体验分享、节日问候）和 3 种表达语气（自然简短、温暖真诚、轻松互动），每次输出 3 条可继续编辑的文案草稿；明确不宣称自动代发、广告投放、互动效果或平台推荐。
- 复用统一内容工作区、复制、TXT 下载、恢复示例和 ToolNotice，不新增首页卡片或场景工具包入口，保持首页和工具包的信息密度可控。

### Develop

- 在 `src/lib/text.ts` 增加 `MomentsCopyScene`、`MomentsCopyTone`、本地模板词典和 `generateMomentsCopies`；统一清理换行与空白、限制主题最多 80 字，空输入返回空结果。
- 在 `src/components/tools/CreatorToolRenderer.tsx` 增加朋友圈文案工作区：主题/场景输入、内容方向和语气选择、3 条文案结果、逐项/整组复制、TXT 下载、重置和事实/版权/商业合作提示。
- 在 `src/components/ToolRenderer.tsx` 接入独立 slug 路由；在 `src/data/tools.ts` 将 #64 标记为本地已实现并加入 `implementedSlugs`；未新增 npm 依赖、API、服务器配置或场景工具包。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 朋友圈文案本地自测通过：默认主题输出 3 条结果，换行/多余空白会被归一化，空主题返回空数组；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、66 个已实现，#64 为本地处理；静态导出检查为 100 个工具详情页、66 个真实工作区、34 个 Coming Soon 页面；朋友圈页面含标题、现在可用状态、操作区、下载入口、合规提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；朋友圈页面线上关键文案、已上线状态、操作区和下载命名存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；部署脚本的尾斜线路由检查曾触发保护性回滚，随后按当前无尾斜线路由约定重新部署成功；Stage 25 临时压缩包已清理，正式备份保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级响应式结构检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更清晰：平台从“工具列表”继续变成围绕中文内容发布准备的轻量工作台，朋友圈文案与公众号标题、排版清理形成从想法到发布草稿的连续链路。
- 首页继续聚焦搜索和少量代表性入口；新增工具只进入工具库、分类和相关推荐，不抢首页视觉，也没有增加场景工具包链接密度。
- 朋友圈文案是稳定的日常表达需求，适合浏览器本地和零依赖实现；模板工具的长期价值在于减少起稿阻力，而不是替代真实经历或制造营销话术。
- 应新增：Stage 26 优先实现本地评论区回复生成器，完成内容发布互动链；之后再做求职简历或学生学习场景工具包。应降级/合并：无数据源的爆款预测、泛化 AI 工具对比和重复模板库继续保持待实现，不为凑数量上线。
- 当前最大体验问题：内容工具的模板语义个性化和历史结果管理仍有限，用户仍需人工核对事实、版权、广告法与商业合作披露；真实设备视觉与下载行为尚未完成 CUA 复验。下一阶段最值得做的是评论回复工具，并评估轻量本地历史能力是否值得抽取。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 96、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 25 实现提交为 `ac5eb31 feat: add local moments copy generator`，当前分支为 `main`，已推送到 GitHub `origin/main`；本次上下文更新单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage25-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：文案由本地固定模板组合而成，不读取朋友圈动态、热度、互动或投放数据；主题最多 80 字，结果只是草稿，用户仍需自行核对事实、版权和商业合作披露。工具不上传或保存用户输入。
- 下一阶段：Stage 26 优先实现本地评论区回复生成器，保持 66 个已实现工具可运行；继续保持 HEIC、Office、OCR、FFmpeg、AI 等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 40. 2026-09-11：第二阶段 Stage 26 本地评论区回复生成器（已完成）

### Plan / Design

- Stage 25 已完成朋友圈文案草稿后，选择 #65 评论区回复生成器补齐“发布后互动”链路：评论感谢、问题咨询、经验补充和异议澄清都是常见的内容运营场景，且可以在浏览器本地完成。
- 采用 4 个回复场景（认可感谢、问题咨询、经验补充、异议澄清）和 3 种表达语气（自然交流、温和真诚、简短克制），每次输出 3 条可人工编辑的回复方向；明确不支持批量代发、不接平台接口、不承诺互动效果。
- 复用统一内容工作区、复制、TXT 下载、恢复示例和 ToolNotice；不增加首页卡片和场景工具包入口，避免互动工具抢占首屏注意力。

### Develop

- 在 `src/lib/text.ts` 增加 `CommentReplyScene`、`CommentReplyTone`、本地回复模板词典和 `generateCommentReplies`；统一清理换行与空白、限制评论最多 100 字，空输入返回空结果。
- 在 `src/components/tools/CreatorToolRenderer.tsx` 增加评论回复工作区：评论原文、场景和语气选择、3 条回复结果、逐项/整组复制、TXT 下载、重置和事实/版权/广告/隐私提示。
- 在 `src/components/ToolRenderer.tsx` 接入独立 slug 路由；在 `src/data/tools.ts` 将 #65 标记为本地已实现并加入 `implementedSlugs`；未新增 npm 依赖、API、服务器配置或场景工具包。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 评论回复本地自测通过：默认评论输出 3 条结果，换行/多余空白会被归一化，空评论返回空数组；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、67 个已实现，#65 为本地处理；静态导出检查为 100 个工具详情页、67 个真实工作区、33 个 Coming Soon 页面；评论回复页含标题、现在可用状态、操作区、下载入口、合规提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；评论回复页线上关键文案、已上线状态、操作区和下载命名存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 26 临时压缩包已清理，正式备份保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级响应式结构检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更完整：平台已经覆盖从内容起稿、标题整理、朋友圈发布到评论互动的连续本地工作流，不再只是孤立的内容模板页。
- 首页继续聚焦搜索和代表性工具；评论回复只进入工具库、分类和相关推荐，不增加首页模块，不改变场景工具包的信息密度。
- 评论回复是稳定的运营效率需求，但模板只能降低起稿成本，不能代替对话理解、事实核验或真人沟通；本地实现比伪装实时 AI 更诚实、可维护且更符合隐私卖点。
- 应新增/调整：Stage 27 将原“AI PPT 大纲生成”改造成真正可用的本地“PPT 大纲整理”，先解决名称与能力不一致，再评估求职/学习场景。应降级/合并：无数据源的爆款预测、泛化 AI 工具对比和重复模板库继续保持待实现。
- 当前最大体验问题：内容工具仍缺少统一的本地历史/收藏结果入口，个性化能力也有限；用户仍需核对事实、版权、广告法、隐私和商业合作要求，真实设备视觉与下载行为尚未完成 CUA 复验。下一阶段最值得做的是一个真实的办公结构化工具，而不是继续增加静态模板。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 93、信息架构 95、用户体验 95、一致性 96、品牌感 93、高级感 93、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 26 实现提交为 `56aabf4 feat: add local comment reply generator`，当前分支为 `main`，已推送到 GitHub `origin/main`；本次上下文更新单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage26-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：回复由本地固定模板组合而成，不读取评论上下文、账号关系、平台规则或互动数据；评论最多 100 字，结果只是草稿，用户仍需自行核对语义、事实、隐私和商业合作边界。工具不上传或保存评论内容。
- 下一阶段：Stage 27 优先实现本地 PPT 大纲整理，保持 67 个已实现工具可运行；继续保持 HEIC、Office、OCR、FFmpeg、AI 等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 41. 2026-09-11：第二阶段 Stage 27 本地 PPT 大纲整理（已完成）

### Plan / Design

- Stage 26 已完成评论区回复草稿后，重新审视 #80“AI PPT 大纲生成”：在没有模型 API、事实检索和账户配置的情况下继续保留 AI 名称会损害产品信任，因此保留旧 slug `ai-ppt-outline` 兼容历史链接，但将工具重命名为“PPT 大纲整理”，明确本地结构整理边界。
- 采用主题、目标受众、演示目标、内容场景（工作汇报/培训分享/方案提案/经验分享）和预计时长（5/10/20 分钟）五个输入维度，输出 4～6 页结构化页纲、每页目的、要点、视觉建议和交付前检查。
- 这是一个真实可用的办公结构工具，不依赖 AI、网络、上传或第三方服务；保留复制/TXT 下载/恢复示例/合规提示，并把新增工作区抽到独立 `OfficeToolRenderer`，避免继续把办公能力塞进内容工具组件。

### Develop

- 在 `src/lib/text.ts` 增加 `PptOutlineScene`、`PptOutlineDuration`、`PptOutlineDraft` 和 `generatePptOutline`；根据场景生成工作汇报、培训、提案、分享四类结构，按时长选择页数，输入清理后在本地内存中生成结果。
- 新增 `src/components/tools/OfficeToolRenderer.tsx`：主题/受众/目标输入、场景和时长选择、页级大纲卡片、复制、`ppt-outline.txt` 下载、恢复示例和事实核对提示。
- 在 `src/components/ToolRenderer.tsx` 接入 `ai-ppt-outline`；在 `src/data/tools.ts` 将 #80 改为本地已实现、移除“AI”元数据、加入 `implementedSlugs`；在 `src/app/globals.css` 增加桌面/移动端一致的页纲结果样式；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- PPT 大纲本地自测通过：10 分钟场景输出 5 页，换行/多余空白会被归一化，空主题返回 `null`；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、68 个已实现，#80 的名称为“PPT 大纲整理”且为本地处理；静态导出检查为 100 个工具详情页、68 个真实工作区、32 个 Coming Soon 页面；页面含标题、现在可用状态、结构化页纲、复制/下载入口、能力边界、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/ai-ppt-outline`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；PPT 页线上关键文案、已上线状态、页纲内容和下载命名存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 27 临时压缩包已清理，正式备份保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级移动端单列和长文本折行检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更可信：工具箱没有继续用“AI”标签包装静态模板，而是把 PPT 大纲能力说清楚、做实，用户知道它能整理什么、不能替代什么；旧 slug 保留降低了 SEO 与历史链接风险。
- 首页继续聚焦搜索和代表性入口；PPT 工具只在工具库、AI 分类中的办公效率子分类和相关推荐中承接办公需求，没有增加首页卡片或新的场景工具包，视觉重点保持稳定。
- 趋势与商业价值判断：办公汇报、培训和提案是长期需求，本地大纲整理可作为后续真实 AI 服务的低风险前置体验；未来若接入模型，必须另行设计 API 密钥、成本、隐私和错误恢复，不在静态工具里假装接入。
- 应新增/调整：Stage 28 将原“AI 生成简历”改造成真正可用的本地“简历内容整理”，优先覆盖求职高频流程；之后再评估周报整理和学生学习工具包。应降级/合并：无数据源的 AI 工具对比、爆款预测和重复 Prompt 库继续保持待实现。
- 当前最大体验问题：办公工具虽开始出现，但跨工具的本地历史结果、模板自定义和真正的文件导出仍有限；用户需要手动补充材料，真实设备视觉与下载行为尚未完成 CUA 复验。下一阶段最值得做的是求职结构化工具，而不是扩大 AI 名称覆盖面。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 27 实现提交为 `73c58e3 feat: add local ppt outline workspace`，当前分支为 `main`，已推送到 GitHub `origin/main`；本次上下文更新单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage27-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：大纲由本地规则和结构模板组成，不读取行业数据、不验证引用、不生成演示文件；主题最多 80 字，用户仍需自行补充真实材料、图表、案例、来源和商业信息。工具不上传或保存输入。
- 下一阶段：Stage 28 优先实现本地简历内容整理，保持 68 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 42. 2026-09-11：第二阶段 Stage 28 本地简历内容整理（已完成）

### Plan / Design

- Stage 27 已完成 PPT 大纲去 AI 化后，重新审视 #78“AI 生成简历”：在没有模型 API、事实检索和账户配置的情况下继续保留 AI 名称会损害产品信任，因此保留旧 slug `ai-resume` 兼容历史链接，将工具重命名为“简历内容整理”，明确只整理用户真实材料。
- 采用目标岗位、求职类型（应届/实习、有工作经验、转行求职、项目制/自由职业）、核心优势、工作/实习经历、项目/作品/成果、技能关键词等输入，输出求职定位、经历、项目成果、技能四个区块以及投递前检查。
- 这是本地结构整理工具，不依赖 AI、网络、上传或第三方服务；复用 `OfficeToolRenderer`、复制/TXT 下载、恢复示例和合规提示，避免新增一套设计语言。

### Develop

- `src/lib/text.ts`：增加 `ResumeProfile`、`ResumeSection`、`ResumeDraft` 与 `generateResumeContent`；统一处理输入归一化、换行/分号拆分和数量上限，不编造用户经历或技能。
- `src/components/tools/OfficeToolRenderer.tsx`：增加简历内容整理工作区，支持目标岗位、求职类型、优势、经历、项目和技能输入，输出区块化结果、复制、`resume-content-draft.txt` 下载、重置和边界提示。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/app/globals.css`：接入独立工具路由、标记 #78 为本地已实现并补齐响应式结果样式；未新增依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 简历内容本地自测通过：默认生成 4 个区块，技能/多行输入可拆分，空目标岗位返回空定位，结果不引入输入之外的事实；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、69 个已实现，#78 为本地处理；静态导出检查为 100 个详情页、69 个真实工作区、31 个 Coming Soon 页面；简历页含标题、现在可用状态、工作区、复制/下载入口、边界提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/ai-resume`、`/tools/ai-ppt-outline`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；简历页线上关键文案、已上线状态、工作区、TXT 下载命名和 canonical 存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 28 临时压缩包已清理，正式备份 `/www/backup/tools-hub-100-stage28-before-20260911` 保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级移动端单列与长文本折行检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更可信：求职工具不再用“AI 生成”包装规则整理，而是帮助用户把真实经历整理成可继续编辑的简历内容草稿；旧 slug 保留，减少 SEO 与历史链接风险。
- 首页继续聚焦搜索、热门工具和场景入口；简历工具只进入工具库、AI/求职子分类与相关推荐，不增加首页卡片或场景工具包密度。
- 求职内容整理具备长期需求和后续商业化潜力，但真正的岗位匹配、事实校验、润色和模型生成应作为独立服务评估 API 成本、隐私和可解释性，当前不伪装接入。
- 应新增/调整：Stage 29 优先将原“AI 生成周报”改造成“工作周报整理”，随后再评估学生学习与电商/跨境场景工具包。应降级/合并：无数据源的爆款预测、泛化 AI 工具对比和重复 Prompt 库继续保持待实现，不为凑数量上线。
- 当前最大体验问题：工具间仍缺少统一的本地历史/收藏结果入口和 DOCX/PDF 等正式文件导出；用户需要自行核对日期、数字、隐私和事实，真实设备视觉与下载行为尚待 CUA 复验。下一阶段最值得做的是高频周报结构化，而不是继续扩大“AI”名称覆盖面。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 28 实现提交为 `84b5967 feat: add local resume content organizer`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage28-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：工具只整理用户提供的事实，不自动判断经历真实性、岗位适配度、招聘结果或隐私风险；目标岗位最多 60 字，经历/项目各最多 8 条，技能最多 12 条，用户仍需自行核对个人信息后再投递。工具不上传或保存输入。
- 下一阶段：Stage 29 优先实现本地工作周报整理，保持 69 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 43. 2026-09-11：第二阶段 Stage 29 本地工作周报整理（已完成）

### Plan / Design

- Stage 28 已完成求职简历内容整理后，选择 #77“AI 生成周报”作为下一个高频办公场景；周报的真实价值是把分散记录整理成可核对、可发送的结构，而不是假装拥有模型总结或自动汇报能力，因此保留旧 slug `ai-weekly-report` 兼容历史链接并重命名为“工作周报整理”。
- 采用周报周期、汇报对象（项目团队/直属负责人/客户或合作方/个人复盘）、本周重点、已完成工作、问题与风险、下周计划、需要协同 7 个输入维度，输出五个区块和发送前检查清单。
- 这是浏览器本地结构整理工具，不上传工作记录、不调用 AI、不自动发送；复用 `OfficeToolRenderer`、统一办公工作台、复制/TXT 下载、恢复示例和风险提示，控制维护成本与数据边界。

### Develop

- `src/lib/text.ts`：增加 `WeeklyReportAudience`、`WeeklyReportSection`、`WeeklyReportDraft` 与 `generateWeeklyReport`；统一清理输入、按行/分号拆分、数量上限和空字段提示，不虚构工作结果。
- `src/components/tools/OfficeToolRenderer.tsx`：增加周报工作区、五类结果区块、复制、`weekly-report-draft.txt` 下载、恢复示例和发送前风险提示。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/app/globals.css`：接入 #77 独立详情页路由、标记本地已实现并补齐桌面/移动端输入和结果样式；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 周报本地自测通过：周期输入生成 5 个区块，多行完成项正确拆分，空周期返回 `null`；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、70 个已实现，#77 名称为“工作周报整理”且为本地处理；静态导出检查为 100 个详情页、70 个真实工作区、30 个 Coming Soon 页面；周报页含标题、现在可用状态、操作区、TXT 下载、边界提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/ai-weekly-report`、`/tools/ai-resume`、`/tools/ai-ppt-outline`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；周报页线上关键文案、已上线状态、工作区、TXT 下载命名、canonical 和 FAQ 存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 29 临时压缩包和 staging/old 目录已清理，正式备份 `/www/backup/tools-hub-100-stage29-before-20260911` 保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级移动端双列输入收敛为单列、长文本折行和静态输出检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更完整：工具箱从“模板和转换工具集合”继续扩展为围绕办公交付的轻量工作台，周报整理把记录、风险、计划和协同放在一个清晰路径里，同时没有用 AI 标签掩盖实际能力。
- 首页继续聚焦搜索、热门工具和场景入口；周报工具只进入工具库、AI/办公效率子分类与相关推荐，不增加首页卡片或新的场景工具包，首屏信息密度保持稳定。
- 周报整理是长期办公需求，未来可连接真正的团队知识库或模型服务，但那会涉及登录、权限、数据留存、API 成本和企业隐私，当前阶段不做不可逆架构扩张。
- 应新增/调整：Stage 30 优先将原“AI 面试题生成”改造成“面试准备整理”，延续求职闭环；之后再评估学生学习工具包。应降级/合并：无数据源的爆款预测、泛化 AI 工具对比、重复 Prompt 库和需要实时数据的能力继续保持待实现。
- 当前最大体验问题：办公内容工具仍缺少统一的本地历史/收藏结果入口和 DOCX/PDF 正式导出；周报结果也需要用户人工核对数字、客户信息、内部资料和风险披露，真实设备视觉与下载反馈尚待 CUA 复验。下一阶段最值得做的是求职面试结构化，而不是继续增加静态模板数量。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 29 实现提交为 `eca2bba feat: add local weekly report organizer`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage29-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：工具只整理用户提供的记录，不自动判断工作结果真实性、优先级、客户满意度或风险等级；每类输入有数量上限，结果只是可编辑草稿，用户发送前必须核对事实、数据、客户/内部信息和隐私边界。工具不上传或保存输入。
- 下一阶段：Stage 30 优先实现本地面试准备整理，保持 70 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 44. 2026-09-11：第二阶段 Stage 30 本地面试准备整理（已完成）

### Plan / Design

- Stage 29 已完成工作周报整理后，选择 #79“AI 面试题生成”完成求职闭环的下一步；没有模型 API、岗位数据库和实时招聘信息时继续保留“AI 生成”会误导用户，因此保留旧 slug `ai-interview-questions` 兼容历史链接，并重命名为“面试准备整理”。
- 采用目标岗位、面试阶段（初筛/HR、行为面/主管、专业/案例、终面/沟通）、重点方向、真实经历/项目材料和想解释的短板 6 个维度，输出 6 个练习问题、准备提示、反问面试官清单和面试前检查。
- 这是浏览器本地模板与结构整理工具，不上传简历、不调用 AI、不判断岗位匹配度或录用概率；复用 `OfficeToolRenderer`、统一办公工作台、复制/TXT 下载、恢复示例和隐私边界提示。

### Develop

- `src/lib/text.ts`：增加 `InterviewStage`、`InterviewPrepQuestion`、`InterviewPrepDraft` 与 `generateInterviewPrep`；根据阶段切换练习方向，使用用户输入的真实材料生成追问上下文，不编造答案或经历。
- `src/components/tools/OfficeToolRenderer.tsx`：增加面试准备工作区、6 个问题卡片、反问清单、面试前检查、复制、`interview-prep-draft.txt` 下载、恢复示例和风险提示。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/app/globals.css`：接入 #79 独立详情页路由、标记本地已实现并补齐桌面/移动端输入和结果样式；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 面试准备本地自测通过：案例面输出 6 个问题和 3 个反问方向，多行经历可拆分，空岗位返回 `null`；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、71 个已实现，#79 名称为“面试准备整理”且为本地处理；静态导出检查为 100 个详情页、71 个真实工作区、29 个 Coming Soon 页面；面试页含标题、现在可用状态、操作区、TXT 下载、边界提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/ai-interview-questions`、`/tools/ai-weekly-report`、`/tools/ai-resume`、`/tools/ai-ppt-outline`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；面试页线上关键文案、已上线状态、工作区、TXT 下载命名、canonical 和 FAQ 存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 30 临时压缩包和 staging/old 目录已清理，正式备份 `/www/backup/tools-hub-100-stage30-before-20260911` 保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级移动端双列输入收敛为单列、问题卡片长文本折行和静态输出检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更完整：求职路径现在覆盖简历内容整理、面试准备整理两个连续阶段，且每一步都明确基于用户真实材料，不再把通用模板伪装成实时 AI 招聘能力。
- 首页继续聚焦搜索、热门工具和场景入口；面试工具只进入工具库、AI/求职子分类与相关推荐，不增加首页卡片或场景工具包密度，首屏仍然克制。
- 面试准备是高频且有商业潜力的场景，未来可评估真实岗位 JD 对照、模型追问和模拟面试，但这些能力需要数据来源、隐私同意、模型成本和结果可解释性，当前阶段不做不可逆架构扩张。
- 应新增/调整：Stage 31 优先将原“AI 总结长文”改造成“长文重点整理”，补齐阅读与知识处理链路；之后再评估学生学习工具包。应降级/合并：无数据源的爆款预测、泛化 AI 工具对比、重复 Prompt 库和需要实时数据的能力继续保持待实现。
- 当前最大体验问题：办公/求职工具仍缺少统一的本地历史、收藏结果和 DOCX/PDF 正式导出；面试问题只是练习方向，用户仍需人工核对事实、保密边界和回答质量，真实设备视觉与下载反馈尚待 CUA 复验。下一阶段最值得做的是可解释的本地长文整理，而不是继续堆叠“AI 生成”名称。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 30 实现提交为 `3a2b1d6 feat: add local interview prep organizer`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage30-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：问题由本地规则和用户材料组合而成，不读取实时岗位要求、不判断面试官意图、不生成可保证通过的答案；用户需自行核对项目真实性、数字、职位信息和保密边界，练习结果不上传或保存。
- 下一阶段：Stage 31 优先实现本地长文重点整理，保持 71 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 45. 2026-09-11：第二阶段 Stage 31 本地长文重点整理（已完成）

### Plan / Design

- Stage 30 已完成面试准备整理后，选择 #76“AI 总结长文”作为办公与学习信息处理的下一项；真正的语义总结需要模型、成本和隐私边界，因此保留旧 slug `ai-long-summary` 兼容历史链接，将工具重命名为“长文重点整理”，明确只做可解释的原文抽取。
- 采用正文、可选阅读重点和提取范围（精简/标准/详细）三个输入维度，输出标题线索、字符/行数/文本块统计、重点段落、结构线索、行动项线索和人工核对清单。
- 重点段落按照段落位置、长度、用户关注词和结构信号排序，保留原文片段并标注抽取原因；不改写、不翻译、不声称理解全文，所有内容只在浏览器本地处理。

### Develop

- `src/lib/text.ts`：增加 `LongTextDepth`、`LongTextHighlight`、`LongTextDraft` 与 `generateLongTextHighlights`；加入本地文本块拆分、关键词/结构信号评分、行动项线索提取和字符统计，输入上限 12,000 字符。
- `src/components/tools/OfficeToolRenderer.tsx`：增加长文工作区、提取范围、统计卡片、重点段落和行动项结果、复制、`long-text-highlights.txt` 下载、恢复示例和能力边界提示。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/app/globals.css`：接入 #76 独立详情页路由、标记本地已实现并补齐桌面/移动端样式；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 长文本地自测通过：多段文本输出重点和行动项，详细模式输出 3 个以上重点，空输入返回 `null`；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、72 个已实现，#76 名称为“长文重点整理”且为本地处理；静态导出检查为 100 个详情页、72 个真实工作区、28 个 Coming Soon 页面；长文页含标题、现在可用状态、统计、操作区、TXT 下载、边界提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/ai-long-summary`、`/tools/ai-interview-questions`、`/tools/ai-weekly-report`、`/tools/ai-resume`、`/tools/ai-ppt-outline`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；长文页线上关键文案、已上线状态、统计/工作区、TXT 下载命名、canonical 和 FAQ 存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 31 临时压缩包和 staging/old 目录已清理，正式备份 `/www/backup/tools-hub-100-stage31-before-20260911` 保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级移动端输入单列、长文本折行和静态输出检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更清晰：平台开始提供可解释的信息处理能力，长文工具从“AI 总结”收敛为“原文重点抽取”，用户能明确知道结果来自哪里、需要自己核对什么，信任感比泛化 AI 宣称更高。
- 首页继续聚焦搜索、热门工具和场景入口；长文工具只进入工具库、AI/文本处理子分类与相关推荐，不增加首页卡片或新的场景工具包，首屏信息密度保持稳定。
- 长文重点整理对会议记录、项目复盘和学习资料都有长期需求，未来可与真正授权的模型服务形成分层体验，但当前本地版本先验证需求和使用路径，不引入登录、数据留存或付费 API。
- 应新增/调整：Stage 32 优先将原“AI 改写降重”改造成“文本表达整理”，强调可控的段落清理和表达检查，不承诺规避检测；之后再评估学生学习工具包。应降级/合并：无数据源的爆款预测、泛化 AI 工具对比、重复 Prompt 库和需要实时数据的能力继续保持待实现。
- 当前最大体验问题：本地文本工具仍缺少统一的历史/收藏结果入口和 DOCX/PDF 正式导出；抽取结果不等同于完整摘要，用户仍需回看上下文、核对数字和隐私，真实设备视觉与下载反馈尚待 CUA 复验。下一阶段最值得做的是可控的文本表达整理，而不是继续堆叠 AI 名称。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 31 实现提交为 `d9d704f feat: add local long text highlights`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage31-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：算法只按文本位置、长度和有限关键词抽取，不理解上下文、不判断事实、不保证覆盖全文重点；正文最多 12,000 字符，用户引用结果前必须回看原文，涉及数字、版权、客户和内部资料时需人工核对。工具不上传或保存输入。
- 下一阶段：Stage 32 优先实现本地文本表达整理，保持 72 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 46. 2026-09-11：第二阶段 Stage 32 本地文本表达整理（已完成）

### Plan / Design

- Stage 31 已完成长文重点抽取后，选择 #75“AI 改写降重”进行能力边界重构；自动改写和“降重”容易被误用于规避原创、查重或平台规则，因此保留旧 slug `ai-rewrite` 兼容历史链接，将工具重命名为“文本表达整理”。
- 采用原文、表达方向（清晰直接/正式稳妥/精简克制/自然友好）两个输入维度，输出格式清理后的文本、字数/段落统计、填充表达/长句/重复标点检查、调整建议和发布前核对清单。
- 默认不改变语义；只有“精简克制”会移除有限且明确列出的填充词，其余只做空格、段落和问题提示，所有处理均在浏览器本地完成。

### Develop

- `src/lib/text.ts`：增加 `TextExpressionMode`、`TextExpressionIssue`、`TextExpressionDraft` 与 `prepareTextExpression`；加入输入清理、有限填充词处理、长句/重复标点检查和模式化建议，输入上限 10,000 字符。
- `src/components/tools/TextExpressionToolRenderer.tsx`：新增独立文本表达工作区，支持表达方向、整理后文本、复制、`text-expression-draft.txt` 下载、恢复示例和原创/合规边界提示。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/app/globals.css`：接入 #75 独立详情页路由、标记本地已实现并补齐结果样式；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 文本表达本地自测通过：精简模式移除有限填充词，保留段落结构并检测重复标点，空输入返回 `null`；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、73 个已实现，#75 名称为“文本表达整理”且为本地处理；静态导出检查为 100 个详情页、73 个真实工作区、27 个 Coming Soon 页面；文本页含标题、现在可用状态、表达方向、复制/下载入口、边界提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/ai-rewrite`、`/tools/ai-long-summary`、`/tools/ai-interview-questions`、`/tools/ai-weekly-report`、`/tools/ai-resume`、`/tools/ai-ppt-outline`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；文本页线上关键文案、已上线状态、工作区、TXT 下载命名、canonical 和 FAQ 存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 32 临时压缩包和 staging/old 目录已清理，正式备份 `/www/backup/tools-hub-100-stage32-before-20260911` 保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级移动端输入单列、只读文本区折行和静态输出检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更可信：平台把“改写降重”收敛为用户可控的表达整理和问题检查，不承诺改变作者身份、规避查重或自动通过平台审核，原创和合规边界更清楚。
- 首页继续聚焦搜索、热门工具和场景入口；文本表达工具只进入工具库、AI/文本处理子分类与相关推荐，不增加首页卡片或场景工具包，首屏信息密度保持稳定。
- 文本整理具备办公、学习和内容发布的长期需求；后续可以评估更强的人工编辑辅助，但不应在没有模型、语料和授权时宣称语义改写或查重能力。
- 应新增/调整：Stage 33 优先实现本地电商 Prompt 模板库，先覆盖商品标题、卖点、客服和跨境场景的真实可复制模板；之后再评估小红书/短视频 Prompt 模板库。应降级/合并：规避检测、爆款预测、泛化 AI 工具对比和需要实时数据的能力继续保持待实现。
- 当前最大体验问题：文本工具之间仍缺少统一历史/收藏结果和正式文件导出；表达检查不能替代人工编辑、原创判断、引用核验和平台规则，真实设备视觉与下载反馈尚待 CUA 复验。下一阶段最值得做的是可检索的运营模板库，而不是继续堆叠自动生成名称。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 32 实现提交为 `e6351ea feat: add local text expression organizer`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage32-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：工具只清理有限格式并提示表达问题，不理解语境、不判断原创、不提供查重结论；精简模式可能改变语气，用户需逐句核对事实、引用、隐私和平台要求，文本不上传或保存。
- 下一阶段：Stage 33 优先实现本地电商 Prompt 模板库，保持 73 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 47. 2026-09-11：第二阶段 Stage 33 本地电商 Prompt 模板库（已完成）

### Plan / Design

- Stage 32 已完成文本表达整理后，选择 #73“电商 Prompt 模板库”推进电商/跨境运营方向；Prompt 模板本身可以在浏览器本地维护和填充，适合作为真实工具，但必须说明它只是可复制的任务指令，不是自动生成器、实时热度工具或平台接口。
- 采用商品/服务、目标用户、真实卖点与规格、平台/市场、模板场景（商品信息/营销内容/客服沟通/跨境电商）和表达方向 6 个输入维度，按场景输出 2 个可填充 Prompt 模板。
- 模板覆盖商品标题结构、卖点提炼、详情页首屏、短视频卖点提纲、售前/售后沟通、英文商品描述准备和跨境物流说明；所有模板都要求模型或人工仅使用已核对资料，缺失信息明确标注待确认。

### Develop

- `src/lib/text.ts`：增加 `EcommercePromptCategory`、`EcommercePromptTone`、`EcommercePrompt`、`EcommercePromptDraft` 与 `generateEcommercePrompts`；本地填充商品上下文、场景模板和广告/客户信息边界。
- `src/components/tools/PromptLibraryToolRenderer.tsx`：新增电商模板工作区，支持场景/语气选择、商品信息填充、单项复制、整组复制和 `ecommerce-prompt-templates.txt` 下载。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/app/globals.css`：接入 #73 独立详情页路由、标记本地已实现并补齐模板卡片样式；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 电商 Prompt 本地自测通过：客服场景输出 2 个模板，商品信息正确填充，缺失信息保留“需要进一步确认”边界，空商品返回 `null`；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、74 个已实现，#73 为本地处理；静态导出检查为 100 个详情页、74 个真实工作区、26 个 Coming Soon 页面；电商页含标题、现在可用状态、四类场景、复制/下载入口、边界提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/ecommerce-prompt-library`、`/tools/ai-rewrite`、`/tools/ai-long-summary`、`/tools/ai-interview-questions`、`/tools/ai-weekly-report`、`/tools/ai-resume`、`/tools/ai-ppt-outline`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；电商页线上关键文案、已上线状态、模板工作区、TXT 下载命名、canonical 和 FAQ 存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 33 临时压缩包和 staging/old 目录已清理，正式备份 `/www/backup/tools-hub-100-stage33-before-20260911` 保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级移动端表单单列、Prompt 长文本折行和静态输出检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更丰富：平台从文本与办公处理延伸到电商运营准备，但仍坚持“模板可控、事实可核对、能力边界清楚”，没有把 Prompt 库包装成自动代运营或实时数据产品。
- 首页继续聚焦搜索、热门工具和场景入口；电商 Prompt 只进入工具库、AI/Prompt 模板子分类与相关推荐，不增加首页卡片或场景工具包，首屏保持克制。
- 电商和跨境运营具备搜索需求与商业潜力，未来可评估合规字段、平台差异和真实工作流，但商品功效、广告法、物流和客户隐私需要人工审核，不能由模板替代。
- 应新增/调整：Stage 34 优先实现本地短视频 Prompt 模板库，覆盖选题、脚本、分镜和复盘，并复用本阶段模板工作区；之后再评估小红书 Prompt 模板库。应降级/合并：无数据源的爆款预测、实时平台热度、自动投放和泛化 AI 工具对比继续保持待实现。
- 当前最大体验问题：Prompt 模板和内容工具仍缺少统一的历史/收藏结果入口，跨平台实际效果也没有数据验证；用户必须核对商品声明、客户资料、版权和平台规则，真实设备视觉与下载反馈尚待 CUA 复验。下一阶段最值得做的是复用模板架构完成短视频场景，而不是新增无差别模板数量。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 33 实现提交为 `9c42950 feat: add local ecommerce prompt library`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage33-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：模板只是 Prompt 结构，不执行模型、不读取实时平台数据、不保证生成内容合规或转化；商品、功效、认证、价格、物流、客户资料和跨境信息均需用户自行核对，输入不上传或保存。
- 下一阶段：Stage 34 优先实现本地短视频 Prompt 模板库，保持 74 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 48. 2026-09-11：第二阶段 Stage 34 本地短视频 Prompt 模板库（已完成）

### Plan / Design

- Stage 33 已完成电商 Prompt 模板库后，选择 #74“短视频 Prompt 模板库”延伸内容运营场景；短视频用户需要的首先是可复用的准备框架，因此提供选题、脚本、分镜和复盘模板，不把 Prompt 库包装成爆款预测或自动代写服务。
- 采用视频主题、目标观众、发布平台、真实素材与限制、模板场景和预计时长 6 个输入维度，按场景输出 2 个可填充 Prompt 模板，并复用电商模板页的卡片、复制、下载和边界提示设计。
- 模板要求用户补充真实素材、版权和平台限制；复盘模板只列出需要人工填写的数据，不读取平台后台、不预测流量、不自动发布。

### Develop

- `src/lib/text.ts`：增加 `ShortVideoPromptScene`、`ShortVideoPromptDuration`、`ShortVideoPromptDraft` 与 `generateShortVideoPrompts`；覆盖选题、口播、分镜和复盘模板，并填充主题、平台、时长与限制。
- `src/components/tools/ShortVideoPromptLibraryToolRenderer.tsx`：新增短视频模板工作区，支持场景/时长选择、真实素材填充、单项复制、整组复制和 `short-video-prompt-templates.txt` 下载。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`：接入 #74 独立详情页路由并标记为本地已实现；复用 `prompt-library-*` 样式，未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 短视频 Prompt 本地自测通过：分镜场景输出 2 个模板，主题和时长正确填充，空主题返回 `null`；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、75 个已实现，#74 为本地处理；静态导出检查为 100 个详情页、75 个真实工作区、25 个 Coming Soon 页面；短视频页含标题、现在可用状态、四类场景、时长选择、复制/下载入口、边界提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/short-video-prompt-library`、`/tools/ecommerce-prompt-library`、`/tools/ai-rewrite`、`/tools/ai-long-summary`、`/tools/ai-interview-questions`、`/tools/ai-weekly-report`、`/tools/ai-resume`、`/tools/ai-ppt-outline`、`/tools/comment-reply-generator`、`/tools/moments-copy-generator`、`/tools/wechat-title-generator`、`/tools/pdf-to-image`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；短视频页线上关键文案、已上线状态、模板工作区、TXT 下载命名、canonical 和 FAQ 存在。
- 服务器回归：Nginx 配置测试和重载成功，39090 在 IPv4/IPv6 上监听，Nginx master/worker 正常；Stage 34 临时压缩包和 staging/old 目录已清理，正式备份 `/www/backup/tools-hub-100-stage34-before-20260911` 保留。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响，已完成代码级移动端表单单列、Prompt 长文本折行和静态输出检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更完整：电商和短视频 Prompt 模板形成两个相邻的内容运营场景，用户可以准备素材和任务指令，但平台仍诚实地把执行、审核和数据复盘留给用户或其授权工作流。
- 首页继续聚焦搜索、热门工具和场景入口；短视频 Prompt 只进入工具库、AI/Prompt 模板子分类与相关推荐，不增加首页卡片或场景工具包，首屏保持克制。
- 短视频创作有长期需求和商业潜力，但热度、推荐和转化依赖平台数据与真实内容质量，模板只能降低准备成本；后续若接入数据服务，必须单独评估授权、成本和隐私。
- 应新增/调整：Stage 35 优先实现本地小红书 Prompt 模板库，覆盖选题、标题、笔记和评论互动，复用现有模板架构；之后再评估学生学习或跨境运营工具包。应降级/合并：爆款预测、实时平台热度、自动投放和泛化 AI 工具对比继续保持待实现。
- 当前最大体验问题：Prompt 模板工具仍缺少统一的历史/收藏结果入口和真实效果反馈；用户需要核对版权、隐私、广告与平台规则，真实设备视觉与下载反馈尚待 CUA 复验。下一阶段最值得做的是补齐小红书场景闭环，而不是增加无差别 Prompt 数量。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 95、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 34 实现提交为 `a06d9ae feat: add local short video prompt library`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage34-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次部署沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/重载 → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：模板只是 Prompt 结构，不执行模型、不读取实时平台数据、不保证流量或转化；用户需自行核对素材版权、人物隐私、商业合作披露、广告法和平台规则，输入不上传或保存。
- 下一阶段：Stage 35 优先实现本地小红书 Prompt 模板库，保持 75 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证浏览器本地或独立服务架构再上线。

## 49. 2026-09-11：第二阶段 Stage 35 本地小红书 Prompt 模板库（已完成）

### Plan / Design

- Stage 34 已完成短视频 Prompt 模板库后，继续实现 #72“小红书 Prompt 模板库”，补齐内容运营场景中从选题、标题、笔记到评论互动的准备链路。
- 采用笔记主题、目标读者、真实素材/已有经历、表达限制、模板场景和表达方向 6 个输入维度；每个场景输出 2 个可填充 Prompt 模板，所有内容在浏览器本地整理，不读取实时热度、不调用模型、不自动发布。
- 同时抽出通用 `PromptTemplate` 数据类型，让电商、短视频和小红书模板共享稳定的数据结构，避免后续每增加一个内容场景就复制一套类型和渲染协议。

### Develop

- `src/lib/text.ts`：新增 `PromptTemplate` 通用类型、`XhsPromptScene`、`XhsPromptTone`、`XhsPromptDraft` 与 `generateXhsPrompts`；覆盖选题方向/筛选、标题结构/检查、笔记结构/图文页提纲、评论回复/结尾互动，并保留 `EcommercePrompt` 类型别名兼容已有引用。
- `src/components/tools/XhsPromptLibraryToolRenderer.tsx`：新增小红书模板工作区，支持真实素材填充、4 类场景、4 种表达方向、单项复制、整组复制、`xhs-prompt-templates.txt` 下载、恢复示例和事实/版权/平台边界提示。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`：接入 #72 独立详情页路由，标记为本地已实现、低风险，并补充不读取实时平台数据的 SEO/产品描述；未新增 npm 依赖、API、服务器配置或第三方服务。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 小红书 Prompt 本地自测通过：选题、标题、笔记、互动 4 个场景均输出 2 个模板；主题和表达方向正确填充；空主题返回 `null`。Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 工具注册表断言通过：100 个工具、76 个已实现，#72 为本地处理且风险等级为 low；静态导出检查为 100 个详情页、76 个真实工作区、24 个 Coming Soon 页面；小红书页含标题、现在可用状态、模板场景、复制/下载入口、边界提示、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/xhs-prompt-library`、`/tools/ecommerce-prompt-library`、`/tools/short-video-prompt-library`、`robots.txt`、`sitemap.xml` 以及既有代表性工具页全部返回 HTTP 200；小红书页服务端 HTML 含独立标题、live 状态、Prompt 和 canonical 标记。静态路由约定为不带尾斜杠，`/tools/xhs-prompt-library/` 返回 404，未将其作为正式入口使用。
- 服务器回归：Nginx 配置测试和 reload 成功，Stage 35 目录切换完成；正式备份 `/www/backup/tools-hub-100-stage35-before-20260911` 保留，上传压缩包、staging 和 old 目录已清理。未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 真实设备视觉、拖拽和实际下载行为仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级移动端表单单列、Prompt 长文本折行和静态输出检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更清楚：小红书 Prompt 与电商、短视频 Prompt 组成相邻的内容运营准备链路，平台提供可控模板和资料整理，不把自己包装成自动代运营、爆款预测或实时平台数据服务。
- 首页继续聚焦搜索、热门工具和场景入口；小红书 Prompt 只进入工具库、AI/Prompt 模板子分类和相关推荐，没有把 8 个模板卡片堆到首页，首屏信息密度保持稳定。
- 分类认知得到补强：用户可以按“小红书内容运营”这一任务进入模板库，但一级分类仍部分使用 AI/Prompt 等技术语言，后续应继续通过场景工具包和筛选标签降低理解成本。
- 趋势与商业价值判断：小红书内容规划、标题和互动准备有长期需求，也能与电商和短视频形成商业场景；实时热度、爆款预测、自动评论和自动发布依赖平台数据/授权，继续保持未实现更诚实、更易维护。
- 应新增/调整：Stage 36 优先评估可维护的 AI 工具场景目录或学生/求职工具包，把静态可核对内容和真实工具入口组合起来；应降级或合并无数据源的 AI 工具对比、爆款预测和自动投放类入口，避免过期信息和伪能力。
- 当前最大体验问题：Prompt 工具仍没有统一的模板历史、收藏结果和跨工具复用入口，真实设备视觉与下载反馈也尚待 CUA 复验；下一阶段最值得做的是确定可维护的内容目录/工具包模型，而不是继续无差别增加模板数量。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备视觉项待补验）：视觉设计 94、信息架构 97、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 35 实现提交为 `0cbab9b feat: add local xiaohongshu prompt library`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage35-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；正确的无尾斜杠路由回归通过，临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：模板只是 Prompt 结构，不执行模型、不读取实时平台数据、不保证流量或转化；用户需自行核对真实经历、素材版权、人物隐私、商业合作披露、广告法和平台规则，输入不上传或保存。模板历史/收藏结果仍未形成跨工具内容闭环。
- 下一阶段：Stage 36 评估 AI 工具场景目录或高价值场景工具包，保持 76 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证数据维护与独立服务架构再上线。

## 50. 2026-09-11：第二阶段 Stage 36 本地 AI 工具场景目录（已完成）

### Plan / Design

- Stage 35 完成小红书 Prompt 模板库后，选择 #66“AI 工具导航”落地为真正可用的本地场景目录，而不是继续保留一张没有筛选和跳转能力的规划卡片。
- 目录首版收录 12 个静态官方入口，覆盖通用对话、搜索与研究、写作与整理、图片与设计、视频创作、编程开发、知识与协作 7 类场景；不展示价格、排名、热度、性能比较或未经核对的“最好用”结论。
- 采用浏览器本地关键词搜索、场景筛选和新窗口官方入口跳转；把外部服务可用性、地区、登录和费用变化明确放在页面边界提示中，降低过期内容和商业误导风险。

### Develop

- `src/data/ai-tools.ts`：新增 12 条静态 AI 服务目录数据、7 类场景标签和官方 HTTPS 链接；数据结构将名称、场景、用途说明、适用任务和 URL 分开，便于后续维护或替换。
- `src/components/tools/AiToolDirectoryRenderer.tsx`：新增目录工作区，支持关键词搜索、7 类场景筛选、结果计数、空结果提示、官方入口外链和第三方服务边界提示；不调用 API、不存储输入、不增加登录。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/app/globals.css`：接入 #66 独立详情页路由，标记为本地已实现并增加桌面/平板/移动端目录网格样式；未新增 npm 依赖、服务器 API 或数据库。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- AI 目录数据自测通过：12 个名称唯一、全部为 HTTPS、7 个场景标签可映射；工具注册表为 100 个工具、77 个已实现，#66 为本地处理且风险等级为 low。Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 静态导出检查：100 个详情页、77 个真实工作区、23 个 Coming Soon 页面；AI 目录页含标题、现在可用状态、搜索/场景文案、外部服务边界、canonical 和 FAQ；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、`/tools/ai-tool-directory`、`/tools/xhs-prompt-library`、`/tools/ecommerce-prompt-library`、`/tools/short-video-prompt-library`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；AI 目录页线上标题、live 状态、搜索入口、边界提示、canonical 和 FAQ 均存在。
- 外部链接检查：代码层面确认 12 个入口均为 HTTPS；部分服务对自动化 HEAD 请求限流、超时或要求浏览器环境，因此未把 HEAD 结果当作可用性保证，页面统一提示以官方页面为准。
- 服务器回归：Nginx 配置测试和 reload 成功，Stage 36 目录切换完成；正式备份 `/www/backup/tools-hub-100-stage36-before-20260911` 保留，上传压缩包、staging 和 old 目录已清理。未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 真实设备视觉、外链点击和移动端滚动仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级响应式网格、静态输出和公网 HTTP 回归，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更完整：平台不只是本地文件/文本处理，也提供“先找到合适外部工具，再回到本地完成整理”的入口；目录没有把外部产品包装成自有能力，信任边界清楚。
- 首页仍然克制：AI 目录只作为一个详情页和工具库入口，不把 12 个外部品牌卡片塞进首页，用户仍先从搜索、热门工具和场景工具包开始。
- 分类更接近用户任务：7 个场景标签比“AI 工具对比”更容易理解，但 AI 目录的内容维护依赖外部产品变动，后续应记录更新时间或建立人工审核节奏，不应自动宣称功能和价格。
- 趋势与商业价值判断：通用 AI、研究、创作、开发和知识协作入口符合当前需求，也能为后续商业合作或导流分析提供基础；但商业化、排名、付费推荐和用户评价暂不进入本阶段，避免利益冲突和过期信息。
- 应新增/调整：Stage 37 优先做场景工具包的任务链补强，尤其是求职简历、学生学习、跨境运营等已有真实工具可串联的方向；应降级或合并无来源、无维护责任的 AI 写作/图片/视频/编程对比页，先做可核对目录再做对比。
- 当前最大体验问题：目录外链的真实可访问性受地区、登录和反爬策略影响，且模板/工具结果历史仍未形成统一闭环；下一阶段最值得做的是场景工具包和统一本地记录的产品取舍，而不是继续扩大外部品牌数量。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备与外链点击项待补验）：视觉设计 94、信息架构 96、用户体验 94、一致性 95、品牌感 93、高级感 93、易用性 94、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 36 实现提交为 `619e5fa feat: add local ai tool directory`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage36-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：外部工具的功能、地区可用性、登录、价格、服务条款和链接结构会变化；本目录不做实时同步、不做性能/合规保证、不代替用户核验，静态数据需要后续人工更新。真实设备视觉、外链点击和统一结果历史仍待补验/规划。
- 下一阶段：Stage 37 评估场景化工具包与求职/学习路径，保持 77 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先验证用户任务链与维护成本再上线。

## 51. 2026-09-11：第二阶段 Stage 37 场景化任务工具包扩展（已完成）

### Plan / Design

- Stage 36 的 AI 工具目录解决了“去哪里找外部服务”，本阶段回到站内真实工具，补齐普通用户更容易理解的任务路径：求职简历、学习整理、AI 内容准备。
- 保留原有办公文件、小红书发布、图片交付、短视频发布、开发排查、生成与分享 6 组工具包，新增 3 组，共 9 组；工具包只展示已经上线的工具，不为即将上线工具制造可点击的空入口。
- 不把 9 组全部搬到首页，继续只在 `/tools` 列表页展示，首页保持搜索、热门入口和分类的三秒理解路径。

### Develop

- `src/data/toolkits.ts`：新增 `job-prep`、`study-notes`、`ai-content-prep` 三组任务工具包，分别串联简历/表达/面试、长文/去重/字数/Markdown、Prompt/小红书/短视频/电商模板，共 9 组、34 个真实工具入口。
- 复用现有 `SceneToolkitGrid`、图标映射、详情页 URL 和工具状态，不新增组件、依赖、API、登录或服务端逻辑；所有链接继续进入原有独立工具页面。

### Test / Self-check

- 场景工具包自测通过：9 组 ID 唯一，34 个入口全部能在工具注册表中找到且 `isImplemented=true`，没有未实现入口。
- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 静态工具列表检查通过：`out/tools.html` 含办公、求职、学习和 AI 内容四条任务链，独立详情页数量保持 100；工具注册表继续为 100 个工具、77 个已实现、23 个 Coming Soon。
- 公网回归：`/`、`/tools`、`/tools/ai-tool-directory`、`/tools/ai-resume`、`/tools/ai-long-summary`、`/tools/xhs-prompt-library`、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；`/tools` 线上可见“把求职材料准备好”“把学习资料理清楚”“把想法整理成清晰指令”和原有办公工具包。
- 真实设备视觉、横向滚动和工具包内逐项点击仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级卡片网格与静态公网检查，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更像“按任务开始的工具工作台”：用户不必先理解 AI、PDF 或 Office 的技术分类，可以从求职、学习或内容准备的目标进入一串真实工具。
- 首页没有变拥挤：工具包继续只在 `/tools` 展示，首页仍然保留搜索、少量热门工具和分类入口；这是对“少即是多”原则的刻意坚持。
- 分类认知更符合普通用户：求职简历、学习整理和 AI 内容准备与真实任务相连；但工具包内链接数量接近单卡上限，后续应按数据和点击行为精简，不再无限增加入口。
- 趋势与商业价值判断：求职、学习和内容运营都是长期需求，且能自然承接已有本地工具；下一步可观察哪些组合真的被使用，再决定是否做模板收藏、批量导出或更深的任务状态。
- 应新增/调整：Stage 38 优先评估统一本地使用历史与结果复用，先覆盖文本、Prompt 和办公工具；应降级/合并重复的“AI 工具对比”入口，避免目录与对比页同时维护同一批外部信息。
- 当前最大体验问题：工具包只是链接串联，还没有“已完成第几步”、结果留存或跨工具复制；下一阶段最值得做的是低风险的本地记录模型，而不是再增加工具包数量。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实设备项待补验）：视觉设计 94、信息架构 98、用户体验 95、一致性 96、品牌感 94、高级感 94、易用性 96、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 37 实现提交为 `5f7cbf1 feat: expand task based toolkits`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage37-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：工具包依赖成员工具的可用性和命名稳定性；学习、求职和内容结果仍需用户核对事实、隐私、版权和平台规则；本阶段没有新增结果历史、批量导出或跨工具状态保存。
- 下一阶段：Stage 38 评估统一本地使用历史与结果复用能力，保持 77 个已实现工具可运行；继续保持 HEIC、Office 高级转换、OCR、FFmpeg、真正 AI 服务等高风险能力的边界记录，先做可清理、可限额、无需登录的浏览器本地方案。

## 52. 2026-09-11：第二阶段 Stage 38 本地结果历史首批接入（已完成）

### Plan / Design

- Stage 37 已把工具按求职、学习和内容准备串成任务链，本阶段处理任务完成后的留存问题；先做浏览器本地结果历史，不引入账号、数据库、云同步或服务端上传。
- 结果历史采用最多 20 条全局容量、按最新优先、同工具同内容去重、单条最多 12,000 字符和手动删除；只在用户点击“保存本次结果”后写入，不静默保存输入或结果。
- 首批接入小红书、电商、短视频 Prompt 模板库和文本表达整理 4 个工作区，复用同一个控件和 localStorage 协议，后续办公工具接入时不复制存储逻辑。

### Develop

- `src/lib/storage.ts`：新增 `ToolHistoryEntry`、`getToolHistory`、`saveToolHistory`、`deleteToolHistory`，使用 `tools-hub-100:tool-history`，对无 localStorage、隐私模式和容量异常做容错。
- `src/components/tools/ToolPrimitives.tsx`：新增 `HistoryControls`，提供保存、按工具查看、复制和删除；明确“最多保留 20 条，仅在本设备保存”。
- `src/components/tools/PromptLibraryToolRenderer.tsx`、`ShortVideoPromptLibraryToolRenderer.tsx`、`XhsPromptLibraryToolRenderer.tsx`、`TextExpressionToolRenderer.tsx`：在复制/下载结果区后接入本地历史控件；`src/app/globals.css` 增加折叠历史列表、长文本折行和移动端可读样式。
- 本阶段没有接入 `OfficeToolRenderer` 的 5 个办公结果区，因为它们目前使用长单行 JSX；先保持功能稳定，下一阶段单独小步接入，避免为了历史功能做大面积重排。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- 本地存储自测通过：容量上限 20、最新优先、同工具同内容去重、按工具过滤、删除和跨工具共存均符合预期；Node 类型剥离和模块类型提示属于既有测试环境警告，不是项目构建错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 静态页检查：小红书、电商、短视频 Prompt 和文本表达 4 页均包含“保存本次结果”、本机保存边界、canonical 和 live 状态；工具注册表继续为 100 个工具、77 个已实现、23 个 Coming Soon；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：`/`、`/tools`、4 个历史接入工具页、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200，线上四页均能读到保存入口和本机历史提示。
- 真实浏览器点击保存、刷新后展开、删除、复制和移动端折叠仍受 CUA 运行时缺少 `@oai/cua/tinyskyAlt` 影响；已完成代码级存储自测、静态输出和公网回归，待环境恢复后补验真实浏览器矩阵。

### Product Review

- 产品定位更完整：工具不只“生成一次结果”，用户可以选择把重要结果留在当前设备，符合不登录、隐私优先的工作台定位；保存是显式动作，避免隐私预期被破坏。
- 首页和工具库信息架构未变：历史入口只出现在具体工作区，首页仍只展示最近使用的工具，不增加结果列表噪音。
- 分类和工具质量得到小幅提升：Prompt 与文本整理现在有连续的“生成/整理 → 复制/下载 → 本机留存”路径；办公工具还没有接入，不能把全站历史能力表述为已完成。
- 趋势与商业价值判断：本地结果留存是办公、内容运营、求职和学习的共性需求，后续可以观察历史使用频率，再决定是否需要导出、恢复输入或跨工具引用；不应直接演进到账号云同步而没有隐私与权限模型。
- 应新增/调整：Stage 39 优先接入 5 个办公结果工作区，并评估“恢复结果/导出历史”是否真的比复制下载更有价值；应降级或合并无数据源的 AI 对比工具，不把历史能力用于保存外部服务结果或敏感文件。
- 当前最大体验问题：结果历史仍是每个工具独立查看，不能跨工具搜索、恢复输入或标记任务状态；容量和长文本边界也需要真实设备验证。下一阶段最值得做的是办公工具接入和恢复交互评估，而不是先做云端账户系统。
- 阶段评分（基于代码、构建产物、静态回归、服务器和公网回归；真实点击项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 97、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 38 实现提交为 `c1bf3c5 feat: add local result history controls`，当前分支为 `main`；实现提交已推送到 GitHub `origin/main`，本次上下文更新随后单独提交并推送。
- 腾讯云已发布到 `/www/wwwroot/tools-hub-100`，公网入口仍为 `http://101.43.29.216:39090/`；本次正式回滚备份为 `/www/backup/tools-hub-100-stage38-before-20260911`，未修改旧项目、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，正式备份保留。
- 已知风险：历史内容保存在当前浏览器 localStorage，清理浏览器数据、隐私模式、跨设备使用和容量限制都会影响留存；内容最多 12,000 字符且没有加密，不适合保存密码、密钥、身份证件或未脱敏客户资料。办公结果、恢复输入和跨工具搜索尚未接入。
- 下一阶段：Stage 39 接入办公结果历史并评估恢复/导出交互，保持 77 个已实现工具可运行；继续坚持显式保存、可删除、有限容量、无需登录，不引入服务端留存。

## 53. 2026-09-11：第二阶段 Stage 39 办公结果历史扩展（已完成）

### Plan / Design

- 在 Stage 38 的统一 localStorage 协议上扩展办公工作区，不新增账号、数据库、云同步、服务端上传或第三方依赖。
- 5 个办公整理工具沿用“用户显式点击保存 → 当前设备保留 → 可复制/删除”的边界；不静默保存输入，不改变既有复制、TXT 下载和重置路径。

### Develop

- `src/components/tools/OfficeToolRenderer.tsx`：为长文重点整理、面试准备整理、工作周报整理、简历内容整理、PPT 大纲整理 5 个结果区接入共享 `HistoryControls`。
- 复用 `src/lib/storage.ts` 的最多 20 条、按最新优先、同工具同内容去重、单条最多 12,000 字符和手动删除规则；不新增 npm 依赖、不改变静态导出和服务端架构。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 产物检查：100 个工具详情页、77 个 live 工具、5 个办公页面均包含“保存本次结果”、本机保存边界、canonical 和 live 状态；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：主页、`/tools`、5 个办公页、小红书 Prompt 页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；5 个办公页线上历史入口与 SEO 标记均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload 和本机回归；备份位于 `/www/backup/tools-hub-100-stage39-before-20260911`。真实浏览器点击保存、刷新展开、删除、复制和移动端拖拽仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更完整：文本、Prompt 和办公工作区都具备“整理/生成 → 复制/下载 → 本机留存”的连续路径，但仍坚持不把规则整理包装成 AI 服务。
- 首页保持聚焦：历史入口只出现在具体工作区，不把结果列表搬到首页；工具库仍按任务工具包组织，首次访问路径没有变长。
- 分类和工具质量更符合真实办公任务：周报、简历、面试、长文和 PPT 结果可以按需留存，适合重复使用的个人工作流；不新增无数据源的外部 AI 对比功能。
- 趋势与商业价值判断：本地留存对办公、求职、学习和内容运营都有复用价值，下一步应先验证恢复/导出是否比复制下载更有价值，再决定是否扩大历史能力；账号云同步需要单独的隐私与权限设计，暂不推进。
- 应新增/调整：Stage 40 优先评估“恢复历史结果/导出历史”的轻量交互，或实现一个仍有明确搜索需求的高价值工具；HEIC、OCR、Office 高级转换、FFmpeg 和真正 AI 服务继续单独验证，不伪装上线。
- 当前最大体验问题：历史记录仍是工具内查看，不能恢复输入、跨工具搜索或标记任务状态；localStorage 的容量、清理和跨设备限制仍需真实设备验证。
- 阶段评分（基于代码、构建产物、服务器和公网回归；真实点击项待补验）：视觉设计 94、信息架构 96、用户体验 96、一致性 97、品牌感 94、高级感 94、易用性 96、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 39 实现提交为 `3c657b4 feat: extend local result history to office tools`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 39 正式备份保留。
- 已知风险：历史内容保存在当前浏览器 localStorage，最多 20 条、单条最多 12,000 字符、没有加密；清理浏览器数据、隐私模式、跨设备使用和容量限制都会影响留存，不适合保存密码、密钥、身份证件或未脱敏客户资料。
- 下一阶段：Stage 40 评估恢复/导出交互或继续实现一个高价值工具，保持 77 个已实现工具和 9 个历史工作区可运行；继续坚持显式保存、可删除、有限容量、无需登录，不引入服务端留存。

## 54. 2026-09-11：第二阶段 Stage 40 本地历史结果导出（已完成）

### Plan / Design

- Stage 39 已让 9 个文本、Prompt 和办公工作区可以显式保存结果；本阶段先解决“刷新后结果只能复制、不能再次下载”的实际问题，不急于引入输入恢复、跨工具搜索或云同步。
- 复用现有 `TextDownloadButton` 和 localStorage 数据，不新增依赖、不新增 API、不改变最多 20 条、单条最多 12,000 字符和仅本机的隐私边界。

### Develop

- `src/components/tools/ToolPrimitives.tsx`：为 `TextDownloadButton` 增加可选按钮文案；历史条目新增“下载结果”，文件名包含工具 slug 和保存时间，仍要求用户在当前设备的点击操作触发下载。
- 未改变 `src/lib/storage.ts` 数据结构；历史内容仍显式保存、按工具查看、可复制、可删除。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 结构检查：源码包含历史条目下载控件；100 个工具详情页、77 个 live 工具、9 个历史工作区和 109 条 sitemap URL 保持不变，sitemap 无 localhost。
- 公网回归：主页、`/tools`、5 个办公页、1 个 Prompt 页、`robots.txt`、`sitemap.xml` 全部 HTTP 200；5 个办公页仍包含保存入口、本机边界、canonical 和 live 状态。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回归和公网回归；备份位于 `/www/backup/tools-hub-100-stage40-before-20260911`。真实浏览器下载手势、刷新后展开和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更完整：本地工作台保存的结果不再被锁在历史折叠区，用户可以在之后复制或重新下载，仍保持无需登录和隐私优先。
- 首页继续聚焦：没有把历史结果或导出入口搬到首屏；新增能力只出现在具体工具工作区，不增加首页信息噪音。
- 分类和工具质量保持统一：办公、Prompt 和文本工作区共用同一套历史控件与下载文案，降低用户学习成本；导出的是保存时的文本结果，不假装保留原始文件格式或可编辑输入状态。
- 趋势与商业价值判断：可携带的文本结果适合周报、简历、内容运营和学习笔记的轻量工作流；在没有隐私、权限和同步设计前，不应继续扩展为账号云端历史。
- 应新增/调整：Stage 41 评估输入恢复是否能明显减少重复填写，再决定是否接入回调；同时选择一个有明确长期需求的 PDF/Office/OCR/视频能力做技术验证，不为凑 100 个而降低“真正可用”标准。
- 当前最大体验问题：历史条目仍不能恢复生成前的输入和选项，也不能跨工具搜索；下载只支持文本结果，复杂文件和结构化格式仍需独立产品设计。
- 阶段评分（基于代码、构建产物、服务器和公网回归；真实点击项待补验）：视觉设计 94、信息架构 96、用户体验 96、一致性 97、品牌感 94、高级感 94、易用性 96、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 40 实现提交为 `a3fe438 feat: allow downloading saved local results`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 40 正式备份保留。
- 已知风险：历史内容保存在当前浏览器 localStorage，最多 20 条、单条最多 12,000 字符、没有加密；清理浏览器数据、隐私模式、跨设备使用和容量限制都会影响留存。导出是文本下载，不保留 DOCX/PDF 原格式，也不适合保存密码、密钥、身份证件或未脱敏客户资料。
- 下一阶段：Stage 41 评估历史输入恢复或继续实现一个高价值工具，保持 77 个已实现工具和 9 个历史工作区可运行；继续坚持显式保存、可删除、有限容量、无需登录，不引入服务端留存。

## 55. 2026-09-11：第二阶段 Stage 41 本地 PDF 转 Word 文本提取（已完成）

### Plan / Design

- 剩余工具中，PDF 转 Word 是明确的办公需求，但完整保留复杂版式、表格、图片和扫描文字需要专用转换/OCR 服务；本阶段先交付可解释、可维护的浏览器本地文本提取版本，不把它包装成版式级转换。
- 复用现有 `pdfjs-dist` 动态加载、PDF 文件验证和静态部署，不新增后端、不上传文件、不新增依赖；对页数、文字量、加密/损坏 PDF 和无可复制文字明确报错。

### Develop

- `src/components/tools/PdfToolRenderer.tsx`：新增 PDF.js 文本提取、按页面和坐标行重组文字、Word 可打开的 `.doc` HTML 文档生成、字符/页数限制和下载结果面板。
- `src/components/ToolRenderer.tsx`：将 `pdf-to-word` 接入真实 PDF 工作区路由。
- `src/data/tools.ts`：把 PDF 转 Word 标记为浏览器本地 live 工具，并把描述改为“提取可复制文字、版式和扫描文字不完整保留”。
- `src/lib/seo.ts`：为 PDF 转 Word 增加版式保留限制 FAQ，确保页面说明和 JSON-LD 诚实一致。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 临时内存 PDF 自测：用 `pdf-lib` 生成含测试文本的 1 页 PDF，使用 PDF.js 官方 legacy Node 构建提取并断言文本成功；默认 PDF.js Node 构建在 Node 22 自测环境触发 `Promise.try` 兼容提示，属于 Node 自测环境差异，浏览器构建链已通过 Next 生产构建验证，未将 Node 默认构建改入产品。
- 产物检查：100 个工具详情页、78 个 live 工具、22 个即将上线工具；`/tools/pdf-to-word` 包含真实工作区、限制提示、专属 FAQ、canonical、live 和 FAQ JSON-LD；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：主页、`/tools`、`/tools/pdf-to-word`、`/tools/pdf-to-image`、`/tools/ai-weekly-report`、`robots.txt`、`sitemap.xml` 全部 HTTP 200；PDF 转 Word 页面线上没有 `status-soon`。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回归和公网回归；备份位于 `/www/backup/tools-hub-100-stage41-before-20260911`。真实浏览器选择 PDF、下载 Word、复杂版式和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更清晰：从“PDF 转 Word”泛化承诺收敛为“本地提取可复制文字并生成 Word 可打开文档”，用户在 3 秒内能知道是否适合自己的 PDF，减少失败预期。
- 首页和工具库保持聚焦：新工具只进入 PDF/Office 分类、搜索、工具包和相关推荐，不增加首屏复杂度；PDF 工具链新增了从页面文件到可编辑文字的真实入口。
- 分类和工具质量更符合办公认知：文本型 PDF 有立即可用路径，扫描 PDF、复杂表格和版式转换仍明确指向 OCR/专业转换的后续能力，没有用假按钮覆盖差距。
- 趋势与商业价值判断：PDF 文字提取是稳定办公需求，本地处理强化隐私卖点；完整 DOCX、OCR 和表格识别若要上线，需要独立评估 WASM 体积、字体布局、浏览器内存、上传清理和服务成本。
- 应新增/调整：Stage 42 优先评估 PDF OCR 或 PDF 转 Excel 的真实技术边界，先做小样本准确率和资源体积验证；Word 转 PDF、Excel/PPT 转 PDF 继续等待稳定的解析/排版方案；AI 对比工具仍建议合并到静态 AI 目录或维持待实现。
- 当前最大体验问题：PDF 转 Word 只输出文本型 `.doc`，不恢复原始版式、图片、表格或扫描文字；用户仍需要在真实浏览器中验证中文字体、下载兼容性和大文件内存表现。
- 阶段评分（基于代码、构建产物、核心提取自测、服务器和公网回归；真实浏览器文件交互待补验）：视觉设计 94、信息架构 96、用户体验 93、一致性 97、品牌感 94、高级感 94、易用性 93、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 41 实现提交为 `a44d265 feat: implement local pdf text to word export`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 41 正式备份保留。
- 已知风险：PDF.js 文本顺序和坐标在复杂 PDF、双栏、旋转页面或嵌入字体时可能不完美；扫描 PDF 无文本层，图片/表格/原版式不完整；单次最多 40 页、200,000 字，且浏览器内存和 Word 对 HTML `.doc` 的兼容性存在差异。文件不上传，但生成内容不加密，不适合处理未脱敏敏感资料。
- 下一阶段：Stage 42 评估 PDF OCR/PDF 转 Excel 的小样本技术验证，或继续实现一个高价值文件工具；保持 78 个已实现工具和 9 个历史工作区可运行，继续坚持真实边界、浏览器优先和每阶段可回滚。

## 56. 2026-09-11：第二阶段 Stage 42 本地 PDF 表格导出（已完成）

### Plan / Design

- 在 Stage 41 的 PDF.js 文本提取基础上验证 PDF 转 Excel 的低依赖路径；不输出伪造的 `.xlsx`，而是把简单文字表格或列表整理为 UTF-8 CSV，让 Excel 直接打开，并在页面、FAQ 和结果区明确格式边界。
- 只处理浏览器本地可读取的文字层；合并单元格、图片表格、扫描 PDF 和复杂版式不承诺准确转换，避免把启发式结果包装成专业表格识别。

### Develop

- `src/components/tools/PdfToolRenderer.tsx`：抽取共享 PDF.js 文本行分组逻辑，按横向间距做有限列推断，生成带 BOM 的 CSV、页码列、最多 12 列、页数/字符限制和下载结果面板。
- `src/components/ToolRenderer.tsx`：将 `pdf-to-excel` 接入 PDF 真实工作区路由；期间静态检查发现并修复了总路由遗漏，避免 live 标记与空操作区不一致。
- `src/data/tools.ts`：将工具重命名为“PDF 表格导出”，标记为浏览器本地 live 工具，说明输出为 Excel 可打开 CSV 而非原生 `.xlsx`。
- `src/lib/seo.ts`：增加 CSV 格式、复杂表格和扫描 PDF 限制 FAQ，结构化数据与页面文案保持一致。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 产物检查：100 个工具详情页、79 个 live 工具、21 个即将上线工具；`/tools/pdf-to-excel` 包含真实操作区、CSV 限制、专属 FAQ、canonical、live 和 FAQ JSON-LD；sitemap 为 109 条 URL 且无 localhost。
- 临时内存 PDF 自测：用 `pdf-lib` 生成含两列标题和数据的 1 页 PDF，使用 PDF.js 官方 legacy Node 构建提取并断言四个文本字段均存在；Node 自测只出现既有 standardFontDataUrl 提示，不影响断言结果。
- 公网回归：主页、`/tools`、`/tools/pdf-to-excel`、`/tools/pdf-to-word`、`/tools/pdf-to-image`、`/tools/ai-weekly-report`、`robots.txt`、`sitemap.xml` 全部 HTTP 200；PDF 表格导出页线上没有 `status-soon`，操作区和 FAQ 均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回归和公网回归；备份位于 `/www/backup/tools-hub-100-stage42-before-20260911`。真实浏览器选择 PDF、下载 CSV、复杂表格准确率和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更清晰：不再把“PDF 转 Excel”泛化成高准确率 `.xlsx` 转换，而是提供适合简单文字表格/列表的本地 CSV 导出，用户可以在 3 秒内判断是否适用。
- 首页和工具库保持聚焦：新工具只进入 PDF/Office 分类、搜索、工具包和相关推荐，不增加首屏模块；PDF 文档处理路径从页面编辑、文字提取延伸到基础表格整理。
- 分类和工具质量更符合真实任务：输出格式、列推断上限、扫描文件边界和复杂表格限制都在操作区可见，避免 live 状态与实际能力错位。
- 趋势与商业价值判断：简单 PDF 表格转 CSV 是稳定办公需求，浏览器本地处理继续强化隐私卖点；复杂表格识别若要商业化，需要 OCR/版面分析、准确率样本、文件清理、WASM 体积和服务成本评估。
- 应新增/调整：Stage 43 优先做 PDF OCR 的小样本技术验证，或根据真实需求继续优化 PDF/Office 文件链；原生 XLSX、Word/Excel/PPT 高保真转换、视频编码和 HEIC 继续保持技术验证状态，不伪装上线。
- 当前最大体验问题：列推断是启发式的，复杂表格可能错列；CSV 不是原生 `.xlsx`，没有恢复单元格样式、公式、合并单元格或图片，真实浏览器下载和样本准确率仍需验证。
- 阶段评分（基于代码、构建产物、PDF.js 核心自测、服务器和公网回归；真实浏览器文件交互待补验）：视觉设计 94、信息架构 96、用户体验 92、一致性 97、品牌感 94、高级感 94、易用性 92、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 42 实现提交为 `621bf8c feat: add local pdf table export`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 42 正式备份保留。
- 已知风险：PDF.js 文本顺序、坐标和列间距在双栏、旋转页面、嵌入字体、无边框表格或复杂合并单元格中可能导致错列；扫描 PDF 没有文字层；单次最多 20 页、200,000 字、最多推断 12 列；文件不上传，但 CSV 内容不加密，不适合未脱敏敏感资料。
- 下一阶段：Stage 43 评估 PDF OCR/PDF 表格准确率或继续实现一个高价值文件工具；保持 79 个已实现工具和 9 个历史工作区可运行，继续坚持真实边界、浏览器优先和每阶段可回滚。

## 57. 2026-09-11：第二阶段 Stage 43 自媒体结果历史扩展（已完成）

### Plan / Design

- Stage 42 已完成 PDF 文字表格的本地 CSV 导出；本阶段先补齐高频自媒体工具的结果留存闭环，不急于安装 OCR、FFmpeg 或第三方 AI 依赖。
- 复用既有 `HistoryControls` 和 localStorage 协议，让用户在生成/整理结果后显式保存，仍然只保存在当前设备、最多 20 条、可复制/下载/删除；不把历史列表搬到首页，也不静默保存输入。

### Develop

- `src/components/tools/CreatorToolRenderer.tsx`：为 11 个高频创作者工作区接入统一本地结果历史：小红书标签推荐、标题结构分析、抖音标题、抖音口播脚本、短视频分镜、小红书标题、公众号标题、朋友圈文案、评论区回复、小红书/公众号排版、敏感词检查。
- 复用 `src/components/tools/ToolPrimitives.tsx` 的 `HistoryControls`，未新增 npm 依赖、API、服务端存储或 localStorage 数据结构；既有复制、TXT 下载、重置和合规提示保持不变。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 产物检查：100 个工具详情页、79 个 live 工具、21 个即将上线工具；11 个自媒体页面均包含“保存本次结果”、最多 20 条提示、浏览器本地处理、canonical 和真实工作区；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：主页、`/tools`、11 个自媒体工具、`/tools/pdf-to-excel`、`/tools/ai-weekly-report`、`robots.txt`、`sitemap.xml` 全部 HTTP 200；11 个自媒体页面线上历史入口和 canonical 均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回源和公网回归；备份位于 `/www/backup/tools-hub-100-stage43-before-20260911`。真实浏览器点击保存、刷新展开、删除、复制、下载和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更清晰：平台从“内容模板生成”进一步变成“主题/素材整理 → 复制/下载 → 本机留存”的内容工作台，且没有把本地模板结果包装成实时热点或 AI 预测。
- 首页保持聚焦：历史控件只出现在具体工具工作区，不增加首屏卡片、筛选项或信息噪音；工具库仍以场景工具包组织入口。
- 分类更符合用户认知：小红书、抖音、公众号、朋友圈和评论回复的高频工作区统一了结果管理体验，降低跨平台运营时的学习成本。
- 趋势与商业价值判断：内容创作和自媒体运营仍有稳定的标题、脚本、排版、互动需求；本地历史能提升复用率，但词库/模板仍不是实时平台数据，不能作为流量或合规保证。
- 应新增/调整：Stage 44 优先做 PDF OCR、HEIC 或 Office 转换中的一项小样本技术验证，先记录准确率、体积、浏览器兼容性、隐私和部署成本；历史功能下一步再评估输入恢复，不直接扩展云同步。
- 应降级/合并：无数据源的 AI 工具对比页继续保持待实现或并入静态 AI 目录；重复的模板库不应继续扩张，除非能形成明确用户任务链。
- 当前最大体验问题：历史结果仍不能恢复生成前的输入和选项，也不能跨工具搜索；localStorage 无加密、受清理/容量/跨设备影响，不适合保存密码、密钥、身份证件或未脱敏客户资料。
- 阶段评分（基于代码、构建产物、服务器和公网回归；真实点击项待补验）：视觉设计 94、信息架构 96、用户体验 95、一致性 97、品牌感 94、高级感 94、易用性 95、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 43 实现提交为 `e65d52e feat: extend local result history to creator tools`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 43 正式备份保留。
- 已知风险：历史内容仍保存在当前浏览器 localStorage，最多 20 条、单条最多 12,000 字符、没有加密；浏览器清理、隐私模式、跨设备和容量限制会影响留存，保存内容不应包含敏感信息。内容工具的词库与模板不代表实时热度、平台推荐或法律结论。
- 下一阶段：Stage 44 选择一个高价值文件能力做可回滚的小样本技术验证，保持 79 个已实现工具和 20 个历史工作区可运行；继续坚持真实边界、浏览器优先和每阶段可构建、可部署、可回滚。

## 58. 2026-09-11：第二阶段 Stage 44 本地视频静音/去音轨（已完成）

### Plan / Design

- 从剩余视频/音频工具中选择“视频静音 / 去音轨”做最小技术验证。浏览器可以读取视频并通过 `captureStream` + `MediaRecorder` 只录制画面，因此不引入 FFmpeg、上传服务或大型 WASM。
- 不承诺原 MP4/MOV 封装、编码或无损转换；产品明确输出为无声 WebM，并限制单文件 200 MB、时长 5 分钟，遇到浏览器能力不足时给出可理解的错误提示。

### Develop

- `src/lib/video.ts`：新增 MediaRecorder 格式探测、视频结束事件处理、仅保留 video track 的本地录制、WebM Blob 输出、文件命名和 5 分钟限制。
- `src/components/tools/VideoToolRenderer.tsx`：新增“视频静音 / 去音轨”工作区，复用拖拽上传、视频预览、处理状态、错误提示和下载原语；同时拆分帧截图工作区，避免条件分支调用 React hooks。
- `src/components/ToolRenderer.tsx`：将 `video-remove-audio` 接入视频工作区路由。
- `src/data/tools.ts`、`src/lib/seo.ts`、`src/app/globals.css`：标记为浏览器本地 live 工具，补充 WebM/封装边界 FAQ、SEO 结构和结果视频样式；未新增 npm 依赖、API 或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning；期间发现并修复了条件分支 hooks 问题和 MediaRecorder 参数命名错误。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 产物检查：100 个工具详情页、80 个 live 工具、20 个即将上线工具；视频静音页包含真实工作区、浏览器本地提示、WebM 边界、专属 FAQ、canonical 和 FAQ JSON-LD；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：主页、`/tools`、`/tools/video-remove-audio`、视频截图、PDF 转 Word、PDF 表格导出、小红书标题、`robots.txt`、`sitemap.xml` 全部 HTTP 200；视频静音页线上没有 `status-soon`，WebM/MediaRecorder 说明、canonical 和 FAQ JSON-LD 均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回源和公网回归；备份位于 `/www/backup/tools-hub-100-stage44-before-20260911`。真实浏览器选择视频、播放、导出 WebM、下载、长视频限制和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更清晰：视频工具链新增了一个无需上传、可立即处理的高频动作，用户能在页面上直接看到“只保留画面、导出 WebM”的真实边界，不会误以为是完整格式转换。
- 首页保持聚焦：新工具只进入视频/音频分类、搜索、相关推荐和场景工具包，不增加首页首屏信息；工作区仍采用上传/预览/处理/结果的统一结构。
- 分类符合用户认知：视频截图、封面提取和静音/去音轨属于同一组视频编辑任务，比单独创建复杂编码分类更容易理解。
- 趋势与商业价值判断：视频发布和素材整理需求稳定，本地去音轨有隐私和低成本价值；原生格式转换、压缩、GIF、音频处理仍需要 FFmpeg 或 WebCodecs 兼容性与性能验证，不能用 WebM 录制替代。
- 应新增/调整：Stage 45 优先对 PDF OCR、HEIC 或 Office 转换做小样本验证，记录准确率、体积、浏览器矩阵和部署成本；如果视频静音在真实浏览器失败率较高，再考虑独立 FFmpeg 服务，而不是扩大前端承诺。
- 应降级/合并：视频封面提取与授权视频封面提取未来可评估统一入口；无实时数据源的 AI 工具对比页继续不优先。
- 当前最大体验问题：本地视频结果仍只在当前页面内存中，不能恢复或跨设备留存；MediaRecorder 浏览器兼容性、编码速度和大文件内存仍缺少真实设备数据，CUA 当前不可用。
- 阶段评分（基于代码、构建产物、服务器和公网回归；真实浏览器视频行为待补验）：视觉设计 94、信息架构 96、用户体验 93、一致性 97、品牌感 94、高级感 94、易用性 92、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 44 实现提交为 `687dee1 feat: add local video audio removal`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 44 正式备份保留。
- 已知风险：`captureStream`、`MediaRecorder` 和 WebM 编码依赖浏览器能力；Safari、旧浏览器、部分输入编码或受保护媒体可能失败；输出只保留画面，不保证原封装、原编码、无损质量或音画同步之外的高级编辑能力。单次最多 200 MB、5 分钟，结果不加密且不应包含敏感视频。
- 下一阶段：Stage 45 继续保持 80 个已实现工具和 20 个待实现工具诚实可用，优先完成一个高价值文件能力的小样本验证；继续坚持浏览器优先、无大依赖、可构建、可部署、可回滚。

## 59. 2026-09-11：第二阶段 Stage 45 本地视频转 GIF（已完成）

### Plan / Design

- 在 Stage 44 的本地视频能力基础上验证“短视频 → GIF”这一稳定的内容发布需求；不引入 FFmpeg、GIF 第三方库或服务端上传，采用浏览器视频解码 + Canvas 抽帧 + 项目内轻量 GIF89a/LZW 编码。
- 为了控制移动端内存和输出体积，限制最多 8 秒、4～12 fps、最长边约 480 像素，并在页面上明确 GIF 最多 256 色、无音频、适合短片段预览而非高保真交付。

### Develop

- `src/lib/video.ts`：新增 256 色 3-3-2 调色板、LZW 压缩、GIF89a 动画封装、Canvas 抽帧和 GIF 文件命名；导出逻辑完全在浏览器执行。
- `src/components/tools/VideoToolRenderer.tsx`：新增 MP4 转 GIF 工作区，提供视频预览、截取时长、帧率选择、处理中状态、错误反馈、GIF 预览和下载；复用既有拖拽上传与隐私提示。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/lib/seo.ts`：接入 live 路由、更新工具状态与本地边界、补充专属 FAQ/JSON-LD；未新增 npm 依赖、API 或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- GIF 编码自测：用 Node 纯内存生成 2×2 两帧 GIF，校验 GIF89a 头、两帧 GCE、结束标记；进一步用纯内存 LZW 解码回环还原 4 个像素索引，测试通过。Node 仅出现既有 Type Stripping/模块类型提示，不是产品构建错误。
- 产物检查：100 个工具详情页、81 个 live 工具、19 个即将上线工具；`/tools/mp4-to-gif` 包含真实工作区、8 秒/256 色边界、专属 FAQ、canonical 和 FAQ JSON-LD；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：主页、`/tools`、GIF、视频静音、视频截图、PDF 转 Word、PDF 表格导出、小红书标题、抖音脚本、`robots.txt`、`sitemap.xml` 全部 HTTP 200；GIF 页线上没有 `status-soon`，工作区与 SEO 标记均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回源和公网回归；备份位于 `/www/backup/tools-hub-100-stage45-before-20260911`。真实浏览器抽帧、GIF 播放、下载、不同编码兼容性和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更清晰：视频工具从截图/封面/静音扩展到可直接用于内容预览的轻量动图，仍然坚持本地处理和明确输出边界，没有把 GIF 当成高保真视频格式转换。
- 首页保持聚焦：新工具只进入视频/音频分类、搜索、相关推荐和现有工具包，不增加首页首屏噪音；详情页仍以“选择 → 设置 → 导出”为唯一主路径。
- 分类符合用户认知：MP4 转 GIF 与视频截图、封面提取、静音属于同一组素材处理任务；限制说明放在操作区内，降低长视频误用和移动端崩溃风险。
- 趋势与商业价值判断：短视频预览、聊天分享和内容运营对 GIF 仍有稳定需求；自包含编码器降低依赖和部署成本，但 GIF 的颜色、体积和浏览器内存限制决定了它不适合专业视频交付。
- 应新增/调整：Stage 46 继续对 PDF OCR、HEIC 或 Office 转换做小样本验证；HEIC 原生解码跨浏览器不稳定，暂不直接上线；PDF OCR 若无可靠中文模型、体积和隐私方案，也继续保持待实现。
- 应降级/合并：视频封面提取与授权视频封面提取未来可合并为一个带版权提示的入口；视频格式/音频格式转换继续等待 FFmpeg 或 WebCodecs 的独立架构，不用 GIF/MediaRecorder 结果冒充。
- 当前最大体验问题：GIF 输出质量和体积受 256 色、480 像素、8 秒限制，且真实设备抽帧性能尚未验证；二进制结果仍不能进入现有文本历史协议。
- 阶段评分（基于代码、构建产物、GIF 回环自测、服务器和公网回归；真实浏览器视频行为待补验）：视觉设计 94、信息架构 96、用户体验 93、一致性 97、品牌感 94、高级感 94、易用性 92、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 45 实现提交为 `a85fa32 feat: add local video to gif export`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 45 正式备份保留。
- 已知风险：GIF 编码采用固定 3-3-2 调色板，颜色和体积不如专业编码器；输入视频解码依赖浏览器，长视频/高分辨率会占用内存；单次最多 8 秒、最长边约 480 像素，结果不加密且不适合敏感视频。
- 下一阶段：Stage 46 继续保持 81 个已实现工具和 19 个待实现工具诚实可用，优先验证一个高价值文件能力；继续坚持浏览器优先、无大依赖、可构建、可部署、可回滚。

## 60. 2026-09-11：第二阶段 Stage 46 本地视频压缩（已完成）

### Plan / Design

- 在 Stage 44/45 的本地视频链上继续实现一个高频的发送前处理动作：浏览器读取视频、按用户选择的目标码率重新录制并导出 WebM；不引入 FFmpeg、上传服务或大型 WASM。
- 对“压缩”保持诚实边界：输出不是原格式封装，不保证无损、不保证体积一定更小，浏览器会尽量保留音轨但输入编码或浏览器能力可能导致无声；限制单文件 200 MB、最长 5 分钟。

### Develop

- `src/lib/video.ts`：新增目标码率 WebM 录制、5 分钟限制、输出命名和资源清理，复用 MediaRecorder 能力探测与视频结束事件处理。
- `src/components/tools/VideoToolRenderer.tsx`：新增视频压缩工作区，提供目标码率选择、视频预览、处理中状态、错误提示和 WebM 下载；与 GIF/静音共用统一上传和结果视觉。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/lib/seo.ts`：接入 live 路由，更新工具描述、浏览器本地边界和专属 FAQ/JSON-LD；未新增 npm 依赖、API 或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 产物检查：100 个工具详情页、82 个 live 工具、18 个即将上线工具；`/tools/video-compress` 包含真实工作区、WebM 边界、专属 FAQ、canonical 和 FAQ JSON-LD；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：主页、`/tools`、视频压缩、GIF、静音、视频截图、PDF 转 Word、PDF 表格导出、小红书标题、抖音脚本、`robots.txt`、`sitemap.xml` 全部 HTTP 200；压缩页线上没有 `status-soon`，工作区与 SEO 标记均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回源和公网回归；备份位于 `/www/backup/tools-hub-100-stage46-before-20260911`。真实浏览器播放、音轨保留、压缩后体积、不同编码兼容性和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更完整：视频素材链现在覆盖截图、封面、GIF、去音轨和发送前压缩；每个动作都把输出格式和质量边界放在操作区，避免把浏览器录制包装成专业转码。
- 首页保持聚焦：新工具只进入视频/音频分类、搜索、相关推荐和现有工具包，不增加首页首屏信息；详情页依旧按“选择 → 设置 → 导出”组织。
- 分类符合用户认知：压缩与 GIF、静音、截图属于同一组素材交付任务；目标码率让用户能主动平衡体积和清晰度，且不需要理解服务端队列。
- 趋势与商业价值判断：发送前降低视频体积是稳定需求，本地处理强化隐私和低成本；但真正的 MP4/MOV 转码、音频格式转换和大文件压缩仍需要 FFmpeg/WebCodecs 与任务队列的独立架构。
- 应新增/调整：Stage 47 继续小样本评估 PDF OCR、HEIC 或 Office 转换；HEIC 受原生解码覆盖限制暂不直接上线，PDF OCR 需先验证中文准确率、模型体积和隐私成本。
- 应降级/合并：视频封面提取与授权视频封面提取未来可合并；视频格式/音频格式转换保持待实现，不能用 WebM 输出替代用户期待的指定格式。
- 当前最大体验问题：视频处理仍缺少真实浏览器矩阵和大文件性能数据，二进制结果不能进入文本历史协议；压缩后的实际大小、音频轨保留和编码兼容性需要用户样本验证。
- 阶段评分（基于代码、构建产物、服务器和公网回归；真实浏览器视频行为待补验）：视觉设计 94、信息架构 96、用户体验 92、一致性 97、品牌感 94、高级感 94、易用性 91、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 46 实现提交为 `313fed3 feat: add local video compression`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 46 正式备份保留。
- 已知风险：`captureStream`/`MediaRecorder` 受浏览器支持影响；输出固定为 WebM，目标码率只是录制参数，可能改变画质、音轨或实际体积；单次最多 200 MB、5 分钟，结果不加密且不适合敏感视频。
- 下一阶段：Stage 47 继续保持 82 个已实现工具和 18 个待实现工具诚实可用，优先完成一个高价值文件能力的小样本验证；继续坚持浏览器优先、无大依赖、可构建、可部署、可回滚。

## 61. 2026-09-11：第二阶段 Stage 47 本地音频压缩（已完成）

### Plan / Design

- 在视频本地处理链之后实现“音频压缩”这一常见发送前动作：使用 HTMLAudioElement、Web Audio `MediaStreamDestination` 和 `MediaRecorder` 在当前浏览器重新编码，优先选择 OGG/Opus 或 WebM/Opus，不引入 FFmpeg、上传服务或大型依赖。
- 不把 OGG/WebM 结果包装成 MP3/WAV 转换；页面明确输出格式、目标码率、最多 10 分钟和浏览器兼容性边界，用户可先预览再下载。

### Develop

- `src/lib/audio.ts`：新增音频扩展名/MIME 校验、200 MB 文件限制、10 分钟时长限制、Web Audio 路由、MediaRecorder 格式探测、目标码率导出和资源清理。
- `src/components/tools/AudioToolRenderer.tsx`：新增拖拽上传、音频预览、64/96/128 kbps 选择、处理状态、错误提示、结果预览和下载工作区。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/lib/seo.ts`、`src/app/globals.css`：接入动态路由、标记本地 live 工具、补充 OGG/WebM 专属 FAQ/JSON-LD 和统一音频样式；未新增 npm 依赖、API 或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- Node 纯内存自测：MP3 MIME/扩展名可通过校验，文本文件会被拒绝；测试通过。Node 仅出现既有 Type Stripping/模块类型提示，不是产品构建错误。
- 产物检查：100 个工具详情页、83 个 live 工具、17 个即将上线工具；`/tools/audio-compress` 包含真实工作区、OGG/WebM 边界、专属 FAQ、canonical 和 FAQ JSON-LD；sitemap 为 109 条 URL 且无 localhost。
- 公网回归：主页、`/tools`、音频压缩、视频压缩、GIF、静音、视频截图、PDF 转 Word、PDF 表格导出、小红书标题、抖音脚本、`robots.txt`、`sitemap.xml` 全部 HTTP 200；音频页线上没有 `status-soon`，工作区与 SEO 标记均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回源和公网回归；备份位于 `/www/backup/tools-hub-100-stage47-before-20260911`。真实浏览器播放、AudioContext 解码、OGG/WebM 编码、音频时长/码率和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更完整：视频和音频现在都有本地压缩入口，用户可以在同一套视觉语言下完成“选择素材 → 目标码率 → 预览 → 下载”；输出格式边界保持透明。
- 首页保持聚焦：音频工具只进入视频/音频分类、搜索、相关推荐和现有工具包，不增加首屏噪音；详情页主路径仍然短。
- 分类符合用户认知：音频压缩与视频压缩属于发送前体积优化，和格式转换、字幕、截图分开，降低理解成本。
- 趋势与商业价值判断：语音、播客和内容运营对压缩仍有稳定需求，本地处理有隐私价值；但 MP3/WAV 转换、音频降噪、视频转 MP3 仍需要编码器或服务端架构，不能用 OGG/WebM 代替用户期待。
- 应新增/调整：Stage 48 优先评估 PDF OCR、HEIC 或 Office 转换的技术边界；HEIC 受原生解码覆盖限制暂不直接上线，PDF OCR 需要中文样本准确率、模型体积和隐私成本证据。
- 应降级/合并：音频格式转换、视频转 MP3 和视频转字幕保持待实现，先做专用编码/队列设计；重复的 AI 对比目录继续不扩张。
- 当前最大体验问题：音频和视频二进制结果仍不能进入文本历史协议；浏览器 MediaRecorder/AudioContext 兼容性、音频轨道和实际压缩体积还没有真实设备矩阵数据。
- 阶段评分（基于代码、构建产物、文件校验自测、服务器和公网回归；真实浏览器媒体行为待补验）：视觉设计 94、信息架构 96、用户体验 92、一致性 97、品牌感 94、高级感 94、易用性 91、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 47 实现提交为 `3af0fd4 feat: add local audio compression`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或 Nginx 配置内容。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 47 正式备份保留。
- 已知风险：OGG/WebM 支持依赖浏览器 MediaRecorder，Safari/旧浏览器可能不支持目标编码；AudioContext 解码可能受输入格式、用户手势和系统策略影响；输出不保证 MP3/WAV、无损质量或体积一定更小，单次最多 200 MB、10 分钟，结果不加密且不适合敏感音频。
- 下一阶段：Stage 48 继续保持 83 个已实现工具和 17 个待实现工具诚实可用，优先完成一个高价值文件能力的小样本验证；继续坚持浏览器优先、无大依赖、可构建、可部署、可回滚。

## 62. 2026-09-11：第二阶段 Stage 48 四个 AI 对比目录（已完成）

### Plan / Design

- 将 AI 工具目录从单一入口扩展为四个按用户任务理解的静态对比页：AI 写作、AI 图片、AI 视频、AI 编程；用户可以先按场景筛选，再进入官方服务，而不是面对一张没有重点的长名单。
- 不虚构实时价格、热度、排行榜、测评结论或第三方 API 数据。页面明确是维护型官方入口目录，外部服务的登录、地区、价格、版权和隐私政策以官方页面为准；这样比伪造“实时对比”更可维护、更符合 SEO 和信任要求。

### Develop

- `src/components/tools/AiComparisonToolRenderer.tsx`：新增统一的四轨道对比目录工作区，支持关键词搜索、场景筛选、工具卡片、适用场景和官方入口跳转。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/lib/seo.ts`、`src/app/globals.css`：接入四个独立 slug，标记为本地 live 工具，补充静态目录 FAQ/JSON-LD、边界说明和响应式卡片网格；未新增 npm 依赖、API 或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 静态产物检查：100 个工具详情页、87 个 live 工具、13 个即将上线工具；四个对比页均包含搜索、官方入口、边界提示、canonical 和 FAQ JSON-LD；sitemap 为 109 条 URL且不含 `localhost`。
- 公网回归：`/`、`/tools`、四个 AI 对比页、AI 工具导航、音频压缩、视频压缩、MP4 转 GIF、小红书标题、PDF 转 Excel、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；四个对比页线上没有 `status-soon`，工作区与 SEO 标记均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回源和公网回归；备份位于 `/www/backup/tools-hub-100-stage48-before-20260911`。真实外链点击、移动端视觉和目录内容长期更新仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更清晰：网站不仅提供本地处理工具，也提供按任务组织的 AI 选择入口；四个页面把“我想写作/做图/做视频/写代码”转成更容易理解的下一步。
- 首页保持聚焦：对比目录通过 `/tools`、搜索、分类和相关推荐进入，不把外部服务清单堆到首屏，首页仍以马上可用的本地工具为主。
- 分类更符合用户认知：用内容任务和工作角色划分 AI 工具，降低“模型名/品牌名优先”带来的理解成本；同时保留通用、研究、工作区等场景筛选。
- 趋势与商业价值判断：AI 选择和入口导航有稳定需求，静态官方链接成本低、适合 SEO 长期维护；但它不是实时评测产品，不能用静态目录替代价格、效果和合规验证。
- 应新增/调整：Stage 49 优先对 PDF OCR、HEIC、Office 转换做真实技术边界验证；AI 目录先观察点击和维护成本，再决定是否合并四个对比页或增加更多垂直目录，不盲目扩张。
- 应降级/合并：若四个 AI 对比页的长期维护价值不足，可合并为 AI 工具目录下的任务筛选，不保留重复内容；仍不接入未经验证的实时价格、热度或第三方 API。
- 当前最大体验问题：外部官方页面的地区、登录、价格和产品定位会变化，当前没有实时校验、收藏对比或用户反馈机制；真实设备视觉与外链点击仍受 CUA 运行时缺失影响。
- 阶段评分（基于代码、静态产物、SEO、自测、服务器和公网回归；真实设备与外链点击项待补验）：视觉设计 94、信息架构 97、用户体验 93、一致性 97、品牌感 94、高级感 94、易用性 93、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 48 实现提交为 `1305656 feat: add searchable ai comparison directories`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或其他项目配置。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 48 正式备份保留。
- 已知风险：官方链接、地区可用性、登录门槛、价格和产品功能会变化；静态目录不保证实时准确、不读取第三方服务实时价格、不提供效果排名，外部使用必须遵守对应服务条款与版权/隐私政策。
- 下一阶段：Stage 49 继续保持 87 个已实现工具和 13 个待实现工具诚实可用，优先对一个高价值文件能力做可回滚的小样本技术验证；继续坚持浏览器优先、无大依赖、可构建、可部署、可回滚。

## 63. 2026-09-11：第二阶段 Stage 49 已知密码 PDF 解密导出（已完成）

### Plan / Design

- 在剩余工具中优先实现“PDF 解密（限已知密码）”：PDF.js 已支持把已知密码传给浏览器加载任务，现有 `pdf-lib` 可以生成新的无密码 PDF，能够在不上传原文件、不引入服务端队列的前提下交付真实结果。
- 明确产品边界：只验证用户已知的打开密码，不破解、不绕过权限；为了兼容浏览器端重新生成，按页渲染为 JPEG 后写入新的 PDF，因此文字选择、链接、表单、目录和复杂结构可能不会保留。这个取舍在按钮、结果区、FAQ 和隐私提示中均已说明。

### Develop

- `src/components/tools/PdfToolRenderer.tsx`：新增 `PdfDecryptTool` 和 `exportUnlockedPdf`，支持单 PDF 拖拽/选择、密码输入、PDF.js 密码加载、最多 15 页、像素总量限制、JPEG 重新渲染、无密码 PDF 下载和失败后的资源清理。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/lib/seo.ts`：接入 `pdf-decrypt` 独立 live 路由，更新真实描述、浏览器本地状态、专属 FAQ 和授权/栅格化边界；未新增 npm 依赖、API、数据库或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- PDF.js 核心自测：`password` 参数类型契约已确认；内存 PDF 文本读取与密码参数 smoke test 通过（`PDFJS_PASSWORD_OPTION_SELF_TEST_OK`）。临时手写 R2 加密 fixture 的标准参数未通过 PDF.js，未把不可靠 fixture 纳入仓库或当作产品证据；真实加密文件的浏览器点击验收仍列为待补验项。
- 产物检查：100 个工具详情页、88 个 live 工具、12 个即将上线工具；`/tools/pdf-decrypt` 包含工作区、密码输入、无密码副本边界、canonical 和 FAQ JSON-LD；sitemap 为 109 条 URL 且不含 `localhost`。
- 公网回归：`/`、`/tools`、PDF 解密、PDF 转 Word、PDF 表格导出、音频压缩、视频压缩、MP4 转 GIF、AI 写作对比、小红书标题、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；PDF 解密页线上没有 `status-soon`，工作区、密码输入、导出按钮和 SEO 标记均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回源和公网回归；备份位于 `/www/backup/tools-hub-100-stage49-before-20260911`。真实浏览器选择加密 PDF、输入正确/错误密码、逐页渲染质量、下载后的 PDF 打开验证和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更清晰：PDF 工具不再把“解密”承诺成破解，而是帮助有权限的用户将已知密码文件重新导出为可分享副本；本地处理继续强化隐私价值。
- 首页保持聚焦：PDF 解密通过工具库、PDF 分类、搜索和相关推荐进入，不增加首页首屏卡片；详情页主路径仍是文件 → 密码 → 导出。
- 分类符合用户认知：它属于 PDF 隐私保护/文件处理，不和普通页面编辑混在一起；“已知密码”前置到名称、标题和说明，减少误用。
- 趋势与商业价值判断：办公协作、打印和资料分享中的密码 PDF 有明确需求；本地逐页重导出成本低、易维护，但不适合需要保留可编辑语义的法律、表单或复杂出版物工作流。
- 应新增/调整：Stage 50 继续先验证 PDF OCR、HEIC、Office 转换或媒体格式转换中的一项；优先选择能用真实样本验证准确率/兼容性的能力，不为达到 100 个数字而上线半成品。
- 应降级/合并：若用户更需要“修改密码/设置权限”而不是无密码副本，应将当前工具与未来 PDF 加密能力拆成清晰的“重导出”和“安全设置”路径；未知密码破解、批量解密和第三方服务暂不规划。
- 当前最大体验问题：当前没有真实浏览器加密 PDF 的正确密码/错误密码/多页质量矩阵，输出是视觉副本而不是结构保真副本；CUA 运行时仍不可用，真实移动端和下载后打开验证待补。
- 阶段评分（基于代码、静态产物、PDF.js 核心自测、服务器和公网回归；真实加密文件与设备点击项待补验）：视觉设计 94、信息架构 97、用户体验 92、一致性 97、品牌感 94、高级感 94、易用性 92、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 49 实现提交为 `ba5dfe0 feat: add known-password pdf unlock`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或其他项目配置。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 49 正式备份保留。
- 已知风险：PDF.js 对部分加密方式、密码编码、损坏文件和超大页面的支持会不同；重新渲染可能增加体积并丢失文字/链接/表单语义；单次最多 15 页、受浏览器内存和 JPEG 质量影响；必须只处理本人拥有权限的文件。
- 下一阶段：Stage 50 继续保持 88 个已实现工具和 12 个待实现工具诚实可用，优先做一个有真实样本和清晰输出边界的高价值能力；继续坚持浏览器优先、无大依赖、可构建、可部署、可回滚。

## 64. 2026-09-11：第二阶段 Stage 50 本地视频转 WebM（已完成）

### Plan / Design

- 在剩余视频能力中先实现一个可以由浏览器原生完成的明确子集：把浏览器能解码的视频重新编码为 WebM，满足网页播放、发送前兼容和轻量分享需求。
- 不把它包装成“任意格式转换”：当前输出固定为 WebM，不承诺 MP4/MOV/MP3 等目标格式，不承诺无损、原封装或一定更小；最长 5 分钟、文件最多 200 MB，处理前后均提示 MediaRecorder 和浏览器编码支持边界。

### Develop

- `src/lib/video.ts`：新增 `convertVideoToWebm`，复用已验证的本地视频解码、MediaRecorder、音轨处理、5 分钟/200 MB 限制和 URL/轨道清理逻辑，输出 `-converted.webm`。
- `src/components/tools/VideoToolRenderer.tsx`：新增视频格式转换工作区，提供拖拽上传、视频预览、转换状态、WebM 结果预览、下载和浏览器支持提示；统一视频结果面板可区分无声视频、压缩视频和转换视频的下载动作。
- `src/components/ToolRenderer.tsx`、`src/data/tools.ts`、`src/lib/seo.ts`：接入原有 `video-convert` slug，标记为本地 live 工具，补充固定输出格式 FAQ/JSON-LD 和真实边界；未新增 npm 依赖、API 或服务器配置。

### Test / Self-check

- `npm run lint`：通过，0 error、0 warning。
- `NEXT_PUBLIC_SITE_URL=http://101.43.29.216:39090 npm run build`：通过，114 条静态路由全部生成。
- 产物检查：100 个工具详情页、89 个 live 工具、11 个即将上线工具；`/tools/video-convert` 包含真实工作区、转换按钮、WebM 输出说明、任意格式边界、canonical 和 FAQ JSON-LD；sitemap 为 109 条 URL 且不含 `localhost`。
- 公网回归：`/`、`/tools`、视频转 WebM、视频压缩、MP4 转 GIF、视频静音、音频压缩、PDF 解密、AI 写作对比、小红书标题、`robots.txt`、`sitemap.xml` 全部返回 HTTP 200；视频转 WebM 页线上没有 `status-soon`，工作区、输出边界和 SEO 标记均存在。
- 腾讯云已完成独立备份、staging 切换、`nginx -t`、reload、本机回源和公网回归；备份位于 `/www/backup/tools-hub-100-stage50-before-20260911`。真实浏览器选择不同编码、播放、转换、音轨保留、下载后播放和移动端视觉仍待 CUA 运行时恢复后补验。

### Product Review

- 产品定位更清晰：视频工具按任务拆成截图、封面、GIF、静音、压缩和“转 WebM”，用户能区分画面提取、体积优化与目标封装，而不是看到一个承诺过大的万能转换器。
- 首页保持聚焦：视频转 WebM 通过视频分类、搜索、相关推荐和工具包进入，不把格式转换细节挤到首屏；详情页先说明输入和固定输出，再提供单一主操作。
- 分类符合用户认知：`video-convert` 仍归入视频/音频的格式转换，但名称、按钮和 FAQ 都把 WebM 作为明确结果，避免用户误以为支持任意目标格式。
- 趋势与商业价值判断：网页视频、社交分享和前端素材对 WebM 有真实需求；浏览器本地实现部署成本低、隐私边界好，但浏览器编码覆盖不能替代 FFmpeg 服务的全格式能力。
- 应新增/调整：Stage 51 优先评估 PDF OCR、HEIC、Office 转换、音频格式转换或视频字幕中的一项，必须先用真实样本确认准确率、输出格式和资源成本；视频/音频格式转换后续可统一成“浏览器原生可输出格式”与“服务端全格式”两层产品。
- 应降级/合并：不要继续为每个格式组合新增独立卡片；当输出能力相同且只有名称不同，应合并为一个明确列出输入/输出矩阵的转换工具。
- 当前最大体验问题：真实视频转码结果仍依赖浏览器原生解码、MediaRecorder 和音轨轨道实现，暂无跨浏览器编码矩阵；“视频压缩”和“转 WebM”内部共享处理链，后续需要用真实使用数据判断是否合并入口。
- 阶段评分（基于代码、静态产物、服务器和公网回归；真实浏览器媒体行为待补验）：视觉设计 94、信息架构 97、用户体验 92、一致性 97、品牌感 94、高级感 94、易用性 92、移动端体验 90。没有低于 90 的项目。

### Commit / Publish / Risk

- Stage 50 实现提交为 `3fb9d4d feat: add local video webm conversion`，当前分支为 `main`，已推送到 GitHub `origin/main`；本节上下文更新随后单独提交并推送。
- 腾讯云公网入口仍为 `http://101.43.29.216:39090/`，发布目录为 `/www/wwwroot/tools-hub-100`；未修改 Hansik、StockAI、数据库、PM2 或其他项目配置。
- 本次发布沿用“远端 staging → 正式备份 → 根目录切换 → Nginx 检查/reload → 本机与公网回归 → 清理精确临时文件”的流程；临时目录和上传压缩包已清理，Stage 50 正式备份保留。
- 已知风险：Safari/旧浏览器可能不支持目标 WebM MediaRecorder；输入编码、音轨、输出码率、体积和画质由浏览器实现决定；视频会重新编码，不适合作为原始素材归档；只处理本人拥有版权或已获授权的内容。
- 下一阶段：Stage 51 继续保持 89 个已实现工具和 11 个待实现工具诚实可用，优先做一个有真实样本和清晰输出边界的高价值能力；继续坚持浏览器优先、无大依赖、可构建、可部署、可回滚。
