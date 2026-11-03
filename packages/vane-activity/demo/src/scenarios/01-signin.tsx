/**
 * 场景 01 · 每日签到
 *
 * 最完整的活动闭环：进度条 + 任务清单 + 奖励领取 + 规则折叠。
 * 本文件自含全部数据，复制到项目里（npm install vane-activity）即可原样运行。
 *
 * 进度 = 任务完成度加权平均（内核 computeProgress）：
 *   (1 + 0.6 + 0) / 3 ≈ 0.53 → 顶部进度条 53%
 *   → 5 元券（阈值 0.5）可领，20 元券（0.9）与终极大礼包（1）仍锁定。
 */
import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";
import { createRuleExpandPlugin } from "vane-activity/custom-plugins/RuleExpandPlugin";

const data: ActivityData = {
  title: "夏日狂欢 · 7 日签到",
  tasks: [
    {
      id: "t1",
      title: "每日签到",
      desc: "连续签到领积分",
      progress: 1,
      status: "completed",
      actionLabel: "已签到",
    },
    {
      id: "t2",
      title: "浏览会场 3 个商品",
      desc: "了解活动好物",
      progress: 0.6,
      status: "available",
      actionLabel: "去浏览",
      rewardId: "r1",
    },
    {
      id: "t3",
      title: "邀请 1 位好友",
      desc: "助力解锁终极大奖",
      progress: 0,
      status: "locked",
      actionLabel: "去邀请",
      rewardId: "r2",
    },
  ],
  rewards: [
    { id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️", desc: "浏览达标即可领取" },
    { id: "r2", title: "20 元会员券", threshold: 0.9, icon: "💎", desc: "邀请好友后解锁" },
    { id: "r3", title: "终极大礼包", threshold: 1, icon: "🎁", desc: "全部任务完成发放" },
  ],
  rules: [
    { title: "活动时间", content: "2024.07.01 - 2024.07.07，逾期任务与奖励失效。" },
    {
      title: "领取规则",
      content: "奖励按总体进度阈值解锁，达标后点击「领取」发放至账户；券类奖励有效期 7 天。",
    },
    {
      title: "特别说明",
      content: "邀请任务需好友完成注册并首单，视为有效助力；异常账号不予发放。",
    },
  ],
};

// 装配顺序由 priority 决定：10 进度 → 20 任务 → 30 奖励 → 40 规则
const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createTaskListPlugin(),
  createRewardClaimPlugin(),
  createRuleExpandPlugin(),
]);

// 演示站用的元信息，复制到自己项目时可整段删掉
export const meta = {
  id: "signin",
  title: "每日签到",
  group: "签到",
  blurb: "进度条 + 任务清单 + 奖励领取 + 规则折叠，最完整的活动闭环。",
  dataNote: "数据内联 · 加权进度 (1 + 0.6 + 0) / 3 ≈ 53%",
};

export default function Stage() {
  return (
    <Activity
      data={data}
      onTaskAction={(id) => console.log("task action", id)}
      onClaim={(id) => console.log("claim", id)}
    />
  );
}
