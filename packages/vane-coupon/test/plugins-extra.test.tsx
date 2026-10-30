import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { createCouponCard } from "../src";
import type { CouponData, CouponPlugin } from "../src";
import { createProgressPlugin } from "../src/custom-plugins/ProgressPlugin";
import { createQuotaPlugin } from "../src/custom-plugins/QuotaPlugin";
import { createCountdownPlugin } from "../src/custom-plugins/CountdownPlugin";
import { createChannelPlugin } from "../src/custom-plugins/ChannelPlugin";
import { createSharePlugin } from "../src/custom-plugins/SharePlugin";
import { createRemindPlugin } from "../src/custom-plugins/RemindPlugin";
import { createCopyCodePlugin } from "../src/custom-plugins/CopyCodePlugin";
import { createHistoryPlugin } from "../src/custom-plugins/HistoryPlugin";
import { createAnalyticsPlugin } from "../src/custom-plugins/AnalyticsPlugin";
import { createDetailLinkPlugin } from "../src/custom-plugins/DetailLinkPlugin";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const base: CouponData = { id: "x1", title: "扩展插件测试券", amount: 10, threshold: 0 };

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  container = null;
  root = null;
});

async function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(ui);
  });
  return container;
}

const q = (sel: string) => container!.querySelector(sel);
const qq = (sel: string) => container!.querySelectorAll(sel);
const click = async (sel: string) => {
  const el = q(sel) as HTMLElement;
  expect(el).toBeTruthy();
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
  });
};

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const waitFor = async (cond: () => boolean, tries = 100) => {
  for (let i = 0; i < tries && !cond(); i++) await tick();
};

describe("ProgressPlugin", () => {
  it("渲染进度与百分比；剩余少时紧迫", async () => {
    const Coupon = createCouponCard([createProgressPlugin()]);
    await mount(React.createElement(Coupon, { coupon: { ...base, total: 100, claimed: 30 } }));
    const el = q('[data-testid="coupon-progress"]') as HTMLElement;
    expect(el.dataset.percent).toBe("30");
    expect(el.dataset.urgent).toBe("false");
    expect(el.textContent).toContain("已抢 30%");
  });

  it("urgentPct 生效；无 total 渲染 null；config 可覆盖", async () => {
    const Coupon = createCouponCard([createProgressPlugin({ urgentPct: 10 })]);
    await mount(React.createElement(Coupon, { coupon: { ...base, total: 100, claimed: 95 } }));
    const el = q('[data-testid="coupon-progress"]') as HTMLElement;
    expect(el.dataset.urgent).toBe("true");
    expect(el.textContent).toContain("仅剩 5 张");

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    await mount(React.createElement(Coupon, { coupon: base })); // 无 total
    expect(q('[data-testid="coupon-progress"]')).toBeNull();

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    const Override = createCouponCard([createProgressPlugin({ total: 10, claimed: 2 })]);
    await mount(React.createElement(Override, { coupon: base }));
    expect((q('[data-testid="coupon-progress"]') as HTMLElement).dataset.percent).toBe("20");
  });
});

describe("QuotaPlugin", () => {
  it("渲染限领提示；超限红字 + state.quotaReached", async () => {
    let exceeded = 0;
    const Coupon = createCouponCard([createQuotaPlugin({ quota: 2, purchasedCount: 2, onExceed: () => (exceeded += 1) })]);
    await mount(React.createElement(Coupon, { coupon: base }));
    const el = q('[data-testid="coupon-quota"]') as HTMLElement;
    expect(el.dataset.reached).toBe("true");
    expect(el.textContent).toContain("已达限领上限");
    expect(exceeded).toBe(1);
  });

  it("未声明 quota 渲染 null", async () => {
    const Coupon = createCouponCard([createQuotaPlugin()]);
    await mount(React.createElement(Coupon, { coupon: base }));
    expect(q('[data-testid="coupon-quota"]')).toBeNull();
  });
});

describe("CountdownPlugin", () => {
  it("未到点渲染倒计时；到点 onFire + autoStart 进入 available", async () => {
    let fired = 0;
    const Coupon = createCouponCard([
      createCountdownPlugin({ startAt: Date.now() + 120, tickMs: 20, autoStart: true, onFire: () => (fired += 1) }),
    ]);
    await mount(React.createElement(Coupon, { coupon: base }));
    const cd = () => q('[data-testid="coupon-countdown-value"]');
    // 倒计时首跳在 setTimeout(0) 之后，等渲染出来
    await waitFor(() => !!cd());
    expect(cd()!.textContent).toContain("距开抢");

    await waitFor(() => fired > 0);
    expect(q('[data-testid="coupon-countdown-value"]')).toBeNull();
    // 本用例未装 ClaimStatePlugin，相位标在核心根节点上（coupon-claim-btn 是 ClaimState 的 testid）
    const rootEl = () => q('[data-testid="coupon-root"]') as HTMLElement;
    await waitFor(() => rootEl()?.dataset.phase === "available");
    expect(rootEl()?.dataset.phase).toBe("available");
  });
});

describe("ChannelPlugin", () => {
  it("渲染渠道小标；数据驱动与 config 驱动", async () => {
    const Coupon = createCouponCard([createChannelPlugin()]);
    await mount(React.createElement(Coupon, { coupon: { ...base, channels: ["仅 APP", "仅新客"] } }));
    expect(qq('[data-testid="coupon-channel-badge"]').length).toBe(2);

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    const Override = createCouponCard([createChannelPlugin({ channels: ["会员专享"] })]);
    await mount(React.createElement(Override, { coupon: base }));
    expect(qq('[data-testid="coupon-channel-badge"]').length).toBe(1);
  });
});

describe("SharePlugin", () => {
  it("有 onShare 渲染按钮并可点击；无 onShare 渲染 null", async () => {
    let shared = 0;
    const Coupon = createCouponCard([createSharePlugin({ onShare: () => { shared += 1; } })]);
    await mount(React.createElement(Coupon, { coupon: base }));
    await click('[data-testid="coupon-share-btn"]');
    expect(shared).toBe(1);

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    const NoShare = createCouponCard([createSharePlugin()]);
    await mount(React.createElement(NoShare, { coupon: base }));
    expect(q('[data-testid="coupon-share-btn"]')).toBeNull();
  });
});

describe("RemindPlugin", () => {
  it("idle 渲染开关，点击切换 state；available 渲染 null", async () => {
    const seen: boolean[] = [];
    const Coupon = createCouponCard([
      createRemindPlugin({ onRemind: (on) => seen.push(on) }),
      // 让相位停在 idle
      (() => {
        const p: CouponPlugin = {
          name: "idle-lock",
          version: "0.1.0",
          priority: 99,
          config: {},
          hooks: { onMount: (ctx) => ctx.setState({ phase: "idle" }) },
        };
        return p;
      })(),
    ]);
    await mount(React.createElement(Coupon, { coupon: base }));
    const btn = () => q('[data-testid="coupon-remind-btn"]') as HTMLButtonElement;
    expect(btn()?.dataset.on).toBe("false");
    await click('[data-testid="coupon-remind-btn"]');
    await waitFor(() => btn()?.dataset.on === "true");
    expect(seen).toEqual([true]);
  });

  it("非 idle 相位渲染 null", async () => {
    const Coupon = createCouponCard([createRemindPlugin()]);
    await mount(React.createElement(Coupon, { coupon: base })); // 默认 available
    expect(q('[data-testid="coupon-remind-btn"]')).toBeNull();
  });
});

describe("CopyCodePlugin", () => {
  it("available 渲染 null；claimed 后展示券码与复制按钮", async () => {
    const Coupon = createCouponCard([
      createCopyCodePlugin({ code: "SAVE-2026" }),
      {
        name: "claimed-lock",
        version: "0.1.0",
        priority: 99,
        config: {},
        hooks: { onMount: (ctx) => ctx.setState({ phase: "claimed" }) },
      } as CouponPlugin,
    ]);
    await mount(React.createElement(Coupon, { coupon: base }));
    expect(q('[data-testid="coupon-code"]')?.textContent).toBe("SAVE-2026");
    expect(q('[data-testid="coupon-copy-btn"]')).toBeTruthy();
  });

  it("available 相位不渲染", async () => {
    const Coupon = createCouponCard([createCopyCodePlugin({ code: "X" })]);
    await mount(React.createElement(Coupon, { coupon: base }));
    expect(q('[data-testid="coupon-code-area"]')).toBeNull();
  });
});

describe("HistoryPlugin", () => {
  it("倒序渲染最近 N 条；空记录渲染 null", async () => {
    const Coupon = createCouponCard([createHistoryPlugin({ max: 2 })]);
    const now = Date.now();
    await mount(
      React.createElement(Coupon, {
        coupon: {
          ...base,
          history: [
            { at: now - 86400000, action: "领取成功" },
            { at: now - 3600000, action: "已使用" },
            { at: now - 60, action: "再次领取" },
          ],
        },
      })
    );
    expect(qq('[data-testid^="coupon-history-item-"]').length).toBe(2);
    expect(q('[data-testid="coupon-history-item-0"]')?.textContent).toContain("再次领取");

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    await mount(React.createElement(Coupon, { coupon: base }));
    expect(q('[data-testid="coupon-history"]')).toBeNull();
  });
});

describe("AnalyticsPlugin", () => {
  it("mount 与相位变化双通道上报（回调 + 总线）", async () => {
    const events: string[] = [];
    const busEvents: string[] = [];
    const Coupon = createCouponCard([
      createAnalyticsPlugin({ onEvent: (e) => events.push(e) }),
      {
        name: "bus-spy",
        version: "0.1.0",
        // priority 95 > Analytics 的 90：先注册监听，才不会错过 mount 事件
        priority: 95,
        config: {},
        hooks: {
          onMount: (ctx) => ctx.bus.on("coupon:analytics", (p: any) => busEvents.push(p.event)),
        },
      } as CouponPlugin,
    ]);
    await mount(React.createElement(Coupon, { coupon: base }));
    expect(events).toContain("coupon:mount");
    expect(busEvents).toContain("coupon:mount");
  });

  it("自身不渲染任何 UI", async () => {
    const Coupon = createCouponCard([createAnalyticsPlugin()]);
    await mount(React.createElement(Coupon, { coupon: base }));
    expect(qq('[data-testid^="coupon-"]').length).toBeGreaterThan(0); // 核心本体照常
    expect(q('[data-testid="coupon-analytics"]')).toBeNull();
  });
});

describe("DetailLinkPlugin", () => {
  it("href 渲染 <a>；onDetail 渲染 <button>；都没有渲染 null", async () => {
    const Coupon = createCouponCard([createDetailLinkPlugin({ href: "/rules" })]);
    await mount(React.createElement(Coupon, { coupon: base }));
    const a = q('[data-testid="coupon-detail-link"]') as HTMLAnchorElement;
    expect(a.tagName).toBe("A");
    expect(a.getAttribute("href")).toBe("/rules");

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    let clicked = 0;
    const Btn = createCouponCard([createDetailLinkPlugin({ onDetail: () => (clicked += 1) })]);
    await mount(React.createElement(Btn, { coupon: base }));
    await click('[data-testid="coupon-detail-link"]');
    expect(clicked).toBe(1);

    await act(async () => root!.unmount());
    container!.innerHTML = "";
    const None = createCouponCard([createDetailLinkPlugin()]);
    await mount(React.createElement(None, { coupon: base }));
    expect(q('[data-testid="coupon-detail-link"]')).toBeNull();
  });
});
