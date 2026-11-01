/**
 * 稳定性回归（P1-1 ~ P1-6）。
 *
 * 每个用例都按「旧实现会怎样失败」构造：回调抛错后布局冻结、数据集替换后沿用旧测量、
 * 数组引用变化触发全量重排、首屏不足一屏不触发触底、布局后内容跳动、零高度项不占位。
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import WaterfallCore, { type WaterfallCoreRef } from "../src/components/WaterfallPlugin/WaterfallCore";

const CONTAINER_WIDTH = 1000;
let mockClientHeight = 600;
let mockScrollHeight = 1000;

type Item = { id: string; h: number };

const proto = HTMLElement.prototype;
const originals = {
  clientWidth: Object.getOwnPropertyDescriptor(proto, "clientWidth"),
  clientHeight: Object.getOwnPropertyDescriptor(proto, "clientHeight"),
  scrollHeight: Object.getOwnPropertyDescriptor(proto, "scrollHeight"),
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
  Object.defineProperty(proto, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-vane-waterfall") ? mockClientHeight : 0;
    },
  });
  Object.defineProperty(proto, "scrollHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-vane-waterfall") ? mockScrollHeight : 0;
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
  for (const key of Object.keys(originals) as Array<keyof typeof originals>) {
    const descriptor = originals[key];
    if (descriptor) Object.defineProperty(proto, key, descriptor);
  }
});

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const ref = React.createRef<WaterfallCoreRef>();

beforeEach(() => {
  mockClientHeight = 600;
  mockScrollHeight = 1000;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  Element.prototype.scrollTo = function scrollTo() {
    /* noop */
  } as any;
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

function renderCore(
  items: Item[],
  extra: Partial<React.ComponentProps<typeof WaterfallCore>> = {}
) {
  return (
    <WaterfallCore
      ref={ref}
      items={items}
      columns={1}
      gap={10}
      debounceDelay={0}
      renderItem={(item: any) => <div data-h={item.h}>{item.id}</div>}
      keyExtractor={(item: any) => item.id}
      {...extra}
    />
  );
}

describe("P1-1 回调抛错后布局不冻结", () => {
  it("onBeforeLayout 抛错：本次跳过，下一次请求仍能正常布局", async () => {
    let shouldThrow = true;
    const onBeforeLayout = () => {
      if (shouldThrow) throw new Error("boom-before");
    };

    await act(async () => {
      root.render(
        renderCore([{ id: "a", h: 100 }, { id: "b", h: 100 }], { onBeforeLayout })
      );
    });
    await flush();

    // 旧实现：异常没被兜住，isCalculatingLayoutRef 卡在 true → 位置永远为空
    expect(ref.current!.getAllItemPositions().size).toBe(0);

    shouldThrow = false;
    act(() => ref.current!.relayout());
    await flush();

    // 标志已复位，补跑成功
    expect(ref.current!.getAllItemPositions().size).toBe(2);
    expect(ref.current!.getItemPosition(1)!.y).toBe(110);
  });

  it("onLayoutComplete 抛错：布局结果照常提交，后续重排继续", async () => {
    let calls = 0;
    const onLayoutComplete = () => {
      calls += 1;
      throw new Error("boom-complete");
    };

    await act(async () => {
      root.render(
        renderCore([{ id: "a", h: 100 }, { id: "b", h: 100 }], { onLayoutComplete })
      );
    });
    await flush();

    expect(calls).toBeGreaterThan(0);
    expect(ref.current!.getAllItemPositions().size).toBe(2);

    const els = host.querySelectorAll<HTMLElement>("[data-index]");
    els[0].setAttribute("data-h", "300");
    act(() => ref.current!.relayout());
    await flush();

    expect(ref.current!.getItemPosition(1)!.y).toBe(310);
  });
});

describe("P1-2 数据集替换清理测量缓存", () => {
  it("换数据后，离屏新项不再沿用旧项的高度", async () => {
    mockClientHeight = 1000;
    await act(async () => {
      root.render(
        renderCore(
          [
            { id: "a", h: 100 },
            { id: "b", h: 200 },
          ],
          { virtualize: { overscan: 0, estimateHeight: 240, adaptiveEstimate: false } }
        )
      );
    });
    await flush();

    // 此时两项都渲染过，缓存里有 a=100 / b=200
    expect((await ref.current!.measureItem(1)).height).toBe(200);

    // 视口缩到只放得下第一项 → 第二项卸载，缓存仍保留旧高度
    // （50 高：第一项占 [0,50)，第二项从 y=60 起，完全在视口外）
    mockClientHeight = 50;
    act(() => ref.current!.relayout());
    await flush();
    expect(host.querySelectorAll("[data-index]").length).toBe(1);
    expect((await ref.current!.measureItem(1)).height).toBe(200);

    // 换一批同长度但 key 完全不同的数据：旧实现对 index 1 依旧返回 200
    await act(async () => {
      root.render(
        renderCore(
          [
            { id: "c", h: 50 },
            { id: "d", h: 300 },
          ],
          { virtualize: { overscan: 0, estimateHeight: 240, adaptiveEstimate: false } }
        )
      );
    });
    await flush(100);

    const second = await ref.current!.measureItem(1);
    expect(second.height).not.toBe(200);
    // 新项未渲染 → 拿估值占位
    expect(second.height).toBe(240);
  });
});

describe("P1-3 数据集指纹：内容不变不重排", () => {
  it("换数组引用但 key 不变时不触发重排", async () => {
    let layoutCalls = 0;
    const onLayout = () => {
      layoutCalls += 1;
    };

    await act(async () => {
      root.render(
        renderCore([{ id: "a", h: 100 }, { id: "b", h: 100 }], { onLayout })
      );
    });
    await flush();

    const before = ref.current!.getAllItemPositions();
    const count = layoutCalls;

    await act(async () => {
      root.render(
        renderCore([{ id: "a", h: 100 }, { id: "b", h: 100 }], { onLayout })
      );
    });
    await flush();

    // 旧实现每次渲染都会产出新 items → 每次全量重排
    expect(layoutCalls).toBe(count);
    expect(ref.current!.getAllItemPositions()).toBe(before);
  });
});

describe("P1-4 首屏不足一屏也触发触底", () => {
  it("内容高度小于容器高度时，挂载布局完成后触发 onReachBottom", async () => {
    mockClientHeight = 600;
    mockScrollHeight = 200; // 内容不足一屏，永远不会产生 scroll 事件
    const distances: number[] = [];

    await act(async () => {
      root.render(
        renderCore([{ id: "a", h: 100 }], {
          onReachBottom: (distance: number) => distances.push(distance),
        })
      );
    });
    await flush();

    expect(distances.length).toBe(1);
    expect(distances[0]).toBeLessThan(0);
  });
});

describe("P1-5 测量回写后的滚动锚定", () => {
  it("视口上方项变高时补偿 scrollTop，首个可见项留在原位", async () => {
    mockClientHeight = 200;
    await act(async () => {
      root.render(
        renderCore([
          { id: "a", h: 100 },
          { id: "b", h: 100 },
          { id: "c", h: 100 },
        ])
      );
    });
    await flush();

    const container = ref.current!.getContainer()!;
    container.scrollTop = 110; // 项 b 正好贴视口顶部

    const els = host.querySelectorAll<HTMLElement>("[data-index]");
    els[0].setAttribute("data-h", "300");
    act(() => ref.current!.relayout());
    await flush();

    // b 的新 y = 310；锚点偏移 0 → 补偿后 scrollTop 应为 310（旧实现停在 110，内容整体下跳）
    expect(ref.current!.getItemPosition(1)!.y).toBe(310);
    expect(container.scrollTop).toBe(310);
  });
});

describe("P1-6 零高度项不再被丢弃", () => {
  it("首测高度为 0 的项仍占位（minItemHeight 默认 48）", async () => {
    await act(async () => {
      root.render(
        renderCore([{ id: "a", h: 0 }, { id: "b", h: 100 }])
      );
    });
    await flush();

    const positions = ref.current!.getAllItemPositions();
    expect(positions.size).toBe(2);
    expect(positions.get(0)!.height).toBe(48);
    // 后续项排在占位块之后，而不是压在它身上
    expect(positions.get(1)!.y).toBe(58);
  });

  it("显式 minItemHeight=0 时退回旧行为（跳过不占位）", async () => {
    await act(async () => {
      root.render(
        renderCore([{ id: "a", h: 0 }, { id: "b", h: 100 }], { minItemHeight: 0 })
      );
    });
    await flush();

    const positions = ref.current!.getAllItemPositions();
    expect(positions.size).toBe(1);
    expect(positions.get(1)!.y).toBe(0);
  });
});
