"use client";

import { Printer, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";
import { TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleMarkdown = `# 项目周报

## 本周完成

- 完成首页信息架构梳理
- 修复移动端的间距问题
- 发布新的工具页面

## 下一步

继续收集反馈，并把高频需求做成稳定、清晰的工作流。

> 内容在浏览器本地排版，打印时请选择“另存为 PDF”。`;

export function MarkdownPdfToolRenderer() {
  const [input, setInput] = useState(sampleMarkdown);
  const preview = useMemo(() => markdownToHtml(input), [input]);

  function reset() {
    setInput(sampleMarkdown);
  }

  return <div className="workspace-card markdown-pdf-workspace"><WorkspaceHeader title="Markdown 转 PDF" description="实时预览 Markdown 排版，打开打印对话框后保存为 PDF。" /><div className="markdown-pdf-grid"><div className="markdown-pdf-input"><TextareaField label="Markdown 内容" value={input} onChange={setInput} placeholder="输入标题、段落、列表或代码" rows={20} /></div><article className="markdown-pdf-preview" aria-label="Markdown 排版预览" dangerouslySetInnerHTML={{ __html: preview }} /></div><div className="workspace-actions markdown-pdf-actions"><button type="button" className="primary-button" onClick={() => window.print()} disabled={!input.trim()}><Printer size={17} />导出 PDF</button><button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">打印设置中选择“另存为 PDF”</span></div><ToolNotice tone="privacy">Markdown 排版和预览都在当前浏览器中完成，内容不会上传；原始文本不会被平台保存。</ToolNotice></div>;
}
