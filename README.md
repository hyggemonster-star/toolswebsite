# AI效率工具箱 · tools-hub-100

面向中文用户的 100 个高频实用工具集合站。第一阶段优先提供无需登录、浏览器本地处理的轻量工具，同时保留完整的工具目录、分类、搜索、独立详情页和 SEO 基础结构。

## 当前阶段

- 15 个纯前端工具已实现：JSON 格式化、JSON 压缩、Base64 编码解码、URL 编码解码、时间戳转换、UUID 生成器、MD5/SHA 哈希、二维码生成、字数统计、文本去重、文本大小写转换、密码生成、单位换算、图片压缩、图片尺寸修改。
- 其余 85 个工具已建立数据和独立详情页，显示为“即将上线”，不会假装已经提供完整功能。
- 文件和图片工具会优先在浏览器本地处理；任何后续上传类功能都必须补充隐私、处理范围和自动清理说明。

## 本地开发

推荐路径：`D:\CODEX\tools-hub-100`

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

## 检查与构建

```bash
npm run lint
npm run build
npm run start
```

正式域名确定后，可通过 `NEXT_PUBLIC_SITE_URL` 配置 canonical、robots 和 sitemap 的基础地址；未配置时默认使用 `http://localhost:3000`。

## 路由

- `/`：首页、醒目搜索、分类、热门工具、最近使用和隐私提示
- `/tools`：100 个工具的搜索与分类筛选
- `/tools/[slug]`：每个工具的独立详情页；已上线工具展示操作区，未上线工具展示状态与相关推荐
- `/categories/[category]`：分类工具页
- `/robots.txt`、`/sitemap.xml`：SEO 基础文件

## 关键文件

- `src/data/tools.ts`：100 个工具数据及实现状态
- `src/data/categories.ts`：7 个工具分类
- `src/components/ToolRenderer.tsx`：15 个已上线工具的本地处理逻辑
- `src/components/ToolBrowser.tsx`：搜索和分类筛选
- `src/components/HomeExplorer.tsx`：首页搜索、热门、最近使用和分类入口
- `src/lib/storage.ts`：设备本地最近使用记录
- `PROJECT_CONTEXT_TOOLS_HUB.md`：跨电脑、跨 Codex 继续开发的主上下文文档

## 部署约定

当前只完成本地项目和 Git 初始化，未连接服务器、未修改 Nginx/PM2，也未绑定正式域名。后续部署前必须先确认独立服务器目录、未占用端口、启动命令、Nginx 方案和域名，再从独立 GitHub 仓库 clone。

建议的生产启动方式：

```bash
npm ci
npm run build
npx next start --port 端口号
```

## Git 与敏感信息

项目使用独立 GitHub private 仓库 `git@github.com:hyggemonster-star/toolswebsite.git`。不要提交 `.env*`、`node_modules`、`.next`、`dist`、`uploads`、`logs`、`cache`、私钥、密码、API Key 或用户文件。`.gitignore` 已包含这些规则。

自媒体和视频内容相关功能只允许用于原创或已获授权的内容，不提供搬运、盗用或无水印下载用途。
