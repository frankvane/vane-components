/**
 * 逐项示例 · 关键词高亮
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createKeywordHighlightPlugin } from "vane-danmaku/custom-plugins/KeywordHighlightPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createKeywordHighlightPlugin({ keywords: ["福利", "抽奖", "高能"] })];

export const meta = {
  slug: "keyword-highlight",
  title: "关键词高亮",
  group: "emphasis",
  intro: "福利 / 抽奖 / 高能 等关键词染成强调色并加高亮底。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
