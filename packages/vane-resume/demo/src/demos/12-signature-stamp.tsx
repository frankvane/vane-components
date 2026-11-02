import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "signature-stamp",
  title: "电子落款",
  group: "plugin",
  plugin: "SignatureStampPlugin",
  intro: "文末追加签名（姓名 / 手写图）+ 签署日期；可选 CSS 圆形印章作角标（renderOverlay）。",
  why: "正式投递 / 确认稿需要落款与印章，手动拼容易破坏布局。",
  plugs: [
    {
      fn: "createSignatureStampPlugin",
      cfg: `name: "林清扬", stamp: "{{stamp}}"`,
      why: "renderFooter 加签名行；stamp 为 seal 时再叠加右上角印章角标。",
    },
  ],
  controls: [
    {
      key: "stamp",
      label: "印章",
      kind: "select",
      init: "seal",
      options: [
        { label: "圆形印章", value: "seal" },
        { label: "无印章", value: "none" },
      ],
    },
  ],
  props: [],
};

export default makeStage("SignatureStampPlugin");
