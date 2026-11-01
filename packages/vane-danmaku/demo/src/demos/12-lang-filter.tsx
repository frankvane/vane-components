/**
 * 逐项示例 · 语种过滤
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createLangFilterPlugin } from "vane-danmaku/custom-plugins/LangFilterPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_LANG } from "./lib/LiveDanmaku";

const PLUGINS = [createLangFilterPlugin({ allow: ["cjk", "latin"] })];

export const meta = {
  slug: "lang-filter",
  title: "语种过滤",
  group: "content",
  intro: "按 Unicode 脚本放行 / 过滤，比如只留 CJK + 拉丁，挡掉西里尔等。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_LANG} height={300} />;
}
