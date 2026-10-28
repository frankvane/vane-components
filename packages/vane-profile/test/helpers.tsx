/**
 * 测试公共桩（仿 vane-card / vane-waterfall 测试范式）。
 *
 * happy-dom 无布局引擎，这里只提供最小渲染工具：
 *  - renderProfile：用 withPlugins 包装 ProfileCore 跑真实插件系统链路；
 *  - flush：冲刷微任务，`executeHook` 是 async，render 后必须等一轮再断言。
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import ProfileCore from "../src/components/ProfilePlugin/ProfileCore";
import { withPlugins } from "../src/components/ProfilePlugin/withPlugins";
import type {
  ProfileCoreProps,
  ProfileCoreRef,
  ProfilePlugin,
} from "../src/components/ProfilePlugin/plugins/types";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * 冲刷微任务：`executeHook` 是 async（钩子体在首个 await 之后才执行），
 * 因此 renderProfile 之后必须显式等一轮，否则同步断言会读到「钩子还没跑」的假象。
 */
export async function flush(times = 3): Promise<void> {
  await act(async () => {
    for (let i = 0; i < times; i += 1) {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
}

export interface RenderHandle {
  container: HTMLDivElement;
  root: Root;
  ref: React.RefObject<ProfileCoreRef>;
  unmount: () => void;
  /** 用新的 props 重渲染同一棵树 */
  rerender: (next: Partial<ProfileCoreProps<any>>) => Promise<void>;
}

/** 用 withPlugins 包装 ProfileCore，跑真实插件系统链路 */
export function renderProfile(
  plugins: ProfilePlugin<any>[],
  props: Partial<ProfileCoreProps<any>> = {}
): RenderHandle {
  const Wrapped = withPlugins(ProfileCore as any, { plugins });
  const ref = React.createRef<ProfileCoreRef>();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: Record<string, unknown> = { ...props };
  const render = (p: Record<string, unknown>) =>
    root.render(React.createElement(Wrapped, { ref, ...p } as any));
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

/** 直接渲染 ProfileCore（不带插件系统），用于 Core 单测 */
export function renderCore(
  props: Partial<ProfileCoreProps<any>> = {}
): RenderHandle {
  const ref = React.createRef<ProfileCoreRef>();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: Record<string, unknown> = { ...props };
  const render = (p: Record<string, unknown>) =>
    root.render(React.createElement(ProfileCore as any, { ref, ...p } as any));
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
