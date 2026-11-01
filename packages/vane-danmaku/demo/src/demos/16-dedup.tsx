/**
 * 逐项示例 · 去重
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createDedupPlugin } from "vane-danmaku/custom-plugins/DedupPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_MODERATION } from "./lib/LiveDanmaku";

const PLUGINS = [createDedupPlugin({ window: 5 })];

export const meta = {
  slug: "dedup",
  title: "去重",
  group: "content",
  intro: "短时间内重复文本只保留一条，挡住复制粘贴刷屏。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_MODERATION} height={300} />;
}
