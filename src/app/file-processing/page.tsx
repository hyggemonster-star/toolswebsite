import { TrustPage } from "@/components/TrustPage";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("/file-processing", "文件处理说明", "了解中文效率工具箱的本地文件处理边界、格式限制和下载注意事项。");

export default function FileProcessingPage() {
  return <TrustPage title="文件处理说明" description="不同工具的处理位置和能力边界不同。选择工具时，请先看页面提示的本地处理、格式和输出说明。" sections={[
    { title: "浏览器本地处理", paragraphs: ["当前开放的图片、文本和文件工具在浏览器本地运行。选择文件后，浏览器会在当前设备上读取和处理；文件不会上传到本站服务器。", "本地处理依赖设备内存、浏览器能力和文件大小。页面关闭或刷新后，未下载的临时结果可能消失。"] },
    { title: "格式和输出", bullets: ["复杂 PDF、扫描件、表格、字体、动画和原版式不保证完整保留。", "下载后请用目标软件打开检查，尤其是需要提交、打印或再次编辑的文件。", "不支持的格式会给出错误提示；未上线工具不会伪造结果。", "处理前建议保留原文件备份，并确认输出文件的扩展名和用途。"] },
  ]} />;
}
