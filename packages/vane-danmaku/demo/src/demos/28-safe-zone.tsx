/**
 * 逐项示例 · 防遮挡安全区
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createSafeZonePlugin } from "vane-danmaku/custom-plugins/SafeZonePlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createSafeZonePlugin({ reservedBands: { top: 0.2, bottom: 0.14 } })];

export const meta = {
  slug: "safe-zone",
  title: "防遮挡安全区",
  group: "control",
  intro: "默认静态安全区（顶/底条带）；也可注入 MediaPipe 实时避让区（见场景 02）。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
