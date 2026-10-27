/**
 * 测试公共桩：happy-dom 无布局引擎，这里提供
 *  - IntersectionObserver / ResizeObserver 的极简 mock（可断言创建次数）
 *  - renderCard / renderCore 渲染工具（createRoot + act，仿 waterfall 测试）
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import CardCore, {
  type CardCoreProps,
  type CardCoreRef,
} from "../src/components/CardPlugin/core/CardCore";
import { withPlugins } from "../src/components/CardPlugin/plugins/withPlugins";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// ---- Observer 桩 ----
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: any;
  observed: Element[] = [];
  constructor(cb: any) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
    this.callback([{ isIntersecting: true, target: el }]);
  }
  unobserve() {}
  disconnect() {
    this.observed = [];
  }
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: any;
  observed: Element[] = [];
  constructor(cb: any) {
    this.callback = cb;
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
    this.callback([{ contentRect: { width: 100, height: 80 } }]);
  }
  unobserve() {}
  disconnect() {
    this.observed = [];
  }
}

export function installObservers() {
  MockIntersectionObserver.instances = [];
  MockResizeObserver.instances = [];
  (globalThis as any).IntersectionObserver = MockIntersectionObserver as any;
  (globalThis as any).ResizeObserver = MockResizeObserver as any;
}
export function ioInstances() {
  return MockIntersectionObserver.instances;
}
export function roInstances() {
  return MockResizeObserver.instances;
}

export interface RenderHandle {
  container: HTMLDivElement;
  root: Root;
  ref: React.RefObject<CardCoreRef>;
  unmount: () => void;
  /** 用新的 props 重渲染同一棵树（用于验证 hooks 顺序在重渲染中保持稳定） */
  rerender: (next: Partial<CardCoreProps<any>>) => Promise<void>;
}

/**
 * 冲刷微任务：`executeHook` 是 async（钩子体在首个 await 之后才执行），
 * 因此 renderCard 之后必须显式等一轮，否则同步断言会读到「钩子还没跑」的假象。
 * 包在 act 里保证期间产生的 setState 被正常处理。
 */
export async function flush(times = 3): Promise<void> {
  await act(async () => {
    for (let i = 0; i < times; i += 1) {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
}

/** 用 withPlugins 包装 CardCore 渲染一张卡（真实插件系统链路） */
export function renderCard(
  plugins: CardPlugin<any>[],
  props: Partial<CardCoreProps<any>> = {}
): RenderHandle {
  const Wrapped = withPlugins(CardCore as any, { plugins });
  const ref = React.createRef<CardCoreRef>();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const baseProps = { cardId: "test-card", data: {}, ...props };
  const render = (p: Record<string, unknown>) =>
    root.render(React.createElement(Wrapped, { ref, ...p } as any));
  act(() => {
    render(baseProps);
  });
  let current = baseProps;
  return {
    container,
    root,
    ref,
    unmount: () => act(() => root.unmount()),
    rerender: async (next) => {
      current = { ...current, ...next };
      await act(async () => {
        render(current);
      });
      await flush();
    },
  };
}

/** 直接渲染 CardCore（不带插件系统），用于 Core 单测 */
export function renderCore(
  props: Partial<CardCoreProps<any>> = {}
): RenderHandle {
  const ref = React.createRef<CardCoreRef>();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: Record<string, unknown> = {
    cardId: "test-card",
    data: {},
    ...props,
  };
  const render = (p: Record<string, unknown>) =>
    root.render(React.createElement(CardCore as any, { ref, ...p } as any));
  act(() => {
    render(current);
  });
  return {
    container,
    root,
    ref,
    unmount: () => act(() => root.unmount()),
    rerender: async (next) => {
      current = { ...current, ...next };
      await act(async () => {
        render(current);
      });
      await flush();
    },
  };
}
