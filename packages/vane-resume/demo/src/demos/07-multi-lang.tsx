import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "multi-lang",
  title: "多语言",
  group: "plugin",
  plugin: "MultiLangPlugin",
  intro: "在预设语言间切换，整体翻译文本字段；缺失字段保留原文降级。",
  why: "投外企 / 海外岗需要中英双语，逐字段手写两套成本太高。",
  plugs: [{ fn: "createMultiLangPlugin", cfg: "{}", why: "经 transformData 注入翻译后的文本字段。", }],
  props: [],
};

export default makeStage("MultiLangPlugin");
