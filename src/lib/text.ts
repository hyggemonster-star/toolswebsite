export type CsvTable = {
  headers: string[];
  rows: string[][];
};

function csvError(message: string): Error {
  return new Error(`CSV 解析失败：${message}`);
}

export function parseCsv(input: string): CsvTable {
  const source = input.replace(/^\uFEFF/, "");
  if (!source.trim()) throw csvError("请输入带表头的 CSV 内容。 ");

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (inQuotes) throw csvError("引号没有闭合。 ");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const cleanedRows = rows.filter((current) => current.some((value) => value.trim() !== ""));
  if (!cleanedRows.length) throw csvError("没有找到有效数据。 ");
  const headers = cleanedRows[0].map((header, index) => header.trim() || `column${index + 1}`);
  if (new Set(headers).size !== headers.length) throw csvError("表头不能重复。 ");
  return { headers, rows: cleanedRows.slice(1) };
}

export function csvToJson(input: string) {
  const { headers, rows } = parseCsv(input);
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function escapeCsv(value: unknown) {
  const text = typeof value === "string" ? value : value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function jsonToCsv(input: string) {
  const parsed: unknown = JSON.parse(input);
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
    throw new Error("JSON 转 CSV 需要一个非空的对象数组，例如 [{\"name\":\"张三\"}]。 ");
  }
  const headers = Array.from(new Set(parsed.flatMap((item) => Object.keys(item as Record<string, unknown>))));
  if (!headers.length) throw new Error("对象数组没有可导出的字段。 ");
  const rows = parsed.map((item) => headers.map((header) => escapeCsv((item as Record<string, unknown>)[header])).join(","));
  return [headers.map(escapeCsv).join(","), ...rows].join("\n");
}

export type RegexMatch = {
  value: string;
  index: number;
  groups: string[];
};

export function findRegexMatches(pattern: string, flags: string, input: string): RegexMatch[] {
  const normalizedFlags = flags.replace(/g/g, "");
  const scanner = new RegExp(pattern, `${normalizedFlags}g`);
  const matches: RegexMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = scanner.exec(input)) !== null) {
    matches.push({ value: match[0], index: match.index, groups: match.slice(1).map((item) => item ?? "") });
    if (match[0] === "") scanner.lastIndex += 1;
    if (matches.length >= 1000) break;
  }
  return matches;
}

function decodeBase64UrlSegment(segment: string) {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
  const binary = atob(normalized);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

export function decodeJwt(token: string) {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("JWT 应该由 header、payload、signature 三段组成。 ");
  let header: unknown;
  let payload: unknown;
  try {
    header = JSON.parse(decodeBase64UrlSegment(parts[0]));
    payload = JSON.parse(decodeBase64UrlSegment(parts[1]));
  } catch {
    throw new Error("JWT 的 header 或 payload 不是有效的 Base64URL JSON。 ");
  }
  return { header, payload, signature: parts[2] };
}

export type SubtitleCue = {
  start: number;
  end: number;
  text: string;
};

function parseSubtitleTime(value: string) {
  const match = value.trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) throw new Error(`无法识别字幕时间：${value}`);
  return ((Number(match[1]) * 60 * 60 + Number(match[2]) * 60 + Number(match[3])) * 1000) + Number(match[4]);
}

function formatSubtitleTime(milliseconds: number, separator: "," | ".") {
  const value = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(value / 3_600_000);
  const minutes = Math.floor((value % 3_600_000) / 60_000);
  const seconds = Math.floor((value % 60_000) / 1000);
  const millis = value % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${separator}${String(millis).padStart(3, "0")}`;
}

export function parseSubtitles(input: string): SubtitleCue[] {
  const blocks = input.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const cues: SubtitleCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timeIndex = lines.findIndex((line) => line.includes("-->") && /\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(line));
    if (timeIndex < 0) {
      if (block.toUpperCase() === "WEBVTT" || block.startsWith("WEBVTT")) continue;
      continue;
    }
    const [startText, endText] = lines[timeIndex].split("-->").map((item) => item.trim().split(/\s+/)[0]);
    const text = lines.slice(timeIndex + 1).join("\n").trim();
    if (!text) continue;
    const start = parseSubtitleTime(startText);
    const end = parseSubtitleTime(endText);
    if (end < start) throw new Error("字幕结束时间不能早于开始时间。 ");
    cues.push({ start, end, text });
  }
  if (!cues.length) throw new Error("没有找到有效字幕片段，请检查时间轴格式。 ");
  return cues;
}

export function formatSubtitles(cues: SubtitleCue[], format: "srt" | "vtt") {
  const separator = format === "srt" ? "," : ".";
  const blocks = cues.map((cue, index) => `${format === "srt" ? `${index + 1}\n` : ""}${formatSubtitleTime(cue.start, separator)} --> ${formatSubtitleTime(cue.end, separator)}\n${cue.text}`);
  return `${format === "vtt" ? "WEBVTT\n\n" : ""}${blocks.join("\n\n")}\n`;
}

export function shiftSubtitles(cues: SubtitleCue[], offsetSeconds: number) {
  const offset = Math.round(offsetSeconds * 1000);
  return cues.map((cue) => {
    const start = Math.max(0, cue.start + offset);
    const end = Math.max(start, cue.end + offset);
    return { ...cue, start, end };
  });
}

export type NoteSpacing = "standard" | "airy";

export function formatCreatorNote(input: string, spacing: NoteSpacing = "standard") {
  const lines = input
    .replace(/\r/g, "")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, "").trim());
  const gap = spacing === "airy" ? ["", ""] : [""];
  const output: string[] = [];
  let blankLines = 0;

  for (const line of lines) {
    if (!line) {
      blankLines += 1;
      continue;
    }

    if (output.length && blankLines) output.push(...gap);
    blankLines = 0;
    output.push(line.replace(/^(?:[-*•])\s+/, "• "));
  }

  return output.join("\n").trim();
}

const creatorRiskTerms = ["全网最低", "官方推荐", "百分百", "最有效", "国家级", "零风险", "稳赚", "根治", "药效", "治疗", "绝对", "第一"];

export type RiskWordMatch = {
  term: string;
  index: number;
  context: string;
};

export function findCreatorRiskWords(input: string, customTerms = "") {
  const extraTerms = customTerms.split(/[，,、\n]/).map((term) => term.trim()).filter((term) => term && term.length <= 30);
  const terms = Array.from(new Set([...creatorRiskTerms, ...extraTerms])).sort((a, b) => b.length - a.length);
  const source = input.toLocaleLowerCase();
  const matches: RiskWordMatch[] = [];

  for (const term of terms) {
    const needle = term.toLocaleLowerCase();
    let fromIndex = 0;
    while (fromIndex < source.length) {
      const index = source.indexOf(needle, fromIndex);
      if (index < 0) break;
      const start = Math.max(0, index - 12);
      const end = Math.min(input.length, index + term.length + 12);
      matches.push({ term, index, context: `${start > 0 ? "…" : ""}${input.slice(start, end)}${end < input.length ? "…" : ""}` });
      fromIndex = index + Math.max(1, needle.length);
      if (matches.length >= 200) break;
    }
    if (matches.length >= 200) break;
  }

  return matches.sort((a, b) => a.index - b.index || b.term.length - a.term.length);
}

export type CreatorTitleScene = "experience" | "guide" | "review" | "list";
export type CreatorTitleTone = "natural" | "practical" | "curious";

const creatorTitleTemplates: Record<CreatorTitleScene, Record<CreatorTitleTone, string[]>> = {
  experience: {
    natural: ["{topic}真实体验：几个细节想和你分享", "第一次试{topic}，我的感受是这样", "关于{topic}，这次体验我记下了这些"],
    practical: ["{topic}体验复盘：先看这 3 个细节", "用完{topic}之后，我会这样做选择", "{topic}值不值得试？把实际感受说清楚"],
    curious: ["有人也在关注{topic}吗？先分享我的体验", "{topic}到底适合谁？我的体验给你参考", "第一次接触{topic}，你最想知道什么？"],
  },
  guide: {
    natural: ["{topic}怎么开始？把我的步骤整理好了", "想做{topic}，可以先从这几步开始", "关于{topic}，一份不绕路的小笔记"],
    practical: ["{topic}入门清单：按这 5 步慢慢做", "做{topic}前，建议先准备好这几件事", "{topic}实用攻略：流程、细节和避坑点"],
    curious: ["新手做{topic}，最容易卡在哪一步？", "如果从零开始{topic}，你会先做什么？", "{topic}怎么做更顺？我把过程拆开了"],
  },
  review: {
    natural: ["{topic}使用记录：优点和不足都写下来", "用了几次{topic}，说说我的真实观察", "{topic}对比体验：我最后留下了这些感受"],
    practical: ["{topic}怎么选？从这 4 个维度看更清楚", "{topic}测评笔记：适合人群和使用成本", "选择{topic}前，先把这几个问题想明白"],
    curious: ["{topic}真的适合你吗？不妨先看这份记录", "面对{topic}的不同选择，我会怎么判断？", "{topic}怎么挑不容易后悔？分享我的思路"],
  },
  list: {
    natural: ["我的{topic}清单：最近常用的几项", "整理了一份{topic}收藏夹，慢慢补充", "关于{topic}，这些小发现值得记下来"],
    practical: ["{topic}清单整理：按使用场景分好了", "需要{topic}时，我会优先看这几项", "{topic}推荐思路：先按需求筛选"],
    curious: ["你的{topic}清单里，有没有漏掉这一项？", "正在找{topic}？可以先从这份清单看起", "关于{topic}，你还想补充哪些好用选项？"],
  },
};

export function generateCreatorTitles(topic: string, scene: CreatorTitleScene = "experience", tone: CreatorTitleTone = "natural") {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!cleanTopic) return [];

  return Array.from(new Set(creatorTitleTemplates[scene][tone].map((template) => template.replace("{topic}", cleanTopic))));
}
