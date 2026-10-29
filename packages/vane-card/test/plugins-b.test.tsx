/**
 * C3.2 · B 级 10 个插件的行为契约
 *
 * 重点不是「能渲染」，而是迁移后必须成立的几条：
 *  1. 价格链路真的通：PriceCalculator 在 onMount 就发布 price:change
 *  2. 曝光不再自建 IntersectionObserver（每卡只该有 Core 那一个）
 *  3. 曝光时长用每卡独立的时间戳，不被别的卡污染
 *  4. A11y 的 focus 监听与全局播报区在卸载时回收（引用计数）
 *  5. Countdown 已过期时不起定时器，归零后停表
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createQuantityPlugin,
  createPriceCalculatorPlugin,
  createCouponPlugin,
  createAnalyticsPlugin,
  createA11yPlugin,
  createCountdownPlugin,
  createStatePlugin,
} from "../src/custom-plugins";
import { __getLiveRegionUsers } from "../src/custom-plugins/A11yPlugin";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import { renderCard, installObservers, ioInstances, flush } from "./helpers";

beforeEach(() => {
  installObservers();
});

/**
 * 探针插件：把总线事件抄出来。
 *
 * priority 必须高于所有发布方（这里 999）：钩子按 priority 降序执行，
 * onMount 里先订阅才能收到别人 onMount 里发的首个事件。
 * 这条顺序约定是卡片的隐式契约 —— Analytics(50) 之所以能收到
 * PriceCalculator(20) 的首个 price:change，靠的就是 50 > 20。
 */
function probe(sink: Array<{ event: string; payload: any }>): CardPlugin {
  return {
    name: "probe",
    priority: 999,
    hooks: {
      onMount: (ctx) => {
        const offs = [
          ctx.bus?.on?.("price:change", (payload: any) =>
            sink.push({ event: "price:change", payload })
          ),
          ctx.bus?.on?.("sku:change", (payload: any) =>
            sink.push({ event: "sku:change", payload })
          ),
        ];
        return () => offs.forEach((off) => off?.());
      },
    },
  };
}

describe("价格链路（Quantity → PriceCalculator → 总线）", () => {
  it("PriceCalculator 在 onMount 发布 price:change，含单价/数量/小计/合计", async () => {
    const events: Array<{ event: string; payload: any }> = [];
    renderCard(
      [createQuantityPlugin(), createPriceCalculatorPlugin(), probe(events)],
      { data: { price: 100 } }
    );
    await flush();

    const priceEvents = events.filter((e) => e.event === "price:change");
    expect(priceEvents.length).toBeGreaterThan(0);
    const last = priceEvents[priceEvents.length - 1].payload;
    expect(last.price).toBe(100);
    expect(last.quantity).toBe(1);
    expect(last.subtotal).toBe(100);
    expect(last.total).toBe(100);
  });

  it("套用优惠券后合计被扣减（券走总线，不靠插件互相 import）", async () => {
    const events: Array<{ event: string; payload: any }> = [];
    renderCard(
      [
        createCouponPlugin({ coupons: [{ code: "C10", discount: 10 }], autoApply: true }),
        createPriceCalculatorPlugin(),
        probe(events),
      ],
      { data: { price: 100 } }
    );
    await flush();

    const priceEvents = events.filter((e) => e.event === "price:change");
    const discounted = priceEvents.some((e) => e.payload.total === 90);
    expect(discounted).toBe(true);
  });
});

describe("Analytics 复用 Core 的可见性观测", () => {
  it("装 Analytics 后仍只有一个 IntersectionObserver（Core 的那个）", async () => {
    renderCard([createAnalyticsPlugin()]);
    await flush();
    expect(ioInstances().length).toBe(1);
  });

  it("可见性变化经 Core 下发，产生 exposure_enter / exposure_exit", async () => {
    const seen: Array<[string, any]> = [];
    renderCard([
      createAnalyticsPlugin({ transport: (event, payload) => seen.push([event, payload]) }),
    ]);
    await flush();

    expect(seen.some(([e]) => e === "exposure_enter")).toBe(true);

    // 手动模拟「离开视口」：Core 的 IO 回调里拿到的是我们注入的 mock
    const io = ioInstances()[0] as any;
    io.callback([{ isIntersecting: false, target: io.observed[0] }]);
    await flush();

    const exit = seen.find(([e]) => e === "exposure_exit");
    expect(exit).toBeTruthy();
    expect(typeof exit?.[1].dwellMs).toBe("number");
  });

  it("minExposureMs 未达标时不上报 exposure_exit", async () => {
    const seen: Array<[string, any]> = [];
    renderCard([
      createAnalyticsPlugin({
        minExposureMs: 60_000,
        transport: (event, payload) => seen.push([event, payload]),
      }),
    ]);
    await flush();

    const io = ioInstances()[0] as any;
    io.callback([{ isIntersecting: false, target: io.observed[0] }]);
    await flush();

    expect(seen.some(([e]) => e === "exposure_exit")).toBe(false);
  });
});

describe("A11y 的监听与全局播报区回收", () => {
  it("播报区按引用计数：两卡共享，卸一张仍在，全卸才移除", async () => {
    const a = renderCard([createA11yPlugin({ announceOnFocus: true })]);
    await flush();
    const b = renderCard([createA11yPlugin({ announceOnFocus: true })]);
    await flush();

    expect(document.getElementById("a11y-live-region")).not.toBeNull();
    expect(__getLiveRegionUsers()).toBe(2);

    a.unmount();
    await flush();
    expect(__getLiveRegionUsers()).toBe(1);
    expect(document.getElementById("a11y-live-region")).not.toBeNull();

    b.unmount();
    await flush();
    expect(__getLiveRegionUsers()).toBe(0);
    expect(document.getElementById("a11y-live-region")).toBeNull();
  });

  it("focus 监听在卸载后不再触发（具名 handler 能被移除）", async () => {
    const { container, unmount } = renderCard([
      createA11yPlugin({ announceOnFocus: true }),
    ]);
    await flush();
    const el = container.querySelector(".card-core") as HTMLElement;
    const live = document.getElementById("a11y-live-region") as HTMLElement;

    el.dispatchEvent(new Event("focus"));
    expect(live.textContent).toContain("聚焦");

    live.textContent = "";
    unmount();
    await flush();
    el.dispatchEvent(new Event("focus"));
    expect(live.textContent).toBe("");
  });

  it("ARIA 属性在卸载时被清掉，不残留到复用的容器上", async () => {
    const { container, unmount } = renderCard([createA11yPlugin()]);
    await flush();
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.getAttribute("role")).toBe("article");
    expect(el.getAttribute("tabindex")).toBe("0");

    unmount();
    await flush();
    expect(el.getAttribute("role")).toBeNull();
    expect(el.getAttribute("tabindex")).toBeNull();
  });
});

describe("Countdown 定时器生命周期", () => {
  it("已过期时直接显示「已结束」且不起定时器", async () => {
    const spy = vi.spyOn(globalThis, "setInterval");
    const { container } = renderCard([
      createCountdownPlugin({ endTimestamp: Date.now() - 1000 }),
    ]);
    await flush();
    expect(container.textContent).toContain("已结束");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("未过期时起一个定时器，卸载后清掉", async () => {
    const setSpy = vi.spyOn(globalThis, "setInterval");
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { container, unmount } = renderCard([
      createCountdownPlugin({ durationMs: 60_000 }),
    ]);
    await flush();
    expect(container.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(setSpy).toHaveBeenCalled();

    unmount();
    await flush();
    expect(clearSpy).toHaveBeenCalled();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("State 的状态差分回调", () => {
  it("config 的 onCartChange 由 onStateChange 差分触发（旧版是死钩子）", async () => {
    const calls: Array<[string, boolean]> = [];
    const { rerender } = renderCard([
      createStatePlugin({ onCartChange: (id, added) => calls.push([id, added]) }),
    ]);
    await flush();
    expect(calls).toEqual([]);

    // 初始挂载就把 cart 设成 false，再触发一次 props 变化不会误报
    await rerender({ data: { price: 1 } });
    expect(calls).toEqual([]);
  });
});
