/**
 * 逐项示例 · 审计旁路
 * 只装一个插件看它的独立行为。源码即正在运行的那份。
 */
import React from "react";
import { createAuditLogPlugin } from "vane-danmaku/custom-plugins/AuditLogPlugin";
import { PluginStage } from "./lib/PluginStage";
import { SAMPLE_BASIC } from "./lib/LiveDanmaku";

const PLUGINS = [createAuditLogPlugin()];

export const meta = {
  slug: "audit-log",
  title: "审计旁路",
  group: "content",
  intro: "旁路记录被拦截/命中的弹幕，不改流，只做统计与风控留痕。",
};

export default function Stage() {
  return <PluginStage plugins={PLUGINS} items={SAMPLE_BASIC} height={300} />;
}
