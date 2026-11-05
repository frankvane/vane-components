import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { describe, expect, it } from "vitest";
import { createPluginBus } from "../src/bus/PluginBus";
import { composeSlots, renderPluginSlot } from "../src/react/slots";
import type { Plugin, PluginContext } from "../src/types";

const ctx = {
  props: {},
  data: {},
  bus: createPluginBus(),
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

describe("renderPluginSlot / composeSlots", () => {
  it("footer 槽接受显式 slotPosition: 'footer'", async () => {
    const plugin: Plugin = {
      name: "footer-explicit",
      config: { slotPosition: "footer", order: 10 },
      hooks: { renderFooter: () => <span>F-FOOTER</span> },
    };
    const { container } = await mount(composeSlots([plugin], ctx, null));
    expect(container.textContent).toContain("F-FOOTER");
  });

  it("footer 槽兼容历史写法 slotPosition: 'after'（存量插件不回归）", async () => {
    const legacy: Plugin = {
      name: "footer-legacy",
      config: { slotPosition: "after", order: 10 },
      hooks: { renderFooter: () => <span>F-AFTER</span> },
    };
    const { container } = await mount(composeSlots([legacy], ctx, null));
    expect(container.textContent).toContain("F-AFTER");
  });

  it("未声明 slotPosition 的 renderHeader 插件只在 after 段渲染一次", async () => {
    const plugin: Plugin = {
      name: "header-default",
      hooks: { renderHeader: () => <span>H</span> },
    };
    const { container } = await mount(composeSlots([plugin], ctx, null));
    expect(container.textContent).toBe("H");
  });

  it("显式 before 的插件只出现在 children 之前", async () => {
    const before: Plugin = {
      name: "header-before",
      config: { slotPosition: "before" },
      hooks: { renderHeader: () => <span>B</span> },
    };
    const after: Plugin = {
      name: "header-after",
      config: { slotPosition: "after" },
      hooks: { renderHeader: () => <span>A</span> },
    };
    const { container } = await mount(composeSlots([before, after], ctx, <span>C</span>));
    expect(container.textContent).toBe("BCA");
  });

  it("插件顺序调整时按插件名复用 key，不重挂载子树", async () => {
    let mounts = 0;
    function Stateful() {
      const [id] = useState(() => {
        mounts += 1;
        return mounts;
      });
      return <span data-id={id}>S</span>;
    }
    const a: Plugin = {
      name: "slot-a",
      config: { order: 1 },
      hooks: { renderHeader: () => <Stateful /> },
    };
    const b: Plugin = {
      name: "slot-b",
      config: { order: 2 },
      hooks: { renderHeader: () => <span>B</span> },
    };
    const { container, render } = await mount(composeSlots([a, b], ctx, null));
    expect(container.querySelector("[data-id]")?.getAttribute("data-id")).toBe("1");

    await render(composeSlots([b, a], ctx, null));
    expect(container.querySelector("[data-id]")?.getAttribute("data-id")).toBe("1");
    expect(mounts).toBe(1);
  });

  it("renderPluginSlot 对单插件抛错只丢该段", async () => {
    const bad: Plugin = {
      name: "bad-slot",
      hooks: {
        renderOverlay: () => {
          throw new Error("boom");
        },
      },
    };
    const good: Plugin = {
      name: "good-slot",
      hooks: { renderOverlay: () => <span>OK</span> },
    };
    const nodes = renderPluginSlot([bad, good], ctx, { hook: "renderOverlay" });
    const { container } = await mount(<>{nodes}</>);
    expect(container.textContent).toContain("OK");
  });
});
