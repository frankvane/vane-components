import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GalleryCore } from "../src/gallery/GalleryCore";
import { galleryPreset } from "../src/gallery/presets/gallery";
import type { GalleryImage } from "../src/gallery/types";

// 让 React 15+ 的 act() 警告安静（happy-dom 下需显式声明 act 环境）
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const images: GalleryImage[] = [
  { src: "a.jpg", alt: "A" },
  { src: "b.jpg", alt: "B" },
  { src: "c.jpg", alt: "C" },
];

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function render(plugins = galleryPreset()) {
  await act(async () => {
    root.render(<GalleryCore images={images} plugins={plugins} mainHeight={300} />);
  });
}

function click(el: Element | null) {
  if (!el) throw new Error("element not found");
  act(() => {
    el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  });
}

function keydown(key: string) {
  const rootEl = container.querySelector("[data-gallery-root]");
  act(() => {
    rootEl?.dispatchEvent(
      new window.KeyboardEvent("keydown", { key, bubbles: true })
    );
  });
}

describe("GalleryCore 集成（缩略联动 + 协调态）", () => {
  it("挂载不崩溃，带 data-gallery-root 锚点", async () => {
    await render();
    expect(container.querySelector("[data-gallery-root]")).toBeTruthy();
  });

  it("缩略条渲染 N 个缩略按钮（ThumbSync 接入）", async () => {
    await render();
    const thumbs = container.querySelectorAll('[aria-label^="第 "]');
    expect(thumbs.length).toBe(images.length);
  });

  it("计数器初始显示 1 / 3（Counter 接入）", async () => {
    await render();
    expect(container.textContent).toContain("1 / 3");
  });

  it("点击第 3 张缩略图 → 计数器刷新为 3 / 3（缩略联动）", async () => {
    await render();
    click(container.querySelector('[aria-label="第 3 张"]'));
    expect(container.textContent).toContain("3 / 3");
  });

  it("键盘右方向键 → 计数器变为 2 / 3（Core 级键盘切换）", async () => {
    await render();
    keydown("ArrowRight");
    expect(container.textContent).toContain("2 / 3");
    keydown("ArrowLeft");
    expect(container.textContent).toContain("1 / 3");
  });

  it("指示点渲染 N 个圆点（Indicator 接入）", async () => {
    await render();
    const dots = container.querySelectorAll('[aria-label^="跳到第 "]');
    expect(dots.length).toBe(images.length);
  });

  it("不传 plugins 时回退到 galleryPreset", async () => {
    await act(async () => {
      root.render(<GalleryCore images={images} />);
    });
    expect(container.textContent).toContain("1 / 3");
  });
});
