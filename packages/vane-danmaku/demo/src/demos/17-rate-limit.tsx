/**
 * 逐项示例 · 单用户限速
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createRateLimitPlugin } from "vane-danmaku/custom-plugins/RateLimitPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_MODERATION } from "./lib/LiveDanmaku";

const PLUGINS = [createRateLimitPlugin({ max: 3, window: 6 })];

export const meta = {
  slug: "rate-limit",
  title: "单用户限速",
  group: "content",
  intro: "限制单用户单位时间内的弹幕条数，防单点刷屏。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_MODERATION} height={300} />;
}
