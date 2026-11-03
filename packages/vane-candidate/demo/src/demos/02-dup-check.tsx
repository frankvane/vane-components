import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "dup-check",
  title: "重复候选人检测",
  group: "badge",
  plugin: "DupCheckPlugin",
  intro: "扫描同名 / 同邮箱 / 同手机号的投递，命中者在卡片徽章区挂「疑似重复」警示。",
  why: "候选人重复投递很常见（内推 + 海投同时进行），合并档案前先标记出来。",
  plugs: [
    {
      fn: "createDupCheckPlugin",
      cfg: `{ fields: ["name", "email", "phone"] }`,
      why: "用 signature map 两两比对，任何字段命中即双方都挂警示。",
    },
  ],
  props: [],
  note: "样例里 c-001 与 c-010 同名同邮箱同手机号 —— 两张卡都会出现「疑似重复」。",
};

export default makeStage("DupCheckPlugin");
