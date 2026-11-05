/**
 * P2 回归：工具栏可访问性 / hover、IPv6 私网判定、图片平移入口。
 */
import { describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

import { ToolbarButton } from "../src/components/FilePreviewPlugin/shared/ToolbarComponents";
import {
  copyToClipboard,
  isPubliclyReachableUrl,
} from "../src/components/FilePreviewPlugin/shared/fileHelpers";
import { createImagePreviewPlugin } from "../src/custom-plugins/ImagePreviewPlugin";
import { flush, renderPreview } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("P2-8 · ToolbarButton 可访问性", () => {
  it("图标按钮有 aria-label，图标本身对读屏器隐藏", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(
          ToolbarButton,
          { onClick: () => {}, title: "放大", icon: "+", variant: "icon" },
          "+"
        )
      );
    });

    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("aria-label")).toBe("放大");
    expect(btn.querySelector("span")?.getAttribute("aria-hidden")).toBe("true");

    act(() => root.unmount());
    container.remove();
  });

  it("hover 由 React state 驱动（样式真的变了，且能还原）", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(ToolbarButton, { onClick: () => {} }, "按钮")
      );
    });

    const btn = container.querySelector("button")!;
    const base = btn.style.background;
    act(() => {
      btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(btn.style.background).not.toBe(base);

    act(() => {
      btn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    expect(btn.style.background).toBe(base);

    act(() => root.unmount());
    container.remove();
  });
});

describe("P2-9 · IPv6 私网判定", () => {
  it("唯一本地 / 链路本地 / IPv4 映射都被判为不可达", () => {
    expect(isPubliclyReachableUrl("https://[fc00::1]/a.pdf")).toBe(false);
    expect(isPubliclyReachableUrl("https://[fd12:3456::1]/a.pdf")).toBe(false);
    expect(isPubliclyReachableUrl("https://[fe80::1]/a.pdf")).toBe(false);
    expect(
      isPubliclyReachableUrl("https://[::ffff:192.168.1.1]/a.pdf")
    ).toBe(false);
  });

  it("公网 IPv6 不被误杀", () => {
    expect(isPubliclyReachableUrl("https://[2001:db8::1]/a.pdf")).toBe(true);
    expect(isPubliclyReachableUrl("https://cdn.example.com/a.pdf")).toBe(true);
  });
});

describe("P2-6 · 复制走统一降级路径", () => {
  it("navigator.clipboard 不可用（http 内网）时退到 execCommand 并返回成功", async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard"
    );
    const originalExec = Object.getOwnPropertyDescriptor(
      document,
      "execCommand"
    );
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    const exec = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      value: exec,
      configurable: true,
    });

    try {
      expect(await copyToClipboard("hello")).toBe(true);
      expect(exec).toHaveBeenCalledWith("copy");
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, "clipboard", originalClipboard);
      } else {
        Reflect.deleteProperty(navigator, "clipboard");
      }
      if (originalExec) {
        Object.defineProperty(document, "execCommand", originalExec);
      } else {
        Reflect.deleteProperty(document, "execCommand");
      }
    }
  });
});

describe("P2-4 · 图片放大后可平移", () => {
  it("放大后 transform 带上 translate，光标变成可抓取", async () => {
    const IMAGE: FileInfo = {
      name: "cat.png",
      size: 1024,
      type: "image/png",
      extension: "png",
      url: "blob:cat",
    };
    const h = renderPreview([createImagePreviewPlugin()], { file: IMAGE });
    await flush();

    const zoomIn = Array.from(h.container.querySelectorAll("button")).find(
      (b) => b.getAttribute("title") === "放大"
    );
    act(() => zoomIn?.click());
    await flush();

    const img = h.container.querySelector("img")!;
    expect(img.style.transform).toContain("translate(0px, 0px)");
    expect(img.style.cursor).toBe("grab");
    h.unmount();
  });
});
