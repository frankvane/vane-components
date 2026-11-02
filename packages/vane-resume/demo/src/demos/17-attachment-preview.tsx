import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "attachment-preview",
  title: "附件预览",
  group: "plugin",
  plugin: "AttachmentPreviewPlugin",
  intro: "列出附件卡片（PDF / 图片 / 链接），点击在灯箱中预览；items 会合并进 data.attachments。",
  why: "作品集、证书扫描件随简历一并提供，HR 点开即看。",
  plugs: [
    {
      fn: "createAttachmentPreviewPlugin",
      cfg: `items: [{ name: "作品集", kind: "pdf", url: "https://x.com/p.pdf" }]`,
      why: "renderAttachments 渲染卡片网格，renderOverlay 承载灯箱。",
    },
  ],
  props: [],
};

export default makeStage("AttachmentPreviewPlugin");
