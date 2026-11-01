/**
 * 逐项示例 · 关键词硬屏蔽
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createKeywordBlockPlugin } from "vane-danmaku/custom-plugins/KeywordBlockPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_MODERATION } from "./lib/LiveDanmaku";

const PLUGINS = [createKeywordBlockPlugin({ words: ["竞品", "违规"] })];

export const meta = {
  slug: "keyword-block",
  title: "关键词硬屏蔽",
  group: "content",
  intro: "黑名单词直接删除整条（与打码不同：连位置都不留）。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_MODERATION} height={300} />;
}
