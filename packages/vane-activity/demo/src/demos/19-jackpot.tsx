import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createJackpotPlugin } from "vane-activity/custom-plugins/JackpotPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * JackpotPlugin：幸运抽奖九宫格，落在 renderFooter 槽。
 *
 * 奖池固定 8 格（不足自动补「谢谢参与」，超过取前 8），中心是抽取按钮；
 * 点一次先乐观扣 1 次，然后高亮按 8 的倍数走两圈以上、逐渐减速，停在随机中奖格。
 * 次数归零后按钮变「已抽完」并禁用。
 *
 * 不传 onDraw 时中奖结果只展示在卡片里；接后端就传 onDraw 发奖并埋点
 * （次数已由插件扣减，不用回写）。
 *
 * 进度 53% 来自任务加权 (1 + 0.6 + 0) / 3。
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 幸运抽奖",
  tasks: [
    { id: "t1", title: "每日签到", progress: 1, status: "completed" },
    { id: "t2", title: "浏览会场 3 个商品", progress: 0.6, status: "available" },
    { id: "t3", title: "邀请 1 位好友", progress: 0, status: "locked" },
  ],
  rewards: [{ id: "r1", title: "5 元无门槛券", threshold: 0.5, icon: "🎟️" }],
  rules: [],
};

const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createTaskListPlugin(),
  createJackpotPlugin({
    title: "幸运抽奖 · 100% 中奖",
    times: 3,
    prizes: [
      { id: "p1", label: "5 元券", icon: "🎟️" },
      { id: "p2", label: "谢谢参与", icon: "🍬" },
      { id: "p3", label: "20 积分", icon: "⭐" },
      { id: "p4", label: "会员 7 天", icon: "💎" },
      { id: "p5", label: "1 元红包", icon: "🧧" },
      { id: "p6", label: "谢谢参与", icon: "🍬" },
      { id: "p7", label: "免邮券", icon: "📦" },
      { id: "p8", label: "100 积分", icon: "🌟" },
    ],
  }),
]);

export const meta = {
  slug: "jackpot",
  title: "抽奖九宫格 JackpotPlugin",
  group: "plugin",
  plugins: ["JackpotPlugin", "ProgressFxPlugin", "TaskListPlugin"],
  intro: "8 格奖池 + 中心按钮，高亮转两圈减速停格，次数用完自动禁用。",
};

export default function Stage() {
  return <Activity data={data} />;
}
