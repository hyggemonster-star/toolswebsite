export type ToolCategory =
  | "pdf-office"
  | "image"
  | "video-audio"
  | "creator"
  | "ai"
  | "developer"
  | "daily";

export type RiskLevel = "low" | "medium" | "high";

export interface ToolRecord {
  id: number;
  name: string;
  slug: string;
  category: ToolCategory;
  subCategory: string;
  description: string;
  priority: number;
  tags: string[];
  isImplemented: boolean;
  isClientSide: boolean;
  riskLevel: RiskLevel;
  seoTitle: string;
  seoDescription: string;
  relatedTools: string[];
}

type ToolSeed = Omit<
  ToolRecord,
  "isImplemented" | "seoTitle" | "seoDescription" | "relatedTools"
> & {
  relatedTools?: string[];
};

const implementedSlugs = new Set([
  "json-format",
  "json-minify",
  "base64-codec",
  "url-codec",
  "timestamp-converter",
  "uuid-generator",
  "hash-generator",
  "qr-generator",
  "word-count",
  "text-dedupe",
  "text-case",
  "password-generator",
  "unit-converter",
  "image-compress",
  "image-resize",
]);

const toolSeeds: ToolSeed[] = [
  // PDF / Office 文件工具
  { id: 1, name: "PDF 转 Word", slug: "pdf-to-word", category: "pdf-office", subCategory: "文档转换", description: "将 PDF 文档转换为可编辑的 Word 文件。", priority: 3, tags: ["PDF", "Word", "转换"], isClientSide: false, riskLevel: "medium" },
  { id: 2, name: "Word 转 PDF", slug: "word-to-pdf", category: "pdf-office", subCategory: "文档转换", description: "把 Word 文档整理成适合分享和打印的 PDF。", priority: 3, tags: ["Word", "PDF", "转换"], isClientSide: false, riskLevel: "medium" },
  { id: 3, name: "PDF 压缩", slug: "pdf-compress", category: "pdf-office", subCategory: "PDF 处理", description: "在尽量保持清晰度的同时减小 PDF 文件体积。", priority: 3, tags: ["PDF", "压缩", "文件"], isClientSide: false, riskLevel: "medium" },
  { id: 4, name: "PDF 合并", slug: "pdf-merge", category: "pdf-office", subCategory: "PDF 处理", description: "将多个 PDF 按顺序合并为一个文件。", priority: 3, tags: ["PDF", "合并", "批量"], isClientSide: false, riskLevel: "medium" },
  { id: 5, name: "PDF 拆分", slug: "pdf-split", category: "pdf-office", subCategory: "PDF 处理", description: "按页码范围拆出需要的 PDF 页面。", priority: 3, tags: ["PDF", "拆分", "页面"], isClientSide: false, riskLevel: "medium" },
  { id: 6, name: "PDF 转图片", slug: "pdf-to-image", category: "pdf-office", subCategory: "文档转换", description: "把 PDF 页面导出为常见图片格式。", priority: 4, tags: ["PDF", "图片", "导出"], isClientSide: false, riskLevel: "medium" },
  { id: 7, name: "图片转 PDF", slug: "image-to-pdf", category: "pdf-office", subCategory: "文档转换", description: "将多张图片整理成一份 PDF 文档。", priority: 3, tags: ["图片", "PDF", "转换"], isClientSide: false, riskLevel: "medium" },
  { id: 8, name: "PDF 加水印", slug: "pdf-watermark", category: "pdf-office", subCategory: "PDF 处理", description: "为 PDF 页面添加文字水印或版权提示。", priority: 4, tags: ["PDF", "水印", "版权"], isClientSide: false, riskLevel: "medium" },
  { id: 9, name: "PDF 加密", slug: "pdf-encrypt", category: "pdf-office", subCategory: "隐私保护", description: "为 PDF 设置打开密码和基础权限。", priority: 4, tags: ["PDF", "加密", "隐私"], isClientSide: false, riskLevel: "high" },
  { id: 10, name: "PDF 解密（限已知密码）", slug: "pdf-decrypt", category: "pdf-office", subCategory: "隐私保护", description: "仅处理你拥有权限且已知密码的 PDF 文件。", priority: 4, tags: ["PDF", "解密", "授权"], isClientSide: false, riskLevel: "high" },
  { id: 11, name: "PDF 页面旋转", slug: "pdf-rotate", category: "pdf-office", subCategory: "页面编辑", description: "调整 PDF 单页或多页的方向。", priority: 4, tags: ["PDF", "旋转", "页面"], isClientSide: false, riskLevel: "medium" },
  { id: 12, name: "PDF 删除页面", slug: "pdf-delete-pages", category: "pdf-office", subCategory: "页面编辑", description: "从 PDF 中移除不需要的页面。", priority: 4, tags: ["PDF", "删除", "页面"], isClientSide: false, riskLevel: "medium" },
  { id: 13, name: "PDF 页面重新排序", slug: "pdf-reorder-pages", category: "pdf-office", subCategory: "页面编辑", description: "拖动调整 PDF 页面排列顺序。", priority: 4, tags: ["PDF", "排序", "页面"], isClientSide: false, riskLevel: "medium" },
  { id: 14, name: "PDF 添加页码", slug: "pdf-page-numbers", category: "pdf-office", subCategory: "页面编辑", description: "为 PDF 页面添加页码和位置设置。", priority: 4, tags: ["PDF", "页码", "排版"], isClientSide: false, riskLevel: "low" },
  { id: 15, name: "PDF OCR 识别文字", slug: "pdf-ocr", category: "pdf-office", subCategory: "文字识别", description: "从扫描 PDF 中识别可复制的文字内容。", priority: 4, tags: ["PDF", "OCR", "识别"], isClientSide: false, riskLevel: "medium" },
  { id: 16, name: "PDF 转 Excel", slug: "pdf-to-excel", category: "pdf-office", subCategory: "文档转换", description: "提取 PDF 表格并转换为 Excel 表格。", priority: 4, tags: ["PDF", "Excel", "表格"], isClientSide: false, riskLevel: "medium" },
  { id: 17, name: "Excel 转 PDF", slug: "excel-to-pdf", category: "pdf-office", subCategory: "文档转换", description: "将 Excel 工作表导出为便于查看的 PDF。", priority: 4, tags: ["Excel", "PDF", "转换"], isClientSide: false, riskLevel: "medium" },
  { id: 18, name: "PPT 转 PDF", slug: "ppt-to-pdf", category: "pdf-office", subCategory: "文档转换", description: "将演示文稿转换成 PDF 方便发送。", priority: 4, tags: ["PPT", "PDF", "转换"], isClientSide: false, riskLevel: "medium" },
  { id: 19, name: "Markdown 转 PDF", slug: "markdown-to-pdf", category: "pdf-office", subCategory: "文档转换", description: "将 Markdown 内容排版并导出为 PDF。", priority: 4, tags: ["Markdown", "PDF", "排版"], isClientSide: false, riskLevel: "low" },
  { id: 20, name: "Markdown 转 Word", slug: "markdown-to-word", category: "pdf-office", subCategory: "文档转换", description: "把 Markdown 文档转换为 Word 文件。", priority: 4, tags: ["Markdown", "Word", "转换"], isClientSide: false, riskLevel: "low" },

  // 图片处理工具
  { id: 21, name: "图片压缩", slug: "image-compress", category: "image", subCategory: "图片优化", description: "在浏览器本地压缩图片，方便上传和分享。", priority: 1, tags: ["图片", "压缩", "本地处理"], isClientSide: true, riskLevel: "low" },
  { id: 22, name: "图片格式转换", slug: "image-convert", category: "image", subCategory: "格式转换", description: "在 JPG、PNG、WEBP 等常见图片格式之间转换。", priority: 3, tags: ["图片", "格式", "转换"], isClientSide: false, riskLevel: "low" },
  { id: 23, name: "HEIC 转 JPG", slug: "heic-to-jpg", category: "image", subCategory: "格式转换", description: "将手机拍摄的 HEIC 图片转换为 JPG。", priority: 4, tags: ["HEIC", "JPG", "兼容"], isClientSide: false, riskLevel: "low" },
  { id: 24, name: "图片尺寸修改", slug: "image-resize", category: "image", subCategory: "图片编辑", description: "按像素或比例调整图片尺寸，浏览器本地完成。", priority: 1, tags: ["图片", "尺寸", "本地处理"], isClientSide: true, riskLevel: "low" },
  { id: 25, name: "图片裁剪", slug: "image-crop", category: "image", subCategory: "图片编辑", description: "裁剪图片比例和画布范围，适配不同平台。", priority: 3, tags: ["图片", "裁剪", "比例"], isClientSide: false, riskLevel: "low" },
  { id: 26, name: "图片去背景", slug: "image-background-remove", category: "image", subCategory: "图片编辑", description: "去除图片背景并保留主体，适合电商和头像场景。", priority: 4, tags: ["图片", "去背景", "电商"], isClientSide: false, riskLevel: "medium" },
  { id: 27, name: "图片加水印", slug: "image-watermark", category: "image", subCategory: "版权保护", description: "为图片添加文字水印，保护内容署名。", priority: 3, tags: ["图片", "水印", "版权"], isClientSide: false, riskLevel: "low" },
  { id: 28, name: "图片批量加水印", slug: "image-batch-watermark", category: "image", subCategory: "版权保护", description: "一次为多张图片添加统一水印。", priority: 4, tags: ["图片", "批量", "水印"], isClientSide: false, riskLevel: "low" },
  { id: 29, name: "图片去 EXIF 隐私信息", slug: "image-remove-exif", category: "image", subCategory: "隐私保护", description: "移除图片中的拍摄设备和定位等 EXIF 信息。", priority: 3, tags: ["图片", "EXIF", "隐私"], isClientSide: false, riskLevel: "low" },
  { id: 30, name: "图片转 Base64", slug: "image-to-base64", category: "image", subCategory: "开发辅助", description: "将图片转换为可嵌入网页的 Base64 数据。", priority: 4, tags: ["图片", "Base64", "开发"], isClientSide: false, riskLevel: "low" },
  { id: 31, name: "Base64 转图片", slug: "base64-to-image", category: "image", subCategory: "开发辅助", description: "将 Base64 数据还原为可下载的图片文件。", priority: 4, tags: ["Base64", "图片", "开发"], isClientSide: false, riskLevel: "low" },
  { id: 32, name: "图片转 ICO 图标", slug: "image-to-ico", category: "image", subCategory: "开发辅助", description: "制作网站 favicon 和桌面图标文件。", priority: 4, tags: ["图片", "ICO", "图标"], isClientSide: false, riskLevel: "low" },
  { id: 33, name: "图片九宫格切图", slug: "image-grid-split", category: "image", subCategory: "图片编辑", description: "把一张图片切成适合社交平台发布的九宫格。", priority: 4, tags: ["图片", "九宫格", "社交媒体"], isClientSide: false, riskLevel: "low" },
  { id: 34, name: "长图切片", slug: "long-image-slice", category: "image", subCategory: "图片编辑", description: "将长截图或长图按指定高度切分。", priority: 4, tags: ["长图", "切片", "图片"], isClientSide: false, riskLevel: "low" },
  { id: 35, name: "图片拼接长图", slug: "image-stitch", category: "image", subCategory: "图片编辑", description: "将多张图片按顺序拼接成一张长图。", priority: 4, tags: ["图片", "拼接", "长图"], isClientSide: false, riskLevel: "low" },
  { id: 36, name: "证件照换底色", slug: "id-photo-background", category: "image", subCategory: "证件照", description: "为证件照更换常用背景色，提交前请自行核对规格。", priority: 4, tags: ["证件照", "底色", "图片"], isClientSide: false, riskLevel: "medium" },
  { id: 37, name: "证件照尺寸裁剪", slug: "id-photo-crop", category: "image", subCategory: "证件照", description: "按常见证件照尺寸裁剪图片。", priority: 4, tags: ["证件照", "尺寸", "裁剪"], isClientSide: false, riskLevel: "low" },
  { id: 38, name: "图片清晰度增强", slug: "image-enhance", category: "image", subCategory: "图片优化", description: "改善图片观感并尝试提升细节清晰度。", priority: 4, tags: ["图片", "增强", "清晰度"], isClientSide: false, riskLevel: "medium" },

  // 视频 / 音频工具
  { id: 39, name: "视频转音频 MP3", slug: "video-to-mp3", category: "video-audio", subCategory: "格式转换", description: "从视频文件中提取音频并导出为 MP3。", priority: 3, tags: ["视频", "MP3", "音频"], isClientSide: false, riskLevel: "medium" },
  { id: 40, name: "视频压缩", slug: "video-compress", category: "video-audio", subCategory: "视频优化", description: "降低视频体积，方便发送和上传。", priority: 4, tags: ["视频", "压缩", "上传"], isClientSide: false, riskLevel: "medium" },
  { id: 41, name: "MP4 转 GIF", slug: "mp4-to-gif", category: "video-audio", subCategory: "格式转换", description: "截取 MP4 片段并转换为 GIF 动图。", priority: 4, tags: ["MP4", "GIF", "动图"], isClientSide: false, riskLevel: "medium" },
  { id: 42, name: "视频截图", slug: "video-screenshot", category: "video-audio", subCategory: "视频编辑", description: "从视频指定时间点导出清晰截图。", priority: 3, tags: ["视频", "截图", "封面"], isClientSide: false, riskLevel: "low" },
  { id: 43, name: "视频封面提取", slug: "video-cover-extract", category: "video-audio", subCategory: "视频编辑", description: "从你拥有版权或已获授权的视频中提取封面帧。", priority: 3, tags: ["视频", "封面", "授权"], isClientSide: false, riskLevel: "high" },
  { id: 44, name: "视频格式转换", slug: "video-convert", category: "video-audio", subCategory: "格式转换", description: "在常见视频格式之间转换编码和封装。", priority: 4, tags: ["视频", "格式", "转换"], isClientSide: false, riskLevel: "medium" },
  { id: 45, name: "音频格式转换", slug: "audio-convert", category: "video-audio", subCategory: "格式转换", description: "在 MP3、WAV 等常见音频格式之间转换。", priority: 4, tags: ["音频", "格式", "转换"], isClientSide: false, riskLevel: "medium" },
  { id: 46, name: "音频压缩", slug: "audio-compress", category: "video-audio", subCategory: "音频优化", description: "调整音频参数以减小文件体积。", priority: 4, tags: ["音频", "压缩", "文件"], isClientSide: false, riskLevel: "medium" },
  { id: 47, name: "视频转字幕", slug: "video-to-subtitles", category: "video-audio", subCategory: "文字处理", description: "为本人拥有版权或已获授权的视频生成字幕草稿。", priority: 4, tags: ["视频", "字幕", "授权"], isClientSide: false, riskLevel: "high" },
  { id: 48, name: "SRT 转 VTT", slug: "srt-to-vtt", category: "video-audio", subCategory: "字幕处理", description: "将 SRT 字幕转换为适合网页播放的 VTT。", priority: 3, tags: ["SRT", "VTT", "字幕"], isClientSide: false, riskLevel: "low" },
  { id: 49, name: "字幕时间轴调整", slug: "subtitle-timing", category: "video-audio", subCategory: "字幕处理", description: "整体平移字幕时间轴，修正同步偏差。", priority: 4, tags: ["字幕", "时间轴", "视频"], isClientSide: false, riskLevel: "low" },
  { id: 50, name: "视频静音 / 去音轨", slug: "video-remove-audio", category: "video-audio", subCategory: "视频编辑", description: "移除视频音轨，导出无声版本。", priority: 4, tags: ["视频", "静音", "音轨"], isClientSide: false, riskLevel: "medium" },

  // 自媒体运营工具
  { id: 51, name: "小红书标题生成器", slug: "xhs-title-generator", category: "creator", subCategory: "小红书", description: "根据主题整理小红书标题方向和表达角度。", priority: 3, tags: ["小红书", "标题", "创作"], isClientSide: false, riskLevel: "low" },
  { id: 52, name: "小红书笔记排版", slug: "xhs-note-formatter", category: "creator", subCategory: "小红书", description: "清理和整理笔记段落、符号与层级。", priority: 3, tags: ["小红书", "排版", "笔记"], isClientSide: false, riskLevel: "low" },
  { id: 53, name: "小红书标签推荐", slug: "xhs-hashtag-recommender", category: "creator", subCategory: "小红书", description: "围绕内容主题整理可供人工筛选的标签方向。", priority: 4, tags: ["小红书", "标签", "运营"], isClientSide: false, riskLevel: "low" },
  { id: 54, name: "小红书封面比例裁剪", slug: "xhs-cover-crop", category: "creator", subCategory: "小红书", description: "按小红书常用封面比例准备图片。", priority: 4, tags: ["小红书", "封面", "裁剪"], isClientSide: false, riskLevel: "low" },
  { id: 55, name: "小红书敏感词检测", slug: "xhs-sensitive-word-check", category: "creator", subCategory: "内容检查", description: "辅助检查文案中的风险表达，不能替代平台规则核验。", priority: 3, tags: ["小红书", "敏感词", "合规"], isClientSide: false, riskLevel: "medium" },
  { id: 56, name: "小红书爆款标题分析", slug: "xhs-title-analyzer", category: "creator", subCategory: "内容分析", description: "拆解标题结构和信息密度，帮助优化原创表达。", priority: 4, tags: ["小红书", "标题", "分析"], isClientSide: false, riskLevel: "low" },
  { id: 57, name: "抖音标题生成器", slug: "douyin-title-generator", category: "creator", subCategory: "抖音", description: "围绕视频主题整理抖音标题和开场方向。", priority: 3, tags: ["抖音", "标题", "创作"], isClientSide: false, riskLevel: "low" },
  { id: 58, name: "抖音口播脚本生成", slug: "douyin-script-generator", category: "creator", subCategory: "抖音", description: "将主题整理成适合口播的脚本结构。", priority: 3, tags: ["抖音", "脚本", "口播"], isClientSide: false, riskLevel: "low" },
  { id: 59, name: "短视频分镜脚本生成", slug: "short-video-storyboard", category: "creator", subCategory: "短视频", description: "生成镜头、画面、台词和节奏的分镜草稿。", priority: 4, tags: ["短视频", "分镜", "脚本"], isClientSide: false, riskLevel: "low" },
  { id: 60, name: "视频文案提取（限授权内容）", slug: "authorized-video-copy-extract", category: "creator", subCategory: "内容整理", description: "仅用于你本人拥有版权或已获授权的视频内容整理。", priority: 4, tags: ["视频", "文案", "授权"], isClientSide: false, riskLevel: "high" },
  { id: 61, name: "视频封面提取（限授权内容）", slug: "authorized-video-cover-extract", category: "creator", subCategory: "内容整理", description: "仅从你本人拥有版权或已获授权的视频中提取封面。", priority: 4, tags: ["视频", "封面", "授权"], isClientSide: false, riskLevel: "high" },
  { id: 62, name: "公众号标题生成器", slug: "wechat-title-generator", category: "creator", subCategory: "公众号", description: "围绕文章主题整理公众号标题方向。", priority: 4, tags: ["公众号", "标题", "创作"], isClientSide: false, riskLevel: "low" },
  { id: 63, name: "公众号排版格式清理", slug: "wechat-format-cleaner", category: "creator", subCategory: "公众号", description: "清理从不同编辑器复制来的多余格式和空行。", priority: 4, tags: ["公众号", "排版", "清理"], isClientSide: false, riskLevel: "low" },
  { id: 64, name: "微信朋友圈文案生成", slug: "moments-copy-generator", category: "creator", subCategory: "朋友圈", description: "根据场景整理克制、自然的朋友圈文案方向。", priority: 4, tags: ["朋友圈", "文案", "创作"], isClientSide: false, riskLevel: "low" },
  { id: 65, name: "评论区回复生成器", slug: "comment-reply-generator", category: "creator", subCategory: "互动运营", description: "为常见评论场景整理礼貌、自然的回复草稿。", priority: 4, tags: ["评论", "回复", "运营"], isClientSide: false, riskLevel: "low" },

  // AIGC / AI 创作工具
  { id: 66, name: "AI 工具导航", slug: "ai-tool-directory", category: "ai", subCategory: "工具发现", description: "按使用场景浏览 AI 工具和服务方向。", priority: 3, tags: ["AI", "导航", "工具"], isClientSide: false, riskLevel: "low" },
  { id: 67, name: "AI 写作工具对比", slug: "ai-writing-comparison", category: "ai", subCategory: "工具对比", description: "从功能、适用场景和使用成本等角度对比 AI 写作工具。", priority: 4, tags: ["AI", "写作", "对比"], isClientSide: false, riskLevel: "low" },
  { id: 68, name: "AI 图片工具对比", slug: "ai-image-comparison", category: "ai", subCategory: "工具对比", description: "整理 AI 图片生成和编辑工具的差异。", priority: 4, tags: ["AI", "图片", "对比"], isClientSide: false, riskLevel: "low" },
  { id: 69, name: "AI 视频工具对比", slug: "ai-video-comparison", category: "ai", subCategory: "工具对比", description: "整理 AI 视频创作工具的功能侧重点。", priority: 4, tags: ["AI", "视频", "对比"], isClientSide: false, riskLevel: "low" },
  { id: 70, name: "AI 编程工具对比", slug: "ai-coding-comparison", category: "ai", subCategory: "工具对比", description: "按编程协作场景对比 AI 开发工具。", priority: 4, tags: ["AI", "编程", "对比"], isClientSide: false, riskLevel: "low" },
  { id: 71, name: "Prompt 生成器", slug: "prompt-generator", category: "ai", subCategory: "Prompt", description: "通过目标、受众和风格生成更清晰的 Prompt 草稿。", priority: 3, tags: ["AI", "Prompt", "提示词"], isClientSide: false, riskLevel: "low" },
  { id: 72, name: "小红书 Prompt 模板库", slug: "xhs-prompt-library", category: "ai", subCategory: "Prompt 模板", description: "整理适合小红书选题、标题和笔记的 Prompt 模板。", priority: 4, tags: ["AI", "Prompt", "小红书"], isClientSide: false, riskLevel: "low" },
  { id: 73, name: "电商 Prompt 模板库", slug: "ecommerce-prompt-library", category: "ai", subCategory: "Prompt 模板", description: "整理商品描述、卖点提炼和客服场景的 Prompt 模板。", priority: 4, tags: ["AI", "Prompt", "电商"], isClientSide: false, riskLevel: "low" },
  { id: 74, name: "短视频 Prompt 模板库", slug: "short-video-prompt-library", category: "ai", subCategory: "Prompt 模板", description: "整理短视频选题、脚本和分镜的 Prompt 模板。", priority: 4, tags: ["AI", "Prompt", "短视频"], isClientSide: false, riskLevel: "low" },
  { id: 75, name: "AI 改写降重", slug: "ai-rewrite", category: "ai", subCategory: "文本处理", description: "辅助调整表达结构和语气，保留人工审核与原创判断。", priority: 4, tags: ["AI", "改写", "文本"], isClientSide: false, riskLevel: "medium" },
  { id: 76, name: "AI 总结长文", slug: "ai-long-summary", category: "ai", subCategory: "文本处理", description: "将长文整理为重点、结构和行动项摘要。", priority: 3, tags: ["AI", "总结", "长文"], isClientSide: false, riskLevel: "medium" },
  { id: 77, name: "AI 生成周报", slug: "ai-weekly-report", category: "ai", subCategory: "办公效率", description: "将工作记录整理成结构化周报草稿。", priority: 4, tags: ["AI", "周报", "办公"], isClientSide: false, riskLevel: "medium" },
  { id: 78, name: "AI 生成简历", slug: "ai-resume", category: "ai", subCategory: "求职", description: "根据经历和目标岗位整理简历内容草稿。", priority: 4, tags: ["AI", "简历", "求职"], isClientSide: false, riskLevel: "medium" },
  { id: 79, name: "AI 面试题生成", slug: "ai-interview-questions", category: "ai", subCategory: "求职", description: "按岗位方向生成练习用面试题和追问角度。", priority: 4, tags: ["AI", "面试", "求职"], isClientSide: false, riskLevel: "low" },
  { id: 80, name: "AI PPT 大纲生成", slug: "ai-ppt-outline", category: "ai", subCategory: "办公效率", description: "将主题和受众整理成清晰的演示文稿大纲。", priority: 4, tags: ["AI", "PPT", "大纲"], isClientSide: false, riskLevel: "low" },

  // 开发者 / 站长工具
  { id: 81, name: "JSON 格式化", slug: "json-format", category: "developer", subCategory: "JSON", description: "让压缩或凌乱的 JSON 变得清晰易读。", priority: 1, tags: ["JSON", "格式化", "开发"], isClientSide: true, riskLevel: "low" },
  { id: 82, name: "JSON 压缩", slug: "json-minify", category: "developer", subCategory: "JSON", description: "移除 JSON 多余空白，生成紧凑字符串。", priority: 1, tags: ["JSON", "压缩", "开发"], isClientSide: true, riskLevel: "low" },
  { id: 83, name: "JSON 转 CSV", slug: "json-to-csv", category: "developer", subCategory: "数据转换", description: "将简单对象数组转换为 CSV 文本。", priority: 3, tags: ["JSON", "CSV", "数据"], isClientSide: false, riskLevel: "low" },
  { id: 84, name: "CSV 转 JSON", slug: "csv-to-json", category: "developer", subCategory: "数据转换", description: "将带表头的 CSV 文本转换为 JSON 数组。", priority: 3, tags: ["CSV", "JSON", "数据"], isClientSide: false, riskLevel: "low" },
  { id: 85, name: "Base64 编码解码", slug: "base64-codec", category: "developer", subCategory: "编码解码", description: "在文本和 Base64 字符串之间进行 Unicode 安全转换。", priority: 1, tags: ["Base64", "编码", "解码"], isClientSide: true, riskLevel: "low" },
  { id: 86, name: "URL 编码解码", slug: "url-codec", category: "developer", subCategory: "编码解码", description: "快速编码或解码 URL 参数和文本片段。", priority: 1, tags: ["URL", "编码", "解码"], isClientSide: true, riskLevel: "low" },
  { id: 87, name: "时间戳转换", slug: "timestamp-converter", category: "developer", subCategory: "时间工具", description: "在 Unix 时间戳和本地日期时间之间转换。", priority: 1, tags: ["时间戳", "日期", "开发"], isClientSide: true, riskLevel: "low" },
  { id: 88, name: "UUID 生成器", slug: "uuid-generator", category: "developer", subCategory: "开发辅助", description: "生成符合常见格式的随机 UUID。", priority: 1, tags: ["UUID", "随机", "开发"], isClientSide: true, riskLevel: "low" },
  { id: 89, name: "MD5 / SHA 哈希生成", slug: "hash-generator", category: "developer", subCategory: "安全与校验", description: "在浏览器中生成 MD5、SHA-1、SHA-256 等文本哈希。", priority: 1, tags: ["MD5", "SHA", "哈希"], isClientSide: true, riskLevel: "low" },
  { id: 90, name: "正则表达式测试", slug: "regex-tester", category: "developer", subCategory: "文本处理", description: "用示例文本测试正则表达式匹配结果。", priority: 3, tags: ["正则", "Regex", "开发"], isClientSide: false, riskLevel: "low" },
  { id: 91, name: "JWT 解析", slug: "jwt-decoder", category: "developer", subCategory: "安全与校验", description: "只在本地解析 JWT 头部和载荷，不验证签名。", priority: 3, tags: ["JWT", "解析", "安全"], isClientSide: false, riskLevel: "medium" },
  { id: 92, name: "Cron 表达式生成器", slug: "cron-generator", category: "developer", subCategory: "开发辅助", description: "根据执行频率生成常见 Cron 表达式。", priority: 4, tags: ["Cron", "定时", "开发"], isClientSide: false, riskLevel: "low" },

  // 日常实用工具
  { id: 93, name: "二维码生成器", slug: "qr-generator", category: "daily", subCategory: "生成器", description: "把网址或文字生成可下载的二维码图片。", priority: 1, tags: ["二维码", "生成", "分享"], isClientSide: true, riskLevel: "low" },
  { id: 94, name: "条形码生成器", slug: "barcode-generator", category: "daily", subCategory: "生成器", description: "生成常见格式的条形码，使用前请核对编码规范。", priority: 4, tags: ["条形码", "生成", "商品"], isClientSide: false, riskLevel: "low" },
  { id: 95, name: "短链接生成器", slug: "short-link", category: "daily", subCategory: "链接工具", description: "将长网址转换为更易分享的短链接。", priority: 4, tags: ["短链接", "网址", "分享"], isClientSide: false, riskLevel: "medium" },
  { id: 96, name: "字数统计", slug: "word-count", category: "daily", subCategory: "文本工具", description: "统计中文字符、英文单词、行数和字节数。", priority: 1, tags: ["字数", "统计", "文本"], isClientSide: true, riskLevel: "low" },
  { id: 97, name: "文本去重", slug: "text-dedupe", category: "daily", subCategory: "文本工具", description: "按行去除重复内容，保留首次出现的顺序。", priority: 1, tags: ["文本", "去重", "清理"], isClientSide: true, riskLevel: "low" },
  { id: 98, name: "文本大小写转换", slug: "text-case", category: "daily", subCategory: "文本工具", description: "快速转换英文文本大小写和标题格式。", priority: 1, tags: ["文本", "大小写", "格式"], isClientSide: true, riskLevel: "low" },
  { id: 99, name: "单位换算", slug: "unit-converter", category: "daily", subCategory: "换算工具", description: "在长度、重量、温度和数据大小单位之间换算。", priority: 1, tags: ["单位", "换算", "计算"], isClientSide: true, riskLevel: "low" },
  { id: 100, name: "密码生成器", slug: "password-generator", category: "daily", subCategory: "安全工具", description: "在本地生成随机密码，不上传也不保存生成结果。", priority: 1, tags: ["密码", "随机", "安全"], isClientSide: true, riskLevel: "low" },
];

export const tools: ToolRecord[] = toolSeeds.map((tool) => {
  const categoryPeers = toolSeeds
    .filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug)
    .slice(0, 3)
    .map((candidate) => candidate.slug);

  return {
    ...tool,
    isImplemented: implementedSlugs.has(tool.slug),
    seoTitle: `${tool.name}｜免费在线工具｜AI效率工具箱`,
    seoDescription: `${tool.description} 免费、无需登录，优先在浏览器本地处理。`,
    relatedTools: tool.relatedTools ?? categoryPeers,
  };
});

export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategory) {
  return tools.filter((tool) => tool.category === category);
}

export function getImplementedTools() {
  return tools.filter((tool) => tool.isImplemented);
}

export function getPopularTools() {
  return [...tools].sort((a, b) => a.priority - b.priority || a.id - b.id).slice(0, 8);
}

export const toolCount = tools.length;
