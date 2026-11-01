/**
 * P1-3 + P2-7 回归：换文件时 sharedData 与插件本地 state 必须复位。
 *
 * 原缺陷：内核的 `sharedMap` 生命周期是整个组件实例。打开 A 时写进去的值，
 * 换到 B 仍然在；插件的本地 state（CSV 排序、列宽）同样会带过去。
 */
import { describe, expect, it } from "vitest";
import React, { act } from "react";

import { TEXT_FILE, flush, renderPreview } from "./helpers";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../src/components/FilePreviewPlugin/plugins/types";

const PROBE_KEY = "test:file-name";

function SharedProbe({ context }: { context: FilePreviewPluginContext }) {
  const value = context.sharedData.get(PROBE_KEY) as string | undefined;
  return React.createElement("span", { "data-testid": "probe" }, value ?? "none");
}

function Counter() {
  const [count, setCount] = React.useState(0);
  return React.createElement(
    "button",
    {
      "data-testid": "counter",
      onClick: () => setCount((n) => n + 1),
    },
    String(count)
  );
}

const probePlugin: FilePreviewPlugin = {
  name: "SharedProbe",
  supportedTypes: ["text/*"],
  priority: 10,
  hooks: {
    onMount: (context) => {
      // onMount 只跑一次，模拟插件把「打开时看到的东西」写进 sharedData
      context.sharedData.set(PROBE_KEY, context.file.name);
    },
    render: (context) => React.createElement(SharedProbe, { context }),
  },
};

const counterPlugin: FilePreviewPlugin = {
  name: "LocalStateProbe",
  supportedTypes: ["text/*"],
  priority: 10,
  hooks: {
    render: () => React.createElement(Counter),
  },
};

const A = { ...TEXT_FILE, name: "a.txt", url: "blob:a" };
const B = { ...TEXT_FILE, name: "b.txt", url: "blob:b" };

describe("P1-3 · sharedData 按文件复位", () => {
  it("换文件后读不到上一个文件写进 sharedData 的值", async () => {
    const h = renderPreview([probePlugin], { file: A });
    await flush();
    expect(h.container.querySelector("[data-testid=probe]")?.textContent).toBe(
      "a.txt"
    );

    await h.rerender({ file: B });
    expect(h.container.querySelector("[data-testid=probe]")?.textContent).toBe(
      "none"
    );
    h.unmount();
  });
});

describe("P2-7 · 插件本地 state 随文件复位", () => {
  it("CSV 类本地 state（排序 / 列宽）的等价状态在换文件后清零", async () => {
    const h = renderPreview([counterPlugin], { file: A });
    await flush();

    const before = h.container.querySelector("[data-testid=counter]") as HTMLElement;
    act(() => before.click());
    expect(before.textContent).toBe("1");

    await h.rerender({ file: B });
    expect(h.container.querySelector("[data-testid=counter]")?.textContent).toBe(
      "0"
    );
    h.unmount();
  });
});
