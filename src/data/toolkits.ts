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
    title: "把一份文件整理好",
    description: "合并、拆分、加页码，交付前一次整理清楚。",
    icon: "briefcase",
    toolSlugs: ["pdf-merge", "pdf-split", "pdf-page-numbers"],
  },
  {
    id: "publish-note",
    eyebrow: "小红书发布",
    title: "把笔记发布前整理好",
    description: "先生成标题，再检查结构、整理标签和文字，最后做一次发布前复核。",
    icon: "pen",
    toolSlugs: ["xhs-title-generator", "xhs-title-analyzer", "xhs-hashtag-recommender", "xhs-note-formatter", "xhs-sensitive-word-check"],
  },
  {
    id: "make-assets",
    eyebrow: "图片交付",
    title: "让图片马上能用",
    description: "改尺寸、转格式、加署名，适配上传和分享。",
    icon: "image",
    toolSlugs: ["image-resize", "image-convert", "image-watermark"],
  },
  {
    id: "video-materials",
    eyebrow: "短视频发布",
    title: "把视频发布前准备好",
    description: "截取画面、提取封面、整理字幕，再准备标题和口播。",
    icon: "video",
    toolSlugs: ["video-screenshot", "video-cover-extract", "srt-to-vtt", "douyin-title-generator", "douyin-script-generator"],
  },
  {
    id: "developer-debug",
    eyebrow: "开发排查",
    title: "快速看懂一段数据",
    description: "格式化 JSON、解码文本、验证正则，减少来回切换。",
    icon: "code",
    toolSlugs: ["json-format", "base64-codec", "regex-tester"],
  },
  {
    id: "share-and-generate",
    eyebrow: "生成与分享",
    title: "生成一个可以带走的结果",
    description: "二维码、条形码和随机密码，都在当前设备完成。",
    icon: "sparkles",
    toolSlugs: ["qr-generator", "barcode-generator", "password-generator"],
  },
];
