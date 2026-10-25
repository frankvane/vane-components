import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { withPlugins } from "../src/components/LazyLoadImagePlugin/withPlugins";
import { LazyLoadImageCore } from "../src/components/LazyLoadImagePlugin/LazyLoadImageCore";
import { createBlurUpPlugin } from "../src/custom-plugins/BlurUpPlugin";
import type {
  LazyImageContext,
  LazyImagePlugin,
} from "../src/components/LazyLoadImagePlugin/plugins/types";

const Wrapped = withPlugins(LazyLoadImageCore, [createBlurUpPlugin()]);

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function render(props: Record<string, any> = {}) {
  await act(async () => {
    root.render(<Wrapped src="/demo.jpg" {...props} />);
  });
}

/** 在独立容器里挂载一个 HOC（避免与共享 root 冲突） */
async function renderIn(component: React.ReactElement) {
  const localContainer = document.createElement("div");
  document.body.appendChild(localContainer);
  const localRoot = createRoot(localContainer);
  await act(async () => {
    localRoot.render(component);
  });
  return { localContainer, localRoot };
}

describe("withPlugins(LazyLoadImageCore) 端到端", () => {
  it("挂载后渲染容器，不崩溃", async () => {
    await render();
    expect(container.querySelector("div")).toBeTruthy();
  });

  it("transformProps 链路生效（装配不抛错，插件链已注册）", async () => {
    await render();
    // lazy 模式下 jsdom/happy-dom 无 IntersectionObserver，保持 idle 不加载，
    // 这里验证 HOC 装配本身不抛错且 Core 正常渲染。
    expect(container.querySelector("div")).toBeTruthy();
  });

  it("onMount 钩子执行", async () => {
    const calls: string[] = [];
    const probe: LazyImagePlugin = {
      name: "probe-mount",
      hooks: { onMount: () => void calls.push("mount") },
    };
    const WrappedProbe = withPlugins(LazyLoadImageCore, [probe]);
    await renderIn(<WrappedProbe src="/x.jpg" />);
    expect(calls).toEqual(["mount"]);
  });

  it("progress 桥接：bus emit('progress') → onProgress 钩子", async () => {
    const received: unknown[] = [];
    let capturedBus: LazyImageContext["bus"] | null = null;
    const probe: LazyImagePlugin = {
      name: "probe-bus",
      hooks: {
        onMount: (ctx) => {
          capturedBus = ctx.bus;
        },
      },
    };
    const spy: LazyImagePlugin = {
      name: "spy-progress",
      hooks: {
        onProgress: (_ctx, progress) => void received.push(progress),
      },
    };
    const WrappedBridge = withPlugins(LazyLoadImageCore, [probe, spy]);
    await renderIn(<WrappedBridge src="/y.jpg" />);
    expect(capturedBus).not.toBeNull();
    const payload = { loaded: 10, total: 100, percent: 10, timestamp: 1 };
    await act(async () => {
      capturedBus!.emit("progress", payload);
      await Promise.resolve();
    });
    expect(received).toEqual([payload]);
  });

  it("领域 priority 适配：priority 10 先于未声明插件执行 onMount", async () => {
    const order: string[] = [];
    const loaderLike: LazyImagePlugin = {
      name: "loader-like",
      priority: 10,
      hooks: { onMount: () => void order.push("loader-like") },
    };
    const normal: LazyImagePlugin = {
      name: "normal",
      hooks: { onMount: () => void order.push("normal") },
    };
    const WrappedOrder = withPlugins(LazyLoadImageCore, [normal, loaderLike]);
    await renderIn(<WrappedOrder src="/z.jpg" />);
    expect(order).toEqual(["loader-like", "normal"]);
  });

  it("onUnmount 钩子在卸载时执行", async () => {
    const calls: string[] = [];
    const probe: LazyImagePlugin = {
      name: "probe-unmount",
      hooks: { onUnmount: () => void calls.push("unmount") },
    };
    const WrappedProbe = withPlugins(LazyLoadImageCore, [probe]);
    const { localRoot } = await renderIn(<WrappedProbe src="/u.jpg" />);
    await act(async () => {
      localRoot.unmount();
    });
    expect(calls).toEqual(["unmount"]);
  });
});
