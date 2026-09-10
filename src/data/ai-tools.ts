export type AiDirectoryCategory = "general" | "research" | "writing" | "image" | "video" | "coding" | "workspace";

export const aiDirectoryCategoryLabels: Record<AiDirectoryCategory | "all", string> = {
  all: "全部场景",
  general: "通用对话",
  research: "搜索与研究",
  writing: "写作与整理",
  image: "图片与设计",
  video: "视频创作",
  coding: "编程开发",
  workspace: "知识与协作",
};

export type AiDirectoryTool = {
  name: string;
  category: AiDirectoryCategory;
  description: string;
  bestFor: string;
  url: string;
};

export const aiDirectoryTools: AiDirectoryTool[] = [
  { name: "ChatGPT", category: "general", description: "适合从问题拆解、写作草稿到日常对话的通用入口。", bestFor: "通用问答、头脑风暴、任务拆解", url: "https://chatgpt.com/" },
  { name: "Claude", category: "writing", description: "适合长文本协作、表达整理和需要反复编辑的工作。", bestFor: "长文阅读、写作协作、内容整理", url: "https://claude.ai/" },
  { name: "Gemini", category: "workspace", description: "适合探索 Google 生态中的对话、资料整理和多模态任务。", bestFor: "资料整理、对话、跨格式探索", url: "https://gemini.google.com/" },
  { name: "Perplexity", category: "research", description: "适合先提出研究问题，再沿着来源继续核对和阅读。", bestFor: "资料检索、问题研究、来源追踪", url: "https://www.perplexity.ai/" },
  { name: "Midjourney", category: "image", description: "适合探索视觉概念、风格方向和图片创意草案。", bestFor: "视觉灵感、概念图、风格探索", url: "https://www.midjourney.com/" },
  { name: "Canva AI", category: "image", description: "适合把文字想法继续整理成社媒、演示和设计素材。", bestFor: "海报、社媒素材、演示设计", url: "https://www.canva.com/ai-image-generator/" },
  { name: "Runway", category: "video", description: "适合探索 AI 视频生成、镜头概念和视觉实验方向。", bestFor: "视频概念、镜头实验、视觉草案", url: "https://runwayml.com/" },
  { name: "Cursor", category: "coding", description: "适合在代码编辑流程中辅助理解、修改和验证项目代码。", bestFor: "代码理解、重构辅助、项目协作", url: "https://www.cursor.com/" },
  { name: "GitHub Copilot", category: "coding", description: "适合在开发环境中补全代码、解释片段和整理实现思路。", bestFor: "代码补全、测试辅助、开发效率", url: "https://github.com/features/copilot" },
  { name: "Notion AI", category: "workspace", description: "适合在知识库和项目页面中整理已有内容与下一步行动。", bestFor: "会议记录、知识库、项目整理", url: "https://www.notion.so/product/ai" },
  { name: "Kimi", category: "writing", description: "适合中文长文本阅读、资料整理和继续编辑工作。", bestFor: "中文长文、资料整理、内容协作", url: "https://www.kimi.com/" },
  { name: "DeepSeek", category: "research", description: "适合把问题拆成步骤，辅助进行中文资料与思路整理。", bestFor: "问题分析、中文协作、代码思路", url: "https://www.deepseek.com/" },
];
