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

export type CreatorTitleAnalysis = {
  title: string;
  characterCount: number;
  contentCharacterCount: number;
  digitCount: number;
  punctuationCount: number;
  emojiCount: number;
  hasQuestionHook: boolean;
  hasListSignal: boolean;
  hasSceneSignal: boolean;
  hasBenefitSignal: boolean;
  structureScore: number;
  suggestions: string[];
};

export function analyzeCreatorTitle(input: string): CreatorTitleAnalysis {
  const title = input.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const characters = Array.from(title);
  const contentCharacters = characters.filter((character) => /[\p{L}\p{N}\u4e00-\u9fff]/u.test(character));
  const digitCount = (title.match(/\d/g) ?? []).length;
  const punctuationCount = (title.match(/[，。！？!?、：:；;,.·…]/g) ?? []).length;
  const emojiCount = characters.filter((character) => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(character)).length;
  const hasQuestionHook = /[?？]|为什么|怎么|如何|值得|吗/.test(title);
  const hasListSignal = /\d+|[一二三四五六七八九十]+[个项步条种]|清单|合集|盘点|避坑/.test(title);
  const hasSceneSignal = /周末|通勤|上班|租房|学生|新手|宝妈|职场|旅行|家里|宿舍|小个子|油皮|敏感肌|本地/.test(title);
  const hasBenefitSignal = /攻略|方法|技巧|推荐|清单|测评|避坑|教程|对比|怎么选|入门|提升|省钱|好用|安排/.test(title);

  if (!title) {
    return {
      title,
      characterCount: 0,
      contentCharacterCount: 0,
      digitCount: 0,
      punctuationCount: 0,
      emojiCount: 0,
      hasQuestionHook: false,
      hasListSignal: false,
      hasSceneSignal: false,
      hasBenefitSignal: false,
      structureScore: 0,
      suggestions: ["请输入一条标题，分析结果会在当前浏览器中生成。"],
    };
  }

  let structureScore = contentCharacters.length >= 12 && contentCharacters.length <= 28 ? 30 : contentCharacters.length >= 8 && contentCharacters.length <= 36 ? 22 : 12;
  if (hasSceneSignal) structureScore += 20;
  if (hasBenefitSignal) structureScore += 25;
  if (hasQuestionHook || hasListSignal) structureScore += 15;
  if (digitCount > 0) structureScore += 5;
  structureScore += punctuationCount <= 2 ? 5 : punctuationCount <= 4 ? 2 : 0;

  const suggestions: string[] = [];
  if (contentCharacters.length < 8) suggestions.push("信息偏少，可以补充对象、场景或结果，让读者更快判断是否相关。");
  if (contentCharacters.length > 30) suggestions.push("标题偏长，可以删去重复修饰词，把核心主题放在前面。");
  if (!hasSceneSignal) suggestions.push("可以加入具体场景、人群或使用时机，例如通勤、租房、周末或新手。");
  if (!hasBenefitSignal) suggestions.push("可以补充内容收益或形式，例如攻略、清单、测评、方法或避坑。");
  if (punctuationCount > 2) suggestions.push("标点较多，建议保留一个主要停顿，减少视觉负担。");
  if (!suggestions.length) suggestions.push("结构信号较完整，发布前请核对标题承诺与正文是否一致。");

  return {
    title,
    characterCount: characters.length,
    contentCharacterCount: contentCharacters.length,
    digitCount,
    punctuationCount,
    emojiCount,
    hasQuestionHook,
    hasListSignal,
    hasSceneSignal,
    hasBenefitSignal,
    structureScore: Math.min(100, structureScore),
    suggestions,
  };
}

export type ShortVideoTitleScene = "story" | "guide" | "review" | "list";
export type ShortVideoTitleTone = "direct" | "curious" | "natural";
export type ShortVideoTitleDraft = { title: string; hook: string };

const shortVideoTitleTemplates: Record<ShortVideoTitleScene, Record<ShortVideoTitleTone, string[]>> = {
  story: {
    direct: ["{topic}：把真实过程讲清楚", "做完{topic}后，我整理了这份复盘", "关于{topic}，先说结论再看过程"],
    curious: ["你也在经历{topic}吗？先看我的记录", "{topic}最容易卡在哪？我把过程拍下来了", "如果重新做一次{topic}，我会先改哪里？"],
    natural: ["记录一下我的{topic}，几个细节想分享", "关于{topic}，这次过程比想象中更有收获", "把{topic}拍下来，留一份真实记录"],
  },
  guide: {
    direct: ["{topic}怎么做？按这几步开始", "想做{topic}，先把这几个环节理顺", "{topic}入门：从准备到完成的流程"],
    curious: ["第一次做{topic}，你会先从哪一步开始？", "{topic}为什么总是做不顺？先看这几个环节", "如果从零开始{topic}，哪些步骤不能省？"],
    natural: ["把{topic}的步骤整理成一条视频", "想做{topic}的话，可以先看看这份流程", "关于{topic}，分享一套不绕路的做法"],
  },
  review: {
    direct: ["{topic}使用记录：优点和限制都说清楚", "体验{topic}之后，我会这样做选择", "{topic}到底适不适合你？看完再决定"],
    curious: ["{topic}值得试吗？先看真实使用场景", "面对不同的{topic}，你会怎么选？", "{topic}好不好用，关键要看哪几个细节？"],
    natural: ["用了几次{topic}，说说我的真实感受", "关于{topic}，把优点和不足都记录下来", "分享一下我对{topic}的使用观察"],
  },
  list: {
    direct: ["{topic}清单：按使用场景整理好了", "需要{topic}时，我会优先看这几项", "一条视频看懂{topic}的几个选择"],
    curious: ["正在找{topic}？这几项可以先收藏", "你的{topic}清单里，有没有漏掉这一项？", "关于{topic}，你最想先看哪一个？"],
    natural: ["整理一份{topic}清单，慢慢补充", "最近收集的{topic}，按顺序分享给你", "关于{topic}，这些小发现值得记下来"],
  },
};

const shortVideoHookTemplates: Record<ShortVideoTitleScene, string[]> = {
  story: ["先说一个最容易忽略的细节，再用具体画面还原过程。", "从一个真实片段开始，再补充我最后得到的结论。", "把前后变化放在开头，让观众知道这条视频要解决什么。"],
  guide: ["先展示完成后的效果，再按顺序拆解每一步。", "先说适用场景，再从准备、执行和检查三个环节讲起。", "把最容易出错的步骤提前，帮助观众少走一次弯路。"],
  review: ["先交代使用场景，再分别说优点、限制和适合人群。", "从一次具体使用开始，不只讲结论，也说明判断过程。", "把最影响选择的一个细节放在前面，再补充其他观察。"],
  list: ["先亮出这次要分享的清单，再逐项补充使用场景。", "先说筛选标准，再按顺序展示每一项的特点。", "从最值得收藏的一项开始，最后补充其他选择。"],
};

export function generateShortVideoTitles(topic: string, scene: ShortVideoTitleScene = "story", tone: ShortVideoTitleTone = "natural"): ShortVideoTitleDraft[] {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!cleanTopic) return [];

  const templates = shortVideoTitleTemplates[scene][tone];
  const hooks = shortVideoHookTemplates[scene];
  return templates.map((template, index) => ({
    title: template.replace("{topic}", cleanTopic),
    hook: hooks[index % hooks.length],
  }));
}

export type DouyinScriptScene = "guide" | "review" | "story" | "list";
export type DouyinScriptTone = "natural" | "direct" | "warm";
export type DouyinScriptDuration = "30" | "60" | "90";
export type DouyinScriptSection = { label: string; narration: string; visual: string };
export type DouyinScriptDraft = { paceNote: string; sections: DouyinScriptSection[]; checklist: string[] };

const douyinScriptTemplates: Record<DouyinScriptScene, { hook: string; context: string; body: string; close: string; visual: string[] }> = {
  guide: {
    hook: "如果你正在做{topic}，先把这一步做对。",
    context: "这条视频把{topic}拆成准备、执行和检查三个环节。",
    body: "先从最容易忽略的准备开始，再演示实际操作，最后补充一个常见误区。",
    close: "如果你准备开始{topic}，可以先保存这套顺序，再按自己的情况调整。",
    visual: ["先展示完成后的效果或关键动作。", "用一个近景和简短字幕交代使用场景。", "按准备、执行、检查顺序切三个画面。", "回到结果画面，停留一秒方便记忆。"],
  },
  review: {
    hook: "最近我把{topic}完整体验了一遍，先说结论：适不适合要看使用场景。",
    context: "这次只从实际使用、优点和限制三个角度讲，不用夸张结论代替体验。",
    body: "先展示一次具体使用，再分别说一个真实优点和一个需要留意的限制。",
    close: "如果你也在考虑{topic}，可以把自己的场景和预算列出来，再决定是否尝试。",
    visual: ["用真实使用画面直接进入主题。", "展示一个最能代表体验的细节。", "优点和限制各用一个对比画面说明。", "最后给出适用人群或下一步选择。"],
  },
  story: {
    hook: "我原本以为{topic}很简单，真正做过一遍才发现这个细节。",
    context: "先还原当时的场景，再说我遇到的问题和后来怎么调整。",
    body: "按照开始、转折和结果三个节点讲清楚过程，让观众知道变化是怎么发生的。",
    close: "这就是我这次做{topic}留下的记录，希望能给正在尝试的人一个参考。",
    visual: ["从一个有变化的画面或动作开始。", "补充人物、时间和场景信息。", "用前后画面对照问题与调整。", "用自然的结果画面收尾。"],
  },
  list: {
    hook: "今天分享{topic}时，我只保留这几项真正用得上的内容。",
    context: "先说筛选标准，再按顺序展示每一项的特点和使用场景。",
    body: "每一项只讲一个核心理由，最后把最适合不同人群的选择放在一起比较。",
    close: "如果你正在找{topic}，可以先收藏这份清单，再按自己的需求筛选。",
    visual: ["先亮出清单主题和数量。", "每一项用统一构图展示，方便比较。", "给每项一个关键词或适用场景。", "用清单总览和筛选标准收尾。"],
  },
};

const douyinScriptToneLeads: Record<DouyinScriptTone, string> = {
  natural: "我先把重点说清楚：",
  direct: "先说结论：",
  warm: "如果你也在关注这个主题，",
};

const douyinScriptPaceNotes: Record<DouyinScriptDuration, string> = {
  "30": "30 秒节奏：开头 3 秒交代主题，主体只保留一个最关键的动作或结论。",
  "60": "60 秒节奏：开头快速说明主题，中段保留 2～3 个画面，结尾留出核对和收束时间。",
  "90": "90 秒节奏：可以补充一个真实案例或对比，但每段仍只讲一个重点，避免信息堆叠。",
};

export function generateDouyinScript(topic: string, scene: DouyinScriptScene = "guide", tone: DouyinScriptTone = "natural", duration: DouyinScriptDuration = "60"): DouyinScriptDraft | null {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!cleanTopic) return null;

  const template = douyinScriptTemplates[scene];
  const replaceTopic = (value: string) => value.replaceAll("{topic}", cleanTopic);
  const lead = douyinScriptToneLeads[tone];
  const sections: DouyinScriptSection[] = [
    { label: "开场 0～3 秒", narration: replaceTopic(template.hook), visual: template.visual[0] },
    { label: "场景交代", narration: `${lead}${replaceTopic(template.context)}`, visual: template.visual[1] },
    { label: "主体展开", narration: replaceTopic(template.body), visual: template.visual[2] },
    { label: "收尾动作", narration: replaceTopic(template.close), visual: template.visual[3] },
  ];
  return {
    paceNote: douyinScriptPaceNotes[duration],
    sections,
    checklist: ["把示例中的场景、数字和结果换成真实内容。", "删掉视频无法证明的绝对化或夸大承诺。", "开头先让观众知道主题，主体每段只保留一个重点。"],
  };
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
