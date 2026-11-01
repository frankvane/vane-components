import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { SignInCore, withSignInPlugins } from "../src";
import { createTodayCheckInPlugin } from "../src/custom-plugins/TodayCheckInPlugin";
import { createRewardClaimPlugin } from "../src/custom-plugins/RewardClaimPlugin";
import { createRemindPlugin } from "../src/custom-plugins/RemindPlugin";
import type { SignInData, SignInCallbacks } from "../src";
import { mountCard } from "./helpers";

function baseData(over: Partial<SignInData> = {}): SignInData {
  return {
    todaySigned: false,
    streak: 7,
    maxStreak: 12,
    totalDays: 132,
    points: 3680,
    calendar: [
      { date: "2026-11-01", day: 8, status: "today" },
    ],
    rewards: [{ day: 8, kind: "points", value: 50, label: "50 积分" }],
    makeup: { available: 3, used: 1, max: 3 },
    ...over,
  };
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
 * P0-1 · 签到 / 领奖在途锁
 *
 * 旧实现 `disabled={todaySigned}` + `onClick={() => ctx.callbacks.sign?.()}`：
 * 请求飞行期间按钮始终可点，双击会并发发出多个签到请求。
 */
describe("P0-1 · 签到在途锁", () => {
  it("请求未返回时置 pending + 禁用，连点三次只发一次 sign", async () => {
    const d = deferred();
    const sign = vi.fn(() => d.promise);
    const Wrapped = withSignInPlugins(SignInCore, [createTodayCheckInPlugin()]);
    const h = mountCard(Wrapped, { data: baseData(), callbacks: { sign } });
    const btn = () =>
      h.q('[data-testid="si-checkin-btn"]') as HTMLButtonElement;

    await h.click('[data-testid="si-checkin-btn"]');
    expect(sign).toHaveBeenCalledTimes(1);
    expect(btn().disabled).toBe(true);
    expect(btn().dataset.pending).toBe("true");
    expect(btn().textContent).toBe("签到中…");

    // 在途期间继续点击：按钮 disabled + handler 内 ref 去重，双保险
    await h.click('[data-testid="si-checkin-btn"]');
    await h.click('[data-testid="si-checkin-btn"]');
    expect(sign).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
      await Promise.resolve();
    });
    // 成功不做乐观已签：仍以宿主的 data.todaySigned 为准
    expect(btn().dataset.pending).toBe("false");
    expect(btn().disabled).toBe(false);
    expect(btn().textContent).toBe("立即签到");
    expect(btn().dataset.signed).toBe("false");

    h.unmount();
  });

  it("回调失败时回滚 pending 并展示可见错误，按钮可重试", async () => {
    const sign = vi.fn(() => Promise.reject(new Error("网络异常")));
    const Wrapped = withSignInPlugins(SignInCore, [createTodayCheckInPlugin()]);
    const h = mountCard(Wrapped, { data: baseData(), callbacks: { sign } });
    const btn = () =>
      h.q('[data-testid="si-checkin-btn"]') as HTMLButtonElement;

    await h.click('[data-testid="si-checkin-btn"]');
    expect(sign).toHaveBeenCalledTimes(1);
    expect(btn().disabled).toBe(false);
    expect(btn().dataset.pending).toBe("false");
    expect(btn().textContent).toBe("立即签到");
    expect(h.q('[data-testid="si-checkin-error"]')?.textContent).toContain(
      "网络异常"
    );

    // 重试：错误先被清掉，请求再次下发
    await h.click('[data-testid="si-checkin-btn"]');
    expect(sign).toHaveBeenCalledTimes(2);

    h.unmount();
  });

  it("宿主回写 data.lastError 时 CTA 直接展示可见反馈", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createTodayCheckInPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({ lastError: { code: "ALREADY_SIGNED", message: "今日已签到" } }),
      callbacks: {},
    });
    expect(h.q('[data-testid="si-checkin-error"]')?.textContent).toBe(
      "今日已签到"
    );
    h.unmount();
  });

  it("默认错误文案在回调返回非 Error 值时仍可见", async () => {
    const sign = vi.fn(() => Promise.reject("boom"));
    const Wrapped = withSignInPlugins(SignInCore, [
      createTodayCheckInPlugin({ errorText: "签到失败，请稍后再试" }),
    ]);
    const h = mountCard(Wrapped, { data: baseData(), callbacks: { sign } });
    await h.click('[data-testid="si-checkin-btn"]');
    expect(h.q('[data-testid="si-checkin-error"]')?.textContent).toBe(
      "boom"
    );
    h.unmount();
  });
});

describe("P0-1 · 领奖在途锁", () => {
  it("领取请求在途时禁用按钮，连点只发一次 claim", async () => {
    const d = deferred();
    const claim = vi.fn(() => d.promise);
    const Wrapped = withSignInPlugins(SignInCore, [createRewardClaimPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({ streak: 8 }),
      callbacks: { claim } as SignInCallbacks,
    });
    const btn = () =>
      h.q('[data-testid="si-claim-btn"]') as HTMLButtonElement;

    await h.click('[data-testid="si-claim-btn"]');
    expect(claim).toHaveBeenCalledTimes(1);
    expect(claim).toHaveBeenCalledWith(8);
    expect(btn().disabled).toBe(true);
    expect(btn().textContent).toBe("领取中…");

    await h.click('[data-testid="si-claim-btn"]');
    expect(claim).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
      await Promise.resolve();
    });
    expect(btn().disabled).toBe(false);
    h.unmount();
  });

  it("领取失败展示错误并回滚", async () => {
    const claim = vi.fn(() => Promise.reject(new Error("已过期")));
    const Wrapped = withSignInPlugins(SignInCore, [createRewardClaimPlugin()]);
    const h = mountCard(Wrapped, { data: baseData({ streak: 8 }), callbacks: { claim } });

    await h.click('[data-testid="si-claim-btn"]');
    expect(h.q('[data-testid="si-claim-error"]')?.textContent).toContain(
      "已过期"
    );
    expect(
      (h.q('[data-testid="si-claim-btn"]') as HTMLButtonElement).disabled
    ).toBe(false);
    h.unmount();
  });

  it("奖励乱序时优先领取 day 最小的待领奖励", () => {
    const Wrapped = withSignInPlugins(SignInCore, [createRewardClaimPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData({
        streak: 8,
        rewards: [
          { day: 8, kind: "points", value: 50, label: "50 积分" },
          { day: 3, kind: "coupon", value: 5, label: "5 元券" },
        ],
      }),
      callbacks: {},
    });
    expect(
      (h.q('[data-testid="si-claim-btn"]') as HTMLButtonElement).dataset.day
    ).toBe("3");
    h.unmount();
  });
});

/**
 * P1-1 / P2-5 · Remind 开关
 *
 * 旧实现「先乐观切换、返回值丢弃」：持久化失败后 UI 永久停在「已开启」，
 * 且声明的 defaultOn 配置从未被读取。
 */
describe("P1-1 · 提醒开关失败回滚", () => {
  it("remind reject 后开关回原态并展示错误", async () => {
    const remind = vi.fn(() => Promise.reject(new Error("保存失败")));
    const Wrapped = withSignInPlugins(SignInCore, [createRemindPlugin()]);
    const h = mountCard(Wrapped, {
      data: baseData(),
      callbacks: { remind },
    });
    const btn = () =>
      h.q('[data-testid="si-remind-btn"]') as HTMLButtonElement;

    expect(btn().dataset.on).toBe("false");

    await h.click('[data-testid="si-remind-btn"]');

    // 失败回滚：回到点击前的 false，而不是停在乐观的 true
    expect(btn().dataset.on).toBe("false");
    expect(btn().getAttribute("aria-pressed")).toBe("false");
    expect(h.q('[data-testid="si-remind-error"]')?.textContent).toContain(
      "保存失败"
    );

    h.unmount();
  });

  it("defaultOn 作为初始值；data.remindEnabled 优先", () => {
    const Wrapped = withSignInPlugins(SignInCore, [
      createRemindPlugin({ defaultOn: true }),
    ]);
    const h = mountCard(Wrapped, { data: baseData(), callbacks: {} });
    expect(
      (h.q('[data-testid="si-remind-btn"]') as HTMLButtonElement).dataset.on
    ).toBe("true");
    h.unmount();

    const WrappedControlled = withSignInPlugins(SignInCore, [
      createRemindPlugin({ defaultOn: true }),
    ]);
    const h2 = mountCard(WrappedControlled, {
      data: baseData({ remindEnabled: false }),
      callbacks: {},
    });
    expect(
      (h2.q('[data-testid="si-remind-btn"]') as HTMLButtonElement).dataset.on
    ).toBe("false");
    h2.unmount();
  });
});
