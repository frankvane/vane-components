import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createTaskTabsPlugin } from "vane-activity/custom-plugins/TaskTabsPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";

/**
 * TaskTabsPlugin：分组任务清单，独占 renderTasks 槽。
 *
 * 分组由 data.taskGroups 声明，任务用 task.group 归属；每个页签右上角带完成度（1/2）。
 * 内置「全部」页签（key = all）恒存在，聚合所有任务。
 *
 * 独占语义：TaskListPlugin 与 TaskTabsPlugin 都声明了 exclusiveSlots: ["renderTasks"]，
 * 同时装配时按 priority 去重 —— 本插件 22 > TaskList 20，TaskList 会被整体丢弃并在
 * 控制台 warn。所以这里只装 TaskTabs，别再叠一个 TaskList。
 *
 * 进度按全部任务加权：(1 + 1 + 0.5 + 0 + 0 + 0) / 6 ≈ 0.42，5 元券（阈值 0.5）还差一点。
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 任务中心",
  taskGroups: [
    { key: "daily", label: "每日", icon: "📅" },
    { key: "growth", label: "成长", icon: "🌱" },
    { key: "invite", label: "邀请", icon: "🤝" },
  ],
  tasks: [
    { id: "d1", title: "每日签到", desc: "连续签到领积分", progress: 1, status: "completed", group: "daily", actionLabel: "已签到" },
    { id: "d2", title: "浏览 3 个商品", desc: "了解活动好物", progress: 1, status: "completed", group: "daily", actionLabel: "已完成" },
    { id: "g1", title: "收藏店铺", desc: "收藏后抽 20 元券", progress: 0.5, status: "available", group: "growth", actionLabel: "去收藏" },
    { id: "g2", title: "加入会员", desc: "享双倍积分", progress: 0, status: "locked", group: "growth", actionLabel: "去开通" },
    { id: "i1", title: "邀请 1 位好友", desc: "好友下单后到账", progress: 0, status: "locked", group: "invite", actionLabel: "去邀请" },
    { id: "i2", title: "好友助力 3 人", desc: "解锁终极大礼包", progress: 0, status: "locked", group: "invite", actionLabel: "去助力" },
  ],
  rewards: [
    { id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️" },
    { id: "r2", title: "20 元会员券", threshold: 0.9, icon: "💎" },
  ],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createTaskTabsPlugin({ defaultTab: "daily", doneLabel: "已完成" }),
  createRewardClaimPlugin(),
]);

export const meta = {
  slug: "task-tabs",
  title: "分组任务 TaskTabsPlugin",
  group: "plugin",
  plugins: ["TaskTabsPlugin", "ProgressFxPlugin", "RewardClaimPlugin"],
  intro: "页签切换 + 每组完成度计数；独占 renderTasks，与 TaskList 二选一。",
};

export default function Stage() {
  return <Activity data={data} />;
}
