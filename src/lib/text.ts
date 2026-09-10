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

export type CreatorHashtagScene = "lifestyle" | "food" | "travel" | "study" | "work" | "beauty" | "home" | "other";

const creatorHashtagSceneTags: Record<CreatorHashtagScene, string[]> = {
  lifestyle: ["生活方式", "日常分享", "我的日常"],
  food: ["美食分享", "探店分享", "吃货日常"],
  travel: ["旅行攻略", "周末去哪儿", "旅行记录"],
  study: ["学习打卡", "学习方法", "自我提升"],
  work: ["职场经验", "效率工具", "工作方法"],
  beauty: ["变美日记", "护肤分享", "好物分享"],
  home: ["家居生活", "收纳整理", "生活好物"],
  other: ["经验分享", "实用技巧", "干货分享"],
};

const creatorHashtagRules: Array<{ keys: string[]; tags: string[] }> = [
  { keys: ["咖啡", "咖啡店", "咖啡馆", "拿铁"], tags: ["咖啡", "咖啡探店", "咖啡店推荐", "下午茶"] },
  { keys: ["旅行", "旅游", "出行", "景点", "民宿", "酒店"], tags: ["旅行", "旅行攻略", "周末旅行", "城市漫游"] },
  { keys: ["美食", "餐厅", "火锅", "甜品", "餐馆", "探店"], tags: ["美食", "美食探店", "本地美食", "吃什么"] },
  { keys: ["收纳", "租房", "家居", "装修", "房间"], tags: ["收纳整理", "租房日记", "家居好物", "居家生活"] },
  { keys: ["简历", "求职", "面试", "实习", "职场"], tags: ["求职经验", "简历优化", "面试经验", "职场成长"] },
  { keys: ["学习", "考试", "考研", "备考", "笔记"], tags: ["学习方法", "学习打卡", "备考经验", "知识分享"] },
  { keys: ["穿搭", "护肤", "化妆", "美妆", "发型"], tags: ["穿搭分享", "护肤记录", "变美日记", "好物分享"] },
  { keys: ["效率", "工具", "办公", "自动化", "软件"], tags: ["效率工具", "办公技巧", "生产力工具", "工作效率"] },
  { keys: ["小红书", "笔记", "种草", "内容"], tags: ["小红书运营", "内容创作", "笔记分享", "自媒体运营"] },
];

const creatorHashtagStopWords = new Set(["分享", "记录", "推荐", "体验", "攻略", "日常", "一些", "关于", "我的", "这个", "怎么", "如何"]);

function normalizeHashtag(value: string) {
  return value.replace(/^#+/, "").replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, "").trim().slice(0, 20);
}

export function generateCreatorHashtags(input: string, scene: CreatorHashtagScene = "other", count = 10) {
  const cleanInput = input.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
  if (!cleanInput) return [];

  const tags: string[] = [];
  const seen = new Set<string>();
  const addTag = (value: string) => {
    const normalized = normalizeHashtag(value);
    if (normalized.length < 2 || creatorHashtagStopWords.has(normalized)) return;
    const tag = `#${normalized}`;
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  };

  const topic = normalizeHashtag(cleanInput.split(/[，。,、；;：:!?！？|]/)[0]);
  addTag(topic);

  for (const rule of creatorHashtagRules) {
    if (rule.keys.some((key) => cleanInput.includes(key))) rule.tags.forEach(addTag);
  }
  (creatorHashtagSceneTags[scene] ?? creatorHashtagSceneTags.other).forEach(addTag);
  ["内容分享", "经验记录", "实用干货"].forEach(addTag);

  const safeCount = Math.min(12, Math.max(5, Math.round(count)));
  return tags.slice(0, safeCount);
}

export type PromptTone = "natural" | "professional" | "concise";
export type PromptFormat = "structured" | "steps" | "table" | "direct";

export type PromptDraft = {
  goal: string;
  audience: string;
  context: string;
  requirements: string;
  tone: PromptTone;
  format: PromptFormat;
};

const promptToneLabels: Record<PromptTone, string> = {
  natural: "自然、清晰、容易理解",
  professional: "专业、严谨、定义清楚",
  concise: "简洁、直接、减少铺垫",
};

const promptFormatLabels: Record<PromptFormat, string> = {
  structured: "先给结论，再按层级展开要点",
  steps: "按执行顺序输出编号步骤，并标注注意事项",
  table: "用表格呈现维度、差异和建议",
  direct: "先直接回答，再补充必要解释",
};

function cleanPromptValue(value: string, limit: number) {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

export function buildPrompt(draft: PromptDraft) {
  const goal = cleanPromptValue(draft.goal, 300);
  if (!goal) return "";

  const audience = cleanPromptValue(draft.audience, 120);
  const context = cleanPromptValue(draft.context, 500);
  const requirements = cleanPromptValue(draft.requirements, 500);
  return [
    "请帮我完成下面的任务。",
    `任务目标：${goal}`,
    audience ? `目标读者：${audience}` : "",
    context ? `已有背景：${context}` : "",
    requirements ? `补充要求：${requirements}` : "",
    `表达语气：${promptToneLabels[draft.tone]}`,
    `输出方式：${promptFormatLabels[draft.format]}`,
    "请区分已知事实与推测；信息不足时先说明假设，不要编造数据或来源。",
  ].filter(Boolean).join("\n");
}
