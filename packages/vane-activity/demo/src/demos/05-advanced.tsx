import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";
import { createRuleExpandPlugin } from "vane-activity/custom-plugins/RuleExpandPlugin";

/**
 * 进阶：四个插件都传了配置，并用「任务全完成」的数据触发 100% 庆祝浮层。
 * 这是生产里最常见的形态——进度条加高、完成态 / 已领态文案本地化、规则折叠到 2 行。
 *
 * 进度 = (1 + 1 + 1) / 3 = 1.0 → 界面 100%，三个奖励全部解锁（终极大礼包可领），
 * 顶部弹出「🎉 进度达成 100%」。
 *
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
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
      progress: 1,
      status: "completed",
      actionLabel: "已浏览",
    },
    {
      id: "t3",
      title: "邀请 1 位好友",
      desc: "助力解锁终极大奖",
      progress: 1,
      status: "completed",
      actionLabel: "已邀请",
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

const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin({ height: 12 }),
  createTaskListPlugin({ showProgress: true, doneLabel: "搞定" }),
  createRewardClaimPlugin({ claimedLabel: "已到账" }),
  createRuleExpandPlugin({ collapsedLines: 2 }),
]);

export const meta = {
  slug: "advanced",
  title: "进阶：带配置的完整闭环 + 100% 庆祝",
  group: "advanced",
  plugins: ["ProgressFxPlugin", "TaskListPlugin", "RewardClaimPlugin", "RuleExpandPlugin"],
  intro:
    "四个插件都传了配置（进度条加高、完成态文案、已领文案、规则折叠到 2 行），并用全完成任务触发 100% 庆祝浮层——生产里最常见的形态。",
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
