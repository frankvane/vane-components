/**
 * Core ref 契约：`relayout` / `scrollToItem` / `measureItem` / `getLayoutInfo`。
 *
 * happy-dom 没有布局引擎（`offsetHeight` 恒为 0），这里用属性拦截造出可控的
 * 测量结果：容器 1000 宽，项高度取 `[data-h]`。这不模拟 CSS，只验证
 * 「Core 有没有按契约测量、算位置、回写」。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import WaterfallCore, { type WaterfallCoreRef } from "../src/components/WaterfallPlugin/WaterfallCore";

const CONTAINER_WIDTH = 1000;

type Item = { id: string; h: number };

const proto = HTMLElement.prototype;
const originals = {
  clientWidth: Object.getOwnPropertyDescriptor(proto, "clientWidth"),
  offsetHeight: Object.getOwnPropertyDescriptor(proto, "offsetHeight"),
  offsetWidth: Object.getOwnPropertyDescriptor(proto, "offsetWidth"),
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
      return this.hasAttribute("data-vane-waterfall") ? CONTAINER_WIDTH : 300;
    },
  });
  Object.defineProperty(proto, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return readHeight(this);
    },
  });
  Object.defineProperty(proto, "offsetWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-vane-waterfall") ? CONTAINER_WIDTH : 300;
    },
  });
});

afterAll(() => {
  if (originals.clientWidth) Object.defineProperty(proto, "clientWidth", originals.clientWidth);
  if (originals.offsetHeight) Object.defineProperty(proto, "offsetHeight", originals.offsetHeight);
  if (originals.offsetWidth) Object.defineProperty(proto, "offsetWidth", originals.offsetWidth);
});

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const scrollCalls: Array<{ top: number; behavior?: string }> = [];

beforeEach(() => {
  scrollCalls.length = 0;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  // happy-dom 的 scrollTo 不改变滚动位置，这里只记录调用
  Element.prototype.scrollTo = function scrollTo(options: any) {
    scrollCalls.push({ top: options?.top ?? 0, behavior: options?.behavior });
  } as any;
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const ref = React.createRef<WaterfallCoreRef>();

const renderItems = (items: Item[]) => (
  <WaterfallCore
    ref={ref}
    items={items}
    columns={1}
    gap={10}
    debounceDelay={0}
    renderItem={(item) => <div data-h={item.h}>item</div>}
    keyExtractor={(item) => item.id}
  />
);

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

describe("Core ref 契约", () => {
  it("挂载后按真实高度算位置，getLayoutInfo 列宽正确", async () => {
    await act(async () => {
      root.render(renderItems([{ id: "a", h: 100 }, { id: "b", h: 150 }]));
    });
    await flush();

    const positions = ref.current!.getAllItemPositions();
    expect(positions.size).toBe(2);
    expect(positions.get(0)!.y).toBe(0);
    expect(positions.get(1)!.y).toBe(110);
    expect(ref.current!.getLayoutInfo().columnWidth).toBe(CONTAINER_WIDTH);
    expect(ref.current!.getLayoutInfo().totalHeight).toBe(100 + 10 + 150 + 10);
  });

  it("scrollToItem 按 block 计算滚动量", async () => {
    await act(async () => {
      root.render(
        renderItems([
          { id: "a", h: 100 },
          { id: "b", h: 150 },
          { id: "c", h: 80 },
        ])
      );
    });
    await flush();

    act(() => ref.current!.scrollToItem(2, { block: "start" }));
    expect(scrollCalls.at(-1)!.top).toBe(270);

    act(() => ref.current!.scrollToItem(2, { block: "end" }));
    // clientHeight 为 0（happy-dom 无布局）→ end 与 start 相同
    expect(scrollCalls.at(-1)!.top).toBeGreaterThanOrEqual(270);
  });

  it("measureItem 返回真实尺寸；未渲染项回退到缓存/估值", async () => {
    await act(async () => {
      root.render(renderItems([{ id: "a", h: 120 }]));
    });
    await flush();

    const size = await ref.current!.measureItem(0);
    expect(size.height).toBe(120);

    const missing = await ref.current!.measureItem(99);
    expect(missing.height).toBe(0);
  });

  it("relayout 在高度变化后重算位置", async () => {
    await act(async () => {
      root.render(renderItems([{ id: "a", h: 100 }, { id: "b", h: 100 }]));
    });
    await flush();
    expect(ref.current!.getItemPosition(1)!.y).toBe(110);

    // 直接改 DOM 上的高度，再显式 relayout
    const els = host.querySelectorAll<HTMLElement>("[data-index]");
    els[0].setAttribute("data-h", "300");
    act(() => ref.current!.relayout());
    await flush();

    expect(ref.current!.getItemPosition(1)!.y).toBe(310);
  });

  it("items 置空后位置清空、总高归零", async () => {
    await act(async () => {
      root.render(renderItems([{ id: "a", h: 100 }]));
    });
    await flush();
    expect(ref.current!.getAllItemPositions().size).toBe(1);

    await act(async () => {
      root.render(renderItems([]));
    });
    await flush();

    expect(ref.current!.getAllItemPositions().size).toBe(0);
    expect(ref.current!.getLayoutInfo().totalHeight).toBe(0);
  });
});
