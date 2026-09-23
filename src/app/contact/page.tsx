import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";

export const metadata: Metadata = {
  title: "联系与关于",
  description: "了解中文效率工具箱的定位、反馈方式和上线联系信息。",
};

export default function ContactPage() {
  return <TrustPage title="联系与关于" description="中文效率工具箱是面向中文用户的轻量工具集合，目标是让常见文件、内容和开发任务打开即可处理。" sections={[
    { title: "项目定位", paragraphs: ["本站聚合办公文件、图片、视频音频、内容创作、智能服务入口、开发者和日常工具。确定性任务优先在浏览器本地完成，需要云端模型服务的内容整理工具会在页面中提示处理边界。"] },
    { title: "反馈与问题", paragraphs: ["当前页面暂未提供独立公开邮箱或在线工单入口。遇到工具错误时，请保留页面地址、浏览器版本、文件格式和不含敏感内容的错误现象，再通过项目维护者提供的公开发布渠道反馈。请不要在公开反馈中粘贴密码、密钥、身份证号或原始商业文件。"] },
    { title: "正式商业上线提示", paragraphs: ["如果将本站作为正式商业服务对外运营，还需要补充经过确认的运营主体、公开联系方式、域名与 HTTPS、适用的法务文本和数据处理安排。本页不虚构主体、备案号、许可证或联系方式。"] },
  ]} />;
}
