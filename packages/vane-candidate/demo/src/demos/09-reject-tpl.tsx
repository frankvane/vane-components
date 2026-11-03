import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "reject-tpl",
  title: "婉拒模板",
  group: "action",
  plugin: "RejectTplPlugin",
  intro: "「婉拒」入口打开浮层：选模板 → 预览编辑 → 确认后候选人流转到 rejected。",
  why: "婉拒信一天要发几十封：模板 + 一处编辑框比邮件客户端快得多。",
  plugs: [
    {
      fn: "createRejectTplPlugin",
      cfg: `{ targetStage: "rejected" }`,
      why: "确认婉拒直接把 stage 写到目标阶段（自动留 history），不依赖相邻阶段。",
    },
  ],
  props: [],
  note: "templates 可整体替换内置模板；文案里支持 {{gap}} 这类占位（模板自身的约定）。",
};

export default makeStage("RejectTplPlugin");
