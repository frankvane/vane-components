import { makeStage } from "./_factory";
import type { DemoMeta } from "./types";

export const meta: DemoMeta = {
  slug: "contact-desensitize",
  title: "联系脱敏",
  group: "plugin",
  plugin: "ContactDesensitizePlugin",
  intro: "对电话 / 邮箱 / 地址做可逆脱敏（138****1234），公开分享时保护隐私。",
  why: "脱敏是可逆的：自己看完整版，发出去的是打码版，收回权限即可还原。",
  plugs: [{ fn: "createContactDesensitizePlugin", cfg: "{}", why: "在隐私遮罩之前改写 contacts，遮蔽已脱敏内容。", }],
  props: [],
};

export default makeStage("ContactDesensitizePlugin");
