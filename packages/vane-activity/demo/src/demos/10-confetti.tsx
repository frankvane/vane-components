import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createConfettiPlugin } from "vane-activity/custom-plugins/ConfettiPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * ConfettiPlugin：进度达成 100% 时容器内下落彩纸。
 *
 * 浮层共存示范：overlay 槽位天然可叠加、不声明独占——本例同时挂 ProgressFx
 * （自带「🎉 进度达成 100%」文字横幅）与 Confetti（彩纸层），两者同屏。
 * 想要「提前庆祝」可以配 threshold（如 0.9）。
 *
 * 进度 = (1 + 1 + 1) / 3 = 1.0 → 100%，终极大礼包（阈值 1）也可领取。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 1, status: "completed" },
    { id: "t3", title: "邀请 1 位好友", progress: 1, status: "completed" },
  ],
  rewards: [
    { id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️", desc: "浏览达标即可领取" },
    { id: "r2", title: "20 元会员券", threshold: 0.9, icon: "💎", desc: "邀请好友后解锁" },
    { id: "r3", title: "终极大礼包", threshold: 1, icon: "🎁", desc: "全部任务完成发放" },
  ],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(), // 文字横幅浮层（overlay priority 10）
  createConfettiPlugin(), // 彩纸层浮层（overlay priority 50，共存不互斥）
  createRewardClaimPlugin(),
  createTaskListPlugin(),
]);

export const meta = {
  slug: "confetti",
  title: "彩纸庆祝 ConfettiPlugin",
  group: "plugin",
  intro:
    "100% 时彩纸下落；与 ProgressFx 的文字横幅同屏共存——overlay 槽位可叠加、不独占。",
};

export default function Stage() {
  return (
    <Activity data={data} onClaim={(id) => console.log("claim", id)} />
  );
}
