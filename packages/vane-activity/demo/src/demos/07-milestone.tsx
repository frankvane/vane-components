import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createMilestoneBarPlugin } from "vane-activity/custom-plugins/MilestoneBarPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * MilestoneBarPlugin：把每个奖励的阈值映射成轨道节点——
 * 已领取=实心绿 / 已达标可领=警示橙 / 未达标=灰。progress 53% 时：
 * 5 元券（0.5）节点已点亮可领，20 元券（0.9）与终极大礼包（1.0）还是灰点。
 *
 * 与 ProgressFx 同槽共存：数字进度条在上、空间感里程碑在下，一个精确一个直观。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 0.6, status: "available" },
    { id: "t3", title: "邀请 1 位好友", progress: 0, status: "locked" },
  ],
  rewards: [
    { id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️", desc: "浏览达标即可领取" },
    { id: "r2", title: "20 元会员券", threshold: 0.9, icon: "💎", desc: "邀请好友后解锁" },
    { id: "r3", title: "终极大礼包", threshold: 1, icon: "🎁", desc: "全部任务完成发放" },
  ],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createMilestoneBarPlugin(),
  createTaskListPlugin(),
]);

export const meta = {
  slug: "milestone",
  title: "里程碑 MilestoneBarPlugin",
  group: "plugin",
  intro:
    "把奖励阈值画成轨道节点（绿=已领 / 橙=可领 / 灰=未达标），与数字进度条上下互补。",
};

export default function Stage() {
  return <Activity data={data} />;
}
