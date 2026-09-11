import type { ToolRecord } from "@/data/tools";
import { getCategoryName } from "@/data/categories";
import { siteConfig } from "./site";

export type ToolFaq = {
  question: string;
  answer: string;
};

export function toolUrl(slug: string) {
  return `${siteConfig.url.replace(/\/$/, "")}/tools/${slug}`;
}

export function getToolFaqs(tool: ToolRecord): ToolFaq[] {
  const isAiDirectory = tool.slug === "ai-tool-directory" || tool.slug.endsWith("-comparison");
  const processingAnswer = isAiDirectory
    ? "在页面中按场景筛选、搜索并打开官方入口；本页是人工维护的静态决策目录，不接收你的内容，也不提供实时排名。"
    : tool.isImplemented
    ? "打开上方操作区，按提示输入内容或选择文件，点击主要按钮即可处理；结果生成后可以复制或下载。"
    : "这个工具的用途、操作步骤和隐私边界已经说明，完整操作区还在准备中。上线前会先完成真实功能和错误提示测试。";
  const privacyAnswer = isAiDirectory
    ? "本页只展示人工维护的工具信息和官方链接，不上传你的文件或文本；打开外部服务后，请以对方的隐私政策为准。"
    : tool.isClientSide
    ? "当前版本在浏览器本地处理，内容不会上传到服务器。关闭页面后，输入内容和处理结果不会作为文件保存在平台。"
    : "当前版本尚未接收或处理文件。若后续需要服务器或第三方服务，会在上线前明确上传范围、保留时间和隐私规则。";
  const saveAnswer = isAiDirectory
    ? "本页不会建立账号云端收藏或保存外部服务结果；你可以自行收藏页面或在目标服务中按其规则保存内容。"
    : tool.isImplemented
    ? "平台不会建立账号云端文件库。结果只保留在当前页面的浏览器内存中，请及时下载重要文件；最近使用记录只保存工具名称。"
    : "当前没有可下载的处理结果。功能上线后会明确结果下载方式、临时文件清理规则和失败后的处理方式。";
  const faqs: ToolFaq[] = [
    { question: `如何使用「${tool.name}」？`, answer: processingAnswer },
    { question: `「${tool.name}」会上传我的内容吗？`, answer: privacyAnswer },
    { question: `「${tool.name}」的结果会保存在哪里？`, answer: saveAnswer },
  ];

  if (tool.riskLevel === "high" || tool.category === "creator") {
    faqs.push({ question: `使用「${tool.name}」需要注意什么？`, answer: "请只处理你本人拥有版权、隐私授权或合法使用权限的内容，并在正式提交前自行核对平台、学校、机构或法律要求。" });
  }
  if (tool.slug === "pdf-to-word") {
    faqs.push({ question: "PDF 转 Word 会保留原来的版式吗？", answer: "当前版本只在浏览器本地提取 PDF 中可复制的文字，并生成 Word 可打开的 .doc 文件；原页面版式、图片、表格和扫描 PDF 文字不会完整保留，扫描文件请使用 OCR。" });
  }
  if (tool.slug === "word-to-pdf") {
    faqs.push({ question: "Word 转 PDF 支持旧版 .doc 和原版式吗？", answer: "当前版本只支持 DOCX 正文文字，不支持旧版 .doc；图片、复杂版式、表格、页眉页脚、批注和目录可能不会保留，结果是适合阅读和打印的基础 PDF。" });
  }
  if (tool.slug === "excel-to-pdf") {
    faqs.push({ question: "Excel 转 PDF 支持旧版 .xls 和复杂表格版式吗？", answer: "当前版本只支持 XLSX，并在浏览器本地提取工作表文字后生成基础 PDF；不保证保留旧版 .xls、图表、图片、复杂样式、合并单元格、列宽和批注。" });
    faqs.push({ question: "Excel 转 PDF 会把公式重新计算吗？", answer: "不会。当前版本读取 XLSX 中已经保存的公式结果或单元格文字，不执行 Excel 公式计算；如果文件没有保存计算结果，相关单元格可能为空。" });
  }
  if (tool.slug === "ppt-to-pdf") {
    faqs.push({ question: "PPT 转 PDF 支持旧版 .ppt 和原版式吗？", answer: "当前版本只支持 PPTX，并在浏览器本地提取幻灯片文字后按页生成基础 PDF；不保证保留旧版 .ppt、图片、图表、动画、主题样式、文本框位置、备注和演讲者视图。" });
    faqs.push({ question: "PPT 转 PDF 会保留演讲者备注吗？", answer: "不会。当前版本只读取幻灯片页面中的文字，不读取演讲者备注或其他演示文稿附属内容；结果适合阅读、打印和分享，不等同于 PowerPoint 的版式级转换。" });
  }
  if (tool.slug === "pdf-to-excel") {
    faqs.push({ question: "PDF 表格导出会生成真正的 Excel 文件吗？", answer: "当前版本生成的是 Excel 可以打开的 UTF-8 CSV，不是原生 .xlsx；它适合简单文字表格或列表，复杂合并单元格、图片表格和扫描 PDF 需要更专业的解析或 OCR。" });
  }
  if (tool.slug === "pdf-decrypt") {
    faqs.push({ question: "PDF 解密需要知道原密码吗？", answer: "需要。当前版本只接受你已知的打开密码，不尝试破解或绕过密码；验证成功后在浏览器本地逐页重新导出一份无密码副本。" });
    faqs.push({ question: "PDF 解密后会保留原来的文字和链接吗？", answer: "当前版本为了兼容浏览器端解锁，会把页面重新渲染成图片再生成 PDF，因此文字选择、链接、表单、目录和复杂结构可能不会保留；适合需要查看、打印或分享的副本。" });
  }
  if (tool.slug === "video-remove-audio") {
    faqs.push({ question: "视频静音会保留原来的 MP4 格式吗？", answer: "当前版本使用浏览器本地 MediaRecorder 只保留画面并导出 WebM，不保证保留原 MP4/MOV 封装或编码；如果需要指定格式或更复杂的编码控制，应使用专业视频工具。" });
  }
  if (tool.slug === "mp4-to-gif") {
    faqs.push({ question: "MP4 转 GIF 的画质和时长有限制吗？", answer: "当前版本在浏览器本地抽取最多 8 秒、最长边约 480 像素的画面，使用最多 256 色的 GIF 编码；它适合短片段预览，不适合长视频或高保真交付。" });
  }
  if (tool.slug === "video-compress") {
    faqs.push({ question: "视频压缩会保留原来的 MP4 格式吗？", answer: "当前版本在浏览器本地按目标码率重新录制并导出 WebM，浏览器会尽量保留音轨，但不保证原 MP4/MOV 封装、无损质量或输出体积一定更小。" });
  }
  if (tool.slug === "video-convert") {
    faqs.push({ question: "视频格式转换支持输出 MP4 或 MOV 吗？", answer: "当前浏览器版本只保证把能播放的视频重新编码为 WebM，不提供 MP4、MOV、MP3 等任意格式互转；输出是否保留音轨还取决于浏览器和输入文件。" });
  }
  if (tool.slug === "audio-compress") {
    faqs.push({ question: "音频压缩会导出 MP3 吗？", answer: "当前版本使用浏览器本地 Web Audio 和 MediaRecorder，优先导出 OGG/WebM 音频，不保证 MP3/WAV 格式、无损质量或输出体积一定更小。" });
  }
  if (tool.slug === "audio-convert") {
    faqs.push({ question: "音频格式转换支持输出 MP3 吗？", answer: "当前浏览器版本只把能解码的音频转换为标准 16-bit PCM WAV，不提供 MP3、AAC、OGG 等任意格式互转；WAV 文件通常更大。" });
  }
  return faqs;
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function getToolStructuredData(tool: ToolRecord, related: ToolRecord[], faqs: ToolFaq[]) {
  const url = toolUrl(tool.slug);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.name,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web Browser",
        description: tool.seoDescription,
        url,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
        featureList: [getCategoryName(tool.category), tool.subCategory, ...tool.tags].join(", "),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "工具库", item: `${siteConfig.url.replace(/\/$/, "")}/tools` },
          { "@type": "ListItem", position: 3, name: tool.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
      },
      ...(related.length ? [{ "@type": "ItemList", name: "相关工具", itemListElement: related.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: toolUrl(item.slug) })) }] : []),
    ],
  };
}

export { safeJsonLd };
