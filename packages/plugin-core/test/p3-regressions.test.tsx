/**
 * 第三轮回归（内核）：变更点只看「次数」不看「存在」——
 * 多跑一次 transform、少跑一次 cleanup 都算失败。
 *
 * 覆盖两个根因：
 *  1. orderedPlugins 稳定化：装配完成后缓存由空变满，插件对象与顺序未变时
 *     渲染数组不得换身份，否则下游 useMemo（transformData / 插槽）会在无关
 *     重渲染时被误判为「插件集合变化」而多跑一次。
 *  2. 卸载路径同步清理：没有任何 onUnmount 钩子时，clear 必须在同步卸载内执行，
 *     否则清理被推迟到微任务，宿主同步断言会看到 0 次。
 */
import React, { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { describe, expect, it } from "vitest";
import { usePluginRuntime } from "../src/react/usePluginRuntime";
import type { Plugin } from "../src/types";

type Options = Parameters<typeof usePluginRuntime>[0];

let currentOptions: Options;
let capturedRuntime: ReturnType<typeof usePluginRuntime> | null = null;
let transformCalls = 0;
let renderCalls = 0;

function Probe() {
  const runtime = usePluginRuntime(currentOptions);
  capturedRuntime = runtime;
  renderCalls += 1;
  // 模拟领域包：transformData 结果进 useMemo，依赖是内核回调的身份
  const data = currentOptions.data;
  useMemo(() => runtime.transformData(data), [data, runtime.transformData]);
  return null;
}

async function mount(options: Options) {
  currentOptions = options;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Probe />);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  return {
    root,
    getRuntime: () => capturedRuntime!,
    rerender: async (next: Partial<Options>) => {
      currentOptions = { ...currentOptions, ...next };
      await act(async () => {
        root.render(<Probe />);
      });
    },
  };
}

describe("内核稳定性回归（次数断言）", () => {
  it("无关重渲染 + 不稳定 extendContext 时 transformData 只执行 1 次", async () => {
    transformCalls = 0;
    renderCalls = 0;
    const DATA = { list: [1] };
    const dataPlugin: Plugin = {
      name: "counter",
      hooks: {
        transformData: (_ctx: any, input: any) => {
          transformCalls += 1;
          return input;
        },
      },
    };
    const props = { tick: 0 } as any;
    const { root, getRuntime, rerender } = await mount({
      plugins: [dataPlugin],
      props,
      data: DATA,
      extendContext: (base) => ({ ...base, tag: "v0" }) as any,
    });

    // 首帧 1 次；装配完成后缓存由空变满，内存身份必须保持不变
    expect(transformCalls).toBe(1);
    const firstOrder = getRuntime().orderedPlugins;
    const firstContext = getRuntime().context;

    // props 引用完全不变，只换 extendContext 身份（领域包的常见写法）
    await rerender({
      extendContext: (base) => ({ ...base, tag: "v1" }) as any,
    });
    expect(renderCalls).toBe(2); // 确认确实发生了重渲染，断言非空转
    expect(getRuntime().context).not.toBe(firstContext);
    expect(getRuntime().orderedPlugins).toBe(firstOrder);
    expect(transformCalls).toBe(1);

    // 再来一次无关重渲染，仍不得多跑
    await rerender({
      extendContext: (base) => ({ ...base, tag: "v2" }) as any,
    });
    expect(getRuntime().orderedPlugins).toBe(firstOrder);
    expect(transformCalls).toBe(1);

    act(() => root.unmount());
  });

  it("同步卸载时 onMount 返回的 cleanup 恰好执行 1 次", async () => {
    let cleaned = 0;
    const cleanupPlugin: Plugin = {
      name: "cleanup",
      hooks: {
        onMount: () => () => {
          cleaned += 1;
        },
      },
    };
    const { root, getRuntime } = await mount({
      plugins: [cleanupPlugin],
      props: {},
    });
    expect(cleaned).toBe(0);

    act(() => root.unmount());
    expect(cleaned).toBe(1);

    // 重复 clear 不得再执行一次
    await getRuntime().manager.clear();
    expect(cleaned).toBe(1);
  });

  it("装配窗口内新增插件后再卸载，cleanup 仍各执行 1 次", async () => {
    let cleanA = 0;
    let mountB = 0;
    let cleanB = 0;
    const a: Plugin = {
      name: "a",
      hooks: { onMount: () => () => { cleanA += 1; } },
    };
    const b: Plugin = {
      name: "b",
      hooks: {
        onMount: () => {
          mountB += 1;
          return () => {
            cleanB += 1;
          };
        },
      },
    };
    const { root, rerender } = await mount({ plugins: [a], props: {} });
    await rerender({ plugins: [a, b] });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // 已挂载的 a 不重跑 onMount，只补挂 b
    expect(mountB).toBe(1);
    act(() => root.unmount());
    expect(cleanA).toBe(1);
    expect(cleanB).toBe(1);
  });
});
