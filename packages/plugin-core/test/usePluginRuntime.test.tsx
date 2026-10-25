import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { describe, expect, it } from "vitest";
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
});
