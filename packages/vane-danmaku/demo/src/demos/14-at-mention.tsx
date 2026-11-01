/**
 * 逐项示例 · @提及高亮
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createAtMentionPlugin } from "vane-danmaku/custom-plugins/AtMentionPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createAtMentionPlugin()];

export const meta = {
  slug: "at-mention",
  title: "@提及高亮",
  group: "content",
  intro: "识别 @用户名，把提及段染成强调色，醒目又不影响其余弹幕。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
