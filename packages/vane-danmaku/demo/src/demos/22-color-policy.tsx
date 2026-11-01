/**
 * 逐项示例 · 角色配色
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createColorPolicyPlugin } from "vane-danmaku/custom-plugins/ColorPolicyPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createColorPolicyPlugin()];

export const meta = {
  slug: "color-policy",
  title: "角色配色",
  group: "emphasis",
  intro: "按用户角色（普通 / 粉丝 / 超管）给弹幕上色，一眼区分。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
