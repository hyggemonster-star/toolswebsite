import { TrustPage } from "@/components/TrustPage";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("/contact", "联系与关于", "了解中文效率工具箱的定位、反馈方式和联系信息。");

export default function ContactPage() {
  return <TrustPage title="联系与关于" description="中文效率工具箱面向中文用户整理常见文件、文本、开发和内容处理工具。每项工具的可用状态及处理边界以页面说明为准。" sections={[
    { title: "项目定位", paragraphs: ["本站聚合办公文件、图片、视频音频、内容处理、开发者和日常工具。当前开放工具按页面说明在浏览器本地完成。"] },
    { title: "反馈与问题", paragraphs: ["当前页面暂未提供独立公开邮箱或在线工单入口。遇到工具错误时，请保留页面地址、浏览器版本、文件格式和不含敏感内容的错误现象，再通过项目维护者提供的公开发布渠道反馈。请不要在公开反馈中粘贴密码、密钥、身份证号或原始商业文件。"] },
    { title: "运营信息", paragraphs: ["网站备案信息展示在页面底部。运营主体与公开联系渠道如需补充，将在确认后更新；本页不虚构相关信息。"] },
  ]} />;
}
