/**
 * 逐项示例 · 设置面板
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createSettingsPanelPlugin } from "vane-danmaku/custom-plugins/SettingsPanelPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createSettingsPanelPlugin()];

export const meta = {
  slug: "settings-panel",
  title: "设置面板",
  group: "control",
  intro: "浮层控制面板：观众调透明度 / 速度 / 轨道高度（经 bus 广播）。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
