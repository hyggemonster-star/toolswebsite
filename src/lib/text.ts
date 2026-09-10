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

export type WechatTitleScene = "experience" | "guide" | "insight" | "list";
export type WechatTitleTone = "clear" | "warm" | "curious";

const wechatTitleTemplates: Record<WechatTitleScene, Record<WechatTitleTone, string[]>> = {
  experience: {
    clear: ["{topic}复盘：我把这几个关键细节记下来了", "做完{topic}之后，最值得保留的是这几步", "关于{topic}，一次真实实践带来的提醒"],
    warm: ["把这次{topic}写下来，也给正在尝试的人一个参考", "关于{topic}，分享一些不那么容易被看见的细节", "做过一遍{topic}后，我想把这些感受留给你"],
    curious: ["第一次做{topic}，哪些问题值得提前想清楚？", "关于{topic}，真正开始之后才发现了什么？", "如果再做一次{topic}，我会先调整哪一步？"],
  },
  guide: {
    clear: ["{topic}怎么做？一份可以照着检查的步骤", "从准备到完成，把{topic}的流程讲清楚", "想做好{topic}，先把这几个基础环节理顺"],
    warm: ["给正在开始{topic}的人：先从这几步慢慢做", "把{topic}整理成一份不绕路的小指南", "如果你也在做{topic}，这份经验或许能帮上忙"],
    curious: ["新手做{topic}，最容易忽略哪几个环节？", "为什么{topic}总是做不顺？可以先检查这些地方", "从零开始{topic}，哪些步骤真的不能省？"],
  },
  insight: {
    clear: ["关于{topic}，先把事实、判断和行动分开", "{topic}背后：几个容易被忽略的判断点", "看懂{topic}，可以先从这几个问题开始"],
    warm: ["慢慢聊聊{topic}：一些实践之后才有的想法", "关于{topic}，我更愿意把复杂的地方讲简单", "写给正在关注{topic}的你：先别急着下结论"],
    curious: ["我们真正需要关注的，是{topic}的哪一面？", "关于{topic}，哪些常见说法值得重新想一遍？", "如果换一个角度看{topic}，你会得到什么结论？"],
  },
  list: {
    clear: ["{topic}清单：按使用场景整理好这几项", "关于{topic}，我建议先收藏这份清单", "需要{topic}时，可以优先检查这几个选择"],
    warm: ["整理一份{topic}清单，留给以后慢慢用", "把近期和{topic}有关的实用内容放在一起", "关于{topic}，这些小发现值得记下来"],
    curious: ["你的{topic}清单里，有没有漏掉这一项？", "正在找{topic}？先从这几个方向看起来", "关于{topic}，你最想先解决哪一个问题？"],
  },
};

export function generateWechatTitles(topic: string, scene: WechatTitleScene = "experience", tone: WechatTitleTone = "clear") {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!cleanTopic) return [];

  return Array.from(new Set(wechatTitleTemplates[scene][tone].map((template) => template.replaceAll("{topic}", cleanTopic))));
}

export type MomentsCopyScene = "daily" | "work" | "recommendation" | "celebration";
export type MomentsCopyTone = "natural" | "warm" | "playful";

const momentsCopyTemplates: Record<MomentsCopyScene, Record<MomentsCopyTone, string[]>> = {
  daily: {
    natural: ["今天想记录一下{topic}，把普通的一天也好好过完。", "关于{topic}，是最近生活里一个让我觉得舒服的小片段。", "把{topic}写进今天，留给以后回看的自己。"],
    warm: ["慢慢把{topic}过好，日子就有了值得记住的瞬间。", "最近因为{topic}，多了一点安稳和小小的满足。", "想把关于{topic}的这份开心分享给你。"],
    playful: ["今日份{topic}打卡，先把快乐存档。", "本来只是想试试{topic}，结果悄悄被治愈了。", "{topic}出现，今天的心情自动加一分。"],
  },
  work: {
    natural: ["记录一下今天的{topic}，一件件做完，心里就踏实了。", "关于{topic}，先把进度和感受留个档。", "忙碌的一天里，{topic}是今天值得记下的一小步。"],
    warm: ["感谢今天认真完成{topic}的自己，慢一点也没关系。", "关于{topic}，把做过的事记下来，也把努力看见。", "今天的{topic}告一段落，给自己留一点肯定。"],
    playful: ["{topic}完成，今天也算顺利收工。", "和{topic}斗智斗勇的一天，先给自己点个赞。", "今日任务：把{topic}做完，然后准时下线。"],
  },
  recommendation: {
    natural: ["最近在留意{topic}，先记下几个真实感受，之后再慢慢更新。", "关于{topic}，目前觉得适合从自己的需求出发试试看。", "把{topic}放进最近的使用清单，体验之后再来分享。"],
    warm: ["如果你也正在了解{topic}，希望这点体验能给你一个参考。", "很喜欢{topic}带来的这点方便，分享给同样有需要的人。", "关于{topic}，不急着下结论，先把适合自己的地方说清楚。"],
    playful: ["{topic}体验中，先把这份新鲜感分享出来。", "最近发现{topic}，先记下这次小小的尝试。", "和{topic}的第一次见面，先来报个到。"],
  },
  celebration: {
    natural: ["今天想把{topic}分享给大家，愿每份小期待都有回应。", "关于{topic}，简单记录一个值得庆祝的时刻。", "借{topic}留下一句问候，也祝大家今天顺心。"],
    warm: ["愿我们都能在{topic}里收获一点轻松和好心情。", "把{topic}的祝福送给你，愿接下来的日子平安顺利。", "因为{topic}，今天多了一份想和你分享的温柔。"],
    playful: ["{topic}已上线，今天的快乐记得签收。", "今日份{topic}，准备好接住好心情了吗？", "{topic}来啦，先把祝福和快乐一起发出去。"],
  },
};

export function generateMomentsCopies(topic: string, scene: MomentsCopyScene = "daily", tone: MomentsCopyTone = "natural") {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!cleanTopic) return [];

  return Array.from(new Set(momentsCopyTemplates[scene][tone].map((template) => template.replaceAll("{topic}", cleanTopic))));
}

export type CommentReplyScene = "appreciation" | "question" | "sharing" | "clarification";
export type CommentReplyTone = "natural" | "warm" | "concise";

const commentReplyTemplates: Record<CommentReplyScene, Record<CommentReplyTone, string[]>> = {
  appreciation: {
    natural: ["谢谢你的认可！也很开心这次分享对你有一点帮助。", "感谢你看到这里，我会继续把真实体验记录清楚。", "谢谢你的反馈，之后有新的体验也会继续分享。"],
    warm: ["谢谢你认真看完并留下这句话，这份鼓励我收到啦。", "很感谢你的喜欢，愿这次分享也给你带来一点帮助。", "谢谢你的温柔反馈，我会继续认真记录和整理。"],
    concise: ["谢谢喜欢，收到你的反馈了。", "感谢认可，我会继续分享。", "谢谢你，看到这条评论很开心。"],
  },
  question: {
    natural: ["你提到的{comment}很值得展开，我再结合实际体验补充清楚。", "谢谢你的提问，关于{comment}，我会把过程和边界再整理得具体一些。", "这个问题记下了，我会根据真实情况补充一条更完整的说明。"],
    warm: ["谢谢你认真提问，关于{comment}，希望后续的补充能真正帮到你。", "这个问题很有代表性，我会慢慢把{comment}相关的细节说明白。", "感谢你的提醒，我也会把{comment}放进下一次整理里。"],
    concise: ["这个问题记下了，我再补充实际情况。", "收到提问，后面把这部分说得更清楚。", "谢谢提醒，我会继续补充这个细节。"],
  },
  sharing: {
    natural: ["你补充的{comment}很有参考价值，感谢把自己的经验也分享出来。", "这个角度很有意思，我先记下了，也欢迎继续交流。", "谢谢补充，大家的不同体验放在一起会更完整。"],
    warm: ["谢谢你分享{comment}，每个人的实际体验都值得被认真听见。", "这个补充很珍贵，也希望更多人能在交流里找到适合自己的方法。", "感谢你的经验，让这次讨论多了一个具体而真实的角度。"],
    concise: ["谢谢补充，这个角度很有参考。", "收到你的经验了，感谢分享。", "这个细节记下了，谢谢交流。"],
  },
  clarification: {
    natural: ["你提到的{comment}提醒得很好，我这里分享的是个人体验，具体情况还要以实际信息为准。", "谢谢指出边界，这次内容只代表我的使用场景，不等于适用于所有人。", "感谢提醒，我会把事实、判断和个人感受区分得更清楚。"],
    warm: ["谢谢你认真指出{comment}，确实需要把适用范围说明白，避免造成误解。", "感谢提醒，我也希望每个人都能根据自己的情况做判断。", "你的补充很重要，我会把不确定的部分写得更谨慎。"],
    concise: ["谢谢提醒，这里只代表个人体验。", "收到，我会把适用边界写清楚。", "感谢指出，我再核对一下事实。"],
  },
};

export function generateCommentReplies(comment: string, scene: CommentReplyScene = "appreciation", tone: CommentReplyTone = "natural") {
  const cleanComment = comment.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  if (!cleanComment) return [];

  const quotedComment = `“${cleanComment}”`;
  return Array.from(new Set(commentReplyTemplates[scene][tone].map((template) => template.replaceAll("{comment}", quotedComment))));
}

export type PptOutlineScene = "report" | "training" | "proposal" | "sharing";
export type PptOutlineDuration = "5" | "10" | "20";
export type PptOutlineSlide = { title: string; purpose: string; points: string[]; visual: string };
export type PptOutlineDraft = { title: string; subtitle: string; paceNote: string; slides: PptOutlineSlide[]; checklist: string[] };

function selectPptSlides(slides: PptOutlineSlide[], duration: PptOutlineDuration) {
  const indexes = duration === "5" ? [0, 1, 2, slides.length - 1] : duration === "10" ? [0, 1, 2, 3, slides.length - 1] : slides.map((_, index) => index);
  return Array.from(new Set(indexes)).map((index) => slides[index]).filter((slide): slide is PptOutlineSlide => Boolean(slide));
}

export function generatePptOutline(topic: string, audience = "", objective = "", scene: PptOutlineScene = "report", duration: PptOutlineDuration = "10"): PptOutlineDraft | null {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!cleanTopic) return null;

  const cleanAudience = audience.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 50) || "目标受众";
  const cleanObjective = objective.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "帮助观众理解主题并采取下一步行动";
  const slidesByScene: Record<PptOutlineScene, PptOutlineSlide[]> = {
    report: [
      { title: "开场与目标", purpose: `让${cleanAudience}先知道为什么现在讨论「${cleanTopic}」。`, points: [`主题：${cleanTopic}`, `本次目标：${cleanObjective}`, "先给出一句可以被复述的核心结论"], visual: "一句话结论卡或摘要页" },
      { title: "现状与关键事实", purpose: "用少量可信材料说明问题处在什么位置。", points: ["补充 1～2 条真实数据、案例或时间线", "说明事实对受众的具体影响", "标注数据范围、来源和时间"], visual: "趋势图、对比表或时间线" },
      { title: "关键发现", purpose: "把材料收敛成观众需要记住的判断。", points: ["发现一：最重要的变化是什么", "发现二：哪些因素影响结果", "说明这些发现为什么与主题相关"], visual: "三点摘要卡或重点标注" },
      { title: "问题与风险", purpose: "提前说明限制条件，避免只展示单向结论。", points: ["当前最大的阻碍或不确定性", "可能带来的影响", "哪些问题需要继续验证"], visual: "风险矩阵或问题清单" },
      { title: "建议与行动", purpose: "把结论转成受众可以执行的下一步。", points: [`建议围绕「${cleanTopic}」先做的一件事`, "负责人、时间和衡量方式", "短期行动与后续复盘节点"], visual: "行动清单或路线图" },
      { title: "决策与交流", purpose: "明确需要确认的事项，并给讨论留下空间。", points: ["需要现场确认的一个决策", "仍需补充的材料", "收集问题和后续跟进方式"], visual: "决策卡或 Q&A 页" },
    ],
    training: [
      { title: "为什么要学", purpose: `让${cleanAudience}理解「${cleanTopic}」与实际任务的关系。`, points: [`学习目标：${cleanObjective}`, "先说明完成后能解决什么问题", "给出适用范围和不适用边界"], visual: "前后对比或问题场景" },
      { title: "核心框架", purpose: "先搭一张简单的知识地图，再逐项展开。", points: ["核心概念一：用一句话解释", "核心概念二：说明与前者的关系", "记住一个判断或操作原则"], visual: "流程图或概念关系图" },
      { title: "示例演示", purpose: "用一个从输入到结果的例子连接抽象概念。", points: [`示例主题：${cleanTopic}`, "展示关键步骤和中间判断", "标记最容易出错的地方"], visual: "分步截图、案例卡或演示录屏" },
      { title: "练习与检查", purpose: "让观众在现场或课后完成一次小练习。", points: ["练习任务：根据自己的场景操作一次", "检查结果是否符合目标", "记录一个仍然不清楚的问题"], visual: "任务卡或检查清单" },
      { title: "总结与行动", purpose: "把知识点压缩成可带走的行动提醒。", points: ["今天最重要的三点", `回到「${cleanTopic}」时先做哪一步`, "提供复习材料或下一次练习入口"], visual: "三点总结卡或行动按钮" },
      { title: "提问与答疑", purpose: "收集真实场景中的差异，避免把单一示例当成通用答案。", points: ["邀请观众提出具体场景", "区分已验证结论和待确认问题", "记录后续补充内容"], visual: "问题墙或 Q&A 页" },
    ],
    proposal: [
      { title: "现状与机会", purpose: `说明为什么现在需要关注「${cleanTopic}」。`, points: ["当前现状和受影响的人群", "机会或问题的具体表现", `与${cleanAudience}的关系`], visual: "现状数据或问题场景" },
      { title: "目标与衡量", purpose: "先定义要改变什么，再讨论怎么做。", points: [`目标：${cleanObjective}`, "成功标准和衡量指标", "范围、时间和不包含的内容"], visual: "目标卡或指标树" },
      { title: "方案框架", purpose: "把方案拆成受众能理解的几个组成部分。", points: ["方案一：核心动作和价值", "方案二：配套动作和依赖", "为什么选择这组组合"], visual: "方案架构图或对比表" },
      { title: "执行计划", purpose: "把想法落到阶段、负责人和交付物。", points: ["第一阶段：验证关键假设", "第二阶段：扩大应用范围", "每阶段的交付物和检查点"], visual: "路线图或甘特式时间线" },
      { title: "资源与风险", purpose: "让决策者看到成本、依赖和可能的失败方式。", points: ["需要的人力、时间和材料", "最大风险与应对方案", "仍需要确认的前置条件"], visual: "资源表或风险矩阵" },
      { title: "需要的决策", purpose: "明确演示结束后希望观众做什么决定。", points: ["请确认的一个核心选项", "需要谁在什么时间前确认", "确认后立即开始的下一步"], visual: "决策页或行动清单" },
    ],
    sharing: [
      { title: "从一个问题开始", purpose: `用具体场景引出「${cleanTopic}」，让观众快速建立关联。`, points: [`受众：${cleanAudience}`, "提出一个真实、具体的问题", "告诉观众接下来会得到什么"], visual: "问题大字或场景图片" },
      { title: "我的主要观点", purpose: "用一句话说清楚这次分享最想留下的判断。", points: [`核心观点：${cleanObjective}`, "说明观点来自什么经历或材料", "先讲边界，不把个人体验当普遍结论"], visual: "观点卡或金句页" },
      { title: "案例拆解", purpose: "用一个完整案例把观点落地。", points: [`案例与「${cleanTopic}」的关系`, "过程中的关键选择", "结果、限制和仍未解决的部分"], visual: "前后对比或案例时间线" },
      { title: "可执行方法", purpose: "把经验整理成观众今天就能尝试的动作。", points: ["第一步：准备什么", "第二步：怎么判断", "第三步：如何检查结果"], visual: "三步流程或检查表" },
      { title: "总结与带走", purpose: "把分享收束为少量可以复述的要点。", points: ["一个核心结论", "两个容易忽略的提醒", "一个建议尝试的下一步"], visual: "总结卡或清单页" },
      { title: "交流与补充", purpose: "把单向分享变成可继续讨论的对话。", points: ["邀请观众分享不同场景", "记录值得继续验证的问题", "留下后续资料或联系方式"], visual: "Q&A 页或讨论提示" },
    ],
  };

  const slides = selectPptSlides(slidesByScene[scene], duration);
  const durationMinutes = Number(duration);
  const minutesPerSlide = Math.max(1, Math.round(durationMinutes / slides.length));
  return {
    title: `${cleanTopic}：演示文稿大纲`,
    subtitle: `面向${cleanAudience} · ${cleanObjective}`,
    paceNote: `建议 ${duration} 分钟讲完 ${slides.length} 页，每页约 ${minutesPerSlide} 分钟；先讲结论，再用材料支撑。`,
    slides,
    checklist: ["每页只保留一个主要观点，标题尽量写成结论。", `补充与「${cleanTopic}」相关的真实数据、案例和来源。`, "演练开场、页间转场和最后的行动请求。", "确认所有数字、截图、引用和商业信息都经过核对。"],
  };
}

export type ResumeProfile = "campus" | "experienced" | "career-change" | "freelance";
export type ResumeSection = { title: string; items: string[] };
export type ResumeDraft = { title: string; intro: string; sections: ResumeSection[]; checklist: string[] };

const resumeProfileLabels: Record<ResumeProfile, string> = {
  campus: "应届 / 实习",
  experienced: "有工作经验",
  "career-change": "转行求职",
  freelance: "项目制 / 自由职业",
};

function splitResumeItems(input: string, maxItems: number) {
  return Array.from(new Set(input.replace(/\r/g, "").split(/[\n；;]+/).map((item) => item.replace(/^[\s•·\-–—*]+/u, "").replace(/\s+/g, " ").trim()).filter(Boolean))).slice(0, maxItems);
}

export function generateResumeContent(role: string, profile: ResumeProfile = "experienced", strengths = "", experience = "", projects = "", skills = ""): ResumeDraft | null {
  const cleanRole = role.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!cleanRole) return null;

  const cleanStrengths = strengths.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  const experienceItems = splitResumeItems(experience, 8);
  const projectItems = splitResumeItems(projects, 8);
  const skillItems = splitResumeItems(skills.replace(/[,，、]/g, "\n"), 12);
  const profileLabel = resumeProfileLabels[profile];
  const fallback = (label: string) => [`请补充${label}，优先写清具体动作、结果和可核验的证据。`];

  return {
    title: `${cleanRole}｜简历内容整理`,
    intro: `目标岗位：${cleanRole} · 候选人类型：${profileLabel} · ${cleanStrengths || "请补充一句与你目标岗位最相关的优势"}`,
    sections: [
      { title: "求职定位", items: [`目标岗位：${cleanRole}`, `候选人类型：${profileLabel}`, `核心优势：${cleanStrengths || "待补充"}`] },
      { title: "工作 / 实习经历", items: experienceItems.length ? experienceItems : fallback("工作或实习经历") },
      { title: "项目与成果", items: projectItems.length ? projectItems : fallback("项目、作品或可量化成果") },
      { title: "技能关键词", items: skillItems.length ? skillItems : fallback("与岗位相关的工具、方法或专业技能") },
    ],
    checklist: ["每条经历尽量使用“动作 + 结果 + 证据”，不要只写职责。", "数字、项目名称、客户和成果必须来自真实经历并可以核验。", "按目标岗位删减无关内容，优先保留最近且最匹配的材料。", "提交前检查联系方式、时间线、文件命名和隐私信息。"],
  };
}

export type WeeklyReportAudience = "team" | "manager" | "client" | "personal";
export type WeeklyReportSection = { title: string; items: string[] };
export type WeeklyReportDraft = { title: string; intro: string; sections: WeeklyReportSection[]; checklist: string[] };

const weeklyReportAudienceLabels: Record<WeeklyReportAudience, string> = {
  team: "项目团队",
  manager: "直属负责人",
  client: "客户 / 合作方",
  personal: "个人复盘",
};

function splitWeeklyItems(input: string, maxItems: number) {
  return Array.from(new Set(input.replace(/\r/g, "").split(/[\n；;]+/).map((item) => item.replace(/^[\s•·\-–—*]+/u, "").replace(/\s+/g, " ").trim()).filter(Boolean))).slice(0, maxItems);
}

export function generateWeeklyReport(period: string, audience: WeeklyReportAudience = "team", focus = "", completed = "", blockers = "", nextPlan = "", support = ""): WeeklyReportDraft | null {
  const cleanPeriod = period.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!cleanPeriod) return null;

  const cleanFocus = focus.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  const completedItems = splitWeeklyItems(completed, 8);
  const blockerItems = splitWeeklyItems(blockers, 6);
  const nextPlanItems = splitWeeklyItems(nextPlan, 8);
  const supportItems = splitWeeklyItems(support, 6);
  const audienceLabel = weeklyReportAudienceLabels[audience];
  const fallback = (label: string) => [`请补充${label}，优先写清动作、结果、负责人或时间点。`];

  return {
    title: `${cleanPeriod}｜工作周报整理`,
    intro: `汇报对象：${audienceLabel} · ${cleanFocus || "请补充本周最重要的结果"} · 本地结构整理，不调用 AI`,
    sections: [
      { title: "本周重点", items: [cleanFocus || "待补充本周最重要的结果或判断"] },
      { title: "已完成工作", items: completedItems.length ? completedItems : fallback("已完成事项") },
      { title: "问题与风险", items: blockerItems.length ? blockerItems : ["请确认是否存在需要同步的阻塞、风险或依赖。"] },
      { title: "下周计划", items: nextPlanItems.length ? nextPlanItems : fallback("下周计划") },
      { title: "需要协同", items: supportItems.length ? supportItems : ["如需他人支持，请写清负责人、事项与期望完成时间。"] },
    ],
    checklist: ["完成项尽量写成“动作 + 结果 + 证据”，不要只罗列过程。", "问题与风险要注明影响、负责人和下一次同步时间。", "下周计划控制在可执行范围内，并明确优先级或截止时间。", "发送前检查客户名、数据、链接、内部信息和个人隐私。"],
  };
}

export type InterviewStage = "screening" | "behavioral" | "case" | "final";
export type InterviewPrepQuestion = { title: string; question: string; preparation: string };
export type InterviewPrepDraft = { title: string; intro: string; questions: InterviewPrepQuestion[]; questionsToAsk: string[]; checklist: string[] };

const interviewStageLabels: Record<InterviewStage, string> = {
  screening: "初筛 / HR 面",
  behavioral: "行为面 / 主管面",
  case: "专业面 / 案例面",
  final: "终面 / 沟通面",
};

const interviewStageTemplates: Record<InterviewStage, { title: string; question: string; preparation: string }> = {
  screening: { title: "岗位匹配", question: "为什么考虑这个岗位？你认为自己最匹配的能力是什么？", preparation: "准备 1 个岗位动机和 1 个能证明匹配度的真实例子。" },
  behavioral: { title: "行为案例", question: "请讲一次你推动他人、处理分歧或在限制条件下完成目标的经历。", preparation: "按背景、任务、行动、结果和复盘组织，避免只讲团队做了什么。" },
  case: { title: "场景拆解", question: "如果接手一个与目标岗位相关的问题，你会如何澄清目标、拆解步骤并判断结果？", preparation: "先问清目标和约束，再说明优先级、验证方法与风险。" },
  final: { title: "判断与协作", question: "当目标、资源或不同意见发生冲突时，你会如何做取舍并推动共识？", preparation: "准备一个真实取舍案例，说明判断依据、沟通对象和最终结果。" },
};

export function generateInterviewPrep(role: string, stage: InterviewStage = "screening", focus = "", experience = "", projects = "", concern = ""): InterviewPrepDraft | null {
  const cleanRole = role.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!cleanRole) return null;

  const cleanFocus = focus.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  const cleanConcern = concern.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const evidenceItems = splitResumeItems(`${experience}\n${projects}`, 3);
  const evidenceHint = evidenceItems[0] ? `围绕这段材料准备追问：“${evidenceItems[0]}”` : "先选一段与岗位最相关的真实经历，准备背景、行动、结果和复盘。";
  const stageTemplate = interviewStageTemplates[stage];

  return {
    title: `${cleanRole}｜面试准备整理`,
    intro: `目标岗位：${cleanRole} · 面试阶段：${interviewStageLabels[stage]} · 本地练习方向，不调用 AI`,
    questions: [
      { title: "60 秒自我介绍", question: `请用 60～90 秒介绍与你应聘“${cleanRole}”最相关的经历。`, preparation: "先说当前定位，再说 1～2 个证据，最后落到为什么适合这个岗位。" },
      { title: "岗位动机", question: `为什么想应聘“${cleanRole}”？你希望在这份工作中解决什么问题？`, preparation: "把个人动机、岗位信息和可贡献的能力连起来，不只说平台或薪资。" },
      { title: "经历深挖", question: evidenceItems[0] ? `请详细讲讲：“${evidenceItems[0]}”。你具体做了什么？` : "请挑一段最能证明你适合目标岗位的真实经历，并说明你具体做了什么。", preparation: evidenceHint },
      { title: "结果与证据", question: cleanFocus ? `围绕“${cleanFocus}”，你会如何证明工作结果和个人贡献？` : "你如何证明一项工作的结果，以及其中哪些部分是你的个人贡献？", preparation: "准备数字、时间、前后变化、样例或他人反馈；没有数字就诚实说明证据边界。" },
      stageTemplate,
      { title: "困难与复盘", question: cleanConcern ? `如果面试官追问“${cleanConcern}”，你会如何回答并说明改进？` : "讲一次没有按预期推进的经历：你如何处理，之后做了什么调整？", preparation: "不要回避问题，说明判断、补救、结果和下一次会怎么做。" },
    ],
    questionsToAsk: ["这个岗位入职后的前 90 天，最重要的目标是什么？", "团队如何判断这个岗位做得好？目前最大的协作或业务挑战是什么？", "接下来面试流程和时间安排大致如何？"],
    checklist: ["每个回答先给结论，再用真实经历和证据展开，控制在 1～2 分钟。", "不要编造项目、数字、职责或工具熟练度；不会的问题说明思路和学习方式。", "针对目标岗位准备 2～3 个可追问的项目案例，提前练习不同角度。", "面试前检查简历时间线、职位名称、隐私信息和需要保密的客户/内部资料。"],
  };
}

export type LongTextDepth = "compact" | "standard" | "detailed";
export type LongTextHighlight = { excerpt: string; reason: string };
export type LongTextDraft = { title: string; intro: string; stats: { characters: number; lines: number; blocks: number }; outline: string[]; highlights: LongTextHighlight[]; actions: string[]; checklist: string[] };

function splitLongTextBlocks(input: string) {
  const lines = input.split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const blocks = lines.flatMap((line) => line.length > 260 ? (line.match(/[^。！？!?；;]+[。！？!?；;]?/gu) ?? [line]) : [line]);
  return Array.from(new Set(blocks.map((block) => block.trim()).filter((block) => block.length >= 6))).slice(0, 160);
}

export function generateLongTextHighlights(input: string, focus = "", depth: LongTextDepth = "standard"): LongTextDraft | null {
  const cleanText = input.replace(/\r/g, "").trim().slice(0, 12000);
  if (!cleanText) return null;

  const lines = cleanText.split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const blocks = splitLongTextBlocks(cleanText);
  const cleanFocus = focus.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  const focusTerms = cleanFocus.split(/[\s,，、；;]+/).filter((term) => term.length >= 2).slice(0, 6);
  const signalWords = ["关键", "结论", "问题", "目标", "风险", "建议", "需要", "下一步", "影响", "结果", "方案", "数据"];
  const highlightCount = depth === "compact" ? 3 : depth === "detailed" ? 8 : 5;
  const rankedBlocks = blocks.map((block, index) => {
    const focusScore = focusTerms.filter((term) => block.includes(term)).length * 4;
    const signalScore = signalWords.filter((word) => block.includes(word)).length * 2;
    const lengthScore = block.length >= 25 && block.length <= 220 ? 2 : 0;
    const positionScore = index < 2 ? 2 : 0;
    return { block, index, score: focusScore + signalScore + lengthScore + positionScore };
  }).sort((left, right) => right.score - left.score || left.index - right.index).slice(0, highlightCount).sort((left, right) => left.index - right.index);
  const highlights = rankedBlocks.map(({ block }) => ({ excerpt: block.length > 220 ? `${block.slice(0, 220)}…` : block, reason: focusTerms.some((term) => block.includes(term)) ? "匹配阅读重点" : signalWords.some((word) => block.includes(word)) ? "包含结构信号" : "保留正文前段或信息完整段落" }));
  const actionKeywords = ["下一步", "需要", "建议", "计划", "负责", "截止", "请", "应当", "可以", "行动", "完成"];
  const actions = Array.from(new Set(blocks.filter((block) => actionKeywords.some((keyword) => block.includes(keyword))).map((block) => block.length > 180 ? `${block.slice(0, 180)}…` : block))).slice(0, depth === "detailed" ? 6 : 4);
  const outline = Array.from(new Set(lines.filter((line) => line.length <= 40 && !/[。！？!?，,]$/u.test(line)).map((line) => line.replace(/^#{1,6}\s*/u, "").trim()))).slice(0, 8);
  const title = (lines[0] ?? "长文重点整理").replace(/^#{1,6}\s*/u, "").slice(0, 60) || "长文重点整理";

  return {
    title: `${title}｜重点整理`,
    intro: `本地抽取 ${depth === "compact" ? "精简" : depth === "detailed" ? "详细" : "标准"}版 · ${cleanFocus ? `阅读重点：${cleanFocus}` : "未指定阅读重点"} · 不调用 AI，不改写原文`,
    stats: { characters: Array.from(cleanText).length, lines: lines.length, blocks: blocks.length },
    outline: outline.length ? outline : ["未识别到明确小标题，可把重点段落作为新的分节依据。"],
    highlights: highlights.length ? highlights : [{ excerpt: "未识别到足够长的重点段落，请补充更多正文或降低格式噪音。", reason: "输入内容较短" }],
    actions: actions.length ? actions : ["未识别到明确行动项，请手动检查“下一步、负责人、截止时间和风险”。"],
    checklist: ["重点段落是按位置和关键词抽取，不等同于语义总结，请回看上下文。", "行动项需要人工确认负责人、时间、优先级和是否已经完成。", "如果文本包含数字、引用、客户资料或内部信息，请在分享前逐项核对。", "需要真正概括、翻译或改写时，应使用经过授权的模型或人工编辑流程。"],
  };
}

export type TextExpressionMode = "clear" | "formal" | "concise" | "friendly";
export type TextExpressionIssue = { label: string; detail: string; count: number };
export type TextExpressionDraft = { title: string; intro: string; cleanedText: string; stats: { characters: number; paragraphs: number; sentences: number; removedFillers: number }; issues: TextExpressionIssue[]; suggestions: string[]; checklist: string[] };

const textExpressionModeLabels: Record<TextExpressionMode, string> = {
  clear: "清晰直接",
  formal: "正式稳妥",
  concise: "精简克制",
  friendly: "自然友好",
};

const textExpressionFillers = ["其实", "基本上", "相对来说", "可以说", "我觉得", "然后呢", "就是说"];

function countTextOccurrences(input: string, value: string) {
  return input.split(value).length - 1;
}

export function prepareTextExpression(input: string, mode: TextExpressionMode = "clear"): TextExpressionDraft | null {
  const cleanInput = input.replace(/\r/g, "").trim().slice(0, 10000);
  if (!cleanInput) return null;

  const sourceBlocks = cleanInput.split(/\n+/).map((block) => block.replace(/[ \t]+/g, " ").trim()).filter(Boolean);
  const fillerCount = textExpressionFillers.reduce((total, filler) => total + countTextOccurrences(cleanInput, filler), 0);
  const cleanedBlocks = sourceBlocks.map((block) => {
    if (mode !== "concise") return block;
    return textExpressionFillers.reduce((current, filler) => current.replaceAll(filler, ""), block).replace(/\s{2,}/g, " ").trim();
  }).filter(Boolean);
  const cleanedText = cleanedBlocks.join("\n\n");
  const sentenceCount = (cleanedText.match(/[。！？!?；;]/gu) ?? []).length || (cleanedText ? 1 : 0);
  const longSentenceCount = cleanedText.split(/(?<=[。！？!?；;])/u).filter((sentence) => sentence.trim().length > 60).length;
  const repeatedPunctuationCount = (cleanedText.match(/(?:！{2,}|？{2,}|!{2,}|\?{2,})/gu) ?? []).length;
  const issues: TextExpressionIssue[] = [];
  if (fillerCount) issues.push({ label: "填充表达", detail: `发现 ${fillerCount} 处可人工确认的口语化或重复表达。`, count: fillerCount });
  if (longSentenceCount) issues.push({ label: "长句", detail: `发现 ${longSentenceCount} 个超过 60 字的句子，可考虑拆成结论、原因和证据。`, count: longSentenceCount });
  if (repeatedPunctuationCount) issues.push({ label: "重复标点", detail: `发现 ${repeatedPunctuationCount} 处连续感叹号或问号，请确认是否确有强调必要。`, count: repeatedPunctuationCount });
  if (!issues.length) issues.push({ label: "基础检查", detail: "未发现明显的填充表达、长句或重复标点，可继续做事实和语气核对。", count: 0 });

  const modeSuggestions: Record<TextExpressionMode, string[]> = {
    clear: ["每段先说结论，再补充原因、证据或下一步。", "把抽象形容词替换成动作、结果和可核对的事实。"],
    formal: ["检查口语、情绪化和模糊承诺，确保对外表达边界清楚。", "涉及客户、数据和时间时，使用准确称谓并核对上下文。"],
    concise: ["删除不影响事实的填充表达，保留动作、结果、限制和下一步。", "一段只保留一个主要意思，必要时拆分长句。"],
    friendly: ["保留清晰信息，同时检查语气是否自然、具体且尊重对方。", "避免过度命令或夸大承诺，用真实上下文说明原因。"],
  };

  return {
    title: `文本表达整理｜${textExpressionModeLabels[mode]}`,
    intro: `本地格式清理与表达检查 · ${textExpressionModeLabels[mode]} · 不调用 AI，不承诺降重或规避检测`,
    cleanedText,
    stats: { characters: Array.from(cleanedText).length, paragraphs: cleanedBlocks.length, sentences: sentenceCount, removedFillers: mode === "concise" ? fillerCount : 0 },
    issues,
    suggestions: modeSuggestions[mode],
    checklist: ["整理后的文本没有改变事实检查责任，请逐句核对数字、时间、来源和承诺。", "如果用于论文、作业、广告或对外发布，请遵守原创、引用和平台规则。", "不要把本地表达整理结果当成 AI 改写、查重结论或合规审核。"],
  };
}

export type EcommercePromptCategory = "product" | "marketing" | "customer-service" | "cross-border";
export type EcommercePromptTone = "clear" | "warm" | "professional" | "concise";
export type PromptTemplate = { title: string; use: string; prompt: string };
export type EcommercePrompt = PromptTemplate;
export type EcommercePromptDraft = { category: EcommercePromptCategory; categoryLabel: string; toneLabel: string; prompts: PromptTemplate[] };

const ecommercePromptCategoryLabels: Record<EcommercePromptCategory, string> = {
  product: "商品信息",
  marketing: "营销内容",
  "customer-service": "客服沟通",
  "cross-border": "跨境电商",
};

const ecommercePromptToneLabels: Record<EcommercePromptTone, string> = {
  clear: "清晰直接",
  warm: "温和友好",
  professional: "专业克制",
  concise: "短句精简",
};

export function generateEcommercePrompts(product: string, audience = "", features = "", market = "", tone: EcommercePromptTone = "clear", category: EcommercePromptCategory = "product"): EcommercePromptDraft | null {
  const cleanProduct = product.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  if (!cleanProduct) return null;

  const cleanAudience = audience.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "待补充目标用户";
  const cleanFeatures = features.replace(/\r/g, "").trim().slice(0, 600) || "待补充真实卖点、规格、限制和证据";
  const cleanMarket = market.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "待补充平台或市场";
  const context = `商品/服务：${cleanProduct}\n目标用户：${cleanAudience}\n真实卖点与规格：${cleanFeatures}\n平台/市场：${cleanMarket}\n表达方向：${ecommercePromptToneLabels[tone]}`;
  const templateGroups: Record<EcommercePromptCategory, PromptTemplate[]> = {
    product: [
      { title: "商品标题结构", use: "用于整理电商平台标题方向", prompt: `请根据以下真实资料，整理 5 个商品标题方向。每条控制在适合平台展示的长度，突出一个主要利益点；不要添加资料中没有的功效、认证、销量或承诺，并在每条后说明使用了哪条真实信息。\n\n${context}` },
      { title: "卖点提炼", use: "用于详情页或商品卡片的卖点整理", prompt: `请把以下真实资料整理为 3～5 条商品卖点。每条包含“特点 + 对用户的实际帮助”，区分事实与需要补证的说法；不要夸大效果，不要虚构参数。\n\n${context}` },
    ],
    marketing: [
      { title: "详情页首屏文案", use: "用于商品详情页首屏结构", prompt: `请根据以下真实资料，给出一个电商详情页首屏文案草稿，包含主标题、副标题、3 条证据型卖点和一个克制的行动提示。优先清楚说明适用人群与使用场景，不写绝对化或无法证明的承诺。\n\n${context}` },
      { title: "短视频卖点提纲", use: "用于短视频商品介绍前期准备", prompt: `请根据以下真实资料，整理一份 30 秒商品介绍提纲：开场场景、一个核心问题、产品如何解决、真实证据、结尾行动提示。不要编造测评数据、用户反馈或平台热度。\n\n${context}` },
    ],
    "customer-service": [
      { title: "售前咨询回复", use: "用于整理清楚、可核对的售前回复", prompt: `请根据以下真实资料，设计 3 种售前咨询回复方向：适用人群、主要规格、使用限制。语气${ecommercePromptToneLabels[tone]}，遇到资料没有覆盖的问题要明确说“需要进一步确认”，不要代替客服承诺。\n\n${context}` },
      { title: "售后沟通草稿", use: "用于整理售后问题的沟通结构", prompt: `请根据以下真实资料，整理一个售后沟通草稿结构：先确认问题、再说明已知信息、提出下一步处理、最后告知预计同步时间。不要推卸责任、不要承诺未经确认的退款或时效。\n\n${context}` },
    ],
    "cross-border": [
      { title: "英文商品描述准备", use: "用于跨境商品英文描述的资料准备", prompt: `请先根据以下真实资料，列出生成英文商品描述前需要确认的字段，并给出一份不夸大、不虚构认证和功效的英文描述草稿结构。所有尺寸、材质、适用范围和限制必须以资料为准；缺失信息请标注待确认。\n\n${context}` },
      { title: "跨境客服与物流说明", use: "用于跨境咨询和物流说明的 Prompt", prompt: `请根据以下真实资料，整理一份跨境客服回复的中英双语要点：产品信息、发货范围、预计时效的待确认项、售后边界和需要买家提供的信息。没有确定的数据请保留占位，不要自行承诺。\n\n${context}` },
    ],
  };

  return { category, categoryLabel: ecommercePromptCategoryLabels[category], toneLabel: ecommercePromptToneLabels[tone], prompts: templateGroups[category] };
}

export type ShortVideoPromptScene = "ideas" | "script" | "storyboard" | "review";
export type ShortVideoPromptDuration = "15" | "30" | "60";
export type ShortVideoPromptDraft = { scene: ShortVideoPromptScene; sceneLabel: string; durationLabel: string; prompts: PromptTemplate[] };

const shortVideoPromptSceneLabels: Record<ShortVideoPromptScene, string> = {
  ideas: "选题策划",
  script: "口播脚本",
  storyboard: "分镜拆解",
  review: "内容复盘",
};

const shortVideoPromptDurationLabels: Record<ShortVideoPromptDuration, string> = { "15": "15 秒", "30": "30 秒", "60": "60 秒" };

export function generateShortVideoPrompts(topic: string, audience = "", platform = "", constraints = "", scene: ShortVideoPromptScene = "ideas", duration: ShortVideoPromptDuration = "30"): ShortVideoPromptDraft | null {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!cleanTopic) return null;

  const cleanAudience = audience.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "待补充目标观众";
  const cleanPlatform = platform.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "待补充发布平台";
  const cleanConstraints = constraints.replace(/\r/g, "").trim().slice(0, 500) || "待补充事实、素材、版权和拍摄限制";
  const context = `视频主题：${cleanTopic}\n目标观众：${cleanAudience}\n发布平台：${cleanPlatform}\n预计时长：${shortVideoPromptDurationLabels[duration]}\n已知限制与真实素材：${cleanConstraints}`;
  const promptGroups: Record<ShortVideoPromptScene, PromptTemplate[]> = {
    ideas: [
      { title: "选题方向", use: "用于整理可验证的短视频选题", prompt: `请根据以下真实信息，整理 8 个短视频选题方向。每个方向包含观众痛点、视频承诺、所需真实素材和适合的开场问题；不要声称爆款、不要编造热度或用户数据。\n\n${context}` },
      { title: "开场钩子", use: "用于准备前 3 秒的表达方向", prompt: `请为以下视频主题整理 6 个开场表达方向，分别说明适合的画面或动作，并标注哪些说法需要事实证据。避免夸大、恐吓和绝对化承诺。\n\n${context}` },
    ],
    script: [
      { title: "口播脚本结构", use: "用于整理一版可人工修改的口播提纲", prompt: `请根据以下真实信息，整理一份${shortVideoPromptDurationLabels[duration]}口播脚本提纲：开场、问题、核心内容、证据/示例、行动提示。每段说明建议时长，不能补写资料中没有的事实、评价或结果。\n\n${context}` },
      { title: "字幕与口语化检查", use: "用于把已有脚本交给模型做可控检查", prompt: `请检查下面主题对应的短视频脚本准备要求，列出适合字幕阅读的短句、可能过长的句子和需要人工核对的事实。不要改变作者观点，不要替作者编造案例或数据。\n\n${context}` },
    ],
    storyboard: [
      { title: "镜头分镜", use: "用于整理画面、口播和时长的对应关系", prompt: `请根据以下真实信息，整理一份${shortVideoPromptDurationLabels[duration]}分镜表，字段包含镜号、时长、画面、口播/字幕、道具或素材、拍摄注意事项。没有提供的素材请标为待准备，不要虚构可用画面。\n\n${context}` },
      { title: "拍摄清单", use: "用于拍摄前检查素材与版权边界", prompt: `请根据以下主题整理拍摄前清单，至少包含场景、人物、道具、录音、字幕、封面、授权和备份；把需要确认的版权、隐私和品牌信息单独列出。\n\n${context}` },
    ],
    review: [
      { title: "内容复盘问题", use: "用于发布后人工复盘，不读取平台数据", prompt: `请根据以下真实信息整理一份短视频复盘问题清单，覆盖目标观众、前几秒是否清楚、内容证据、评论反馈、完播/点击数据（如有）、下一次实验。没有数据时明确标注待补充，不要预测流量。\n\n${context}` },
      { title: "下一轮实验", use: "用于把复盘结论转成小步测试计划", prompt: `请把以下短视频主题转成 3 个低成本实验方向，每个包含只改一个变量、需要观察的指标、最小素材和停止条件。不要承诺结果，也不要把平台偶然波动当成因果。\n\n${context}` },
    ],
  };

  return { scene, sceneLabel: shortVideoPromptSceneLabels[scene], durationLabel: shortVideoPromptDurationLabels[duration], prompts: promptGroups[scene] };
}

export type XhsPromptScene = "topic" | "title" | "note" | "engagement";
export type XhsPromptTone = "clear" | "warm" | "professional" | "conversational";
export type XhsPromptDraft = { scene: XhsPromptScene; sceneLabel: string; toneLabel: string; prompts: PromptTemplate[] };

const xhsPromptSceneLabels: Record<XhsPromptScene, string> = {
  topic: "选题策划",
  title: "标题方向",
  note: "笔记结构",
  engagement: "互动回复",
};

const xhsPromptToneLabels: Record<XhsPromptTone, string> = {
  clear: "清晰直接",
  warm: "温和真诚",
  professional: "专业克制",
  conversational: "自然口语",
};

export function generateXhsPrompts(topic: string, audience = "", materials = "", constraints = "", tone: XhsPromptTone = "clear", scene: XhsPromptScene = "topic"): XhsPromptDraft | null {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!cleanTopic) return null;

  const cleanAudience = audience.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "待补充目标读者";
  const cleanMaterials = materials.replace(/\r/g, "").trim().slice(0, 700) || "待补充真实经历、素材、数据或可公开引用的信息";
  const cleanConstraints = constraints.replace(/\r/g, "").trim().slice(0, 400) || "待补充平台、品牌、版权、隐私和表达限制";
  const context = `笔记主题：${cleanTopic}\n目标读者：${cleanAudience}\n真实素材与经历：${cleanMaterials}\n已知限制：${cleanConstraints}\n表达方向：${xhsPromptToneLabels[tone]}`;
  const promptGroups: Record<XhsPromptScene, PromptTemplate[]> = {
    topic: [
      { title: "选题方向", use: "用于整理可由真实素材支撑的小红书选题", prompt: `请根据以下真实信息，整理 6 个小红书选题方向。每个方向包含读者问题、内容角度、需要准备的真实素材和适合的笔记形式；不要声称热门、爆款或平台偏好，不要补写没有提供的经历和数据。\n\n${context}` },
      { title: "选题筛选", use: "用于从多个方向中选出更值得先做的题目", prompt: `请按“读者需求是否清楚、资料是否足够、是否容易核对、制作成本是否可控”四个维度，比较以下主题可延展的选题方向，并给出先做顺序。缺少证据的地方标记为待补充，不要用搜索热度或虚构数据替代判断。\n\n${context}` },
    ],
    title: [
      { title: "标题结构", use: "用于整理有场景、有信息点的标题方向", prompt: `请根据以下真实信息，整理 8 个小红书标题方向。标题可以使用场景、对象、问题、清单或方法结构，但必须准确对应正文，不要使用“全网最好”“一定要买”“百分百”等绝对化表达，也不要声称爆款或热门。\n\n${context}` },
      { title: "标题检查", use: "用于把已有标题交给模型做可控检查", prompt: `请针对以下主题给出标题检查清单：信息是否具体、目标读者是否可识别、利益点是否有正文支撑、是否存在夸大或诱导表达、是否需要补充限定条件。请提供可修改的方向，不要承诺点击率，也不要擅自添加事实。\n\n${context}` },
    ],
    note: [
      { title: "笔记结构", use: "用于整理一篇可继续编辑的图文笔记骨架", prompt: `请根据以下真实信息，整理一篇小红书笔记结构：开头场景、读者问题、核心内容、真实体验或证据、限制条件、结尾互动。每一段写清楚需要补充的素材；没有提供的体验、效果和数据必须标为待确认，不要代写虚假经历。\n\n${context}` },
      { title: "图文页提纲", use: "用于拆分封面、图片页和正文说明", prompt: `请把以下主题整理为一份小红书图文页提纲，包含封面信息、每一页的一个重点、配图建议、图片文字和正文补充。每页只承担一个信息点，涉及功效、价格、测评、引用或他人信息时标记核对项，不要编造素材。\n\n${context}` },
    ],
    engagement: [
      { title: "评论回复", use: "用于整理礼貌、可核对的评论回复方向", prompt: `请根据以下真实信息，整理 6 种小红书评论回复方向，覆盖感谢、追问、不同体验、资料不足和需要进一步确认的情况。回复要自然、克制，不要冒充用户口吻，不要虚构使用效果、销量、资质或售后承诺。\n\n${context}` },
      { title: "结尾互动", use: "用于为笔记结尾准备自然的问题", prompt: `请为以下主题整理 6 个适合放在笔记结尾的开放式问题，引导读者分享真实需求或经验。避免制造焦虑、虚假稀缺和强制互动，不要暗示已经存在的评论、投票或平台反馈。\n\n${context}` },
    ],
  };

  return { scene, sceneLabel: xhsPromptSceneLabels[scene], toneLabel: xhsPromptToneLabels[tone], prompts: promptGroups[scene] };
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

export type ShortVideoStoryboardShot = { label: string; duration: string; framing: string; visual: string; narration: string; purpose: string };
export type ShortVideoStoryboardDraft = { paceNote: string; shots: ShortVideoStoryboardShot[]; checklist: string[] };

const storyboardDurationPlans: Record<DouyinScriptDuration, string[]> = {
  "30": ["3 秒", "4 秒", "7 秒", "8 秒", "5 秒", "3 秒"],
  "60": ["3 秒", "7 秒", "14 秒", "16 秒", "12 秒", "8 秒"],
  "90": ["3 秒", "10 秒", "21 秒", "25 秒", "18 秒", "13 秒"],
};

const storyboardTemplates: Record<DouyinScriptScene, Array<Omit<ShortVideoStoryboardShot, "duration">>> = {
  guide: [
    { label: "开场钩子", framing: "近景", visual: "先展示{topic}完成后的关键效果或最有变化的瞬间。", narration: "如果你正在做{topic}，先看这一步。", purpose: "让观众立刻知道主题" },
    { label: "场景交代", framing: "中景", visual: "用一个稳定画面交代人物、地点和要解决的问题。", narration: "这条视频把{topic}拆成准备、执行和检查三个环节。", purpose: "补足必要背景" },
    { label: "准备动作", framing: "俯拍 / 特写", visual: "按顺序摆出材料或工具，只保留和{topic}直接相关的内容。", narration: "先从最容易忽略的准备开始，做完再进入下一步。", purpose: "让步骤可以照着做" },
    { label: "核心演示", framing: "中近景", visual: "连续拍下关键动作，必要时用字幕标出先后顺序。", narration: "接下来演示实际操作，每次只讲一个重点。", purpose: "呈现可复现过程" },
    { label: "结果检查", framing: "前后对比", visual: "展示完成结果，并补一个常见误区或需要复核的细节。", narration: "最后看结果，也别忘了检查这个容易被忽略的细节。", purpose: "降低照做时的出错率" },
    { label: "收尾动作", framing: "中景", visual: "回到结果画面，留出一秒展示重点字幕和下一步动作。", narration: "如果你准备开始{topic}，可以先保存这套顺序，再按自己的情况调整。", purpose: "给出自然下一步" },
  ],
  review: [
    { label: "开场结论", framing: "使用近景", visual: "从真实使用画面开始，不用片头动画遮住关键内容。", narration: "最近我把{topic}完整体验了一遍，先说结论：适不适合要看使用场景。", purpose: "先建立观看预期" },
    { label: "使用场景", framing: "中景", visual: "展示一次完整使用场景，并交代时间、对象或限制条件。", narration: "这次只从实际使用、优点和限制三个角度讲。", purpose: "避免脱离场景下结论" },
    { label: "真实体验", framing: "手部特写", visual: "拍下最能代表体验的操作细节，保留自然反应。", narration: "先看一次具体使用，再说这个体验对我有什么影响。", purpose: "提供可验证细节" },
    { label: "优点与限制", framing: "分屏 / 对比", visual: "优点和限制各用一个画面说明，避免只展示单方面效果。", narration: "一个真实优点是这里，另一个需要留意的限制是这里。", purpose: "让比较更公平" },
    { label: "适用人群", framing: "中近景", visual: "用文字卡或实拍场景标出适合与不适合的使用情况。", narration: "如果你的使用场景不同，结论也可能不同。", purpose: "帮助观众自我判断" },
    { label: "收尾建议", framing: "自然中景", visual: "回到真实结果或收纳画面，留下清晰的下一步建议。", narration: "如果你也在考虑{topic}，可以先列出自己的场景和预算，再决定是否尝试。", purpose: "收束并避免夸大承诺" },
  ],
  story: [
    { label: "开场变化", framing: "动作近景", visual: "从一个有变化的动作或前后对比切入，不先解释太多。", narration: "我原本以为{topic}很简单，真正做过一遍才发现这个细节。", purpose: "用变化引起兴趣" },
    { label: "时间地点", framing: "环境中景", visual: "补充人物、时间和场景信息，让观众进入当时的状态。", narration: "先还原当时的场景，再说我遇到的问题。", purpose: "建立真实背景" },
    { label: "遇到问题", framing: "细节特写", visual: "拍下问题发生的证据或具体细节，不用抽象形容词代替。", narration: "真正卡住我的，是这个看起来不大的问题。", purpose: "让冲突具体可见" },
    { label: "调整过程", framing: "连续中景", visual: "按开始、转折和调整三个节点拍摄，保留关键尝试。", narration: "我后来换了一个做法，先调整顺序，再观察结果。", purpose: "展示变化怎么发生" },
    { label: "前后结果", framing: "前后对比", visual: "用相近构图对比调整前后，标出真正发生变化的部分。", narration: "调整之后，变化主要出现在这里，其他部分并没有凭空变好。", purpose: "让结果有依据" },
    { label: "经验收尾", framing: "自然中景", visual: "用自然的结果画面收尾，字幕只保留一句经验。", narration: "这就是我这次做{topic}留下的记录，希望能给正在尝试的人一个参考。", purpose: "留下可复用经验" },
  ],
  list: [
    { label: "清单亮相", framing: "俯拍 / 总览", visual: "先亮出{topic}清单主题和数量，画面保持干净。", narration: "今天分享{topic}时，我只保留这几项真正用得上的内容。", purpose: "先说明看点范围" },
    { label: "筛选标准", framing: "中近景", visual: "用一张简短字幕卡说明筛选标准，不堆叠无关信息。", narration: "先说筛选标准，再按顺序展示每一项的特点和使用场景。", purpose: "让清单有判断依据" },
    { label: "项目展示一", framing: "统一中景", visual: "第一项使用统一构图展示，并给出一个明确关键词。", narration: "第一项只讲一个核心理由，适合这个使用场景。", purpose: "降低比较成本" },
    { label: "项目展示二", framing: "统一中景", visual: "第二项保持同样构图，再补充与上一项不同的特点。", narration: "第二项的差异在这里，选择时可以和自己的需求对照。", purpose: "形成可扫读对比" },
    { label: "选择建议", framing: "对比画面", visual: "把不同项目按人群或场景并排，画面只保留关键差异。", narration: "如果更在意这个场景，可以优先看这一项；如果更在意另一个场景，则反过来。", purpose: "帮助快速筛选" },
    { label: "清单收尾", framing: "总览中景", visual: "用清单总览和筛选标准收尾，留出收藏或记录的空间。", narration: "如果你正在找{topic}，可以先收藏这份清单，再按自己的需求筛选。", purpose: "给出克制的下一步" },
  ],
};

const storyboardPaceNotes: Record<DouyinScriptDuration, string> = {
  "30": "30 秒节奏：共 6 个镜头，前 3 秒交代主题，中段只保留一条可复现动作。",
  "60": "60 秒节奏：共 6 个镜头，主体可以补充细节或对比，但每个镜头只承担一个重点。",
  "90": "90 秒节奏：共 6 个镜头，可以加入真实案例和前后对比，仍要避免一段塞入多个结论。",
};

export function generateShortVideoStoryboard(topic: string, scene: DouyinScriptScene = "guide", duration: DouyinScriptDuration = "60"): ShortVideoStoryboardDraft | null {
  const cleanTopic = topic.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!cleanTopic) return null;

  const template = storyboardTemplates[scene];
  const durations = storyboardDurationPlans[duration];
  const replaceTopic = (value: string) => value.replaceAll("{topic}", cleanTopic);
  return {
    paceNote: storyboardPaceNotes[duration],
    shots: template.map((shot, index) => ({
      ...shot,
      duration: durations[index],
      visual: replaceTopic(shot.visual),
      narration: replaceTopic(shot.narration),
    })),
    checklist: ["确认每个画面都能由现有设备和场地拍到。", "把数字、效果、案例和对比换成真实可证明的内容。", "拍摄前确认人物肖像、音乐、素材和场地拥有合法使用权限。"],
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
