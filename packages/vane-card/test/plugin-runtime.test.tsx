/**
 * C2.6 · 插件系统运行期语义（接 vane-plugin-core）
 *
 * 覆盖验收清单：
 *  - onMount 返回清理函数在卸载时执行一次（R2）
 *  - 钩子返回 false 中断链
 *  - renderOverlay 输出在 container.contains() 之内
 *  - 单个插件渲染抛错只丢自己那段（PluginErrorBoundary）
 *  - renderPriceArea 装 3 个插件 → 输出 3 段且顺序符合 order/priority（R5）
 *  - setState 差分触发 onStateChange（prev/next）
 *  - 内核级：false 中断链 / R2 bus off===on
 */
import React, { act } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPluginManager, createPluginBus } from "vane-plugin-core";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import { usePluginSlot } from "../src/components/CardPlugin/plugins/slots";
import { renderCard, installObservers, flush } from "./helpers";

beforeEach(() => {
  installObservers();
});

describe("插件运行期语义", () => {
  it("R2: onMount 返回的清理函数在卸载时执行一次", async () => {
    let mountCount = 0;
    let cleanupCount = 0;
    const p: CardPlugin = {
      name: "p",
      hooks: {
        onMount: () => {
          mountCount += 1;
          return () => {
            cleanupCount += 1;
          };
        },
      },
    };
    const { unmount } = renderCard([p]);
    await flush();
    expect(mountCount).toBe(1);
    unmount();
    await flush();
    expect(cleanupCount).toBe(1);
  });

  it("onClick 链路：点击卡片触发插件 onClick", async () => {
    let clicked = 0;
    const p: CardPlugin = {
      name: "click",
      hooks: {
        onClick: () => {
          clicked += 1;
        },
      },
    };
    const { container } = renderCard([p]);
    await flush();
    const el = container.querySelector(".card-core") as HTMLElement;
    await act(async () => {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();
    expect(clicked).toBe(1);
  });

  it("renderOverlay 输出在容器内部", () => {
    const p: CardPlugin = {
      name: "ov",
      hooks: {
        renderOverlay: () =>
          React.createElement("div", { "data-testid": "overlay" }, "hi"),
      },
    };
    const { container } = renderCard([p]);
    const overlay = container.querySelector('[data-testid="overlay"]');
    expect(overlay).not.toBeNull();
    expect(container.contains(overlay)).toBe(true);
  });

  it("PluginErrorBoundary：单个插件渲染抛错只丢自己那段", () => {
    const good: CardPlugin = {
      name: "good",
      hooks: {
        renderOverlay: () =>
          React.createElement("div", { id: "good" }, "g"),
      },
    };
    const bad: CardPlugin = {
      name: "bad",
      hooks: {
        renderOverlay: () => {
          throw new Error("boom");
        },
      },
    };
    const { container } = renderCard([good, bad]);
    expect(container.querySelector("#good")).not.toBeNull();
    // bad 那段被错误边界吃掉，不应导致白屏；good 仍在
    expect(container.querySelector(".card-core")).not.toBeNull();
  });

  it("renderPriceArea：3 个插件按 config.order 升序渲染（R5）", () => {
    function Sink() {
      const nodes = usePluginSlot("priceArea");
      return React.createElement("div", { id: "sink" }, nodes as any);
    }
    const p1: CardPlugin = {
      name: "p1",
      config: { order: 2 },
      hooks: {
        renderPriceArea: () =>
          React.createElement("span", { id: "a1" }, "A"),
      },
    };
    const p2: CardPlugin = {
      name: "p2",
      config: { order: 1 },
      hooks: {
        renderPriceArea: () =>
          React.createElement("span", { id: "a2" }, "B"),
      },
    };
    const p3: CardPlugin = {
      name: "p3",
      config: { order: 3 },
      hooks: {
        renderPriceArea: () =>
          React.createElement("span", { id: "a3" }, "C"),
      },
    };
    const { container } = renderCard([p1, p2, p3], {
      children: React.createElement(Sink),
    });
    expect(container.querySelector("#a1")).not.toBeNull();
    expect(container.querySelector("#a2")).not.toBeNull();
    expect(container.querySelector("#a3")).not.toBeNull();
    // 顺序：p2(order1) → p1(order2) → p3(order3) => "BAC"
    const sink = container.querySelector("#sink");
    expect(sink?.textContent).toBe("BAC");
  });

  it("onStateChange：setState 差分触发，携带 prev/next（挂载时可见性变化即触发）", async () => {
    const diffs: Array<[boolean, boolean]> = [];
    const p: CardPlugin = {
      name: "st",
      hooks: {
        onStateChange: (_ctx, prev: any, next: any) => {
          diffs.push([Boolean(prev.isVisible), Boolean(next.isVisible)]);
        },
      },
    };
    // 挂载时 mock IntersectionObserver 会触发 onVisibilityChange(true)，
    // withPlugins 据此 setState({isVisible:true})，进而触发 onStateChange(false→true)
    renderCard([p]);
    await flush();
    expect(diffs.some(([p, n]) => p === false && n === true)).toBe(true);
  });
});

describe("内核级语义（vane-plugin-core 直接驱动）", () => {
  it("钩子返回 false 中断链，后续插件不再执行", async () => {
    const order: string[] = [];
    const manager = createPluginManager();
    manager.registerAll([
      {
        name: "a",
        priority: 10,
        hooks: { onClick: () => { order.push("a"); return false; } },
      } as any,
      {
        name: "b",
        priority: 5,
        hooks: { onClick: () => { order.push("b"); } },
      } as any,
    ]);
    await manager.executeHook("onClick", {} as any);
    expect(order).toEqual(["a"]);
  });

  it("R2 内核级：卸载后 bus.off 计数 == bus.on 计数", async () => {
    const { createQuantityPlugin } = await import(
      "../src/components/CardPlugin/custom-plugins"
    );
    const { createPriceCalculatorPlugin } = await import(
      "../src/components/CardPlugin/custom-plugins"
    );
    const { createComparePricePlugin } = await import(
      "../src/components/CardPlugin/custom-plugins"
    );
    const { createCouponRecommendPlugin } = await import(
      "../src/components/CardPlugin/custom-plugins"
    );
    const { createOrderSummaryPlugin } = await import(
      "../src/components/CardPlugin/custom-plugins"
    );

    const bus = createPluginBus();
    let off = 0;
    const realOn = (bus as any).on.bind(bus);
    vi.spyOn(bus, "on").mockImplementation((...args: any[]) => {
      const o = realOn(...args);
      return () => {
        off += 1;
        return o();
      };
    });
    const manager = createPluginManager();
    manager.registerAll([
      createQuantityPlugin(),
      createPriceCalculatorPlugin(),
      createComparePricePlugin(),
      createCouponRecommendPlugin(),
      createOrderSummaryPlugin(),
    ] as any);
    const ctx: any = {
      bus,
      data: { price: 100 },
      forceUpdate: vi.fn(),
      cardId: "c1",
      sharedData: new Map(),
      state: {},
      getContainer: () => null,
      setState: () => {},
    };
    await manager.executeHook("onMount", ctx);
    const onCount = (bus.on as any).mock.calls.length;
    manager.clear();
    expect(off).toBe(onCount);
    expect(off).toBeGreaterThan(0);
  });
});
