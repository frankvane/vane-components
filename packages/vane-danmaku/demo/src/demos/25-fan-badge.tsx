/**
 * 逐项示例 · 粉丝牌
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createFanBadgePlugin } from "vane-danmaku/custom-plugins/FanBadgePlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_INTERACTION } from "./lib/LiveDanmaku";

const PLUGINS = [createFanBadgePlugin({ badges: { u1: { name: "老粉", level: 6, color: "#ff7a29" }, u2: { name: "舰长", level: 12, color: "#5fd3c8" } } })];

export const meta = {
  slug: "fan-badge",
  title: "粉丝牌",
  group: "interaction",
  intro: "给指定用户挂粉丝牌（牌底主色 + 等级），由内核绘制。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_INTERACTION} height={300} />;
}
