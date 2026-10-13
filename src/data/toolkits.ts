export type ToolkitIcon = "briefcase" | "pen" | "image" | "video" | "code";

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
    eyebrow: "内容发布",
    title: "内容发布准备",
    description: "裁剪封面、清理排版并检查风险表达。",
    icon: "pen",
    toolSlugs: ["xhs-cover-crop", "xhs-sensitive-word-check", "wechat-format-cleaner"],
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
    description: "截取视频画面、提取授权封面和转换字幕。",
    icon: "video",
    toolSlugs: ["video-screenshot", "video-cover-extract", "srt-to-vtt"],
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
    id: "share-tools",
    eyebrow: "分享工具",
    title: "分享工具",
    description: "制作二维码、条形码和随机密码；全部在当前设备完成。",
    icon: "briefcase",
    toolSlugs: ["qr-generator", "barcode-generator", "password-generator"],
  },
];
