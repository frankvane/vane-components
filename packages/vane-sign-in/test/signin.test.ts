import { describe, expect, it } from "vitest";
import { createStreakStatePlugin } from "../src/custom-plugins/StreakStatePlugin";
import { createTodayCheckInPlugin } from "../src/custom-plugins/TodayCheckInPlugin";
import type { SignInData } from "../src/components/SignInPlugin/plugins/types";

function baseData(over: Partial<SignInData> = {}): SignInData {
  return {
    todaySigned: false,
    streak: 7,
    maxStreak: 12,
    totalDays: 132,
    points: 3680,
    calendar: [],
    rewards: [],
    makeup: { available: 3, used: 1, max: 3 },
    ...over,
  };
}

describe("createStreakStatePlugin", () => {
  it("返回带 name/priority 的插件定义", () => {
    const p = createStreakStatePlugin();
    expect(p.name).toBe("StreakState");
    expect(p.priority).toBe(10);
    expect(p.hooks.renderHeader).toBeTypeOf("function");
  });

  it("挂载机器可读 meta", () => {
    expect(createStreakStatePlugin.meta.name).toBe("StreakStatePlugin");
  });

  it("renderHeader 渲染连签天数", () => {
    const node = createStreakStatePlugin().hooks.renderHeader!({
      data: baseData(),
    } as any);
    expect(node).toBeTruthy();
  });
});

describe("createTodayCheckInPlugin", () => {
  it("今日已签时禁用态分支不抛错", () => {
    const p = createTodayCheckInPlugin();
    const node = p.hooks.renderActions!({
      data: baseData({ todaySigned: true }),
      callbacks: {},
    } as any);
    expect(node).toBeTruthy();
  });
});
