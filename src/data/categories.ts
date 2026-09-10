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
    name: "PDF / Office 文件",
    shortName: "PDF / Office",
    description: "转换、整理和保护日常文档。",
    icon: "file",
    color: "coral",
  },
  {
    id: "image",
    name: "图片处理",
    shortName: "图片处理",
    description: "压缩、调整尺寸和处理图片素材。",
    icon: "image",
    color: "blue",
  },
  {
    id: "video-audio",
    name: "视频 / 音频",
    shortName: "视频 / 音频",
    description: "处理媒体文件、字幕和音轨。",
    icon: "video",
    color: "purple",
  },
  {
    id: "creator",
    name: "自媒体运营",
    shortName: "自媒体运营",
    description: "让选题、标题和排版更顺手。",
    icon: "pen",
    color: "yellow",
  },
  {
    id: "ai",
    name: "AIGC / AI 创作",
    shortName: "AIGC / AI",
    description: "发现 AI 工具，整理创作提示词。",
    icon: "sparkles",
    color: "mint",
  },
  {
    id: "developer",
    name: "开发者 / 站长",
    shortName: "开发者 / 站长",
    description: "编码、数据和站长工作的小帮手。",
    icon: "code",
    color: "navy",
  },
  {
    id: "daily",
    name: "日常实用工具",
    shortName: "日常工具",
    description: "文本、生成器和生活中的小计算。",
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
