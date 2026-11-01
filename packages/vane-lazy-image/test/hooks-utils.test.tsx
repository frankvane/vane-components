import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLCPPreload } from "../src/hooks/useLCPPreload";
import { observerPool, observeElement } from "../src/components/LazyLoadImagePlugin/ObserverPool";
import {
  disposeGlobalContext,
  getGlobalNetworkInfo,
} from "../src/utils/GlobalContext";

function Probe({ src }: { src: string }) {
  useLCPPreload(src, true);
  return React.createElement("img", { src });
}

async function mount(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

afterEach(() => {
  document.querySelectorAll('link[rel="preload"]').forEach((n) => n.remove());
  observerPool.disconnectAll();
  vi.restoreAllMocks();
});

describe("P2-7 useLCPPreload 不再拼接 CSS 选择器", () => {
  it("含引号 / 方括号的签名 URL 也能正常插入预加载链接", async () => {
    const src = "/img/a'b[1].jpg?token=x";
    const { root } = await mount(<Probe src={src} />);
    const links = document.querySelectorAll('link[rel="preload"]');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(src);

    await act(async () => root.unmount());
  });

  it("同地址重复挂载不会插入第二条 preload，卸载后清理", async () => {
    const src = "/img/hero.jpg";
    const { root } = await mount(
      <>
        <Probe src={src} />
        <Probe src={src} />
      </>
    );
    expect(document.querySelectorAll('link[rel="preload"]')).toHaveLength(1);

    await act(async () => root.unmount());
    expect(document.querySelectorAll('link[rel="preload"]')).toHaveLength(0);
  });
});

describe("P2-8 ObserverPool 重复观察 / 重复退订", () => {
  it("同一元素注册两次回调，一次 unobserve 即清空全部回调与计数", () => {
    observerPool.disconnectAll();
    const el = document.createElement("div");
    document.body.appendChild(el);

    observeElement(el, () => {}, {});
    observeElement(el, () => {}, {});
    expect(observerPool.getElementCount()).toBe(1);
    expect(observerPool.getStats().elementCount).toBe(1);

    observerPool.unobserve(el);
    expect(observerPool.getElementCount()).toBe(0);
    // 旧实现按「一次删除一个回调」计数，会残留 elementCount=1
    expect(observerPool.getStats().elementCount).toBe(0);

    // 幂等：再次退订不报错、不产生负数
    observerPool.unobserve(el);
    expect(observerPool.getStats().elementCount).toBe(0);
    el.remove();
  });
});

describe("P2-9 GlobalContext 可释放并惰性重建监听", () => {
  it("dispose 移除 online/resize 监听，再次访问时重新注册", () => {
    // 确保已初始化（模块单例在导入时已注册过一次）
    getGlobalNetworkInfo();

    const removeSpy = vi.spyOn(window, "removeEventListener");
    const addSpy = vi.spyOn(window, "addEventListener");

    disposeGlobalContext();
    expect(removeSpy.mock.calls.some((c) => c[0] === "online")).toBe(true);
    expect(removeSpy.mock.calls.some((c) => c[0] === "resize")).toBe(true);

    getGlobalNetworkInfo();
    expect(addSpy.mock.calls.some((c) => c[0] === "online")).toBe(true);
    expect(addSpy.mock.calls.some((c) => c[0] === "resize")).toBe(true);
  });
});
