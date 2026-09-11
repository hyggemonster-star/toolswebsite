import { createPdfFromImages, type PdfOutput } from "./pdf";

export const MAX_TEXT_PDF_PAGES = 20;

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_MARGIN = 96;
const TEXT_SIZE = 30;
const LINE_HEIGHT = 48;

function wrapLine(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  const characters = Array.from(value);
  if (!characters.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const character of characters) {
    const candidate = current + character;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function canvasToJpegFile(canvas: HTMLCanvasElement, pageNumber: number) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("无法生成 PDF 页面图像。 ")), "image/jpeg", 0.92);
  });
  return new File([blob], `text-page-${String(pageNumber).padStart(3, "0")}.jpg`, { type: "image/jpeg" });
}

export async function createTextPdf(text: string, name: string): Promise<PdfOutput> {
  const pages: File[] = [];
  type PageState = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D };
  function createPage(): PageState {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器不支持 Canvas PDF 排版。 ");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.fillStyle = "#17233f";
    context.font = `${TEXT_SIZE}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
    context.textBaseline = "top";
    return { canvas, context };
  }
  async function flushPage(page: PageState) {
    pages.push(await canvasToJpegFile(page.canvas, pages.length + 1));
  }

  let page = createPage();
  let y = PAGE_MARGIN;
  const maxWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  for (const paragraph of text.split(/\r?\n/)) {
    const lines = wrapLine(page.context, paragraph, maxWidth);
    for (const line of lines) {
      if (y + LINE_HEIGHT > PAGE_HEIGHT - PAGE_MARGIN) {
        await flushPage(page);
        if (pages.length >= MAX_TEXT_PDF_PAGES) throw new Error(`正文超过 ${MAX_TEXT_PDF_PAGES} 页，请先拆分文件。 `);
        page = createPage();
        y = PAGE_MARGIN;
      }
      page.context.fillText(line, PAGE_MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += LINE_HEIGHT * 0.35;
  }
  await flushPage(page);
  return createPdfFromImages(pages, name);
}
