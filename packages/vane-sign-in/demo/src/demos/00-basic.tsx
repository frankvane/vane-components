import React, { useState } from "react";
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createStreakStatePlugin } from "vane-sign-in/custom-plugins/StreakStatePlugin";
import { createCalendarStripPlugin } from "vane-sign-in/custom-plugins/CalendarStripPlugin";
import { createRewardPreviewPlugin } from "vane-sign-in/custom-plugins/RewardPreviewPlugin";
import { createMakeupSlotPlugin } from "vane-sign-in/custom-plugins/MakeupSlotPlugin";
import { createTodayCheckInPlugin } from "vane-sign-in/custom-plugins/TodayCheckInPlugin";
import type { SignInData, SignInCallbacks } from "vane-sign-in";
import type { DemoMeta } from "./types";

/**
 * 00 · 最小可用
 *
 * 内核起步：用插件装配出「连签状态 + 日历条 + 奖励预告 + 补签 + 今日签到」。
 * import 是「消费者视角」包名（demo/vite.config.ts 的 alias 指回 src），
 * 页面里展示的源码可以原样复制到真实项目。
 */
export const meta: DemoMeta = {
  slug: "basic",
  title: "最小可用",
  group: "basic",
  intro: "内核 + 五个核心插件跑通装配链路；加插件就是往 withPlugins 数组里加一项。",
};

function buildData(signedToday: boolean): SignInData {
  const calendar = Array.from({ length: 14 }, (_, i) => {
    const day = i + 1;
    const status: SignInData["calendar"][number]["status"] = day < 8
      ? "signed"
      : day === 8 && !signedToday
      ? "today"
      : day === 9
      ? "missed"
      : "future";
    return {
      date: `2026-10-${String(day).padStart(2, "0")}`,
      day,
      status,
      canMakeup: day === 9,
    };
  });
  return {
    todaySigned: signedToday,
    streak: signedToday ? 8 : 7,
    maxStreak: 12,
    totalDays: 132,
    points: 3680,
    calendar,
    rewards: [
      { day: 1, kind: "points", value: 10, label: "10 积分", claimed: true },
      { day: 3, kind: "coupon", value: 5, label: "5 元券", claimed: true },
      { day: 7, kind: "gift", label: "7 天礼包", claimed: true },
      { day: 8, kind: "points", value: 50, label: "50 积分" },
      { day: 10, kind: "badge", label: "闪耀徽章" },
    ],
    makeup: { available: 3, used: 1, max: 3 },
  };
}

const Enhanced = withSignInPlugins(SignInCore, [
  createStreakStatePlugin(),
  createCalendarStripPlugin(),
  createRewardPreviewPlugin(),
  createMakeupSlotPlugin(),
  createTodayCheckInPlugin(),
]);

export default function Stage() {
  const [signed, setSigned] = useState(false);
  const data = buildData(signed);
  const callbacks: SignInCallbacks = {
    sign: () => setSigned(true),
    makeup: () => alert("触发补签"),
    claim: (d) => alert(`领取第 ${d} 天奖励`),
  };
  return (
    <Enhanced
      data={data}
      callbacks={callbacks}
      containerStyle={{ maxWidth: 480, margin: "0 auto" }}
    />
  );
}
