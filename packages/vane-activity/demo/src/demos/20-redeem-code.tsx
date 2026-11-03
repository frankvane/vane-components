import React from "react";
import { ActivityCore, withPlugins } from "vane-activity";
import type { ActivityData } from "vane-activity";
import { createRedeemCodePlugin } from "vane-activity/custom-plugins/RedeemCodePlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";

/**
 * RedeemCodePlugin：兑换码，落在 renderRewards 槽且不声明独占，
 * 因此能和 RewardClaimPlugin 的奖励列表上下叠放（这里靠 order 把兑换卡放在上面）。
 *
 * 校验顺序：非空 → 最短长度 8 位 → 前缀 VANE，全过才调 onRedeem；
 * onRedeem 返回 false 时展示「兑换码无效或已被使用」。
 * 示例里只认 VANE-8888（前缀对但码错也会被拒），用来演示失败态。
 *
 * 输入框内容提交时会 trim + 转大写，业务侧拿到的一定是规范化后的码。
 * 本文件自含数据，复制到你的项目即可运行。演示台专用的 meta 导出可整段删掉。
 */
const data: ActivityData = {
  title: "夏日狂欢 · 兑换中心",
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
  createRedeemCodePlugin({
    prefix: "VANE",
    order: 0,
    onRedeem: (code) => {
      // 真实项目里换成接口核销；返回 false 就展示失败文案
      console.log("[redeem]", code);
      return code === "VANE-8888";
    },
  }),
  createRewardClaimPlugin({ order: 1 }),
]);

export const meta = {
  slug: "redeem-code",
  title: "兑换码 RedeemCodePlugin",
  group: "plugin",
  plugins: ["RedeemCodePlugin", "RewardClaimPlugin", "ProgressFxPlugin"],
  intro: "输入框 + 长度/前缀校验 + 成功失败回执；与奖励列表同槽共存。",
};

export default function Stage() {
  return <Activity data={data} />;
}
