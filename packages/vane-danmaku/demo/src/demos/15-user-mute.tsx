/**
 * 逐项示例 · 用户禁言
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createUserMutePlugin } from "vane-danmaku/custom-plugins/UserMutePlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_MODERATION } from "./lib/LiveDanmaku";

const PLUGINS = [createUserMutePlugin({ users: ["bot"] })];

export const meta = {
  slug: "user-mute",
  title: "用户禁言",
  group: "content",
  intro: "把指定用户的全部弹幕从流里剔除（如刷屏机器人）。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_MODERATION} height={300} />;
}
