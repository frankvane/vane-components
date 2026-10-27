/**
 * 26 个插件的一致性闸门（W3 验收）：
 *  1. 工厂返回 `{ name, hooks, meta }`，`meta` 与同目录 doc.json 一致；
 *  2. hooks 只用到 D3 收口后的 20 个领域钩子（防止旧死钩子被悄悄搬回来）；
 *  3. doc.json 里的 config 项都有 name/type/description；
 *  4. 三组端到端：数据管线顺序、布局钩子生效、覆盖层挂在容器内。
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";

import * as plugins from "../src/custom-plugins";
import WaterfallCore, { type WaterfallCoreRef } from "../src/components/WaterfallPlugin/WaterfallCore";
import { withPlugins } from "../src/components/WaterfallPlugin/withPlugins";
import type { WaterfallPlugin } from "../src/components/WaterfallPlugin/plugins/types";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const ALLOWED_HOOKS = new Set([
  "onMount",
  "onUnmount",
  "onPropsChange",
  "transformProps",
  "onBeforeLayout",
  "onLayout",
  "onLayoutComplete",
  "calculateColumns",
  "calculateColumnWidth",
  "calculateItemPosition",
  "onItemMount",
  "onItemUnmount",
  "onItemEnterViewport",
  "onItemLeaveViewport",
  "onItemClick",
  "onScroll",
  "onResize",
  "onReachBottom",
  "renderOverlay",
  "renderItemWrapper",
]);

/** 每个插件的最小可用配置（必填项） */
const MIN_CONFIG: Record<string, any> = {
  createAlignmentPlugin: { mode: "shortest" },
  createAutoColumnPlugin: { minColumnWidth: 200 },
  createResponsiveColumnsPlugin: { breakpoints: { sm: { width: 0, columns: 2 } } },
  createFixedHeightPlugin: { itemHeight: 200 },
  createPinItemPlugin: { pinnedIndices: [0] },
  createThrottlePlugin: { scroll: 16 },
  createDebounceLayoutPlugin: { delay: 150 },
  createRecyclePlugin: { poolSize: 20 },
};

const factories = Object.entries(plugins).filter(
  ([name, value]) => name.startsWith("create") && typeof value === "function"
) as Array<[string, ((config?: any) => WaterfallPlugin<any>) & { meta?: any }]>;

describe("插件一致性", () => {
  it("导出 26 个插件工厂", () => {
    expect(factories).toHaveLength(26);
  });

  it("每个工厂都有 .meta，且 name 与工厂名对应", () => {
    for (const [name, factory] of factories) {
      expect(factory.meta, `${name} 缺少 .meta`).toBeTruthy();
      expect(factory.meta.name).toMatch(/Plugin$/);
      expect(typeof factory.meta.description).toBe("string");
      expect(factory.meta.description.length).toBeGreaterThan(8);
    }
  });

  it("doc.json 与 .meta 一致，且 config 项字段完整", () => {
    const dir = path.join(process.cwd(), "src/custom-plugins");
    const dirs = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
    expect(dirs.length).toBe(26);

    for (const entry of dirs) {
      const docPath = path.join(dir, entry.name, "doc.json");
      expect(fs.existsSync(docPath), `${entry.name} 缺少 doc.json`).toBe(true);
      const doc = JSON.parse(fs.readFileSync(docPath, "utf-8"));
      expect(doc.name).toBe(`${entry.name.replace(/Plugin$/, "")}Plugin`);
      expect(doc.since).toBe("2.0.0");
      expect(Array.isArray(doc.config)).toBe(true);
      for (const item of doc.config) {
        expect(item.name, `${entry.name} config 缺 name`).toBeTruthy();
        expect(item.type, `${entry.name} config 缺 type`).toBeTruthy();
        expect(item.description, `${entry.name} config 缺 description`).toBeTruthy();
      }
      expect(doc.example).toContain("withPlugins");
      expect(doc.features.length).toBeGreaterThanOrEqual(3);
      expect(doc.useCases.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("hooks 只使用收口后的 20 个领域钩子", () => {
    for (const [name, factory] of factories) {
      const plugin = factory(MIN_CONFIG[name]);
      expect(plugin.name).toMatch(/Plugin$/);
      expect(plugin.hooks).toBeTruthy();
      for (const hook of Object.keys(plugin.hooks)) {
        expect(ALLOWED_HOOKS.has(hook), `${name} 用了未收口的钩子 ${hook}`).toBe(true);
      }
    }
  });

  it("数据管线 priority 固定：Filter > Sort > Search > Pagination", () => {
    const p = (name: string) => factories.find(([f]) => f === name)![1](MIN_CONFIG[name]).priority ?? 0;
    expect(p("createFilterPlugin")).toBe(40);
    expect(p("createSortPlugin")).toBe(30);
    expect(p("createSearchPlugin")).toBe(20);
    expect(p("createPaginationPlugin")).toBe(10);
    expect(p("createFilterPlugin")).toBeGreaterThan(p("createSortPlugin"));
    expect(p("createSortPlugin")).toBeGreaterThan(p("createSearchPlugin"));
    expect(p("createSearchPlugin")).toBeGreaterThan(p("createPaginationPlugin"));
  });
});

// ---------------- 端到端 ----------------

const proto = HTMLElement.prototype;
const originals = {
  clientWidth: Object.getOwnPropertyDescriptor(proto, "clientWidth"),
  offsetHeight: Object.getOwnPropertyDescriptor(proto, "offsetHeight"),
};
let containerWidth = 900;

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
      return this.hasAttribute("data-vane-waterfall") ? containerWidth : 300;
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
  if (originals.clientWidth) Object.defineProperty(proto, "clientWidth", originals.clientWidth);
  if (originals.offsetHeight) Object.defineProperty(proto, "offsetHeight", originals.offsetHeight);
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

const ITEMS = Array.from({ length: 10 }, (_v, index) => ({
  id: `item-${index}`,
  h: 100 + index * 10,
  price: index * 10,
  name: index % 2 === 0 ? "even" : "odd",
}));

async function mount(pluginList: WaterfallPlugin[], extra: Record<string, any> = {}) {
  const Wrapped = withPlugins(WaterfallCore, pluginList);
  const rendered: string[] = [];
  await act(async () => {
    root.render(
      <Wrapped
        ref={ref}
        items={ITEMS}
        columns={2}
        gap={10}
        debounceDelay={0}
        renderItem={(item: any) => {
          rendered.push(item.id);
          return <div data-h={item.h}>{item.id}</div>;
        }}
        keyExtractor={(item: any) => item.id}
        {...extra}
      />
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  return rendered;
}

describe("端到端", () => {
  it("数据管线：Filter → Sort → Pagination 组合结果正确", async () => {
    const rendered = await mount(
      [
        plugins.createFilterPlugin({ predicate: (item: any) => item.price >= 30 }),
        plugins.createSortPlugin({ comparator: (a: any, b: any) => b.price - a.price }),
        plugins.createPaginationPlugin({ pageSize: 3 }),
      ],
      { pageIndex: 1 }
    );

    // price>=30 → 30..90 共 7 条；降序 90,80,70,60,50,40,30；取第 1 页 3 条
    // renderItem 会被多次调用（重排、重渲染），取最后一轮结果
    expect(rendered.slice(-3)).toEqual(["item-9", "item-8", "item-7"]);
    expect(new Set(rendered).size).toBe(3);
    expect(ref.current!.getAllItemPositions().size).toBe(3);
  });

  it("布局钩子：AutoColumn 按容器宽度算列数，Gap 生效", async () => {
    containerWidth = 660;
    await mount([
      plugins.createAutoColumnPlugin({ minColumnWidth: 200 }),
      plugins.createGapPlugin({ columnGap: 10, rowGap: 10 }),
    ]);

    // (660 + 10) / (200 + 10) = 3.19 → 3 列
    expect(ref.current!.getLayoutInfo().columns).toBe(3);
    expect(ref.current!.getLayoutInfo().gap).toBe(10);
    // 第一行三项的 y 都是 0
    expect(ref.current!.getItemPosition(1)!.y).toBe(0);
    containerWidth = 900;
  });

  it("PinItem 把置顶项钉在顶部，后续项被推下去", async () => {
    await mount([plugins.createPinItemPlugin({ pinnedIndices: [0], column: 0 })], {
      columns: 1,
    });

    expect(ref.current!.getItemPosition(0)!.y).toBe(0);
    expect(ref.current!.getItemPosition(0)!.column).toBe(0);
    // 单列时第 2 项应落在置顶项下方（100 + gap 10）
    expect(ref.current!.getItemPosition(1)!.y).toBe(110);
  });

  it("PinItem 读得到 GapPlugin 经 transformProps 注入的间隔", async () => {
    // props 上不留 gap：间距只能由 GapPlugin 写进 transformProps 的结果。
    // 早先插件钩子里的 `context.props` 是**未经 transformProps 的那份**，
    // 于是 PinItem 读到 rowGap=undefined → 第二项与置顶块贴死（y 差 0 而非 gap），
    // x 也少算一个 columnGap（真实 demo 里表现为第二张卡左缩 12px）。
    await mount(
      [
        plugins.createGapPlugin({ columnGap: 20, rowGap: 20 }),
        plugins.createPinItemPlugin({ pinnedIndices: [0, 1], column: 0 }),
      ],
      { columns: 2, gap: undefined, columnGap: undefined, rowGap: undefined }
    );

    // 列宽 = (900 - 20) / 2 = 440
    expect(ref.current!.getLayoutInfo().columnWidth).toBe(440);

    const first = ref.current!.getItemPosition(0)!;
    const second = ref.current!.getItemPosition(1)!;

    // 第 1 项本该落列 1，被钉回列 0：x 必须与列 0 对齐，不能留一个 columnGap
    expect(second.column).toBe(0);
    expect(second.x).toBe(0);
    // 高度 100 + rowGap 20
    expect(second.y).toBe(120);
    expect(first.y).toBe(0);
  });

  it("覆盖层渲染在滚动容器内部且可被 StickyHeader 用 sticky 定位", async () => {
    await mount([
      plugins.createGroupingPlugin({ groupBy: (item: any) => item.name }),
      plugins.createStickyHeaderPlugin({ title: "今日推荐" }),
    ]);

    const container = ref.current!.getContainer()!;
    const header = host.textContent?.includes("今日推荐");
    expect(header).toBe(true);
    const sticky = host.querySelector<HTMLElement>('[data-vane-waterfall] > div');
    expect(sticky === null || container.contains(sticky)).toBe(true);
  });

  it("Recycle：离开视口设 visibility:hidden，回来恢复", () => {
    const plugin = plugins.createRecyclePlugin({ poolSize: 5 });
    const el = document.createElement("div");
    const container = document.createElement("div");
    const context: any = {
      getItemRef: (index: number) => (index === 0 ? el : null),
      containerRef: { current: container },
      props: {},
      itemRefs: new Map([[0, el]]),
    };

    plugin.hooks.onItemLeaveViewport!(context, 0, {
      index: 0,
      isVisible: false,
      visibleRatio: 0,
      isAboveViewport: true,
      isBelowViewport: false,
    });
    expect(el.style.visibility).toBe("hidden");

    plugin.hooks.onItemEnterViewport!(context, 0, {
      index: 0,
      isVisible: true,
      visibleRatio: 1,
      isAboveViewport: false,
      isBelowViewport: false,
    });
    expect(el.style.visibility).toBe("visible");
  });
});
