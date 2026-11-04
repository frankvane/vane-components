import React, { forwardRef } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { describe, expect, it, vi } from "vitest";
import { usePluginRuntime } from "../src/react/usePluginRuntime";
import { withPlugins } from "../src/react/withPlugins";
import type { Plugin, PluginContext } from "../src/types";

type Options = Parameters<typeof usePluginRuntime>[0];

const makePlugin = (name: string, extra: Partial<Plugin> = {}): Plugin => ({
  name,
  hooks: {},
  ...extra,
});

let currentOptions: Options;
let capturedRuntime: ReturnType<typeof usePluginRuntime> | null = null;
let seenContext: PluginContext | null = null;

function TransformProbe() {
  const runtime = usePluginRuntime(currentOptions);
  capturedRuntime = runtime;
  // 首帧渲染期调用 transform：此时提交阶段快照尚未写入
  if ((currentOptions.props as Record<string, unknown>).duringRender) {
    runtime.transformData({ n: 0 });
  }
  return null;
}

async function mount(options: Options) {
  currentOptions = options;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<TransformProbe />);
  });
  return {
    root,
    getRuntime: () => capturedRuntime!,
    rerender: async (next?: Partial<Options>) => {
      currentOptions = { ...currentOptions, ...next };
      await act(async () => {
        root.render(<TransformProbe />);
      });
    },
  };
}

const Core = forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => (
  <div ref={ref} data-title={props.title as string | undefined}>
    {props.children as React.ReactNode}
  </div>
));

async function mountHoc(node: React.ReactElement, rerenderNode?: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  if (rerenderNode) {
    await act(async () => {
      root.render(rerenderNode);
    });
  }
  return { container, root };
}

describe("P2-13 上下文快照", () => {
  it("首帧渲染期 transform 仍拿到 context（不依赖已提交快照）", async () => {
    seenContext = null;
    const plugin = makePlugin("capture", {
      hooks: {
        transformData: (context: PluginContext, data: unknown) => {
          seenContext = context;
          return data;
        },
      },
    });
    await mount({ plugins: [plugin], props: { duringRender: true } });
    expect(seenContext).not.toBeNull();
    expect((seenContext as unknown as PluginContext).props).toEqual({ duringRender: true });
  });

  it("execute 使用提交阶段后的 context", async () => {
    let seen = 0;
    const plugin = makePlugin("probe", {
      hooks: {
        probe: (context: PluginContext) => {
          seen = (context.props as Record<string, number>).v;
        },
      },
    });
    const { getRuntime, rerender } = await mount({ plugins: [plugin], props: { v: 1 } });
    await rerender({ props: { v: 2 } });
    await getRuntime().execute("probe");
    expect(seen).toBe(2);
  });
});

describe("P2-9 HOC 不自动触发 onPropsChange", () => {
  it("props 变化不触发插件 onPropsChange（需宿主自行接线）", async () => {
    const onPropsChange = vi.fn();
    const Enhanced = withPlugins(Core, [
      makePlugin("p", { hooks: { onPropsChange } }),
    ]);
    await mountHoc(
      <Enhanced title="a" />,
      <Enhanced title="b" />
    );
    expect(onPropsChange).not.toHaveBeenCalled();
  });
});

describe("P2-15 HOC 接管字段告警", () => {
  it("宿主显式传 containerRefExternal 时告警", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Enhanced = withPlugins(Core, []);
    await mountHoc(<Enhanced containerRefExternal={{ current: null }} />);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("containerRefExternal")
    );
    warn.mockRestore();
  });
});
