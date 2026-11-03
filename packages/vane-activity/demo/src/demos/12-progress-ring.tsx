import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createProgressRingPlugin } from "vane-activity/custom-plugins/ProgressRingPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * ProgressRingPlugin：环形进度（renderProgress 槽）。
 * 进度 53% 来自任务加权：(1 + 0.6 + 0) / 3 ≈ 0.53 —— 环走一半，中心数字 53。
 * 右侧第二行「距「20 元会员券」还差 37%」是插件自己算的：
 * 在未领取的奖励里找第一个 threshold > 53% 的档位（0.9），0.9 - 0.53 → 37%。
 *
 * 与 ProgressFx 同槽共存：环在上（order 0）、数字条在下（order 1），
 * 一个给「一眼比例」，一个给「精确刻度」。
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
    { id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️" },
    { id: "r2", title: "20 元会员券", threshold: 0.9, icon: "💎" },
    { id: "r3", title: "终极大礼包", threshold: 1, icon: "🎁" },
  ],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createProgressRingPlugin({ size: 112, label: "签到总进度", order: 0 }),
  createProgressFxPlugin({ order: 1 }),
  createTaskListPlugin(),
]);

export const meta = {
  slug: "progress-ring",
  title: "环形进度 ProgressRingPlugin",
  group: "plugin",
  intro: "SVG 双环 + 中心百分比 + 「距下一档还差 N%」；与进度条同槽上下互补。",
};

export default function Stage() {
  return <Activity data={data} />;
}
