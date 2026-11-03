import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "contact-mask",
  title: "联系方式脱敏",
  group: "pipeline",
  plugin: "ContactMaskPlugin",
  intro: "把邮箱 / 手机号替换为掩码（138****5678 / a***c@example.com），指定阶段可豁免。",
  why: "简历池一旦外流，联系方式就是核心资产 —— 默认脱敏是合规底线。",
  plugs: [
    {
      fn: "createContactMaskPlugin",
      cfg: `{ maskEmail: {{maskEmail}}, maskPhone: {{maskPhone}} }`,
      why: "transformData 管道末位执行（priority 10），保证排序仍用原始数据。",
    },
  ],
  props: [],
  controls: [
    { key: "maskEmail", label: "脱敏邮箱", kind: "switch", init: true },
    { key: "maskPhone", label: "脱敏手机", kind: "switch", init: true },
  ],
  note: "visibleStages 可豁免后期阶段（如 offer / hired 需要完整联系方式去约人）。",
};

export default makeStage("ContactMaskPlugin");
