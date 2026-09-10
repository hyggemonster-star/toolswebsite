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
  const processingAnswer = tool.isImplemented
    ? "打开上方操作区，按提示输入内容或选择文件，点击主要按钮即可处理；结果生成后可以复制或下载。"
    : "这个工具的用途、操作步骤和隐私边界已经说明，完整操作区还在准备中。上线前会先完成真实功能和错误提示测试。";
  const privacyAnswer = tool.isClientSide
    ? "当前版本在浏览器本地处理，内容不会上传到服务器。关闭页面后，输入内容和处理结果不会作为文件保存在平台。"
    : "当前版本尚未接收或处理文件。若后续需要服务器或第三方服务，会在上线前明确上传范围、保留时间和隐私规则。";
  const saveAnswer = tool.isImplemented
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
  if (tool.slug === "pdf-to-excel") {
    faqs.push({ question: "PDF 表格导出会生成真正的 Excel 文件吗？", answer: "当前版本生成的是 Excel 可以打开的 UTF-8 CSV，不是原生 .xlsx；它适合简单文字表格或列表，复杂合并单元格、图片表格和扫描 PDF 需要更专业的解析或 OCR。" });
  }
  if (tool.slug === "video-remove-audio") {
    faqs.push({ question: "视频静音会保留原来的 MP4 格式吗？", answer: "当前版本使用浏览器本地 MediaRecorder 只保留画面并导出 WebM，不保证保留原 MP4/MOV 封装或编码；如果需要指定格式或更复杂的编码控制，应使用专业视频工具。" });
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
