/**
 * props 变化要立刻反映到布局上（回归测试，2026-10-26）
 *
 * 现场：示例页把「列数」从 3 拖到 5，读数变了、卡片没变 —— 排是排了，
 * 但项级 ResizeObserver 的回调持有**首帧**的 `calculateLayout`（闭包里 columns=3），
 * 卡片因列宽变化回流时它被触发，又用 3 列排了一遍，把结果盖回去。
 * 增加列数必现、减少列数偶发，所以很容易被当成「控件没接上」。
 *
 * 这里把两条都钉住：
 *  1. columns / padding 变了就要重排（effect 依赖表别漏项）；
 *  2. 重排之后 ResizeObserver 再触发，结果必须保持新值（不能用陈旧闭包覆盖）。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import WaterfallCore, { type WaterfallCoreRef } from "../src/components/WaterfallPlugin/WaterfallCore";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CONTAINER_WIDTH = 900;
const GAP = 10;

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  targets = new Set<Element>();
  constructor(public callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
  static triggerAll() {
    for (const instance of MockResizeObserver.instances) {
      instance.targets.forEach((el) =>
        instance.callback([{ target: el } as unknown as ResizeObserverEntry], instance as any)
      );
    }
  }
  static reset() {
    MockResizeObserver.instances = [];
  }
}

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
      return this.hasAttribute("data-vane-waterfall") ? CONTAINER_WIDTH : 300;
    },
  });
  Object.defineProperty(proto, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return readHeight(this);
    },
  });
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

afterAll(() => {
  if (originals.clientWidth) Object.defineProperty(proto, "clientWidth", originals.clientWidth);
  if (originals.offsetHeight) Object.defineProperty(proto, "offsetHeight", originals.offsetHeight);
  vi.unstubAllGlobals();
});

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const ref = React.createRef<WaterfallCoreRef>();

const ITEMS = [
  { id: "a", h: 100 },
  { id: "b", h: 120 },
  { id: "c", h: 140 },
  { id: "d", h: 160 },
];

beforeEach(() => {
  MockResizeObserver.reset();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const settle = async (ms = 30) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

async function render(props: { columns: number; padding?: number }) {
  await act(async () => {
    root.render(
      <WaterfallCore
        ref={ref}
        items={ITEMS}
        columns={props.columns}
        padding={props.padding ?? 0}
        gap={GAP}
        debounceDelay={0}
        renderItem={(item) => <div data-h={item.h}>item</div>}
        keyExtractor={(item) => item.id}
      />
    );
  });
  await settle();
}

describe("布局 props 变化", () => {
  it("columns 变多后立即按新列数重排", async () => {
    await render({ columns: 2 });
    expect(ref.current!.getLayoutInfo().columns).toBe(2);
    expect(ref.current!.getLayoutInfo().columnWidth).toBe((CONTAINER_WIDTH - GAP) / 2);

    await render({ columns: 4 });
    expect(ref.current!.getLayoutInfo().columns).toBe(4);
    expect(ref.current!.getLayoutInfo().columnWidth).toBe((CONTAINER_WIDTH - GAP * 3) / 4);
  });

  it("重排后项级 ResizeObserver 再触发，不能把列数盖回旧值", async () => {
    await render({ columns: 3 });
    expect(ref.current!.getLayoutInfo().columns).toBe(3);

    await render({ columns: 5 });
    // 卡片宽度变了 → 内容回流 → 每项的 ResizeObserver 都会来一次
    act(() => MockResizeObserver.triggerAll());
    await settle();

    expect(ref.current!.getLayoutInfo().columns).toBe(5);
    // 第 4 项落在第 4 列（0 基）—— 3 列时它只能落在 0..2
    expect(ref.current!.getItemPosition(3)!.column).toBe(3);
    expect(ref.current!.getLayoutInfo().columnWidth).toBe((CONTAINER_WIDTH - GAP * 4) / 5);
  });

  it("padding 变化参与布局（可用宽 = 容器宽 − 左右 padding）", async () => {
    await render({ columns: 2, padding: 0 });
    expect(ref.current!.getLayoutInfo().columnWidth).toBe((CONTAINER_WIDTH - GAP) / 2);
    expect(ref.current!.getItemPosition(0)!.x).toBe(0);

    await render({ columns: 2, padding: 30 });
    expect(ref.current!.getLayoutInfo().columnWidth).toBe((CONTAINER_WIDTH - 60 - GAP) / 2);
    expect(ref.current!.getItemPosition(0)!.x).toBe(30);
  });

  it("布局期间到达的请求不会被丢弃（补齐后列数正确）", async () => {
    await render({ columns: 1 });
    // 同一帧内连续改两次：第一次进入 await，第二次必须排队而不是被静默丢掉
    await act(async () => {
      root.render(
        <WaterfallCore
          ref={ref}
          items={ITEMS}
          columns={2}
          gap={GAP}
          debounceDelay={0}
          renderItem={(item) => <div data-h={item.h}>item</div>}
          keyExtractor={(item) => item.id}
        />
      );
    });
    await render({ columns: 4 });
    await settle(60);
    expect(ref.current!.getLayoutInfo().columns).toBe(4);
  });
});
