import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderGallerySlot } from "../src/gallery/slots";
import type { GalleryContext, GalleryPlugin } from "../src/gallery/types";

const ctx = {} as GalleryContext;

function plugin(name: string, slot: string, priority?: number): GalleryPlugin {
  return {
    name,
    version: "1.0.0",
    config: {},
    priority,
    hooks: { [slot]: () => <span data-name={name}>{name}</span> } as any,
  };
}

describe("renderGallerySlot（图集领域槽分发）", () => {
  it("无插件实现该钩子时返回 null", () => {
    const node = renderGallerySlot([plugin("a", "galleryToolbarArea")], ctx, "galleryThumbArea");
    expect(node).toBeNull();
  });

  it("单个插件实现时渲染其输出", () => {
    const node = renderGallerySlot([plugin("a", "galleryToolbarArea")], ctx, "galleryToolbarArea");
    const html = renderToStaticMarkup(node as React.ReactElement);
    expect(html).toContain('data-name="a"');
  });

  it("按 priority 升序排列（越小越靠前）", () => {
    const low = plugin("low", "galleryToolbarArea", 200);
    const high = plugin("high", "galleryToolbarArea", 10);
    const node = renderGallerySlot([low, high], ctx, "galleryToolbarArea");
    const html = renderToStaticMarkup(node as React.ReactElement);
    expect(html.indexOf('data-name="high"')).toBeLessThan(html.indexOf('data-name="low"'));
  });

  it("enabled:false 的插件被跳过", () => {
    const disabled: GalleryPlugin = {
      name: "off",
      version: "1.0.0",
      config: {},
      enabled: false,
      hooks: { galleryToolbarArea: () => <span data-name="off">off</span> } as any,
    };
    const node = renderGallerySlot([disabled], ctx, "galleryToolbarArea");
    expect(node).toBeNull();
  });

  it("四个领域槽各自独立分发", () => {
    const p = plugin("x", "galleryThumbArea");
    const thumb = renderGallerySlot([p], ctx, "galleryThumbArea");
    const toolbar = renderGallerySlot([p], ctx, "galleryToolbarArea");
    expect(renderToStaticMarkup(thumb as React.ReactElement)).toContain('data-name="x"');
    expect(toolbar).toBeNull();
  });
});
