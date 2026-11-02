import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "privacy-mask",
  title: "隐私遮罩",
  group: "plugin",
  plugin: "PrivacyMaskPlugin",
  intro: "一键进入隐私模式：整页毛玻璃视觉遮挡 + 敏感字段数据级隐藏（默认为概述与联系方式）。毛玻璃不防复制，敏感信息请依赖字段隐藏 / 脱敏。",
  why: "简历里手机号真金白银，发给陌生人前先一键打码最稳妥。",
  plugs: [{ fn: "createPrivacyMaskPlugin", cfg: "{}", why: "遮罩经 overlay 渲染，优先级靠后确保盖在最上。", }],
  props: [],
};

export default makeStage("PrivacyMaskPlugin");
