"use client";

import { Check, FileJson, ShieldCheck, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { ToolRecord } from "@/data/tools";
import { csvToJson, decodeJwt, findRegexMatches, formatSubtitles, jsonToCsv, parseSubtitles, shiftSubtitles } from "@/lib/text";
import { CopyButton, ResultBox, TextDownloadButton, TextareaField, ToolNotice, WorkspaceHeader } from "./ToolPrimitives";

function JsonCsvTool({ direction }: { direction: "json-to-csv" | "csv-to-json" }) {
  const isJsonToCsv = direction === "json-to-csv";
  const [input, setInput] = useState(isJsonToCsv ? '[{"name":"张三","score":95},{"name":"李四","score":88}]' : "name,score\n张三,95\n李四,88");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function process() {
    try {
      setOutput(isJsonToCsv ? jsonToCsv(input) : JSON.stringify(csvToJson(input), null, 2));
      setError("");
    } catch (reason) {
      setOutput("");
      setError(reason instanceof Error ? reason.message : "转换失败，请检查输入内容。 ");
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title={isJsonToCsv ? "JSON 转 CSV" : "CSV 转 JSON"} description={isJsonToCsv ? "把对象数组转换成带表头的 CSV 文本。" : "读取带表头的 CSV，转换成 JSON 对象数组。"} /><div className="workspace-grid"><TextareaField label={isJsonToCsv ? "输入 JSON" : "输入 CSV"} value={input} onChange={setInput} placeholder={isJsonToCsv ? "[{\"name\":\"张三\"}]" : "name,score\n张三,95"} rows={11} /><ResultBox label={isJsonToCsv ? "CSV 结果" : "JSON 结果"} value={output} placeholder="转换结果会显示在这里" /></div><div className="workspace-actions"><button type="button" className="primary-button" onClick={process}><FileJson size={17} />开始转换</button>{output && <><CopyButton value={output} /><TextDownloadButton value={output} name={isJsonToCsv ? "converted.csv" : "converted.json"} /></>}</div>{error && <p className="field-error">{error}</p>}<ToolNotice tone="privacy">数据只在浏览器内转换；嵌套对象会以 JSON 文本写入 CSV 单元格。</ToolNotice></div>;
}

function RegexTool() {
  const [pattern, setPattern] = useState("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b");
  const [flags, setFlags] = useState("gi");
  const [input, setInput] = useState("联系邮箱：hello@example.com，备用邮箱 support@example.cn");
  const result = useMemo(() => {
    if (!pattern) return { matches: [], error: "" };
    try {
      return { matches: findRegexMatches(pattern, flags, input), error: "" };
    } catch (reason) {
      return { matches: [], error: reason instanceof Error ? `正则表达式有误：${reason.message}` : "正则表达式有误。" };
    }
  }, [flags, input, pattern]);

  return <div className="workspace-card"><WorkspaceHeader title="正则表达式测试" description="输入模式和示例文本，实时查看匹配结果与捕获组。" /><div className="regex-controls"><label className="tool-field"><span>正则表达式</span><input value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="例如：\\d+" spellCheck={false} /></label><label className="tool-field regex-flags"><span>Flags</span><input value={flags} onChange={(event) => setFlags(event.target.value.replace(/[^dgimsuvy]/g, ""))} maxLength={8} spellCheck={false} /></label></div><TextareaField label="示例文本" value={input} onChange={setInput} placeholder="输入需要测试的文本" rows={7} />{result.error ? <p className="field-error">{result.error}</p> : <div className="match-summary"><span className="match-summary-dot" />匹配到 <strong>{result.matches.length}</strong> 处{result.matches.length >= 1000 ? "（已显示前 1000 处）" : ""}</div>}{result.matches.length > 0 && <div className="match-list">{result.matches.map((match, index) => <div key={`${match.index}-${index}`}><span>#{index + 1}</span><code>{match.value || "空匹配"}</code><small>位置 {match.index}{match.groups.length ? ` · 捕获组 ${match.groups.join(" / ")}` : ""}</small></div>)}</div>}<ToolNotice>匹配过程使用浏览器原生 RegExp，不会上传测试文本。</ToolNotice></div>;
}

function JwtTool() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<{ header: string; payload: string; signature: string } | null>(null);
  const [error, setError] = useState("");

  function process() {
    try {
      const decoded = decodeJwt(token);
      setResult({ header: JSON.stringify(decoded.header, null, 2), payload: JSON.stringify(decoded.payload, null, 2), signature: decoded.signature });
      setError("");
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "JWT 解析失败，请检查输入。 ");
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title="JWT 解析" description="只在本地读取 JWT 的 header 和 payload，方便调试令牌内容。" /><TextareaField label="JWT Token" value={token} onChange={setToken} placeholder="粘贴由三个点分隔的 JWT" rows={6} /><div className="workspace-actions"><button type="button" className="primary-button" onClick={process}><ShieldCheck size={17} />解析 JWT</button></div>{error && <p className="field-error">{error}</p>}{result && <div className="token-result-grid"><ResultBox label="Header" value={result.header} /><ResultBox label="Payload" value={result.payload} /><div className="token-signature"><span>Signature（未验证）</span><code>{result.signature}</code><CopyButton value={result.signature} /></div></div>}<ToolNotice tone="warning">这里只做 Base64URL 解码，不验证签名、不判断令牌是否可信，也不会请求任何接口。</ToolNotice></div>;
}

type CronFrequency = "every-minute" | "hourly" | "daily" | "weekday" | "weekly" | "monthly";

function CronTool() {
  const [frequency, setFrequency] = useState<CronFrequency>("daily");
  const [minute, setMinute] = useState("0");
  const [hour, setHour] = useState("9");
  const [weekday, setWeekday] = useState("1");
  const [day, setDay] = useState("1");
  const result = useMemo(() => {
    const safeMinute = Math.min(59, Math.max(0, Number(minute) || 0));
    const safeHour = Math.min(23, Math.max(0, Number(hour) || 0));
    if (frequency === "every-minute") return { expression: "* * * * *", summary: "每分钟执行" };
    if (frequency === "hourly") return { expression: `${safeMinute} * * * *`, summary: `每小时第 ${safeMinute} 分钟执行` };
    if (frequency === "daily") return { expression: `${safeMinute} ${safeHour} * * *`, summary: `每天 ${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")} 执行` };
    if (frequency === "weekday") return { expression: `${safeMinute} ${safeHour} * * 1-5`, summary: `工作日 ${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")} 执行` };
    if (frequency === "weekly") return { expression: `${safeMinute} ${safeHour} * * ${weekday}`, summary: `每周${["日", "一", "二", "三", "四", "五", "六"][Number(weekday)]} ${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")} 执行` };
    const safeDay = Math.min(31, Math.max(1, Number(day) || 1));
    return { expression: `${safeMinute} ${safeHour} ${safeDay} * *`, summary: `每月 ${safeDay} 日 ${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")} 执行` };
  }, [day, frequency, hour, minute, weekday]);

  return <div className="workspace-card"><WorkspaceHeader title="Cron 表达式生成器" description="选择常见执行频率，生成可以直接复制的五段式 Cron。" /><div className="cron-builder"><label className="tool-field"><span>执行频率</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as CronFrequency)}><option value="every-minute">每分钟</option><option value="hourly">每小时</option><option value="daily">每天</option><option value="weekday">每个工作日</option><option value="weekly">每周</option><option value="monthly">每月</option></select></label>{frequency !== "every-minute" && <label className="tool-field"><span>分钟（0–59）</span><input type="number" min="0" max="59" value={minute} onChange={(event) => setMinute(event.target.value)} /></label>}{!["every-minute", "hourly"].includes(frequency) && <label className="tool-field"><span>小时（0–23）</span><input type="number" min="0" max="23" value={hour} onChange={(event) => setHour(event.target.value)} /></label>}{frequency === "weekly" && <label className="tool-field"><span>星期</span><select value={weekday} onChange={(event) => setWeekday(event.target.value)}>{["周日", "周一", "周二", "周三", "周四", "周五", "周六"].map((name, index) => <option value={index} key={name}>{name}</option>)}</select></label>}{frequency === "monthly" && <label className="tool-field"><span>每月第几日</span><input type="number" min="1" max="31" value={day} onChange={(event) => setDay(event.target.value)} /></label>}</div><div className="cron-preview"><span>生成结果</span><code>{result.expression}</code><strong>{result.summary}</strong><CopyButton value={result.expression} /></div><ToolNotice>表达式按常见 Linux Cron 语法生成；服务器时区和夏令时规则请以实际运行环境为准。</ToolNotice></div>;
}

const subtitleSample = "1\n00:00:01,000 --> 00:00:03,000\n你好，欢迎使用工具箱。\n\n2\n00:00:04,000 --> 00:00:06,000\n这是一段示例字幕。";

function SubtitleTool({ timing = false }: { timing?: boolean }) {
  const [input, setInput] = useState(subtitleSample);
  const [format, setFormat] = useState<"srt" | "vtt">(timing ? "srt" : "srt");
  const [offset, setOffset] = useState("0");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function process() {
    try {
      const cues = parseSubtitles(input);
      setOutput(formatSubtitles(timing ? shiftSubtitles(cues, Number(offset) || 0) : cues, timing ? format : "vtt"));
      setError("");
    } catch (reason) {
      setOutput("");
      setError(reason instanceof Error ? reason.message : "字幕处理失败，请检查时间轴。 ");
    }
  }

  return <div className="workspace-card"><WorkspaceHeader title={timing ? "字幕时间轴调整" : "SRT 转 VTT"} description={timing ? "整体平移字幕时间轴，修正提前或延后的同步偏差。" : "把带序号的 SRT 字幕转换成网页播放器常用的 VTT。"} /><div className="subtitle-settings">{timing ? <label className="tool-field"><span>偏移秒数</span><input type="number" step="0.1" value={offset} onChange={(event) => setOffset(event.target.value)} placeholder="正数延后，负数提前" /></label> : <div className="subtitle-format-note"><Check size={16} />输出为 WebVTT</div>}{timing && <label className="tool-field"><span>输出格式</span><select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="srt">SRT</option><option value="vtt">VTT</option></select></label>}</div><TextareaField label={timing ? "输入 SRT / VTT" : "输入 SRT"} value={input} onChange={setInput} placeholder={subtitleSample} rows={12} /><div className="workspace-actions"><button type="button" className="primary-button" onClick={process}><WandSparkles size={17} />{timing ? "调整时间轴" : "转换为 VTT"}</button>{output && <><CopyButton value={output} /><TextDownloadButton value={output} name={timing ? `subtitle-adjusted.${format}` : "converted.vtt"} /></>}</div>{error && <p className="field-error">{error}</p>}{output && <ResultBox label="处理结果" value={output} />}<ToolNotice tone="privacy">字幕文本只在当前浏览器处理；负数偏移会把时间轴提前，最早时间会限制为 00:00:00.000。</ToolNotice></div>;
}

export function DeveloperToolRenderer({ tool }: { tool: ToolRecord }) {
  switch (tool.slug) {
    case "json-to-csv": return <JsonCsvTool direction="json-to-csv" />;
    case "csv-to-json": return <JsonCsvTool direction="csv-to-json" />;
    case "regex-tester": return <RegexTool />;
    case "jwt-decoder": return <JwtTool />;
    case "cron-generator": return <CronTool />;
    case "srt-to-vtt": return <SubtitleTool />;
    case "subtitle-timing": return <SubtitleTool timing />;
    default: return null;
  }
}
