import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePluginRuntime } from "../src/react/usePluginRuntime";
import { createPluginManager } from "../src/manager/PluginManager";
import type { Plugin, PluginContext } from "../src/types";

type Options = Parameters<typeof usePluginRuntime>[0];

let currentOptions: Options;
let capturedRuntime: ReturnType<typeof usePluginRuntime> | null = null;

function Probe() {
  capturedRuntime = usePluginRuntime(currentOptions);
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
  return {
    root,
    getRuntime: () => capturedRuntime!,
    rerender: async (next?: Partial<Options>) => {
      currentOptions = { ...currentOptions, ...next };
      await act(async () => {
        root.render(<Probe />);
      });
    },
  };
}

const ctx = {} as PluginContext;
const makePlugin = (name: string, extra: Partial<Plugin> = {}): Plugin => ({
  name,
  hooks: {},
  ...extra,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("P1-1 卸载时序", () => {
  it("先执行 onUnmount，再执行清理函数", async () => {
    const calls: string[] = [];
    const plugin = makePlugin("probe", {
      hooks: {
        onMount: () => () => calls.push("cleanup"),
        onUnmount: () => {
          calls.push("unmount");
        },
      },
    });
    const { root } = await mount({ plugins: [plugin], props: {} });
    await act(async () => {
      root.unmount();
    });
    expect(calls).toEqual(["unmount", "cleanup"]);
  });
});

describe("P1-2 重装配差集对齐", () => {
  it("增 / 删 / 未变三态下 mount 与 unmount 次数正确", async () => {
    const calls: string[] = [];
    const make = (name: string): Plugin => ({
      name,
      hooks: {
        onMount: () => {
          calls.push(`mount-${name}`);
          return () => calls.push(`cleanup-${name}`);
        },
        onUnmount: () => {
          calls.push(`unmount-${name}`);
        },
      },
    });
    const [a, b, c] = [make("a"), make("b"), make("c")];
    const { rerender } = await mount({ plugins: [a, b], props: {} });
    expect(calls.filter((x) => x.startsWith("mount-"))).toEqual(["mount-a", "mount-b"]);

    await rerender({ plugins: [a, b, c] });
    expect(calls.filter((x) => x === "mount-a")).toHaveLength(1);
    expect(calls.filter((x) => x === "mount-b")).toHaveLength(1);
    expect(calls).toContain("mount-c");
    expect(calls).not.toContain("unmount-a");

    await rerender({ plugins: [a, b] });
    expect(calls).toContain("unmount-c");
    expect(calls).toContain("cleanup-c");
    expect(calls.filter((x) => x === "mount-a")).toHaveLength(1);
    expect(calls.filter((x) => x === "mount-b")).toHaveLength(1);
  });

  it("P2-11：未变更插件保留 bus 订阅，移除时回收", async () => {
    let received = 0;
    const listener: Plugin = {
      name: "listener",
      hooks: {
        onMount: (runtimeCtx: PluginContext) =>
          runtimeCtx.bus.on("tick", () => (received += 1)),
      },
    };
    const other = makePlugin("other");
    const { getRuntime, rerender } = await mount({ plugins: [listener], props: {} });
    getRuntime().bus.setData("tick", 1);
    expect(received).toBe(1);

    await rerender({ plugins: [listener, other] });
    getRuntime().bus.setData("tick", 2);
    expect(received).toBe(2);

    await rerender({ plugins: [other] });
    getRuntime().bus.setData("tick", 3);
    expect(received).toBe(2);
  });
});

describe("P1-3 enabled 真停用", () => {
  it("enabled:false 的 transformProps / transformData 不执行", async () => {
    const props = vi.fn((input: Record<string, unknown>) => input);
    const data = vi.fn((_ctx: PluginContext, input: Record<string, unknown>) => input);
    const disabled = makePlugin("disabled", {
      enabled: false,
      hooks: { transformProps: props, transformData: data },
    });
    const { getRuntime } = await mount({ plugins: [disabled], props: {} });
    expect(getRuntime().orderedPlugins).toHaveLength(0);
    getRuntime().transformProps({ a: 1 });
    getRuntime().transformData({ b: 2 });
    expect(props).not.toHaveBeenCalled();
    expect(data).not.toHaveBeenCalled();
  });

  it("manager.disable 后 transform 停止执行", async () => {
    const transform = vi.fn((input: Record<string, unknown>) => input);
    const plugin = makePlugin("p", { hooks: { transformProps: transform } });
    const { getRuntime, rerender } = await mount({ plugins: [plugin], props: {} });
    getRuntime().transformProps({});
    expect(transform).toHaveBeenCalledTimes(1);

    getRuntime().manager.disable("p");
    await rerender();
    getRuntime().transformProps({});
    expect(transform).toHaveBeenCalledTimes(1);
  });
});

describe("P1-4 循环依赖降级", () => {
  it("不再抛错、子树不白屏，环内插件仍按注册序执行", async () => {
    const calls: string[] = [];
    const a = makePlugin("a", {
      dependencies: ["b"],
      hooks: { onMount: () => void calls.push("a") },
    });
    const b = makePlugin("b", {
      dependencies: ["a"],
      hooks: { onMount: () => void calls.push("b") },
    });
    const { getRuntime } = await mount({ plugins: [a, b], props: {} });
    expect(calls).toEqual(["a", "b"]);
    expect(getRuntime().orderedPlugins.map((p) => p.name)).toEqual(["a", "b"]);
    expect(
      getRuntime().manager.getErrors().some((item) => String(item.error).includes("循环依赖"))
    ).toBe(true);
  });
});

describe("P1-5 超时与代次令牌", () => {
  it("超时后的迟到 cleanup 不登记", async () => {
    const m = createPluginManager({ timeout: 20 });
    const cleanup = vi.fn();
    m.register(
      makePlugin("slow", {
        hooks: {
          onMount: () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(cleanup), 80);
            }),
        },
      })
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await m.executeHook("onMount", ctx);
    await new Promise((resolve) => setTimeout(resolve, 120));
    m.clear();
    expect(cleanup).not.toHaveBeenCalled();
    expect(m.getErrors()).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });

  it("超时后的迟到 rejection 不产生未捕获 rejection", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const m = createPluginManager({ timeout: 20 });
      m.register(
        makePlugin("late-reject", {
          hooks: {
            onMount: () =>
              new Promise((_resolve, reject) => {
                setTimeout(() => reject(new Error("late")), 80);
              }),
          },
        })
      );
      vi.spyOn(console, "warn").mockImplementation(() => {});
      await m.executeHook("onMount", ctx);
      await new Promise((resolve) => setTimeout(resolve, 120));
      expect(unhandled).not.toHaveBeenCalled();
      expect(m.getErrors()).toHaveLength(1);
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("clear 后迟到完成的 cleanup 不得登记", async () => {
    const m = createPluginManager();
    const cleanup = vi.fn();
    m.register(
      makePlugin("race", {
        hooks: {
          onMount: () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(cleanup), 50);
            }),
        },
      })
    );
    const task = m.executeHook("onMount", ctx);
    await new Promise((resolve) => setTimeout(resolve, 10));
    m.clear();
    await task;
    await new Promise((resolve) => setTimeout(resolve, 60));
    m.clear();
    expect(cleanup).not.toHaveBeenCalled();
  });
});

describe("P2-2 错误账本封顶", () => {
  it("开发态最多保留 100 条", async () => {
    const m = createPluginManager({ timeout: 1 });
    for (let i = 0; i < 105; i += 1) {
      m.register(
        makePlugin(`p${i}`, {
          hooks: {
            onMount: () => {
              throw new Error("boom");
            },
          },
        })
      );
    }
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await m.executeHook("onMount", ctx);
    expect(m.getErrors()).toHaveLength(100);
    expect(m.getErrors()[99].plugin).toBe("p104");
  });
});
