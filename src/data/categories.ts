import type { ToolCategory } from "./tools";

export interface CategoryRecord {
  id: ToolCategory;
  name: string;
  shortName: string;
  description: string;
  icon: "file" | "image" | "video" | "pen" | "sparkles" | "code" | "sun";
  color: string;
}

export const categories: CategoryRecord[] = [
  {
    id: "pdf-office",
    name: "办公文件",
    shortName: "办公文件",
    description: "处理 PDF、Word、Excel、PPT 和 Markdown 文件。",
    icon: "file",
    color: "coral",
  },
  {
    id: "image",
    name: "图片处理",
    shortName: "图片处理",
    description: "压缩、裁剪、转格式、加水印和处理证件照。",
    icon: "image",
    color: "blue",
  },
  {
    id: "video-audio",
    name: "视频音频",
    shortName: "视频音频",
    description: "截图、转 GIF、压缩、静音和转换音频。",
    icon: "video",
    color: "purple",
  },
  {
    id: "creator",
    name: "内容创作",
    shortName: "内容创作",
    description: "整理小红书、抖音、公众号和朋友圈文案。",
    icon: "pen",
    color: "yellow",
  },
  {
    id: "ai",
    name: "AI 工具",
    shortName: "AI 工具",
    description: "浏览 AI 工具、Prompt 模板和按场景对比。",
    icon: "sparkles",
    color: "mint",
  },
  {
    id: "developer",
    name: "开发者工具",
    shortName: "开发者工具",
    description: "处理 JSON、Base64、正则、JWT、时间戳和 Cron。",
    icon: "code",
    color: "navy",
  },
  {
    id: "daily",
    name: "日常工具",
    shortName: "日常工具",
    description: "生成二维码、条形码、密码，处理文本和单位换算。",
    icon: "sun",
    color: "orange",
  },
];

export function getCategoryById(id: string) {
  return categories.find((category) => category.id === id);
}

export function getCategoryName(id: ToolCategory) {
  return getCategoryById(id)?.shortName ?? id;
}
