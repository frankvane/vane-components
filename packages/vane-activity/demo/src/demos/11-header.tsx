import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createActivityHeaderPlugin } from "vane-activity/custom-plugins/ActivityHeaderPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * ActivityHeaderPlugin：活动头部横幅（renderHeader 槽，Core 最顶部）。
 * 徽章不是写死的文案，而是由 data.endTime 派生——这里取「当前 + 7 天」，
 * 所以任何时间打开都显示「剩 7 天」，复制走也不会过期。
 *
 * 进度仍是 53%：任务加权 (1 + 0.6 + 0) / 3 ≈ 0.53，
 * 所以进度条停在 53%、5 元券（阈值 0.5）已可领。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 0.6, status: "available" },
    { id: "t3", title: "邀请 1 位好友", progress: 0, status: "locked" },
  ],
  rewards: [
    { id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️" },
    { id: "r2", title: "20 元会员券", threshold: 0.9, icon: "💎" },
  ],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createActivityHeaderPlugin({
    subtitle: "连续签到 7 天，最高领 20 元会员券",
    tags: ["限时", "签到", "新人专享"],
    icon: "☀️",
  }),
  createProgressFxPlugin(),
  createTaskListPlugin(),
]);

export const meta = {
  slug: "header",
  title: "头部横幅 ActivityHeaderPlugin",
  group: "plugin",
  intro: "标题 + 副标题 + 标签 + 状态徽章；徽章由 data.endTime 派生，不写死文案。",
};

export default function Stage() {
  return <Activity data={data} />;
}
