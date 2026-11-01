/**
 * 逐项示例 · 过滤开关
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createFilterTogglePlugin } from "vane-danmaku/custom-plugins/FilterTogglePlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createFilterTogglePlugin()];

export const meta = {
  slug: "filter-toggle",
  title: "过滤开关",
  group: "control",
  intro: "工具条过滤开关：增删对应数据面插件（经 bus 广播）。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
