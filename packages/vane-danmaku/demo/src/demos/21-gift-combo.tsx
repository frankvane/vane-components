/**
 * 逐项示例 · 礼物连击
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createGiftComboPlugin } from "vane-danmaku/custom-plugins/GiftComboPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_COMBO } from "./lib/LiveDanmaku";

const PLUGINS = [createGiftComboPlugin()];

export const meta = {
  slug: "gift-combo",
  title: "礼物连击",
  group: "emphasis",
  intro: "同一用户连续送同类礼物合并成 xN 连击角标。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_COMBO} height={300} />;
}
