/**
 * C3.3 · C 级 3 个（重写）的回归
 *
 *  - Image：errorFallback 真的会显示（旧版恒 display:none 的死代码）、
 *           placeholder 在加载完成前可见、变体图优先于 data.image
 *  - Inventory：库存口径与 Quantity 对齐（选中变体库存优先）
 *  - Animation：卸载清掉 setTimeout 与内联样式、prefers-reduced-motion 时不动画
 */
import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createImagePlugin,
  createInventoryPlugin,
  createAnimationPlugin,
  createSKUPlugin,
} from "../src/custom-plugins";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import { renderCard, installObservers, flush } from "./helpers";

beforeEach(() => {
  installObservers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ImagePlugin（占位实现）", () => {
  it("加载失败时显示 errorFallback，而不是一块空白灰底", async () => {
    const { container } = renderCard([
      createImagePlugin({ errorFallback: React.createElement("span", { id: "fb" }, "图裂了") }),
    ], { data: { image: "/bad.jpg" } });
    await flush();

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();

    await act(async () => {
      img.dispatchEvent(new Event("error"));
    });
    await flush();

    expect(container.querySelector("#fb")).not.toBeNull();
    expect(container.querySelector('[data-image-state="failed"]')).not.toBeNull();
    // 失败后不该再留一个空的 img
    expect(container.querySelector("img")).toBeNull();
  });

  it("placeholder 在加载完成前可见，加载后让位给图片", async () => {
    const { container } = renderCard([
      createImagePlugin({ placeholder: React.createElement("span", { id: "ph" }, "加载中") }),
    ], { data: { image: "/ok.jpg" } });
    await flush();

    expect(container.querySelector("#ph")).not.toBeNull();
    expect(container.querySelector('[data-image-state="loading"]')).not.toBeNull();

    const img = container.querySelector("img") as HTMLImageElement;
    await act(async () => {
      img.dispatchEvent(new Event("load"));
    });
    await flush();

    expect(container.querySelector("#ph")).toBeNull();
    expect(container.querySelector('[data-image-state="loaded"]')).not.toBeNull();
  });

  it("选中变体的图优先于 data.image", async () => {
    const { container } = renderCard(
      [
        createSKUPlugin({
          attributes: [{ name: "颜色", options: ["红", "蓝"] }],
          variants: [
            { sku: "R", attrs: { 颜色: "红" }, image: "/red.jpg", stock: 3 },
            { sku: "B", attrs: { 颜色: "蓝" }, image: "/blue.jpg", stock: 3 },
          ],
        }),
        createImagePlugin(),
      ],
      { data: { image: "/default.jpg", defaultAttrs: { 颜色: "红" } } }
    );
    await flush();

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/red.jpg");
  });

  it("config.src 的优先级高于变体图", async () => {
    const { container } = renderCard(
      [
        createSKUPlugin({
          attributes: [{ name: "颜色", options: ["红"] }],
          variants: [{ sku: "R", attrs: { 颜色: "红" }, image: "/red.jpg" }],
        }),
        createImagePlugin({ src: "/fixed.jpg" }),
      ],
      { data: { defaultAttrs: { 颜色: "红" } } }
    );
    await flush();
    expect(
      (container.querySelector("img") as HTMLImageElement).getAttribute("src")
    ).toBe("/fixed.jpg");
  });
});

describe("InventoryPlugin 库存口径", () => {
  it("选中变体库存为 0 时显示售罄（即使 data.inventory 还有货）", async () => {
    const { container } = renderCard(
      [
        createSKUPlugin({
          attributes: [{ name: "颜色", options: ["红"] }],
          variants: [{ sku: "R", attrs: { 颜色: "红" }, stock: 0 }],
        }),
        createInventoryPlugin(),
      ],
      { data: { inventory: 100, defaultAttrs: { 颜色: "红" } } }
    );
    await flush();
    expect(container.textContent).toContain("已售罄");
  });

  it("无变体时回落到 data.inventory：低于阈值显示库存紧张", async () => {
    const { container } = renderCard([createInventoryPlugin({ lowStockThreshold: 5 })], {
      data: { inventory: 3 },
    });
    await flush();
    expect(container.textContent).toContain("库存紧张");
    expect(container.textContent).not.toContain("已售罄");
  });

  it("库存充足时不渲染任何节点", async () => {
    const { container } = renderCard([createInventoryPlugin()], { data: { inventory: 50 } });
    await flush();
    expect(container.textContent?.trim()).toBe("");
  });
});

describe("AnimationPlugin 生命周期", () => {
  it("卸载时清掉定时器并复原内联样式", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { container, unmount } = renderCard([createAnimationPlugin() as CardPlugin]);
    await flush();

    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.style.opacity).toBe("0"); // 动画起点

    unmount();
    await flush();
    expect(clearSpy).toHaveBeenCalled();
    expect(el.style.opacity).toBe("");
    expect(el.style.transform).toBe("");
  });

  it("prefers-reduced-motion: reduce 时直接不上动画", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as any;

    try {
      const { container } = renderCard([createAnimationPlugin() as CardPlugin]);
      await flush();
      const el = container.querySelector(".card-core") as HTMLElement;
      expect(el.style.opacity).toBe("");
      expect(el.style.transform).toBe("");
    } finally {
      window.matchMedia = original;
    }
  });
});
