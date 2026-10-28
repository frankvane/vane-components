import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { GalleryContext } from "../src/gallery/types";

import { createThumbSyncPlugin } from "../src/custom-plugins/ThumbSyncPlugin";
import { createCounterPlugin } from "../src/custom-plugins/CounterPlugin";
import { createIndicatorPlugin } from "../src/custom-plugins/IndicatorPlugin";
import { createSpin360Plugin } from "../src/custom-plugins/Spin360Plugin";
import { createCarouselPlugin } from "../src/custom-plugins/CarouselPlugin";
import { createZoomControlPlugin } from "../src/custom-plugins/ZoomControlPlugin";
import { createFullscreenPlugin } from "../src/custom-plugins/FullscreenPlugin";
import { createHotspotPlugin } from "../src/custom-plugins/HotspotPlugin";
import { createFavoritePlugin } from "../src/custom-plugins/FavoritePlugin";
import { createThumbPreloadPlugin } from "../src/custom-plugins/ThumbPreloadPlugin";

const images = [
  { src: "a.jpg", alt: "A" },
  { src: "b.jpg", alt: "B" },
  { src: "c.jpg", alt: "C" },
];

function baseCtx(over: Partial<GalleryContext> = {}): GalleryContext {
  return {
    images,
    activeIndex: 0,
    setActiveIndex: () => {},
    frameIndex: 0,
    setFrameIndex: () => {},
    zoom: 1,
    setZoom: () => {},
    favorited: false,
    setFavorited: () => {},
    ...over,
  } as GalleryContext;
}

function renderHook(
  plugin: any,
  slot: string,
  ctx: GalleryContext
): string {
  const fn = plugin.hooks[slot];
  if (!fn) return "";
  return renderToStaticMarkup(fn(ctx) as React.ReactElement);
}

function countButtons(html: string): number {
  return (html.match(/<button/g) ?? []).length;
}

describe("gallery 域插件渲染（表驱动）", () => {
  it("ThumbSync 渲染 N 个缩略按钮", () => {
    const p = createThumbSyncPlugin();
    const html = renderHook(p, "galleryThumbArea", baseCtx());
    expect(countButtons(html)).toBe(images.length);
    expect(html).toContain('aria-label="第 1 张"');
  });

  it("Counter 显示 当前 / 总数", () => {
    const p = createCounterPlugin();
    expect(renderHook(p, "galleryToolbarArea", baseCtx({ activeIndex: 0 }))).toContain("1 / 3");
    expect(renderHook(p, "galleryToolbarArea", baseCtx({ activeIndex: 2 }))).toContain("3 / 3");
  });

  it("Indicator 渲染 N 个圆点", () => {
    const p = createIndicatorPlugin();
    expect(countButtons(renderHook(p, "galleryToolbarArea", baseCtx()))).toBe(images.length);
  });

  it("Spin360：帧数≥2 渲染帧、<2 返回 null", () => {
    const big = createSpin360Plugin();
    expect(renderHook(big, "galleryOverlay", baseCtx())).toContain("<img");
    const small = createSpin360Plugin();
    expect(renderHook(small, "galleryOverlay", baseCtx({ images: [{ src: "x.jpg" }] }))).toBe("");
  });

  it("Carousel：帧数≥2 渲染播放按钮、<2 返回 null", () => {
    const p = createCarouselPlugin();
    expect(renderHook(p, "galleryToolbarArea", baseCtx())).toContain("轮播");
    expect(renderHook(p, "galleryToolbarArea", baseCtx({ images: [{ src: "x.jpg" }] }))).toBe("");
  });

  it("ZoomControl 渲染 − / 百分比 / +", () => {
    const html = renderHook(createZoomControlPlugin(), "galleryToolbarArea", baseCtx());
    expect(html).toContain("−");
    expect(html).toContain("+");
    expect(html).toContain("100%");
  });

  it("Fullscreen 渲染全屏按钮", () => {
    expect(renderHook(createFullscreenPlugin(), "galleryToolbarArea", baseCtx())).toContain("全屏");
  });

  it("Hotspot：有热点时渲染标记", () => {
    const p = createHotspotPlugin({ hotspots: [{ x: 50, y: 50, label: "核心卖点" }] });
    const html = renderHook(p, "galleryOverlay", baseCtx());
    expect(html).toContain("核心卖点");
    // 无热点时不渲染
    expect(renderHook(createHotspotPlugin(), "galleryOverlay", baseCtx())).toBe("");
  });

  it("Favorite 渲染心形且随 favorited 切换", () => {
    expect(renderHook(createFavoritePlugin(), "galleryToolbarArea", baseCtx({ favorited: false }))).toContain("♡");
    expect(renderHook(createFavoritePlugin(), "galleryToolbarArea", baseCtx({ favorited: true }))).toContain("♥");
  });
});

describe("ThumbPreloadPlugin.onActiveChange 预加载", () => {
  let OriginalImage: any;
  const created: string[] = [];

  beforeEach(() => {
    OriginalImage = (globalThis as any).Image;
    created.length = 0;
    (globalThis as any).Image = class {
      set src(v: string) {
        created.push(v);
      }
    };
  });
  afterEach(() => {
    (globalThis as any).Image = OriginalImage;
  });

  it("切换主图后预热后续张（去重、不预热当前张）", () => {
    const p = createThumbPreloadPlugin({ lookahead: 2 });
    p.hooks.onActiveChange!(baseCtx(), 0);
    expect(created).toEqual(["b.jpg", "c.jpg"]);
    // 重复切换同一张不重复预热
    created.length = 0;
    p.hooks.onActiveChange!(baseCtx(), 0);
    expect(created).toEqual([]);
  });

  it("alsoPrevious 额外预热前一张", () => {
    created.length = 0;
    // 用独立图片集，避免模块级 preloaded Set 与上一用例（a/b/c.jpg）去重串扰
    const other = [{ src: "p1.jpg" }, { src: "p2.jpg" }, { src: "p3.jpg" }];
    const p = createThumbPreloadPlugin({ lookahead: 1, alsoPrevious: true });
    p.hooks.onActiveChange!(baseCtx({ images: other as any }), 1);
    expect(created).toEqual(["p3.jpg", "p1.jpg"]);
  });
});

describe("gallery 插件工厂基本契约", () => {
  it("每个 create 返回带 name/version/hooks 的插件", () => {
    const creators = [
      createThumbSyncPlugin,
      createCounterPlugin,
      createIndicatorPlugin,
      createSpin360Plugin,
      createCarouselPlugin,
      createZoomControlPlugin,
      createFullscreenPlugin,
      createHotspotPlugin,
      createFavoritePlugin,
      createThumbPreloadPlugin,
    ];
    for (const c of creators) {
      const p: any = c();
      expect(typeof p.name).toBe("string");
      expect(typeof p.version).toBe("string");
      expect(typeof p.hooks).toBe("object");
    }
  });
});
