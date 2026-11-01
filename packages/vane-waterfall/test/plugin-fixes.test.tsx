/**
 * 插件层回归（P2-1 ~ P2-11）。
 *
 * 分组：
 *  1. 纯钩子单测（不需要 DOM / React）：分页钳制、无限加载实例锁、回收池、Gap 断点、
 *     持久化 schema 与恢复时机、URL 读写、书签单监听、分组缓存、吸顶当前组、
 *     点击/曝光按 key 统计、A11y roving tabindex；
 *  2. HOC 端到端：插件上下文看到的是「渲染集合」、hasMore/isLoading 可由 props 覆盖、
 *     分页与无限加载的互斥告警；
 *  3. Core：项单元 memo（同一 items 重渲染不重跑 renderItem）。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import WaterfallCore, {
  type WaterfallCoreRef,
} from "../src/components/WaterfallPlugin/WaterfallCore";
import { withPlugins } from "../src/components/WaterfallPlugin/withPlugins";
import type { WaterfallPlugin } from "../src/components/WaterfallPlugin/plugins/types";
import * as plugins from "../src/custom-plugins";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/** 宽松上下文：只填当前用例用得到的字段，其余给最小可用的桩 */
function makeCtx<T = any>(overrides: Record<string, any> = {}): any {
  const sharedData = overrides.sharedData ?? new Map<string, any>();
  const bus = overrides.bus ?? { emit: () => {} };
  return {
    items: [],
    rawItems: [],
    itemCount: 0,
    props: {},
    containerRef: { current: null },
    sharedData,
    bus,
    forceUpdate: () => {},
    getItemRef: () => null,
    visibleRange: { start: 0, end: 0 },
    isLayouting: false,
    ...overrides,
  };
}

describe("P2-3 Pagination", () => {
  it("页码越界时钳到最后一页，不再静默变成空列表", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const plugin = plugins.createPaginationPlugin<number>({ pageSize: 3 });
    const out: any = plugin.hooks.transformProps!({
      items: [1, 2, 3, 4, 5, 6, 7],
      pageIndex: 9,
      pageSize: 3,
    } as any);
    expect(out.items).toEqual([7]);
    warn.mockRestore();
  });

  it("非法页码（NaN / 负数 / 小数）归一为合法页", () => {
    const plugin = plugins.createPaginationPlugin<number>({ pageSize: 2 });
    const nan: any = plugin.hooks.transformProps!({ items: [1, 2, 3, 4], pageIndex: NaN } as any);
    expect(nan.items).toEqual([1, 2]);
    const negative: any = plugin.hooks.transformProps!({ items: [1, 2, 3, 4], pageIndex: -3 } as any);
    expect(negative.items).toEqual([1, 2]);
    const fractional: any = plugin.hooks.transformProps!({ items: [1, 2, 3, 4], pageIndex: 2.7 } as any);
    expect(fractional.items).toEqual([3, 4]);
  });
});

describe("P2-2 InfiniteScroll 实例锁", () => {
  it("同一实例加载中不重复触发，不同实例互不影响", async () => {
    let release!: () => void;
    const firstPromise = new Promise<void>((resolve) => (release = resolve));
    const calls: string[] = [];
    const plugin = plugins.createInfiniteScrollPlugin<any>({ threshold: 300 });
    const ctxA = makeCtx({
      containerRef: { current: document.createElement("div") },
      props: {
        onLoadMore: () => {
          calls.push("A");
          return firstPromise;
        },
      },
    });
    const ctxB = makeCtx({
      containerRef: { current: document.createElement("div") },
      props: {
        onLoadMore: () => {
          calls.push("B");
          return Promise.resolve();
        },
      },
    });

    const pending = plugin.hooks.onReachBottom!(ctxA, 0);
    // 第二次触发发生在第一次 resolve 之前 → 必须被并发锁挡住
    void plugin.hooks.onReachBottom!(ctxA, 0);
    expect(calls).toEqual(["A"]);

    // 另一个实例有自己的锁，不受 A 影响
    await plugin.hooks.onReachBottom!(ctxB, 0);
    expect(calls).toEqual(["A", "B"]);

    release();
    await pending;
    await plugin.hooks.onReachBottom!(ctxA, 0);
    expect(calls).toEqual(["A", "B", "A"]);
  });

  it("hasMore=false 时不再触发 onLoadMore", async () => {
    const calls: number[] = [];
    const plugin = plugins.createInfiniteScrollPlugin<any>({ threshold: 300 });
    const ctx = makeCtx({ hasMore: false, props: { onLoadMore: () => calls.push(1) } });
    await plugin.hooks.onReachBottom!(ctx, 0);
    expect(calls).toHaveLength(0);
  });
});

describe("P2-4 Recycle 池上限", () => {
  it("被挤出池子的项一起隐藏，不只是从集合里删掉", () => {
    const plugin = plugins.createRecyclePlugin({ poolSize: 2 });
    const els = [0, 1, 2].map(() => document.createElement("div"));
    const ctx = makeCtx({ getItemRef: (index: number) => els[index] ?? null });

    for (const index of [0, 1, 2]) {
      plugin.hooks.onItemEnterViewport!(ctx, index, undefined as any);
    }

    expect(els[0].style.visibility).toBe("hidden");
    expect(els[1].style.visibility).toBe("visible");
    expect(els[2].style.visibility).toBe("visible");
  });
});

describe("P2-5 Gap 响应式按容器宽度", () => {
  it("容器 780px、窗口 1400px 时取 md 档而不是 xl", () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1400 });

    const container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { configurable: true, value: 780 });
    const plugin = plugins.createGapPlugin({
      responsive: {
        md: { columnGap: 20, rowGap: 20 },
        lg: { columnGap: 40, rowGap: 40 },
        xl: { columnGap: 60, rowGap: 60 },
      },
    });
    const ctx = makeCtx({ containerRef: { current: container } });
    plugin.hooks.onMount!(ctx);
    const out: any = plugin.hooks.transformProps!({} as any);

    expect(out.columnGap).toBe(20);
    expect(out.rowGap).toBe(20);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalInnerWidth });
  });
});

describe("P2-6 StatePersistence schema 与恢复时机", () => {
  beforeEach(() => localStorage.clear());

  it("只读取带 schema 的快照，旧格式直接丢弃", () => {
    localStorage.setItem("wf-state", JSON.stringify({ pageIndex: 3 }));
    const plugin = plugins.createStatePersistencePlugin({ storageKey: "wf-state" });
    const props = { pageIndex: 1 } as any;
    expect((plugin.hooks.transformProps!(props) as any).pageIndex).toBe(1);

    localStorage.setItem("wf-state", JSON.stringify({ version: 1, state: { pageIndex: 3 } }));
    expect((plugin.hooks.transformProps!(props) as any).pageIndex).toBe(3);
  });

  it("滚动位置在首次布局完成后恢复，onMount 不提前 scrollTo", () => {
    localStorage.setItem(
      "wf-scroll",
      JSON.stringify({ version: 1, state: { scrollTop: 500 } })
    );
    const container = document.createElement("div");
    const scrollTo = vi.fn();
    container.scrollTo = scrollTo as any;
    const plugin = plugins.createStatePersistencePlugin({ storageKey: "wf-scroll" });
    const ctx = makeCtx({ containerRef: { current: container } });

    plugin.hooks.onMount!(ctx);
    expect(scrollTo).not.toHaveBeenCalled();

    plugin.hooks.onLayoutComplete!(ctx);
    expect(scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "auto" });

    // 后续布局不能反复把用户的滚动重置回去
    container.scrollTop = 120;
    plugin.hooks.onLayoutComplete!(ctx);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("卸载写入的快照带 version", () => {
    const container = document.createElement("div");
    container.scrollTop = 320;
    const plugin = plugins.createStatePersistencePlugin({ storageKey: "wf-write" });
    plugin.hooks.onUnmount!(
      makeCtx({ containerRef: { current: container }, props: { pageIndex: 2 } })
    );
    const raw = JSON.parse(localStorage.getItem("wf-write")!);
    expect(raw.version).toBe(1);
    expect(raw.state.scrollTop).toBe(320);
    expect(raw.state.pageIndex).toBe(2);
  });
});

describe("P2-6 URLSync 读写", () => {
  afterEach(() => {
    try {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    } catch {
      /* noop */
    }
  });

  it("首次渲染把 URL 参数注入 props（此前只写不读）", () => {
    window.history.replaceState(null, "", `#?pageIndex=3&searchQuery=abc`);
    const plugin = plugins.createURLSyncPlugin({
      mode: "hash",
      keys: ["pageIndex", "searchQuery"],
    });
    const out: any = plugin.hooks.transformProps!({ pageIndex: 1 } as any);
    expect(out.pageIndex).toBe("3");
    expect(out.searchQuery).toBe("abc");
  });

  it("首次 props 默认值与 URL 一致时不重写 URL（避免冲掉深链参数）", () => {
    window.history.replaceState(null, "", `#?pageIndex=3`);
    const replace = vi.spyOn(window.history, "replaceState");
    const plugin = plugins.createURLSyncPlugin({ mode: "hash", keys: ["pageIndex"] });
    plugin.hooks.transformProps!({ pageIndex: 1 } as any);
    const ctx = makeCtx();

    plugin.hooks.onPropsChange!(ctx, {} as any, { pageIndex: "3" } as any);
    expect(replace).not.toHaveBeenCalled();

    plugin.hooks.onPropsChange!(ctx, {} as any, { pageIndex: "5" } as any);
    expect(replace).toHaveBeenCalled();
    replace.mockRestore();
  });
});

describe("P2-6 Bookmark 单监听", () => {
  it("一次按键只保存一次（window/document 双注册已去除）", () => {
    const setItem = vi.spyOn(window.localStorage, "setItem");
    const container = document.createElement("div");
    Object.defineProperty(container, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(container, "clientHeight", { configurable: true, value: 400 });
    container.scrollTop = 250;
    document.body.appendChild(container);

    const plugin = plugins.createBookmarkPlugin({ storageKey: "wf-bookmark" });
    const cleanup = plugin.hooks.onMount!(
      makeCtx({ containerRef: { current: container } })
    ) as () => void;

    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }));
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("wf-bookmark")).toBe("250");

    cleanup();
    container.remove();
    setItem.mockRestore();
  });
});

/** 把 React 节点的文本拼出来（吸顶条是 title + 分组键的拼接） */
function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) return textOf((node.props as any).children);
  return "";
}

describe("P2-7 分组与吸顶", () => {
  it("items 引用不变时不重复重算 / emit，替换数据才 emit", () => {
    const sharedData = new Map<string, any>();
    const events: string[] = [];
    const ctx = makeCtx({
      items: [{ cat: "a" }, { cat: "b" }],
      sharedData,
      bus: { emit: (event: string) => events.push(event) },
    });
    const plugin = plugins.createGroupingPlugin<any>({ groupBy: (item: any) => item.cat });

    plugin.hooks.onMount!(ctx);
    expect(events).toEqual(["grouping:change"]);
    expect(sharedData.get("GROUPS").get("a")).toEqual([0]);
    expect(sharedData.get("GROUP_INDEX").get(1)).toBe("b");

    // 同一份 items：布局完成 / props 变化都不应再广播
    plugin.hooks.onLayoutComplete!(ctx);
    plugin.hooks.onPropsChange!(ctx, {} as any, {} as any);
    expect(events).toEqual(["grouping:change"]);

    ctx.items = [{ cat: "b" }, { cat: "b" }];
    plugin.hooks.onLayoutComplete!(ctx);
    expect(events).toEqual(["grouping:change", "grouping:change"]);
  });

  it("吸顶条显示当前可见项所属分组，而不是恒为第一组", () => {
    const sharedData = new Map<string, any>([
      ["GROUPS", new Map<string | number, number[]>([["a", [0, 1]], ["b", [2, 3]]])],
      ["GROUP_INDEX", new Map<number, string>([[0, "a"], [1, "a"], [2, "b"], [3, "b"]])],
    ]);
    const plugin = plugins.createStickyHeaderPlugin({ title: "分组" });

    const at = (start: number) =>
      textOf(
        plugin.hooks.renderOverlay!(
          makeCtx({ sharedData, visibleRange: { start, end: start + 1 } })
        ) as React.ReactNode
      );

    expect(at(0)).toContain("：a");
    expect(at(2)).toContain("：b");
  });
});

describe("P2-8 统计按稳定 key", () => {
  it("ClickAnalytics：同一项在不同位置点击仍记在同一 key 上", () => {
    const items = [{ id: "x" }, { id: "y" }];
    const ctx = makeCtx({
      items,
      props: { keyExtractor: (item: any) => item.id },
    });
    const plugin = plugins.createClickAnalyticsPlugin<any>({});

    plugin.hooks.onLayoutComplete!(ctx);
    plugin.hooks.onItemClick!(ctx, 0, items[0], {} as any);
    plugin.hooks.onItemClick!(ctx, 0, items[0], {} as any);
    plugin.hooks.onItemClick!(ctx, 1, items[1], {} as any);

    const stats = plugin.getStats();
    expect(stats.total).toBe(3);
    expect(stats.byIndex).toEqual([
      { index: 0, key: "x", clicks: 2 },
      { index: 1, key: "y", clicks: 1 },
    ]);

    // 数据集替换 → 旧计数清零
    ctx.items = [{ id: "z" }];
    plugin.hooks.onLayoutComplete!(ctx);
    expect(plugin.getStats().total).toBe(0);
  });

  it("HeatmapAnalytics：换数据后首屏曝光重新计数（initialCountDone 复位）", () => {
    const ctx = makeCtx({
      items: [{ id: "a" }, { id: "b" }, { id: "c" }],
      visibleRange: { start: 0, end: 2 },
      props: { keyExtractor: (item: any) => item.id },
    });
    const plugin = plugins.createHeatmapAnalyticsPlugin<any>({});

    plugin.hooks.onLayoutComplete!(ctx);
    expect(plugin.getStats().totalViews).toBe(3);

    ctx.items = [{ id: "d" }, { id: "e" }];
    ctx.visibleRange = { start: 0, end: 1 };
    plugin.hooks.onLayoutComplete!(ctx);

    const stats = plugin.getStats();
    expect(stats.totalViews).toBe(2);
    expect(stats.items.map((item) => item.key).sort()).toEqual(["d", "e"]);
  });
});

describe("P2-9 A11y roving tabindex", () => {
  it("只有当前项可 Tab 聚焦，点击后停靠点迁移；setsize 与渲染集合一致", () => {
    const container = document.createElement("div");
    const ctx = makeCtx({
      containerRef: { current: container },
      itemCount: 3,
      isLayouting: false,
    });
    const plugin = plugins.createA11yPlugin({});

    const wrapper = (index: number) =>
      plugin.hooks.renderItemWrapper!(ctx, null, index) as React.ReactElement;

    expect((wrapper(0).props as any).tabIndex).toBe(0);
    expect((wrapper(1).props as any).tabIndex).toBe(-1);
    // 旧实现给每项写死 outline:none，焦点完全不可见
    expect((wrapper(1).props as any).style).toBeUndefined();
    expect((wrapper(1).props as any)["aria-setsize"]).toBe(3);

    plugin.hooks.onItemClick!(ctx, 2, {}, {} as any);
    expect((wrapper(0).props as any).tabIndex).toBe(-1);
    expect((wrapper(2).props as any).tabIndex).toBe(0);
  });
});

// ---------------- HOC / Core 端到端 ----------------

const proto = HTMLElement.prototype;
const originals = {
  clientWidth: Object.getOwnPropertyDescriptor(proto, "clientWidth"),
  clientHeight: Object.getOwnPropertyDescriptor(proto, "clientHeight"),
  offsetHeight: Object.getOwnPropertyDescriptor(proto, "offsetHeight"),
};
const CONTAINER_WIDTH = 900;
const CONTAINER_HEIGHT = 400;

function readHeight(el: Element): number {
  const own = el.getAttribute("data-h");
  if (own !== null) return Number(own);
  const child = el.querySelector("[data-h]");
  return child ? Number(child.getAttribute("data-h")) : 0;
}

beforeAll(() => {
  Object.defineProperty(proto, "clientWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-vane-waterfall") ? CONTAINER_WIDTH : 300;
    },
  });
  Object.defineProperty(proto, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-vane-waterfall") ? CONTAINER_HEIGHT : 0;
    },
  });
  Object.defineProperty(proto, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return readHeight(this);
    },
  });
});

afterAll(() => {
  for (const key of Object.keys(originals) as Array<keyof typeof originals>) {
    const descriptor = originals[key];
    if (descriptor) Object.defineProperty(proto, key, descriptor);
  }
});

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const ref = React.createRef<WaterfallCoreRef>();

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

async function flush(ms = 30) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe("P2-1 插件上下文的数据集合", () => {
  it("items 是渲染集合、rawItems 是原始集合；hasMore/isLoading 可由 props 覆盖", async () => {
    let seen: any = null;
    const probe: WaterfallPlugin<any> = {
      name: "ProbePlugin",
      hooks: {
        onLayoutComplete: (context) => {
          seen = context;
        },
      },
    };
    const items = [
      { id: "a", price: 10, h: 100 },
      { id: "b", price: 30, h: 100 },
      { id: "c", price: 50, h: 100 },
    ];
    const Wrapped = withPlugins(WaterfallCore, [
      plugins.createFilterPlugin<any>({ predicate: (item) => item.price >= 30 }),
      probe,
    ]);

    await act(async () => {
      root.render(
        <Wrapped
          ref={ref}
          items={items}
          columns={1}
          gap={10}
          debounceDelay={0}
          renderItem={(item: any) => <div data-h={item.h}>{item.id}</div>}
          keyExtractor={(item: any) => item.id}
          hasMore={false}
          isLoading={true}
        />
      );
    });
    await flush();

    expect(seen.items).toHaveLength(2);
    expect(seen.itemCount).toBe(2);
    expect(seen.rawItems).toHaveLength(3);
    expect(seen.hasMore).toBe(false);
    expect(seen.isLoading).toBe(true);
    expect(seen.visibleItems.size).toBeGreaterThan(0);
  });

  it("P2-3 Pagination 与 InfiniteScroll 同时启用时给出互斥告警", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Wrapped = withPlugins(WaterfallCore, [
      plugins.createPaginationPlugin({ pageSize: 2 }),
      plugins.createInfiniteScrollPlugin({}),
    ]);

    await act(async () => {
      root.render(
        <Wrapped
          ref={ref}
          items={[{ id: "a", h: 100 }, { id: "b", h: 100 }, { id: "c", h: 100 }]}
          columns={1}
          gap={10}
          debounceDelay={0}
          renderItem={(item: any) => <div data-h={item.h}>{item.id}</div>}
          keyExtractor={(item: any) => item.id}
        />
      );
    });
    await flush();

    expect(
      warn.mock.calls.some((call) => String(call[0]).includes("互斥"))
    ).toBe(true);
    warn.mockRestore();
  });
});

describe("P2-11 项单元 memo", () => {
  it("同一 items / renderItem 重渲染不重复调用 renderItem", async () => {
    let calls = 0;
    const items = [{ id: "a", h: 100 }, { id: "b", h: 100 }];
    const renderItem = (item: any) => {
      calls += 1;
      return <div data-h={item.h}>{item.id}</div>;
    };
    const tree = () => (
      <WaterfallCore
        ref={ref}
        items={items}
        columns={1}
        gap={10}
        debounceDelay={0}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id}
      />
    );

    await act(async () => {
      root.render(tree());
    });
    await flush();
    const first = calls;
    expect(first).toBeGreaterThan(0);

    // items 数组引用不变 → 不重排；项单元是 memo 的 → 内容不再重算
    await act(async () => {
      root.render(tree());
    });
    await flush();
    expect(calls).toBe(first);
  });
});
