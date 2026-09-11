export type ToolkitIcon = "briefcase" | "pen" | "image" | "video" | "code" | "sparkles";

export type ToolkitRecord = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: ToolkitIcon;
  toolSlugs: string[];
};

export const toolkits: ToolkitRecord[] = [
  {
    id: "office-files",
    eyebrow: "办公文件",
    title: "办公文件处理",
    description: "合并、拆分、加页码，整理 PDF 文件。",
    icon: "briefcase",
    toolSlugs: ["pdf-merge", "pdf-split", "pdf-page-numbers"],
  },
  {
    id: "publish-note",
    eyebrow: "小红书发布",
    title: "小红书发布",
    description: "生成标题、整理笔记、检查标签和风险表达。",
    icon: "pen",
    toolSlugs: ["xhs-title-generator", "xhs-title-analyzer", "xhs-hashtag-recommender", "xhs-note-formatter", "xhs-sensitive-word-check"],
  },
  {
    id: "make-assets",
    eyebrow: "图片交付",
    title: "图片交付",
    description: "调整尺寸、转换格式、添加水印。",
    icon: "image",
    toolSlugs: ["image-resize", "image-convert", "image-watermark"],
  },
  {
    id: "video-materials",
    eyebrow: "短视频发布",
    title: "短视频处理",
    description: "截图、提取封面、转换字幕、整理标题和口播。",
    icon: "video",
    toolSlugs: ["video-screenshot", "video-cover-extract", "srt-to-vtt", "douyin-title-generator", "douyin-script-generator"],
  },
  {
    id: "developer-debug",
    eyebrow: "开发排查",
    title: "开发者排查",
    description: "格式化 JSON、解码文本、测试正则。",
    icon: "code",
    toolSlugs: ["json-format", "base64-codec", "regex-tester"],
  },
  {
    id: "share-and-generate",
    eyebrow: "生成与分享",
    title: "生成与分享",
    description: "二维码、条形码和随机密码，都在当前设备完成。",
    icon: "sparkles",
    toolSlugs: ["qr-generator", "barcode-generator", "password-generator"],
  },
  {
    id: "job-prep",
    eyebrow: "求职简历",
    title: "求职简历",
    description: "整理简历、表达和面试准备。",
    icon: "briefcase",
    toolSlugs: ["ai-resume", "ai-rewrite", "ai-interview-questions", "word-count"],
  },
  {
    id: "study-notes",
    eyebrow: "学习整理",
    title: "学习整理",
    description: "整理长文重点、文本和可打印资料。",
    icon: "sparkles",
    toolSlugs: ["ai-long-summary", "text-dedupe", "word-count", "markdown-to-pdf"],
  },
  {
    id: "ai-content-prep",
    eyebrow: "AI 内容准备",
    title: "AI 内容准备",
    description: "生成 Prompt，按小红书、短视频和电商场景填充素材。",
    icon: "pen",
    toolSlugs: ["prompt-generator", "xhs-prompt-library", "short-video-prompt-library", "ecommerce-prompt-library"],
  },
];
