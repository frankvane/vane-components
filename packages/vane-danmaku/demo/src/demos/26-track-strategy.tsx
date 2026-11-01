/**
 * 逐项示例 · 轨道策略
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createTrackStrategyPlugin } from "vane-danmaku/custom-plugins/TrackStrategyPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createTrackStrategyPlugin()];

export const meta = {
  slug: "track-strategy",
  title: "轨道策略",
  group: "layout",
  intro: "重写弹幕的优先轨道分配（如把高优先级弹幕固定到中上区）。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
