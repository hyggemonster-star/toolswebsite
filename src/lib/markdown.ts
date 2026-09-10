const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

function inlineMarkdown(value: string) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/(^|[^~])~([^~\n]+)~(?!~)/g, "$1<del>$2</del>");
  return html;
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const output: string[] = [];
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCode = false;
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    if (!paragraphLines.length) return;
    output.push(`<p>${paragraphLines.map(inlineMarkdown).join("<br />")}</p>`);
    paragraphLines = [];
  }

  function flushList() {
    if (!listType) return;
    output.push(`<${listType}>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  }

  function flushFlow() {
    flushParagraph();
    flushList();
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushFlow();
      if (inCode) {
        const language = codeLanguage ? ` data-language="${escapeHtml(codeLanguage)}"` : "";
        output.push(`<pre><code${language}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        codeLanguage = "";
        inCode = false;
      } else {
        inCode = true;
        codeLanguage = trimmed.slice(3).trim().slice(0, 24);
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushFlow();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushFlow();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(unordered[1]);
      continue;
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(ordered[1]);
      continue;
    }

    if (/^(---+|\*\*\*+|___+)$/.test(trimmed)) {
      flushFlow();
      output.push("<hr />");
      continue;
    }

    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      flushFlow();
      output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    if (listType) flushList();
    paragraphLines.push(trimmed);
  }

  if (inCode) {
    const language = codeLanguage ? ` data-language="${escapeHtml(codeLanguage)}"` : "";
    output.push(`<pre><code${language}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  flushFlow();

  return output.join("\n") || '<p class="markdown-empty">输入 Markdown 后，这里会显示排版预览。</p>';
}

export function markdownToWordDocument(markdown: string) {
  const body = markdownToHtml(markdown);
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>Markdown 文档</title><style>body{font-family:"Microsoft YaHei","PingFang SC",Arial,sans-serif;color:#20283b;line-height:1.75;margin:2cm}h1{font-size:24pt;margin:0 0 20pt}h2{font-size:17pt;margin:22pt 0 8pt}h3{font-size:14pt;margin:16pt 0 6pt}p{margin:8pt 0}ul,ol{margin:8pt 0;padding-left:24pt}blockquote{margin:12pt 0;padding:8pt 12pt;border-left:3pt solid #8ea5e8;color:#58647d;background:#f3f5fb}pre{padding:10pt;background:#f1f3f7;font-family:Consolas,monospace;white-space:pre-wrap}code{font-family:Consolas,monospace;background:#f1f3f7}a{color:#365de8}</style></head><body>${body}</body></html>`;
}
