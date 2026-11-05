/**
 * 交互测试公共桩：真实挂载 Core + 装配器，派发真实点击，读真实 DOM。
 * 与仓库内 vane-file-preview / vane-coupon 的 helpers 同款思路。
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SignInCoreProps } from "../src";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface MountedCard {
  container: HTMLDivElement;
  root: Root;
  q: (selector: string) => HTMLElement | null;
  click: (selector: string) => Promise<void>;
  rerender: (props: SignInCoreProps) => Promise<void>;
  unmount: () => void;
}

export function mountCard(
  Wrapped: React.ElementType,
  props: SignInCoreProps
): MountedCard {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const render = (next: SignInCoreProps) =>
    root.render(
      React.createElement(Wrapped as React.ComponentType<SignInCoreProps>, next)
    );

  act(() => {
    render(props);
  });

  return {
    container,
    root,
    q: (selector) =>
      container.querySelector(selector) as HTMLElement | null,
    click: async (selector) => {
      const element = container.querySelector(selector) as HTMLElement | null;
      if (!element) throw new Error(`找不到元素 ${selector}`);
      await act(async () => {
        element.click();
        await Promise.resolve();
      });
    },
    rerender: async (next) => {
      await act(async () => {
        render(next);
      });
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

/** 把 await 之后的 setState 推进到稳定（不依赖真实计时器） */
export async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}
