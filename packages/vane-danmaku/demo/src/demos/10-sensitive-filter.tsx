/**
 * 逐项示例 · 敏感词过滤
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createSensitiveFilterPlugin } from "vane-danmaku/custom-plugins/SensitiveFilterPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createSensitiveFilterPlugin({ words: ["广告", "代刷", "违规"], mode: "mask" })];

export const meta = {
  slug: "sensitive-filter",
  title: "敏感词过滤",
  group: "content",
  intro: "命中词按 mode 打码或删除；打码条保留并标记 masked，弹幕流不闪烁。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
