import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";

/**
 * 单插件聚焦：只挂 RewardClaimPlugin。
 * 奖励按钮状态不是自己配的，是按「总体进度 vs 阈值」派生的：
 *   进度 = (1 + 0.6 + 0) / 3 ≈ 0.53（界面 53%）
 *   → 5 元券（阈值 0.5）≤ 进度，可领；20 元券（0.9）与终极大礼包（1.0）锁定。
 * 点击「领取」调 onClaim(id)（接业务发放接口）。
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

const Activity = withPlugins(ActivityCore, [createRewardClaimPlugin()]);

export const meta = {
  slug: "rewardclaim",
  title: "奖励领取 RewardClaimPlugin",
  group: "plugin",
  intro:
    "只挂 RewardClaimPlugin 时，活动只剩「奖励领取」区：按钮状态按「总体进度 vs 阈值」派生（可领 / 已领 / 锁定），点击调 onClaim。",
};

export default function Stage() {
  return <Activity data={data} onClaim={(id) => console.log("claim", id)} />;
}
