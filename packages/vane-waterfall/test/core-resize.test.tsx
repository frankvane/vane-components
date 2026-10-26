/**
 * 尺寸变化触发重排：项高度变了（图片加载、内容展开）要重新算位置。
 *
 * happy-dom 的 ResizeObserver 不会真的感知布局变化，这里换成可控 mock：
 * 记下每个被观察的元素，测试里手动 `trigger(el)` 模拟「这一项高度变了」，
 * 再等防抖窗口过去，断言位置已更新。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import WaterfallCore, { type WaterfallCoreRef } from "../src/components/WaterfallPlugin/WaterfallCore";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CONTAINER_WIDTH = 900;

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
  trigger(el: Element) {
    this.callback([{ target: el } as unknown as ResizeObserverEntry], this as any);
  }
  static triggerAll() {
    for (const instance of MockResizeObserver.instances) {
      instance.targets.forEach((el) => instance.trigger(el));
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

async function render(items: Array<{ id: string; h: number }>) {
  await act(async () => {
    root.render(
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
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

describe("尺寸变化重排", () => {
  it("项高度变大后，后续项下移", async () => {
    await render([
      { id: "a", h: 100 },
      { id: "b", h: 120 },
    ]);
    expect(ref.current!.getItemPosition(1)!.y).toBe(110);

    // 第 1 项从 100 长到 260（典型：图片加载完成、正文展开）
    const first = host.querySelector<HTMLElement>('[data-index="0"]')!;
    first.setAttribute("data-h", "260");
    act(() => MockResizeObserver.triggerAll());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    expect(ref.current!.getItemPosition(1)!.y).toBe(270);
    expect(ref.current!.getLayoutInfo().totalHeight).toBe(260 + 10 + 120 + 10);
  });

  it("容器尺寸变化（ResizeObserver 观察容器）触发列宽重算", async () => {
    await render([{ id: "a", h: 100 }]);
    expect(ref.current!.getLayoutInfo().columnWidth).toBe(CONTAINER_WIDTH);

    // 容器宽度改成 600 再通知一次
    Object.defineProperty(proto, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute("data-vane-waterfall") ? 600 : 300;
      },
    });
    act(() => MockResizeObserver.triggerAll());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    expect(ref.current!.getLayoutInfo().columnWidth).toBe(600);
  });

  it("卸载时断掉所有 observer（不留悬挂回调）", async () => {
    await render([{ id: "a", h: 100 }]);
    const observed = MockResizeObserver.instances.reduce(
      (sum, instance) => sum + instance.targets.size,
      0
    );
    expect(observed).toBeGreaterThan(0);

    act(() => root.unmount());
    const remaining = MockResizeObserver.instances.reduce(
      (sum, instance) => sum + instance.targets.size,
      0
    );
    expect(remaining).toBe(0);

    // 重新建一个 root 供 afterEach 卸载
    root = createRoot(host);
  });
});
