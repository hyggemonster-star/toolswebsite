"use client";

/* The SVG is generated from validated EAN-13 digits and intentionally rendered inline. */

import { Download, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { barcodeSvgBlob, createEan13Barcode, type BarcodeResult } from "@/lib/barcode";
import { CopyButton, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

function useObjectUrl(source: Blob | null) {
  const url = useMemo(() => source ? URL.createObjectURL(source) : "", [source]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

export function BarcodeToolRenderer({ tool }: { tool: ToolRecord }) {
  const [input, setInput] = useState("690123456789");
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const [error, setError] = useState("");
  const blob = useMemo(() => result ? barcodeSvgBlob(result.svg) : null, [result]);
  const url = useObjectUrl(blob);

  function generate() {
    try {
      setResult(createEan13Barcode(input));
      setError("");
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "条形码生成失败，请检查输入。 ");
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title={tool.name} description="生成可下载的 EAN-13 商品条形码，校验位会自动计算。" /><label className="tool-field barcode-input"><span>商品编码</span><input value={input} maxLength={13} onChange={(event) => setInput(event.target.value)} inputMode="numeric" placeholder="输入 12 位数字，例如 690123456789" /></label><div className="workspace-actions"><button type="button" className="primary-button" onClick={generate}><RefreshCw size={17} />生成条形码</button>{result && <CopyButton value={result.value} />}</div>{error && <p className="field-error">{error}</p>}{result && <div className="barcode-result"><div className="barcode-preview" dangerouslySetInnerHTML={{ __html: result.svg }} /><div className="barcode-result-actions"><div><span>完整 EAN-13 编码</span><strong>{result.value}</strong></div>{url && <a className="soft-button" href={url} download={`${result.value}.svg`}><Download size={16} />下载 SVG</a>}</div></div>}<ToolNotice tone="warning">仅生成 EAN-13 图形，不代表该编码已注册商品；正式使用前请核对 GS1、平台和打印规范。</ToolNotice></div>;
}
