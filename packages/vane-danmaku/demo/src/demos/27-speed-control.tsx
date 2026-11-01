/**
 * 逐项示例 · 速度控制
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createSpeedControlPlugin } from "vane-danmaku/custom-plugins/SpeedControlPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createSpeedControlPlugin({ factor: 1 })];

export const meta = {
  slug: "speed-control",
  title: "速度控制",
  group: "layout",
  intro: "整体加快 / 放慢弹幕飞行速度，适配不同视频节奏。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
