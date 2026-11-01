import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { SignInCore, withSignInPlugins } from "../src";
import { createTodayCheckInPlugin } from "../src/custom-plugins/TodayCheckInPlugin";
import { createCountdownPlugin } from "../src/custom-plugins/CountdownPlugin";
import type { SignInData } from "../src";
import { mountCard } from "./helpers";

function baseData(over: Partial<SignInData> = {}): SignInData {
  return {
    todaySigned: true,
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

afterEach(() => {
  vi.useRealTimers();
});

/**
 * P1-3 · 跨夜复位
 *
 * 旧实现只在渲染那一帧读 Date.now()：页面开着跨过 00:00 后，
 * `disabled={todaySigned}` 仍把按钮锁死，用户必须手动刷新才能签到。
 */
describe("P1-3 · 跨夜后签到 CTA 自动复位", () => {
  it("跨过 nextResetAt 后，已签按钮自动解除禁用", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 1, 23, 59, 30));
    const resetAt = new Date(2026, 10, 2, 0, 0, 0).getTime();

    const Wrapped = withSignInPlugins(SignInCore, [createTodayCheckInPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({ todaySigned: true, nextResetAt: resetAt }),
      callbacks: {},
    });
    const btn = () =>
      h.q('[data-testid="si-checkin-btn"]') as HTMLButtonElement;

    expect(btn().disabled).toBe(true);
    expect(btn().textContent).toBe("今日已签 ✓");

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(btn().disabled).toBe(false);
    expect(btn().dataset.signed).toBe("false");
    expect(btn().textContent).toBe("立即签到");

    h.unmount();
  });

  it("缺 nextResetAt 时用业务日键 todayKey 兜底判定跨日", async () => {
    vi.useFakeTimers();
    // 本地时区 2026-11-01 23:59:30，业务日仍为 2026-11-01
    vi.setSystemTime(new Date(2026, 10, 1, 23, 59, 30));

    const Wrapped = withSignInPlugins(SignInCore, [createTodayCheckInPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({ todaySigned: true, todayKey: "2026-11-01" }),
      callbacks: {},
    });
    const btn = () =>
      h.q('[data-testid="si-checkin-btn"]') as HTMLButtonElement;

    expect(btn().disabled).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    // 跨到 2026-11-02：toDayKey(now) !== todayKey → 旧 todaySigned 视为过期
    expect(btn().disabled).toBe(false);
    expect(btn().textContent).toBe("立即签到");

    h.unmount();
  });
});

/**
 * P1-3 · 倒计时 tick
 *
 * 旧实现 `const diff = nextResetAt - Date.now()` 只在渲染时算一次，文案永远不变；
 * 长周期还会显示「51小时0分」。
 */
describe("P1-3 · 倒计时随时钟 tick 且使用天单位", () => {
  it("每秒刷新文案，过期后显示「现在可签到」", async () => {
    vi.useFakeTimers();
    const t0 = new Date(2026, 10, 1, 12, 0, 0).getTime();
    vi.setSystemTime(t0);
    const resetAt = t0 + 2 * 86_400_000 + 3 * 3_600_000 + 40 * 60_000;

    const Wrapped = withSignInPlugins(SignInCore, [createCountdownPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({ todaySigned: true, nextResetAt: resetAt }),
      callbacks: {},
    });
    const text = () => h.container.textContent ?? "";

    expect(text()).toContain("2天3小时");

    await act(async () => {
      vi.advanceTimersByTime(3_600_000);
    });
    expect(text()).toContain("2天2小时");

    await act(async () => {
      vi.advanceTimersByTime(2 * 86_400_000 + 3 * 3_600_000);
    });
    expect(text()).toContain("现在可签到");

    h.unmount();
  });
});

/**
 * P1-3 · 回到前台校正
 *
 * 页面从后台切回时，时钟要立刻校正并请求宿主刷新数据（避免长时间挂起后
 * 仍展示旧的 todaySigned / nextResetAt）。
 */
describe("P1-3 · 回到前台触发 refresh", () => {
  it("focus / visibilitychange 各触发一次 callbacks.refresh", async () => {
    const refresh = vi.fn();
    const Wrapped = withSignInPlugins(SignInCore, [createTodayCheckInPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({ todaySigned: false }),
      callbacks: { refresh },
    });

    expect(refresh).toHaveBeenCalledTimes(0);

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(refresh).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(refresh).toHaveBeenCalledTimes(2);

    h.unmount();
  });
});
