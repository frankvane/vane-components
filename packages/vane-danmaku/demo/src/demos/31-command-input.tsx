/**
 * 逐项示例 · 指令输入框
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createCommandInputPlugin } from "vane-danmaku/custom-plugins/CommandInputPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createCommandInputPlugin()];

export const meta = {
  slug: "command-input",
  title: "指令输入框",
  group: "control",
  intro: "底部输入框：观众发弹幕或发 /clear 等指令（经 bus 广播）。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
