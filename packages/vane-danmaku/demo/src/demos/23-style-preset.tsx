/**
 * 逐项示例 · 样式预设
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createStylePresetPlugin } from "vane-danmaku/custom-plugins/StylePresetPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createStylePresetPlugin()];

export const meta = {
  slug: "style-preset",
  title: "样式预设",
  group: "emphasis",
  intro: "一键套用字号 / 字体 / 阴影等视觉预设。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
