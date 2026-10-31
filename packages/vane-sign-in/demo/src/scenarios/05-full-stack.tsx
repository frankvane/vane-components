import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import {
  createStreakStatePlugin,
  createPointsBalancePlugin,
  createStatRowPlugin,
  createLevelBadgePlugin,
  createCountdownPlugin,
  createCalendarStripPlugin,
  createCalendarGridPlugin,
  createMakeupSlotPlugin,
  createRewardPreviewPlugin,
  createRewardClaimPlugin,
  createMilestonePlugin,
  createTodayCheckInPlugin,
  createSharePlugin,
  createRemindPlugin,
  createInvitePlugin,
  createRuleExpandPlugin,
  createRewardHistoryPlugin,
} from "vane-sign-in/custom-plugins";
import type { ScenarioMeta } from "./types";
import { buildSignInData, buildCallbacks } from "../demos/lib/sampleData";

/**
 * 05 · 全功能中台（17 插件全量）
 *
 * 一次性把 17 个插件全量装配，展示完整能力边界，也是组合冲突 / 槽位共存的压力测试。
 */
export const meta: ScenarioMeta = {
  id: "full-stack",
  title: "全功能中台 · 17 插件全量",
  group: "全集",
  ref: { label: "组件能力全集", url: "https://vane.dev/examples/sign-in/full" },
  pain: "想一次性看全部 17 个插件怎么共存——全量装配的压力测试。",
  plugs: [
    { fn: "createStreakStatePlugin", why: "头部连签状态" },
    { fn: "createPointsBalancePlugin", why: "积分余额" },
    { fn: "createStatRowPlugin", why: "统计横排" },
    { fn: "createLevelBadgePlugin", why: "等级徽章" },
    { fn: "createCountdownPlugin", why: "刷新倒计时" },
    { fn: "createCalendarStripPlugin", why: "连签条" },
    { fn: "createCalendarGridPlugin", why: "月历网格" },
    { fn: "createMakeupSlotPlugin", why: "补签入口" },
    { fn: "createRewardPreviewPlugin", why: "奖励预告" },
    { fn: "createRewardClaimPlugin", why: "奖励领取" },
    { fn: "createMilestonePlugin", why: "里程碑" },
    { fn: "createTodayCheckInPlugin", why: "今日签到 CTA" },
    { fn: "createSharePlugin", why: "分享" },
    { fn: "createRemindPlugin", why: "提醒" },
    { fn: "createInvitePlugin", why: "邀请" },
    { fn: "createRuleExpandPlugin", why: "规则展开" },
    { fn: "createRewardHistoryPlugin", why: "领取记录" },
  ],
  props: ["data={data}", "callbacks={callbacks}"],
  note: "五个槽位（header/calendar/rewards/actions/footer）同时承载多个插件，靠 priority 决定共存顺序。",
};

const Enhanced = withSignInPlugins(SignInCore, [
  createStreakStatePlugin(),
  createPointsBalancePlugin(),
  createStatRowPlugin(),
  createLevelBadgePlugin(),
  createCountdownPlugin(),
  createCalendarStripPlugin({ showRewardDot: true }),
  createCalendarGridPlugin(),
  createMakeupSlotPlugin(),
  createRewardPreviewPlugin(),
  createRewardClaimPlugin(),
  createMilestonePlugin(),
  createTodayCheckInPlugin(),
  createSharePlugin(),
  createRemindPlugin(),
  createInvitePlugin(),
  createRuleExpandPlugin({ defaultOpen: true }),
  createRewardHistoryPlugin(),
]);

export default function Stage() {
  const [signed, setSigned] = useState(false);
  const data = buildSignInData(signed);
  const callbacks = buildCallbacks({ sign: () => setSigned(true) });
  return (
    <Enhanced
      data={data}
      callbacks={callbacks}
      containerStyle={{ maxWidth: 480, margin: "0 auto" }}
    />
  );
}
