import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { SignInCore, withSignInPlugins } from "../src";
import { createMakeupSlotPlugin } from "../src/custom-plugins/MakeupSlotPlugin";
import type { SignInData, DayCell } from "../src";
import { mountCard } from "./helpers";

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
    // 固定业务日，避免用例依赖机器当前时间
    todayKey: "2026-11-01",
    ...over,
  };
}

function cell(over: Partial<DayCell> & { date: string }): DayCell {
  return { day: 1, status: "missed", ...over };
}

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * P1-4 · 补签目标选择
 *
 * 旧实现 `calendar.find((c) => c.canMakeup)`：目标完全取决于服务端数组顺序，
 * 且不校验「不晚于今天」，会把未来日期补掉（本该等它变成漏签）。
 */
describe("P1-4 · 补签目标选择", () => {
  it("乱序且含未来日期时，选「不晚于业务日、日期最早」的格", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createMakeupSlotPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({
        calendar: [
          cell({ date: "2026-11-03", day: 10, status: "future", canMakeup: true }),
          cell({ date: "2026-10-31", day: 5, canMakeup: true }),
          cell({ date: "2026-10-30", day: 4, canMakeup: true }),
        ],
      }),
      callbacks: {},
    });

    const btn = () =>
      h.q('[data-testid="si-makeup-btn"]') as HTMLButtonElement;
    // 旧实现会取数组首个 canMakeup 的未来日期 2026-11-03
    expect(btn().dataset.target).toBe("2026-10-30");
    expect(btn().textContent).toBe("补签 · 剩2次");
    expect(btn().disabled).toBe(false);

    h.unmount();
  });

  it("只有未来日期时视为无可补签目标（不会被提前补掉）", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createMakeupSlotPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({
        calendar: [
          cell({ date: "2026-11-03", day: 10, status: "future", canMakeup: true }),
        ],
      }),
      callbacks: {},
    });

    const btn = () =>
      h.q('[data-testid="si-makeup-btn"]') as HTMLButtonElement;
    expect(btn().dataset.target).toBeUndefined();
    expect(btn().textContent).toBe("暂无可补签");
    expect(btn().disabled).toBe(true);

    h.unmount();
  });
});

/**
 * P2-6 · 补签文案两态
 *
 * 旧实现只有「补签次数已用完」一种终态文案：配额还在但无可补目标时也这么写，
 * 用户会误以为配额耗尽。
 */
describe("P2-6 · 补签文案区分「配额耗尽」与「无可补目标」", () => {
  it("配额耗尽 → 专属文案", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createMakeupSlotPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({
        makeup: { available: 3, used: 3, max: 3 },
        calendar: [cell({ date: "2026-10-30", day: 4, canMakeup: true })],
      }),
      callbacks: {},
    });

    const btn = () =>
      h.q('[data-testid="si-makeup-btn"]') as HTMLButtonElement;
    expect(btn().textContent).toBe("补签次数已用完");
    expect(btn().disabled).toBe(true);

    h.unmount();
  });

  it("配额还在但无可补目标 → 另一条文案", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createMakeupSlotPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({ calendar: [] }),
      callbacks: {},
    });

    const btn = () =>
      h.q('[data-testid="si-makeup-btn"]') as HTMLButtonElement;
    expect(btn().textContent).toBe("暂无可补签");
    expect(btn().disabled).toBe(true);

    h.unmount();
  });
});

describe("P1-1 / P0 同款 · 补签在途锁与失败回滚", () => {
  it("点击后带 date + {day} 下发，在途禁用且连点只发一次", async () => {
    const d = deferred();
    const makeup = vi.fn(() => d.promise);
    const Wrapped = withSignInPlugins(SignInCore, [createMakeupSlotPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({
        calendar: [cell({ date: "2026-10-30", day: 4, canMakeup: true })],
      }),
      callbacks: { makeup },
    });

    const btn = () =>
      h.q('[data-testid="si-makeup-btn"]') as HTMLButtonElement;

    await h.click('[data-testid="si-makeup-btn"]');
    expect(makeup).toHaveBeenCalledTimes(1);
    expect(makeup).toHaveBeenCalledWith("2026-10-30", { day: 4 });
    expect(btn().disabled).toBe(true);
    expect(btn().dataset.pending).toBe("true");
    expect(btn().textContent).toBe("补签中…");

    await h.click('[data-testid="si-makeup-btn"]');
    expect(makeup).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
      await Promise.resolve();
    });
    expect(btn().dataset.pending).toBe("false");
    expect(btn().disabled).toBe(false);
    expect(btn().textContent).toBe("补签 · 剩2次");

    h.unmount();
  });

  it("补签失败时回滚 pending 并展示可见错误", async () => {
    const makeup = vi.fn(() => Promise.reject(new Error("补签窗口已关闭")));
    const Wrapped = withSignInPlugins(SignInCore, [createMakeupSlotPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({
        calendar: [cell({ date: "2026-10-30", day: 4, canMakeup: true })],
      }),
      callbacks: { makeup },
    });

    await h.click('[data-testid="si-makeup-btn"]');
    expect(h.q('[data-testid="si-makeup-error"]')?.textContent).toContain(
      "补签窗口已关闭"
    );
    expect(
      (h.q('[data-testid="si-makeup-btn"]') as HTMLButtonElement).disabled
    ).toBe(false);

    h.unmount();
  });
});
