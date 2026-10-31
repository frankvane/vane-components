import type { SignInData, SignInCallbacks, ClaimRecord } from "../../../../src";

/**
 * 演示用共享样本数据。
 * 每个插件页都 import 它，避免把同一份构造逻辑重复 17 遍；
 * 页面里展示的源码只暴露「消费侧」用法（import 包名 + 装配插件），
 * 这份构造细节由本文件兜底，真实项目里由接口下发。
 */
export function buildSignInData(signedToday = false): SignInData {
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

  // 距下次可签到约 1 小时，倒计时插件才有内容
  const nextResetAt = Date.now() + 3.6e6;

  const history: ClaimRecord[] = [
    { id: "c1", day: 7, label: "7 天礼包", at: Date.now() - 86_400_000 },
    { id: "c2", day: 3, label: "5 元券", at: Date.now() - 3 * 86_400_000 },
    { id: "c3", day: 1, label: "10 积分", at: Date.now() - 7 * 86_400_000 },
  ];

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
    nextResetAt,
    level: {
      name: "黄金会员",
      current: 680,
      next: 1000,
      progress: 0.68,
    },
    rules: [
      "每日 0 点刷新签到资格，连续签到奖励递增",
      "断签后连签天数清零，但累计天数保留",
      "补签卡可在断签 7 日内补回当日奖励",
      "积分可 1:100 兑换现金券，详见会员中心",
    ],
    history,
  };
}

/** 默认回调：全空操作，页面可传入覆盖（如 sign 置今日已签） */
export function buildCallbacks(
  overrides: Partial<SignInCallbacks> = {}
): SignInCallbacks {
  return {
    sign: () => {},
    claim: () => {},
    makeup: () => {},
    share: () => {},
    remind: () => {},
    invite: () => {},
    ...overrides,
  };
}
