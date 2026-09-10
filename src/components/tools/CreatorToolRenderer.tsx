"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { formatCreatorNote, type NoteSpacing } from "@/lib/text";
import { CopyButton, ResultBox, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

const sampleNote = `周末去了一家很喜欢的咖啡店

位置很好找，店里很安静，适合一个人坐着工作。

- 光线舒服
- 插座充足
- 咖啡口味清爽

如果你也喜欢安静的小店，可以收藏起来。`;

export function CreatorToolRenderer({ tool }: { tool: ToolRecord }) {
  const [input, setInput] = useState(sampleNote);
  const [spacing, setSpacing] = useState<NoteSpacing>("standard");
  const output = useMemo(() => formatCreatorNote(input, spacing), [input, spacing]);

  function reset() {
    setInput(sampleNote);
    setSpacing("standard");
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="清理复制粘贴带来的空格和空行，整理成更易阅读的笔记草稿。" /><div className="segmented-control" role="group" aria-label="段落间距"><button type="button" className={spacing === "standard" ? "selected" : ""} onClick={() => setSpacing("standard")}>标准段落</button><button type="button" className={spacing === "airy" ? "selected" : ""} onClick={() => setSpacing("airy")}>宽松段落</button></div><div className="workspace-grid"><TextareaField label="原始笔记" value={input} onChange={setInput} placeholder="粘贴笔记内容" rows={13} /><ResultBox label="排版结果" value={output} placeholder="整理后的笔记会显示在这里" /></div><div className="workspace-actions"><CopyButton value={output} />{output && <TextDownloadButton value={output} name="xhs-note-formatted.txt" />}<button type="button" className="soft-button" onClick={reset}><RefreshCw size={16} />恢复示例</button><span className="count-note">只整理格式，不改写内容</span></div><ToolNotice tone="warning">结果只是原创笔记排版草稿，请自行核对事实、版权和平台规则。</ToolNotice></div>;
}
