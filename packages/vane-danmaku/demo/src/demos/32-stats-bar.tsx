/**
 * 逐项示例 · 统计条
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createStatsBarPlugin } from "vane-danmaku/custom-plugins/StatsBarPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createStatsBarPlugin()];

export const meta = {
  slug: "stats-bar",
  title: "统计条",
  group: "control",
  intro: "工具条统计条：展示实时弹幕数等指标（经 bus 广播）。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
