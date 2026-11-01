/**
 * 逐项示例 · 表情短码
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createEmojiRenderPlugin } from "vane-danmaku/custom-plugins/EmojiRenderPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createEmojiRenderPlugin()];

export const meta = {
  slug: "emoji-render",
  title: "表情短码",
  group: "content",
  intro: "把 :rocket: 这类短码转成 unicode 表情，canvas 原生绘制。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
