/**
 * P2 · 装配器生命周期
 *
 * 盯的是「内核接管之后，这几个行为是否仍然成立」：
 *  - 重渲染**不**重建插件实例（迁移前 11 个 demo 页把插件数组写在函数体里，
 *    每次渲染都造新数组 → 全量重新注册 → onMount 反复跑）
 *  - file 变化才重新触发加载钩子
 *  - 单赢家：只有赢家渲染正文，输家的 render 一次都不该被调
 *  - 路由失败落在 unsupported 面板，而不是让 Core 空转一圈
 *  - 插件写状态必须经 reportState 回到 Core（唯一真源）
 */
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import React from "react";
import { TEXT_FILE, flush, renderPreview } from "./helpers";
import type {
  FilePreviewPlugin,
  FilePreviewPluginHooks,
} from "../src/components/FilePreviewPlugin/plugins/types";

const plugin = (
  name: string,
  hooks: FilePreviewPluginHooks = {},
  over: Partial<FilePreviewPlugin> = {}
): FilePreviewPlugin => ({
  name,
  supportedTypes: ["text/*"],
  priority: 10,
  hooks,
  ...over,
});

describe("装配器 · 生命周期", () => {
  it("重渲染不重建插件实例：onMount 只跑一次", async () => {
    const onMount = vi.fn();
    const h = renderPreview([plugin("T", { onMount })]);
    await flush();
    expect(onMount).toHaveBeenCalledTimes(1);

    // 同 url 的新 file 对象：不该重注册
    await h.rerender({ file: { ...TEXT_FILE } });
    await h.rerender({ file: { ...TEXT_FILE } });
    expect(onMount).toHaveBeenCalledTimes(1);
    h.unmount();
  });

  it("file.url 变化时加载钩子重新触发", async () => {
    const onLoadStart = vi.fn();
    const h = renderPreview([plugin("T", { onLoadStart })]);
    await flush();
    expect(onLoadStart).toHaveBeenCalledTimes(1);

    await h.rerender({ file: { ...TEXT_FILE, url: "blob:another" } });
    expect(onLoadStart).toHaveBeenCalledTimes(2);
    h.unmount();
  });

  it("onLoadError 收到 Core 的错误", async () => {
    const onLoadError = vi.fn();
    const h = renderPreview([plugin("T", { onLoadError })], {
      onBeforeLoad: () => {
        throw new Error("门没开");
      },
    });
    await flush();

    expect(onLoadError).toHaveBeenCalledTimes(1);
    expect(onLoadError.mock.calls[0][1]).toBeInstanceOf(Error);
    expect(h.ref.current?.getState().state).toBe("error");
    h.unmount();
  });
});

describe("装配器 · 单赢家", () => {
  it("只有赢家渲染正文，输家的 render 一次都不调", async () => {
    const loser = vi.fn(() => React.createElement("div", null, "loser"));
    const winner = vi.fn(() => React.createElement("div", null, "winner"));

    const h = renderPreview([
      plugin("Loser", { render: loser }, { priority: 1 }),
      plugin("Winner", { render: winner }, { priority: 9 }),
    ]);
    await flush();

    expect(winner).toHaveBeenCalled();
    expect(loser).not.toHaveBeenCalled();
    expect(h.container.textContent).toContain("winner");
    expect(h.container.textContent).not.toContain("loser");
    h.unmount();
  });

  it("工具栏渲染在正文之前（DOM 顺序）", async () => {
    const h = renderPreview([
      plugin("T", {
        renderToolbar: () => React.createElement("span", { id: "tb" }, "工具栏"),
        render: () => React.createElement("span", { id: "bd" }, "正文"),
      }),
    ]);
    await flush();

    const toolbar = h.container.querySelector("[data-vfp-toolbar]");
    const body = h.container.querySelector("[data-vfp-body]");
    expect(toolbar).toBeTruthy();
    expect(body).toBeTruthy();
    // 工具栏是 body 的前一个兄弟
    expect(toolbar?.nextElementSibling).toBe(body);
    expect(body?.textContent).toContain("正文");
    h.unmount();
  });

  it("没有插件认领 → unsupported 面板，且 Core 停在 idle", async () => {
    const h = renderPreview([
      plugin("Pdf", {}, { supportedTypes: ["application/pdf"] }),
    ]);
    await flush();

    expect(h.container.querySelector("[data-vfp-unsupported]")).toBeTruthy();
    // 关键：不是先 loading→loaded 再报错，而是根本不进加载流程
    expect(h.ref.current?.getState().state).toBe("idle");
    h.unmount();
  });
});

describe("装配器 · 状态与共享", () => {
  it("插件 reportState 会写回 Core（唯一真源）", async () => {
    const h = renderPreview([
      plugin("T", {
        render: (ctx) =>
          React.createElement(
            "button",
            {
              onClick: () =>
                ctx.reportState({ state: "error", message: "插件说解析失败" }),
            },
            "fail"
          ),
      }),
    ]);
    await flush();
    expect(h.ref.current?.getState().state).toBe("loaded");

    act(() => {
      (h.container.querySelector("button") as HTMLButtonElement).click();
    });
    expect(h.ref.current?.getState().state).toBe("error");
    expect(h.ref.current?.getState().message).toBe("插件说解析失败");
    h.unmount();
  });

  it("sharedData 跨插件可见（按 priority 顺序执行 onMount）", async () => {
    const seen: unknown[] = [];
    const writer = plugin(
      "Writer",
      { onMount: (ctx) => void ctx.sharedData.set("k", "from-Writer") },
      { priority: 9 }
    );
    const reader = plugin(
      "Reader",
      { onMount: (ctx) => {
          seen.push(ctx.sharedData.get("k"));
        } },
      { priority: 1 }
    );

    const h = renderPreview([writer, reader]);
    await flush();

    expect(seen).toEqual(["from-Writer"]);
    h.unmount();
  });

  it("插件读到的 state 是 Core 的实时镜像（不是首帧快照）", async () => {
    const states: string[] = [];
    const h = renderPreview([
      plugin("T", {
        // 每次渲染都记录一次当前镜像值
        render: (ctx) => {
          states.push(ctx.state.state);
          return React.createElement("span", null, ctx.state.state);
        },
      }),
    ]);
    await flush();

    // 至少经历过 loading → loaded 两个值；不能从头到尾都是 idle
    expect(states).toContain("loaded");
    h.unmount();
  });
});
