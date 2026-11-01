import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { describe, expect, it, vi } from "vitest";
import { usePluginRuntime } from "../src/react/usePluginRuntime";
import type { Plugin } from "../src/types";

type Options = Parameters<typeof usePluginRuntime>[0];

let currentOptions: Options;
let capturedRuntime: ReturnType<typeof usePluginRuntime> | null = null;

function Probe() {
  capturedRuntime = usePluginRuntime(currentOptions);
  return null;
}

/** 挂载 Probe，返回 root 与运行时读取器 */
async function mount(options: Options) {
  currentOptions = options;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<Probe />);
  });
  return {
    root,
    container,
    getRuntime: () => capturedRuntime!,
    rerender: async (next?: Partial<Options>) => {
      currentOptions = { ...currentOptions, ...next };
      await act(async () => {
        root.render(<Probe />);
      });
    },
  };
}

describe("usePluginRuntime", () => {
  it("卸载时先执行 onUnmount 链再清理（插件引用已捕获，clear 不中断链）", async () => {
    const calls: string[] = [];
    const probe: Plugin = {
      name: "probe",
      hooks: {
        onUnmount: () => {
          calls.push("unmount");
        },
      },
    };
    const { root } = await mount({ plugins: [probe], props: {} });
    await act(async () => {
      root.unmount();
    });
    expect(calls).toEqual(["unmount"]);
  });

  it("extendContext 附加的领域字段对 executeHook 可见", async () => {
    let seen: any = null;
    const spy: Plugin = {
      name: "spy",
      hooks: {
        onMount: (ctx: any) => {
          seen = { src: ctx.src, imageState: ctx.imageState };
        },
      },
    };
    const { getRuntime } = await mount({
      plugins: [spy],
      props: {},
      extendContext: (base) => ({ ...base, src: "/demo.jpg", imageState: "loaded" }) as any,
    });
    await act(async () => {
      await getRuntime().execute("onMount" as any);
    });
    expect(seen).toEqual({ src: "/demo.jpg", imageState: "loaded" });
  });

  it("extendContext 为稳定函数时 context 不随每次渲染重建", async () => {
    const extend = (base: any) => ({ ...base, src: "x" });
    const { getRuntime, rerender } = await mount({
      plugins: [],
      props: {},
      extendContext: extend,
    });
    const first = getRuntime().context;
    await rerender();
    expect(getRuntime().context).toBe(first);
  });

  it("同名插件换配置（新对象引用）后重新注册，不再持有旧闭包", async () => {
    const make = (tag: string): Plugin => ({
      name: "same",
      hooks: {
        transformData: (_ctx: any, data: any) => ({ ...data, tag }),
      },
    });
    const oldPlugin = make("old");
    const newPlugin = make("new");
    const { getRuntime, rerender } = await mount({ plugins: [oldPlugin], props: {} });
    expect(getRuntime().orderedPlugins[0]).toBe(oldPlugin);
    expect((getRuntime().transformData({} as any) as any).tag).toBe("old");

    await rerender({ plugins: [newPlugin] });
    expect(getRuntime().orderedPlugins[0]).toBe(newPlugin);
    expect((getRuntime().transformData({} as any) as any).tag).toBe("new");
  });

  it("单插件 transformData 抛错时跳过该插件，其余插件继续生效", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad: Plugin = {
      name: "bad",
      hooks: {
        transformData: () => {
          throw new Error("boom");
        },
      },
    };
    const good: Plugin = {
      name: "good",
      hooks: {
        transformData: (_ctx: any, data: any) => ({ ...data, ok: true }),
      },
    };
    const { getRuntime } = await mount({ plugins: [bad, good], props: {} });
    const out = getRuntime().transformData({} as any) as any;
    expect(out.ok).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("props 内容不变（每次新建同内容对象）时 context 引用保持不变", async () => {
    const { getRuntime, rerender } = await mount({
      plugins: [],
      props: { title: "x", count: 1 } as any,
    });
    const first = getRuntime().context;
    await rerender({ props: { title: "x", count: 1 } as any });
    expect(getRuntime().context).toBe(first);
  });

  it("props 内容变化时 context 重建并携带新值", async () => {
    const { getRuntime, rerender } = await mount({
      plugins: [],
      props: { title: "x" } as any,
    });
    const first = getRuntime().context;
    const nextProps = { title: "y" } as any;
    await rerender({ props: nextProps });
    expect(getRuntime().context).not.toBe(first);
    expect(getRuntime().context.props).toBe(nextProps);
  });

  it("data 内容不变时 context 引用保持不变", async () => {
    const { getRuntime, rerender } = await mount({
      plugins: [],
      props: {},
      data: { list: [1, 2] } as any,
    });
    const first = getRuntime().context;
    await rerender({ data: { list: [1, 2] } as any });
    // list 是新数组引用 → 视为内容变化
    expect(getRuntime().context).not.toBe(first);

    const stableList = [1, 2];
    await rerender({ data: { list: stableList } as any });
    const afterStable = getRuntime().context;
    await rerender({ data: { list: stableList } as any });
    expect(getRuntime().context).toBe(afterStable);
  });
});
