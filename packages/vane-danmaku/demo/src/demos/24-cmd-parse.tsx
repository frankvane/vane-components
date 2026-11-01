/**
 * 逐项示例 · 互动指令
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createCmdParsePlugin } from "vane-danmaku/custom-plugins/CmdParsePlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_CMDS } from "./lib/LiveDanmaku";

const PLUGINS = [createCmdParsePlugin()];

export const meta = {
  slug: "cmd-parse",
  title: "互动指令",
  group: "interaction",
  intro: "识别 /clear、#lottery 等指令前缀，从渲染流移除并广播事件。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_CMDS} height={300} />;
}
