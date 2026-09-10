"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { markdownToHtml, markdownToWordDocument } from "@/lib/markdown";
import { TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleMarkdown = `# 项目周报

## 本周完成

- 完成首页信息架构梳理
- 修复移动端的间距问题
- 发布新的工具页面

## 下一步

继续收集反馈，并把高频需求做成稳定、清晰的工作流。`;

export function MarkdownWordToolRenderer() {
  const [input, setInput] = useState(sampleMarkdown);
  const preview = useMemo(() => markdownToHtml(input), [input]);
  const wordDocument = useMemo(() => input.trim() ? markdownToWordDocument(input) : "", [input]);

  function reset() {
    setInput(sampleMarkdown);
  }

  return <div className="workspace-card markdown-word-workspace"><WorkspaceHeader title="Markdown 转 Word" description="实时预览 Markdown，并下载一个可用 Word 打开的 .doc 文档。" /><div className="markdown-pdf-grid"><div className="markdown-pdf-input"><TextareaField label="Markdown 内容" value={input} onChange={setInput} placeholder="输入标题、段落、列表或代码" rows={20} /></div><article className="markdown-pdf-preview" aria-label="Markdown 排版预览" dangerouslySetInnerHTML={{ __html: preview }} /></div><div className="workspace-actions markdown-word-actions"><TextDownloadButton value={wordDocument} name="markdown-document.doc" mime="application/msword" /><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">Word 可继续编辑，复杂样式请下载后检查</span></div><ToolNotice tone="privacy">文档在当前浏览器中生成，不会上传；当前输出是 Word 可打开的 HTML `.doc`，不包含原生 `.docx` 的复杂版式。</ToolNotice></div>;
}
