/**
 * 场景 02 · 限时秒杀
 *
 * 达标即领，不需要规则说明：进度特效驱动紧迫感，任务清单 + 奖励领取就够。
 * 同一份内核、更少的插件 —— 没装的区块不进产物。
 *
 * 本文件自含全部数据，复制到项目里（npm install vane-activity）即可原样运行。
 * 三项任务全部完成 → 进度 = (1 + 1 + 1) / 3 = 1.0 → 100%，触发庆祝浮层。
 */
import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";

const data: ActivityData = {
  title: "限时秒杀 · 冲刺 100%",
  tasks: [
    { id: "t1", title: "领取秒杀券", progress: 1, status: "completed", actionLabel: "已领取" },
    { id: "t2", title: "加购 3 件商品", progress: 1, status: "completed", actionLabel: "已加购" },
    { id: "t3", title: "20:00 下单", progress: 1, status: "completed", actionLabel: "已下单" },
  ],
  rewards: [
    { id: "r1", title: "5 元秒杀券", threshold: 0.5, icon: "⚡", desc: "加购即得" },
    { id: "r2", title: "免运费权益", threshold: 0.8, icon: "🚚", desc: "下单即送" },
    { id: "r3", title: "整点免单名额", threshold: 1, icon: "🎁", desc: "全部完成抽免单" },
  ],
  rules: "秒杀商品数量有限，下单后 15 分钟内未支付订单自动释放。",
};

// 少装一个 RuleExpandPlugin：规则区整块不进产物，页面更短
const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin({ height: 12 }),
  createTaskListPlugin({ showProgress: false }),
  createRewardClaimPlugin({ claimedLabel: "已领取" }),
]);

// 演示站用的元信息，复制到自己项目时可整段删掉
export const meta = {
  id: "flash",
  title: "限时秒杀",
  group: "促销",
  blurb: "达标即领，无需规则说明：进度特效驱动紧迫感，任务清单与奖励领取就够了。",
  dataNote: "数据内联 · 三项全完成 (1 + 1 + 1) / 3 = 100%",
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
