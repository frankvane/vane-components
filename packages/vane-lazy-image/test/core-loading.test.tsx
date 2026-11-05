import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LazyLoadImageCore,
  type LazyLoadImageCoreRef,
} from "../src/components/LazyLoadImagePlugin/LazyLoadImageCore";
import { withPlugins } from "../src/components/LazyLoadImagePlugin/withPlugins";
import { createFallbackImagePlugin } from "../src/custom-plugins/FallbackImagePlugin";
import { INTERSECTION_OBSERVER_DEFAULTS } from "../src/components/LazyLoadImagePlugin/constants";
import { observerPool } from "../src/components/LazyLoadImagePlugin/ObserverPool";
import type { LazyImagePlugin } from "../src/components/LazyLoadImagePlugin/plugins/types";

/** 在独立容器里挂载，返回容器 / root / 组件 ref */
async function mount(element: React.ReactElement) {
  const localContainer = document.createElement("div");
  document.body.appendChild(localContainer);
  const localRoot = createRoot(localContainer);
  await act(async () => {
    localRoot.render(element);
  });
  return { localContainer, localRoot };
}

async function rerender(root: ReturnType<typeof createRoot>, element: React.ReactElement) {
  await act(async () => {
    root.render(element);
  });
}

async function fire(el: Element, type: string) {
  await act(async () => {
    el.dispatchEvent(new Event(type));
    // 让 React 内部事件队列与微任务（插件钩子链）冲刷完
    await Promise.resolve();
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  observerPool.disconnectAll();
});

describe("Core 加载链路回归（P0-1 / P0-2 / P1-1 / P1-2）", () => {
  it("P0-1：已加载后换 src 会重置状态机并重新发起加载", async () => {
    const ref = React.createRef<LazyLoadImageCoreRef>();
    const { localContainer, localRoot } = await mount(
      <LazyLoadImageCore ref={ref} src="/a.jpg" loading="eager" />
    );

    const img = localContainer.querySelector("img")!;
    await fire(img, "load");
    expect(ref.current!.getState().isLoaded).toBe(true);

    // 换图：即使旧状态是 loaded，也必须回到 loading 并请求新地址
    await rerender(localRoot, <LazyLoadImageCore ref={ref} src="/b.jpg" loading="eager" />);
    expect(ref.current!.getState().isLoading).toBe(true);
    expect(localContainer.querySelector("img")!.getAttribute("src")).toBe("/b.jpg");

    await act(async () => localRoot.unmount());
    localContainer.remove();
  });

  it("P0-2：迟到 / 无关地址的事件不会把 loading 误判为成功", async () => {
    const ref = React.createRef<LazyLoadImageCoreRef>();
    const { localContainer, localRoot } = await mount(
      <LazyLoadImageCore ref={ref} src="/a.jpg" loading="eager" />
    );

    const img = localContainer.querySelector("img")!;
    // 模拟迟到的旧请求：currentSrc 指向另一个地址，但 img 上仍是本次的 /a.jpg
    Object.defineProperty(img, "currentSrc", {
      value: "http://localhost/old.jpg",
      configurable: true,
    });
    await fire(img, "load");
    expect(ref.current!.getState().isLoading).toBe(true);
    expect(ref.current!.getState().isLoaded).toBe(false);

    // 去掉伪装后，本次请求的正常 load 事件仍应生效
    delete (img as unknown as { currentSrc?: string }).currentSrc;
    await fire(img, "load");
    expect(ref.current!.getState().isLoaded).toBe(true);

    await act(async () => localRoot.unmount());
    localContainer.remove();
  });

  it("P0-2：回退图加载成功后，error 态可以转为 loaded 并同步 displaySrc", async () => {
    const Wrapped = withPlugins(LazyLoadImageCore, [
      createFallbackImagePlugin({ fallbackSrc: "/404.jpg" }),
    ]);
    const ref = React.createRef<LazyLoadImageCoreRef>();
    const { localContainer, localRoot } = await mount(
      <Wrapped ref={ref} src="/broken.jpg" loading="eager" />
    );

    const img = localContainer.querySelector("img")!;
    await act(async () => {
      img.dispatchEvent(new Event("error"));
      // 插件链异步执行：等 onLoadError 把 img.src 改写为回退地址
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(ref.current!.getState().isError).toBe(true);
    expect(img.getAttribute("src")).toBe("/404.jpg");

    await fire(img, "load");
    expect(ref.current!.getState().isLoaded).toBe(true);
    // displaySrc 会同步为真正加载成功的回退地址（可能是绝对 URL）
    expect(img.getAttribute("src")).toMatch(/404\.jpg$/);

    await act(async () => localRoot.unmount());
    localContainer.remove();
  });

  it("P1-1：空 src 回到 idle 且不渲染 img，回填后恢复加载", async () => {
    const ref = React.createRef<LazyLoadImageCoreRef>();
    const { localContainer, localRoot } = await mount(
      <LazyLoadImageCore ref={ref} src="" loading="eager" />
    );

    expect(ref.current!.getState().isIdle).toBe(true);
    expect(ref.current!.getState().isLoading).toBe(false);
    expect(localContainer.querySelector("img")).toBeNull();

    await rerender(localRoot, <LazyLoadImageCore ref={ref} src="/a.jpg" loading="eager" />);
    expect(ref.current!.getState().isLoading).toBe(true);
    expect(localContainer.querySelector("img")!.getAttribute("src")).toBe("/a.jpg");

    await act(async () => localRoot.unmount());
    localContainer.remove();
  });

  it("P1-2：无 IntersectionObserver 环境降级为立即加载", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const ref = React.createRef<LazyLoadImageCoreRef>();
    const { localContainer, localRoot } = await mount(
      <LazyLoadImageCore ref={ref} src="/a.jpg" loading="lazy" />
    );

    expect(ref.current!.getState().isLoading).toBe(true);
    expect(localContainer.querySelector("img")!.getAttribute("src")).toBe("/a.jpg");

    await act(async () => localRoot.unmount());
    localContainer.remove();
  });

  it("P1-4：切换 root 滚动容器会重建观察（不同 root 生成独立 observer）", async () => {
    observerPool.disconnectAll();
    const rootA = document.createElement("div");
    const rootB = document.createElement("div");
    document.body.appendChild(rootA);
    document.body.appendChild(rootB);

    const { localContainer, localRoot } = await mount(
      <LazyLoadImageCore src="/a.jpg" loading="lazy" root={rootA} />
    );
    expect(observerPool.getObserverCount()).toBeGreaterThanOrEqual(1);

    await rerender(localRoot, <LazyLoadImageCore src="/a.jpg" loading="lazy" root={rootB} />);
    expect(observerPool.getObserverCount()).toBeGreaterThanOrEqual(2);

    await act(async () => localRoot.unmount());
    localContainer.remove();
    rootA.remove();
    rootB.remove();
  });

  it("P1-5：门控中止后按 300ms 延迟重试，最终进入 loading", async () => {
    let calls = 0;
    const gateOnce: LazyImagePlugin = {
      name: "gate-once",
      hooks: {
        onBeforeLoad: () => {
          calls += 1;
          return calls === 1 ? false : true;
        },
      },
    };
    const Wrapped = withPlugins(LazyLoadImageCore, [gateOnce]);
    const ref = React.createRef<LazyLoadImageCoreRef>();
    const { localContainer, localRoot } = await mount(
      <Wrapped ref={ref} src="/a.jpg" loading="eager" />
    );

    // 首次被门控拦截：不进入 loading、不报错
    expect(ref.current!.getState().isIdle).toBe(true);
    expect(calls).toBe(1);

    // 等待门控重试定时器（300ms）触发
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(calls).toBe(2);
    expect(ref.current!.getState().isLoading).toBe(true);

    await act(async () => localRoot.unmount());
    localContainer.remove();
  });
});

describe("拦截器默认值（P1-3 / P2-10）", () => {
  it("默认 rootMargin 为 200px 提前量", () => {
    expect(INTERSECTION_OBSERVER_DEFAULTS.ROOT_MARGIN).toBe("200px 0px");
  });

  it("默认不在可见后退订（保证 leave 事件可持续触发）", () => {
    expect(INTERSECTION_OBSERVER_DEFAULTS.UNOBSERVE_ON_VISIBLE).toBe(false);
  });
});
