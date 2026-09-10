"use client";

/* QR previews are generated as data URLs and intentionally bypass image optimization. */
/* eslint-disable @next/next/no-img-element */

import QRCode from "qrcode";
import {
  Check,
  Clipboard,
  Download,
  FileImage,
  FileJson,
  ImagePlus,
  LockKeyhole,
  RefreshCw,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { ToolRecord } from "@/data/tools";
import { digestText, md5 } from "@/lib/hash";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return <button type="button" className="soft-button" onClick={copy} disabled={!value}><Clipboard size={16} />{copied ? "已复制" : "复制结果"}</button>;
}

function ToolNotice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "privacy" | "warning" }) {
  return <div className={`tool-notice notice-${tone}`}>{tone === "privacy" ? <LockKeyhole size={17} /> : tone === "warning" ? <WandSparkles size={17} /> : <Check size={17} />}<span>{children}</span></div>;
}

function WorkspaceHeader({ title, description }: { title: string; description: string }) {
  return <div className="workspace-heading"><div><p className="workspace-label">直接处理</p><h2>{title}</h2><p>{description}</p></div><span className="local-badge"><span /> 浏览器本地</span></div>;
}

function TextareaField({ label, value, onChange, placeholder, rows = 10 }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; rows?: number }) {
  return <label className="tool-field"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} spellCheck={false} /></label>;
}

function ResultBox({ label, value, placeholder = "处理结果会出现在这里" }: { label: string; value: string; placeholder?: string }) {
  return <div className="result-box"><div className="result-box-header"><span>{label}</span><CopyButton value={value} /></div><pre className={value ? "has-value" : ""}>{value || placeholder}</pre></div>;
}

function JsonTool({ minify }: { minify: boolean }) {
  const [input, setInput] = useState('{\n  "hello": "world",\n  "items": [1, 2, 3]\n}');
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function process() {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, minify ? 0 : 2));
      setError("");
    } catch (reason) {
      setOutput("");
      setError(reason instanceof Error ? `JSON 格式有误：${reason.message}` : "JSON 格式有误，请检查引号和括号。 ");
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title={minify ? "JSON 压缩" : "JSON 格式化"} description={minify ? "去掉多余空白，让 JSON 更紧凑。" : "让压缩或凌乱的 JSON 变得清晰易读。"} /><div className="workspace-grid"><TextareaField label="输入 JSON" value={input} onChange={setInput} placeholder="粘贴 JSON 内容" /><ResultBox label="处理结果" value={output} /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={process}><FileJson size={17} />{minify ? "压缩 JSON" : "格式化 JSON"}</button><button type="button" className="soft-button" onClick={() => { setInput(""); setOutput(""); setError(""); }}>清空</button></div>{error && <p className="field-error">{error}</p>}<ToolNotice>内容只在当前浏览器中处理，不会上传。</ToolNotice></div>;
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function process() {
    try {
      setOutput(mode === "encode" ? encodeBase64(input) : decodeBase64(input));
      setError("");
    } catch {
      setOutput("");
      setError("这不是有效的 Base64 字符串，请检查内容后再试。 ");
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="Base64 编码解码" description="支持中文文本的 Base64 编码与解码。" /><div className="segmented-control" role="tablist" aria-label="Base64 模式"><button type="button" className={mode === "encode" ? "selected" : ""} onClick={() => setMode("encode")}>文本 → Base64</button><button type="button" className={mode === "decode" ? "selected" : ""} onClick={() => setMode("decode")}>Base64 → 文本</button></div><div className="workspace-grid"><TextareaField label={mode === "encode" ? "输入文本" : "输入 Base64"} value={input} onChange={setInput} placeholder={mode === "encode" ? "输入要编码的中文或英文" : "粘贴 Base64 字符串"} /><ResultBox label="处理结果" value={output} /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={process}>开始{mode === "encode" ? "编码" : "解码"}</button><button type="button" className="soft-button" onClick={() => { setInput(""); setOutput(""); }}>清空</button></div>{error && <p className="field-error">{error}</p>}<ToolNotice>文本只在当前浏览器中处理，不会离开设备。</ToolNotice></div>;
}

function UrlCodecTool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function process() {
    try {
      setOutput(mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input));
      setError("");
    } catch {
      setOutput("");
      setError("解码失败，请确认输入的是完整的 URL 编码文本。 ");
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="URL 编码解码" description="处理 URL 参数中的中文、空格和特殊字符。" /><div className="segmented-control" role="tablist" aria-label="URL 模式"><button type="button" className={mode === "encode" ? "selected" : ""} onClick={() => setMode("encode")}>编码</button><button type="button" className={mode === "decode" ? "selected" : ""} onClick={() => setMode("decode")}>解码</button></div><div className="workspace-grid"><TextareaField label="输入内容" value={input} onChange={setInput} placeholder="输入 URL 参数或文本" /><ResultBox label="处理结果" value={output} /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={process}>开始{mode === "encode" ? "编码" : "解码"}</button><button type="button" className="soft-button" onClick={() => { setInput(""); setOutput(""); }}>清空</button></div>{error && <p className="field-error">{error}</p>}<ToolNotice>处理过程在浏览器本地完成。</ToolNotice></div>;
}

function TimestampTool() {
  const [timestamp, setTimestamp] = useState("");
  const [dateText, setDateText] = useState("");
  const [timestampResult, setTimestampResult] = useState("");
  const [dateResult, setDateResult] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setTimestamp(String(Math.floor(Date.now() / 1000))), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function convertTimestamp() {
    const value = Number(timestamp);
    if (!Number.isFinite(value)) { setDateResult("请输入数字时间戳"); return; }
    const date = new Date(timestamp.length >= 13 ? value : value * 1000);
    setDateResult(Number.isNaN(date.getTime()) ? "无法识别这个时间戳" : date.toLocaleString("zh-CN", { hour12: false }));
  }

  function convertDate() {
    const value = Date.parse(dateText);
    setTimestampResult(Number.isNaN(value) ? "无法识别这个日期" : `${Math.floor(value / 1000)}（秒） / ${value}（毫秒）`);
  }

  return <div className="workspace-card"><WorkspaceHeader title="时间戳转换" description="在 Unix 时间戳和本地日期时间之间快速转换。" /><div className="dual-tool-grid"><div className="mini-tool"><div className="mini-tool-title"><span>时间戳 → 日期</span><small>支持 10 位或 13 位</small></div><label className="tool-field"><span>时间戳</span><input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} inputMode="numeric" placeholder="例如 1710000000" /></label><button type="button" className="primary-button" onClick={convertTimestamp}>转换日期</button><p className="inline-result">{dateResult || "结果会显示在这里"}</p></div><div className="mini-tool"><div className="mini-tool-title"><span>日期 → 时间戳</span><small>浏览器本地时区</small></div><label className="tool-field"><span>日期时间</span><input type="datetime-local" value={dateText} onChange={(event) => setDateText(event.target.value)} /></label><button type="button" className="primary-button" onClick={convertDate}>转换时间戳</button><p className="inline-result">{timestampResult || "结果会显示在这里"}</p></div></div><ToolNotice>日期解析和显示遵循当前设备的本地时区。</ToolNotice></div>;
}

function makeUuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function UuidTool() {
  const [items, setItems] = useState<string[]>([]);
  const [count, setCount] = useState("3");

  function generate() {
    const total = Math.min(20, Math.max(1, Number(count) || 1));
    setItems(Array.from({ length: total }, makeUuid));
  }

  return <div className="workspace-card"><WorkspaceHeader title="UUID 生成器" description="生成随机 UUID v4，适合开发测试和数据标识。" /><div className="inline-controls"><label className="tool-field short-field"><span>生成数量</span><input type="number" min="1" max="20" value={count} onChange={(event) => setCount(event.target.value)} /></label><button type="button" className="primary-button" onClick={generate}><RefreshCw size={17} />生成 UUID</button></div><div className="list-result">{items.length ? items.map((item) => <div key={item}><code>{item}</code><CopyButton value={item} /></div>) : <p className="placeholder-line">点击按钮生成 1–20 个 UUID。</p>}</div><ToolNotice>随机值来自当前浏览器的 Web Crypto API。</ToolNotice></div>;
}

function HashTool() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<"MD5" | "SHA-1" | "SHA-256" | "SHA-512">("SHA-256");
  const [output, setOutput] = useState("");
  const [working, setWorking] = useState(false);

  async function process() {
    setWorking(true);
    setOutput(algorithm === "MD5" ? md5(input) : await digestText(input, algorithm));
    setWorking(false);
  }

  return <div className="workspace-card"><WorkspaceHeader title="MD5 / SHA 哈希生成" description="对文本生成常见哈希，用于校验和开发调试。" /><div className="hash-controls"><label className="tool-field"><span>哈希算法</span><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as typeof algorithm)}>{["MD5", "SHA-1", "SHA-256", "SHA-512"].map((name) => <option key={name}>{name}</option>)}</select></label><button type="button" className="primary-button" onClick={process} disabled={working}>{working ? "生成中…" : "生成哈希"}</button></div><TextareaField label="输入文本" value={input} onChange={setInput} placeholder="输入要计算哈希的文本" rows={7} /><ResultBox label="哈希结果" value={output} /><ToolNotice>哈希过程在浏览器本地完成；哈希不是加密，不能还原原文。</ToolNotice></div>;
}

function QrTool() {
  const [value, setValue] = useState("AI效率工具箱");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!value.trim()) {
      const timer = window.setTimeout(() => setDataUrl(""), 0);
      return () => window.clearTimeout(timer);
    }
    QRCode.toDataURL(value, { width: 360, margin: 2, errorCorrectionLevel: "M", color: { dark: "#17233f", light: "#ffffff" } })
      .then((url) => { if (!cancelled) { setDataUrl(url); setError(""); } })
      .catch(() => { if (!cancelled) setError("二维码生成失败，请换一段更短的内容。 "); });
    return () => { cancelled = true; };
  }, [value]);

  return <div className="workspace-card"><WorkspaceHeader title="二维码生成器" description="输入网址或文字，生成一张可以保存的二维码。" /><div className="qr-layout"><div><TextareaField label="二维码内容" value={value} onChange={setValue} placeholder="输入网址、联系方式或一段文字" rows={8} /><p className="field-hint">内容越短，二维码越容易被识别。</p></div><div className="qr-preview">{dataUrl ? <img src={dataUrl} alt="生成的二维码" /> : <span>输入内容后生成二维码</span>}{dataUrl && <a className="primary-button" href={dataUrl} download="tools-hub-qr.png"><Download size={17} />下载 PNG</a>}</div></div>{error && <p className="field-error">{error}</p>}<ToolNotice>二维码在浏览器本地生成，输入内容不会上传。</ToolNotice></div>;
}

function WordCountTool() {
  const [input, setInput] = useState("");
  const stats = useMemo(() => {
    const characters = Array.from(input).length;
    const chinese = input.match(/[\u3400-\u9fff]/g)?.length ?? 0;
    const englishWords = input.match(/[A-Za-z]+(?:['-][A-Za-z]+)*/g)?.length ?? 0;
    return { characters, chinese, englishWords, lines: input ? input.split(/\r?\n/).length : 0, bytes: new TextEncoder().encode(input).length };
  }, [input]);

  return <div className="workspace-card"><WorkspaceHeader title="字数统计" description="看清文字、行数和字节数，适合写作与内容整理。" /><TextareaField label="输入文本" value={input} onChange={setInput} placeholder="粘贴或输入要统计的内容" rows={13} /><div className="metric-grid"><div><strong>{stats.characters}</strong><span>总字符</span></div><div><strong>{stats.chinese}</strong><span>中文字符</span></div><div><strong>{stats.englishWords}</strong><span>英文单词</span></div><div><strong>{stats.lines}</strong><span>行数</span></div><div><strong>{stats.bytes}</strong><span>UTF-8 字节</span></div></div><ToolNotice>统计过程在浏览器本地完成。</ToolNotice></div>;
}

function DedupeTool() {
  const [input, setInput] = useState("");
  const output = useMemo(() => {
    const seen = new Set<string>();
    return input.split(/\r?\n/).filter((line) => {
      const key = line.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(key) || input.length > 0;
    }).join("\n");
  }, [input]);
  const before = input ? input.split(/\r?\n/).length : 0;
  const after = output ? output.split(/\r?\n/).length : 0;

  return <div className="workspace-card"><WorkspaceHeader title="文本去重" description="按行去掉重复内容，保留第一次出现的顺序。" /><div className="workspace-grid"><TextareaField label="原始文本" value={input} onChange={setInput} placeholder="每行一条内容，例如关键词或名单" /><ResultBox label="去重结果" value={output} /></div><div className="workspace-actions"><span className="count-note">{before} 行 → {after} 行</span><CopyButton value={output} /><button type="button" className="soft-button" onClick={() => setInput("")}>清空</button></div><ToolNotice>会忽略每行首尾空格来判断重复，原始内容不上传。</ToolNotice></div>;
}

function TextCaseTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"upper" | "lower" | "title">("upper");
  const output = useMemo(() => {
    if (mode === "upper") return input.toUpperCase();
    if (mode === "lower") return input.toLowerCase();
    return input.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
  }, [input, mode]);

  return <div className="workspace-card"><WorkspaceHeader title="文本大小写转换" description="一键转换英文文本的大小写和标题格式。" /><div className="segmented-control" role="tablist" aria-label="大小写模式"><button type="button" className={mode === "upper" ? "selected" : ""} onClick={() => setMode("upper")}>全部大写</button><button type="button" className={mode === "lower" ? "selected" : ""} onClick={() => setMode("lower")}>全部小写</button><button type="button" className={mode === "title" ? "selected" : ""} onClick={() => setMode("title")}>首字母大写</button></div><div className="workspace-grid"><TextareaField label="输入文本" value={input} onChange={setInput} placeholder="输入英文标题或句子" /><ResultBox label="转换结果" value={output} /></div><ToolNotice>中文不会被改变，处理过程在浏览器本地完成。</ToolNotice></div>;
}

function PasswordTool() {
  const [length, setLength] = useState("16");
  const [options, setOptions] = useState({ lower: true, upper: true, numbers: true, symbols: true });
  const [password, setPassword] = useState("");

  function generate() {
    const groups = [options.lower ? "abcdefghijkmnopqrstuvwxyz" : "", options.upper ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "", options.numbers ? "23456789" : "", options.symbols ? "!@#$%^&*_-+=?" : ""].filter(Boolean);
    if (!groups.length) return;
    const total = Math.min(128, Math.max(4, Number(length) || 16));
    const random = new Uint32Array(total + groups.length);
    crypto.getRandomValues(random);
    const chars = groups.map((group, index) => group[random[index] % group.length]);
    const all = groups.join("");
    for (let index = groups.length; index < total; index += 1) chars.push(all[random[index] % all.length]);
    setPassword(chars.sort(() => 0.5 - (random[chars.length % random.length] / 2 ** 32)).join(""));
  }

  return <div className="workspace-card"><WorkspaceHeader title="密码生成器" description="生成随机密码，不上传、不保存生成结果。" /><div className="password-controls"><label className="tool-field short-field"><span>密码长度</span><input type="number" min="4" max="128" value={length} onChange={(event) => setLength(event.target.value)} /></label><div className="check-list">{([ ["lower", "小写字母"], ["upper", "大写字母"], ["numbers", "数字"], ["symbols", "符号"] ] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={options[key]} onChange={(event) => setOptions({ ...options, [key]: event.target.checked })} />{label}</label>)}</div></div><div className="password-output"><code>{password || "点击生成按钮"}</code>{password && <CopyButton value={password} />}</div><button type="button" className="primary-button" onClick={generate}><RefreshCw size={17} />生成新密码</button><ToolNotice tone="privacy">建议使用密码管理器保存密码，不要在公共设备上留下敏感信息。</ToolNotice></div>;
}

const unitGroups = {
  长度: { units: ["米", "千米", "厘米", "英尺", "英寸"], factors: { 米: 1, 千米: 1000, 厘米: 0.01, 英尺: 0.3048, 英寸: 0.0254 } },
  重量: { units: ["千克", "克", "磅", "盎司"], factors: { 千克: 1, 克: 0.001, 磅: 0.45359237, 盎司: 0.0283495 } },
  数据: { units: ["字节", "KB", "MB", "GB"], factors: { 字节: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 } },
  时间: { units: ["秒", "分钟", "小时", "天"], factors: { 秒: 1, 分钟: 60, 小时: 3600, 天: 86400 } },
} as const;

type UnitGroup = keyof typeof unitGroups;

function UnitTool() {
  const [group, setGroup] = useState<UnitGroup>("长度");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("米");
  const [to, setTo] = useState("千米");

  const units = unitGroups[group].units;
  const activeFrom = units.some((unit) => unit === from) ? from : units[0];
  const activeTo = units.some((unit) => unit === to) ? to : (units[1] ?? units[0]);
  const result = useMemo(() => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "请输入数字";
    const factors = unitGroups[group].factors as Record<string, number>;
    const converted = numeric * factors[activeFrom] / factors[activeTo];
    return Number(converted.toPrecision(12)).toLocaleString("zh-CN");
  }, [activeFrom, activeTo, group, value]);

  return <div className="workspace-card"><WorkspaceHeader title="单位换算" description="在长度、重量、数据大小和时间单位之间换算。" /><div className="unit-group-tabs">{(Object.keys(unitGroups) as UnitGroup[]).map((item) => <button type="button" className={item === group ? "active" : ""} key={item} onClick={() => setGroup(item)}>{item}</button>)}</div><div className="unit-converter"><label className="tool-field"><span>数值</span><input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" /></label><label className="tool-field"><span>从</span><select value={activeFrom} onChange={(event) => setFrom(event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label><span className="unit-arrow">→</span><label className="tool-field"><span>换算为</span><select value={activeTo} onChange={(event) => setTo(event.target.value)}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label></div><div className="big-result"><span>换算结果</span><strong>{result} {activeTo}</strong></div><ToolNotice>换算使用常见国际单位比例，结果仅供日常参考。</ToolNotice></div>;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取图片"));
    image.src = URL.createObjectURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function ImageCompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState("0.8");
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [working, setWorking] = useState(false);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setResult(null);
  }

  async function compress() {
    if (!file) return;
    setWorking(true);
    try {
      const image = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", Number(quality)));
      if (blob) setResult({ url: URL.createObjectURL(blob), size: blob.size });
    } finally {
      setWorking(false);
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片压缩" description="调整 JPEG 压缩质量，在浏览器本地减小图片体积。" /><label className="upload-drop"><ImagePlus size={28} /><strong>{file ? file.name : "选择一张图片"}</strong><span>{file ? `${formatBytes(file.size)} · 处理前不会上传` : "支持 JPG、PNG、WEBP 等常见图片"}</span><input type="file" accept="image/*" onChange={selectFile} /></label><div className="range-row"><label htmlFor="quality">压缩质量 <strong>{Math.round(Number(quality) * 100)}%</strong></label><input id="quality" type="range" min="0.2" max="1" step="0.05" value={quality} onChange={(event) => setQuality(event.target.value)} /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={compress} disabled={!file || working}>{working ? "处理中…" : "开始压缩"}</button>{result && <a className="soft-button" href={result.url} download={`${file?.name.replace(/\.[^.]+$/, "") || "compressed"}.jpg`}><Download size={16} />下载 {formatBytes(result.size)}</a>}</div>{result && file && <p className="success-line"><Check size={16} />已从 {formatBytes(file.size)} 压缩到 {formatBytes(result.size)}</p>}<ToolNotice tone="privacy">图片在当前浏览器本地处理，页面关闭后不会保留上传内容。</ToolNotice></div>;
}

function ImageResizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [result, setResult] = useState<string | null>(null);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    const url = URL.createObjectURL(selected);
    const image = new Image();
    image.onload = () => { setDimensions({ width: image.naturalWidth, height: image.naturalHeight }); setWidth(String(image.naturalWidth)); setHeight(String(image.naturalHeight)); URL.revokeObjectURL(url); };
    image.src = url;
  }

  function updateWidth(value: string) {
    setWidth(value);
    if (keepRatio && dimensions.width) setHeight(String(Math.round(Number(value) * dimensions.height / dimensions.width)));
  }

  function updateHeight(value: string) {
    setHeight(value);
    if (keepRatio && dimensions.height) setWidth(String(Math.round(Number(value) * dimensions.width / dimensions.height)));
  }

  async function resize() {
    if (!file || !Number(width) || !Number(height)) return;
    const image = await loadImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = Number(width);
    canvas.height = Number(height);
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92));
    if (blob) setResult(URL.createObjectURL(blob));
  }

  return <div className="workspace-card"><WorkspaceHeader title="图片尺寸修改" description="按像素调整图片宽高，适合头像、封面和上传前处理。" /><label className="upload-drop"><FileImage size={28} /><strong>{file ? file.name : "选择一张图片"}</strong><span>{dimensions.width ? `${dimensions.width} × ${dimensions.height} px` : "图片会在浏览器本地读取"}</span><input type="file" accept="image/*" onChange={selectFile} /></label><div className="resize-fields"><label className="tool-field"><span>宽度（px）</span><input type="number" min="1" value={width} onChange={(event) => updateWidth(event.target.value)} /></label><span className="unit-arrow">×</span><label className="tool-field"><span>高度（px）</span><input type="number" min="1" value={height} onChange={(event) => updateHeight(event.target.value)} /></label><label className="check-inline"><input type="checkbox" checked={keepRatio} onChange={(event) => setKeepRatio(event.target.checked)} />锁定比例</label></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={resize} disabled={!file}>调整尺寸</button>{result && <a className="soft-button" href={result} download={`${file?.name.replace(/\.[^.]+$/, "") || "resized"}.jpg`}><Download size={16} />下载图片</a>}</div><ToolNotice tone="privacy">图片只在当前浏览器中处理，不会上传到服务器。</ToolNotice></div>;
}

export function ToolRenderer({ tool }: { tool: ToolRecord }) {
  switch (tool.slug) {
    case "json-format": return <JsonTool minify={false} />;
    case "json-minify": return <JsonTool minify />;
    case "base64-codec": return <Base64Tool />;
    case "url-codec": return <UrlCodecTool />;
    case "timestamp-converter": return <TimestampTool />;
    case "uuid-generator": return <UuidTool />;
    case "hash-generator": return <HashTool />;
    case "qr-generator": return <QrTool />;
    case "word-count": return <WordCountTool />;
    case "text-dedupe": return <DedupeTool />;
    case "text-case": return <TextCaseTool />;
    case "password-generator": return <PasswordTool />;
    case "unit-converter": return <UnitTool />;
    case "image-compress": return <ImageCompressTool />;
    case "image-resize": return <ImageResizeTool />;
    default: return null;
  }
}
