import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createCouponStackPlugin } from "vane-activity/custom-plugins/CouponStackPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/**
 * CouponStackPlugin：奖励渲染成一摞错位的票券卡（RewardClaim 的变体风格）。
 *
 * 独占语义示范：CouponStack 与 RewardClaim 都声明独占 renderRewards 槽位，
 * 同时挂载时装配器只留 priority 高者（RewardClaim 30 > CouponStack 29，
 * 控制台会警告谁被挤出）。想要堆叠风格，就别挂 RewardClaim——本例正是如此。
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
  createCouponStackPlugin(), // 独占 renderRewards（未挂 RewardClaim，所以由它接管）
  createTaskListPlugin(),
]);

export const meta = {
  slug: "coupon-stack",
  title: "券堆叠 CouponStackPlugin",
  group: "plugin",
  intro:
    "票券式卡面替代 RewardClaim 的行式列表；两者同槽独占，同时挂载时高 priority 者胜。",
};

export default function Stage() {
  return (
    <Activity data={data} onClaim={(id) => console.log("claim", id)} />
  );
}
