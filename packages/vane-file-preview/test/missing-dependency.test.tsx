/**
 * 缺失可选依赖 → 面板而不是白屏。
 *
 * 这条路径没法靠「真依赖」测：本地装齐了 jszip，永远走不到失败分支。
 * 所以用 `vi.mock("jszip", () => { throw … })` 让动态 import 真的 reject ——
 * 模拟的正是消费方「只装了 vane-file-preview、没装 jszip」时的运行期表现。
 *
 * 迁移前的对照：静态 `import JSZip from "jszip"` 时这个场景不是「面板」而是
 * 「整个应用起不来」，所以这条测试同时是「别改回静态 import」的守门人
 * （另一道守门在 plugins-b.test.ts 里读源码断言 import() 形态）。
 */
import { describe, expect, it, vi } from "vitest";
import type React from "react";
import { createRoot } from "react-dom/client";

// 工厂抛错 → 动态 import 被 reject（与模块解析失败同一条运行期路径）
vi.mock("jszip", () => {
  throw new Error("Cannot find package 'jszip'");
});

import { createZipPreviewPlugin } from "../src/custom-plugins/ZipPreviewPlugin";
import { createPptxPreviewPlugin } from "../src/custom-plugins/PptxPreviewPlugin";
import {
  ErrorPanel,
  MissingDependency,
} from "../src/components/FilePreviewPlugin/shared/panels";
import { flush, renderPreview } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const file = (over: Partial<FileInfo> = {}): FileInfo => ({
  name: "a.bin",
  size: 2048,
  type: "",
  extension: "bin",
  url: "blob:a",
  ...over,
});

describe("缺失依赖 · 插件降级", () => {
  it("Zip：jszip 加载失败时渲染安装面板，且不崩", async () => {
    const h = renderPreview([createZipPreviewPlugin()], {
      file: file({ name: "a.zip", type: "application/zip", extension: "zip" }),
    });
    await flush();

    const panel = h.container.querySelector("[data-vfp-missing='jszip']");
    expect(panel, "缺失依赖时应当出现 [data-vfp-missing] 面板").not.toBeNull();
    expect(panel?.textContent).toContain("jszip");
    expect(panel?.textContent).toContain("npm i jszip");
    h.unmount();
  });

  it("Pptx：同一个 jszip 缺失，提示里指向 Office 在线预览这条备选", async () => {
    const h = renderPreview([createPptxPreviewPlugin()], {
      file: file({
        name: "a.pptx",
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        extension: "pptx",
      }),
    });
    await flush();

    const panel = h.container.querySelector("[data-vfp-missing='jszip']");
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain("OfficePreviewPlugin");
    h.unmount();
  });
});

describe("缺失依赖 · 面板组件", () => {
  function mount(node: React.ReactElement) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(node);
    return {
      host,
      cleanup: () => {
        root.unmount();
        host.remove();
      },
    };
  }

  it("MissingDependency：包名 + 安装命令 + 可选 hint", async () => {
    const { host, cleanup } = mount(
      <MissingDependency pkg="xlsx" feature="解析表格" hint="也可以走在线预览" />
    );
    await flush();
    expect(host.textContent).toContain("xlsx");
    expect(host.textContent).toContain("npm i xlsx");
    expect(host.textContent).toContain("解析表格");
    expect(host.textContent).toContain("也可以走在线预览");
    cleanup();
  });

  it("MissingDependency：错误详情默认折叠，点开才出现", async () => {
    const { host, cleanup } = mount(
      <MissingDependency pkg="jszip" error="boom-detail" />
    );
    await flush();
    // 默认不展示原文
    expect(host.textContent).not.toContain("boom-detail");

    const toggle = host.querySelector("button");
    expect(toggle).not.toBeNull();
    toggle?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await flush();
    expect(host.textContent).toContain("boom-detail");
    cleanup();
  });

  it("ErrorPanel 带 data-vfp-panel 标记，便于断言与非视觉测试", async () => {
    const { host, cleanup } = mount(<ErrorPanel label="解析失败" error="细节" />);
    await flush();
    expect(host.querySelector("[data-vfp-panel='error']")).not.toBeNull();
    expect(host.textContent).toContain("解析失败");
    cleanup();
  });
});
