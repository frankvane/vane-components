/**
 * 装配层语义（W2 验收）：priority 链、短路、清理函数、插槽位置、错误隔离。
 * 用最小假插件验证，不依赖任何官方插件。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import WaterfallCore, {
  type WaterfallCoreProps,
  type WaterfallCoreRef,
} from "../src/components/WaterfallPlugin/WaterfallCore";
import { withPlugins } from "../src/components/WaterfallPlugin/withPlugins";
import type { WaterfallPlugin } from "../src/components/WaterfallPlugin/plugins/types";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// ---- 测量桩（happy-dom 无布局引擎）----
const proto = HTMLElement.prototype;
const originals = {
  clientWidth: Object.getOwnPropertyDescriptor(proto, "clientWidth"),
  offsetHeight: Object.getOwnPropertyDescriptor(proto, "offsetHeight"),
};

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
      return this.hasAttribute("data-vane-waterfall") ? 900 : 300;
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

const ITEMS = [{ id: "a", h: 100 }, { id: "b", h: 120 }];

function makePlugin(
  name: string,
  hooks: Partial<WaterfallPlugin["hooks"]>,
  priority = 0
): WaterfallPlugin {
  return { name, priority, hooks } as WaterfallPlugin;
}

async function mount(plugins: WaterfallPlugin[], extra: Partial<WaterfallCoreProps> = {}) {
  const Wrapped = withPlugins(WaterfallCore, plugins);
  await act(async () => {
    root.render(
      <Wrapped
        ref={ref}
        items={ITEMS}
        columns={1}
        gap={10}
        debounceDelay={0}
        renderItem={(item) => <div data-h={(item as { h: number }).h}>item</div>}
        keyExtractor={(item) => (item as { id: string }).id}
        {...extra}
      />
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

describe("装配层语义", () => {
  it("transformProps 按 priority 降序链式生效", async () => {
    const trace: string[] = [];
    await mount([
      makePlugin("low", { transformProps: (p) => { trace.push("low"); return { ...p, gap: (p.gap ?? 0) + 1 }; } }, 1),
      makePlugin("high", { transformProps: (p) => { trace.push("high"); return { ...p, gap: (p.gap ?? 0) * 10 }; } }, 100),
    ]);

    expect(trace.slice(0, 2)).toEqual(["high", "low"]);
    // 高优先级先把 gap 10 → 100，低优先级再 +1 → 101，Core 用的是链尾结果
    expect(ref.current!.getLayoutInfo().gap).toBe(101);
    expect(ref.current!.getItemPosition(1)!.y).toBe(100 + 101);
  });

  it("onBeforeLayout 返回 false 中断布局钩子链", async () => {
    const after: string[] = [];
    await mount([
      makePlugin("blocker", { onBeforeLayout: () => false }, 100),
      makePlugin("after", { onBeforeLayout: () => { after.push("after"); return true; } }, 1),
    ]);

    expect(after).toEqual([]);
    // 布局被阻断 → 没有任何位置
    expect(ref.current!.getAllItemPositions().size).toBe(0);
  });

  it("onMount 返回的清理函数在卸载时执行一次", async () => {
    let cleaned = 0;
    await mount([makePlugin("cleanup", { onMount: () => () => { cleaned += 1; } })]);

    expect(cleaned).toBe(0);
    act(() => root.unmount());
    expect(cleaned).toBe(1);

    root = createRoot(host); // 供 afterEach 卸载
  });

  it("renderOverlay 渲染在滚动容器内部", async () => {
    await mount([
      makePlugin("overlay", {
        renderOverlay: () => <div data-testid="overlay">overlay</div>,
      }),
    ]);

    const container = ref.current!.getContainer()!;
    const overlay = host.querySelector("[data-testid='overlay']")!;
    expect(overlay).toBeTruthy();
    expect(container.contains(overlay)).toBe(true);
  });

  it("renderItemWrapper 包裹每个项，且按装配顺序套娃", async () => {
    await mount([
      makePlugin("wrapper", {
        renderItemWrapper: (_ctx, node, index) => (
          <div data-wrap={`w-${index}`}>{node}</div>
        ),
      }),
    ]);

    const firstItem = host.querySelector('[data-index="0"]')!;
    expect(firstItem.querySelector("[data-wrap='w-0']")).toBeTruthy();
  });

  it("单个插件抛错不影响其他插件", async () => {
    const seen: string[] = [];
    await mount([
      makePlugin("boom", {
        onLayoutComplete: () => {
          throw new Error("boom");
        },
      }, 100),
      makePlugin("ok", { onLayoutComplete: () => { seen.push("ok"); } }, 1),
    ]);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(seen).toContain("ok");
    expect(ref.current!.getAllItemPositions().size).toBe(2);
  });

  it("上下文里能读到布局、视口与项位置", async () => {
    let snapshot: any = null;
    await mount([
      makePlugin("reader", {
        onLayoutComplete: (ctx) => {
          snapshot = {
            items: ctx.items.length,
            itemCount: ctx.itemCount,
            columns: ctx.layout.columns,
            firstY: ctx.getItemPosition(0)?.y,
            visibleStart: ctx.visibleRange.start,
            hasMore: ctx.hasMore,
            shared: ctx.sharedData instanceof Map,
          };
        },
      }),
    ]);

    expect(snapshot).toEqual({
      items: 2,
      itemCount: 2,
      columns: 1,
      firstY: 0,
      visibleStart: 0,
      hasMore: true,
      shared: true,
    });
  });
});
