import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createClaimToastPlugin } from "vane-activity/custom-plugins/ClaimToastPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * ClaimToastPlugin：领取成功轻提示（renderOverlay 槽）。
 * 进度 53% 来自 (1 + 0.6 + 0) / 3 ≈ 0.53，于是 5 元券（阈值 0.5）状态是 claimable、
 * 20 元券（0.9）还是 locked —— 点「领取」就会在右下角浮出「已领取：5 元无门槛券」。
 *
 * 首屏已有的领取记录不会补弹；连续领两张会排队显示，各自计时消失。
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
  ],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createTaskListPlugin(),
  createRewardClaimPlugin(),
  createClaimToastPlugin({ durationMs: 2600, position: "bottom-right" }),
]);

export const meta = {
  slug: "claim-toast",
  title: "领取提示 ClaimToastPlugin",
  group: "plugin",
  plugins: ["ClaimToastPlugin", "RewardClaimPlugin", "ProgressFxPlugin", "TaskListPlugin"],
  intro: "领取后右下角淡入「已领取：xx」，2.6s 自动消失；多张排队、互不吞没。",
};

export default function Stage() {
  return <Activity data={data} />;
}
