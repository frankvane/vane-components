import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { describe, expect, it, vi } from "vitest";
import { PluginErrorBoundary } from "../src/sandbox/PluginErrorBoundary";
import { composeSlots } from "../src/react/slots";
import type { Plugin, PluginContext } from "../src/types";

const ctx = {
  props: {},
  data: {},
  bus: {},
  refs: {},
  state: {},
  setState: () => {},
  shared: new Map(),
  deviceInfo: {},
  forceUpdate: () => {},
  getSize: () => ({ width: 0, height: 0 }),
  logger: console,
} as unknown as PluginContext;

async function mount(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const render = async (next: React.ReactNode) => {
    await act(async () => {
      root.render(<>{next}</>);
    });
  };
  await render(node);
  return { container, root, render };
}

class Bomb extends React.Component {
  render(): React.ReactNode {
    throw new Error("boom");
  }
}

describe("P2-3 错误边界可复位", () => {
  it("resetKeys 变化后边界复位、插件槽位重新出现", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onReset = vi.fn();
    let resetKey = 0;
    const node = () => (
      <PluginErrorBoundary
        resetKeys={[resetKey]}
        onReset={onReset}
        fallback={() => <span>FALLBACK</span>}
      >
        {resetKey === 0 ? <Bomb /> : <span>RECOVERED</span>}
      </PluginErrorBoundary>
    );
    const { container, render } = await mount(node());
    expect(container.textContent).toBe("FALLBACK");

    resetKey = 1;
    await render(node());
    expect(container.textContent).toBe("RECOVERED");
    expect(onReset).toHaveBeenCalledTimes(1);
    warn.mockRestore();
    error.mockRestore();
  });
});

describe("P2-12 同名插件槽位去重", () => {
  it("同名插件只渲染第一个，不产生重复输出", async () => {
    const first: Plugin = {
      name: "dup",
      hooks: { renderHeader: () => <span>X</span> },
    };
    const second: Plugin = {
      name: "dup",
      hooks: { renderHeader: () => <span>Y</span> },
    };
    const { container } = await mount(composeSlots([first, second], ctx, null));
    expect(container.textContent).toBe("X");
  });
});
