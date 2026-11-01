/**
 * 逐项示例 · 高赞置顶
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createPinnedTopPlugin } from "vane-danmaku/custom-plugins/PinnedTopPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createPinnedTopPlugin({ minLevel: 20 })];

export const meta = {
  slug: "pinned-top",
  title: "高赞置顶",
  group: "emphasis",
  intro: "高等级 / 高赞发言固定停在顶部轨道，不参与水平滚动。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
