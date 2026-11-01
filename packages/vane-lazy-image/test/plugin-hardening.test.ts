import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  LazyImageContext,
  LazyImageHooks,
} from "../src/components/LazyLoadImagePlugin/plugins/types";

import { createCDNFallbackPlugin } from "../src/custom-plugins/CDNFallbackPlugin";
import { sanitizeSvg, createSvgPlaceholderPlugin } from "../src/custom-plugins/SvgPlaceholderPlugin/create";
import { createFetchLoaderPlugin } from "../src/custom-plugins/FetchLoaderPlugin";
import { createIDBCachePlugin } from "../src/custom-plugins/CacheIDBPlugin/create";
import { createMemoryCachePlugin, MemoryCache } from "../src/custom-plugins/CacheMemoryPlugin/create";
import { createCachePrewarmPlugin } from "../src/custom-plugins/CachePrewarmPlugin";
import { createScrollIdlePlugin } from "../src/custom-plugins/ScrollIdlePlugin";
import { createAspectRatioSpacerPlugin } from "../src/custom-plugins/AspectRatioSpacerPlugin";
import { createBlurUpPlugin } from "../src/custom-plugins/BlurUpPlugin";
import { createSkeletonPlugin } from "../src/custom-plugins/SkeletonPlugin";
import { createHoverPrefetchPlugin } from "../src/custom-plugins/HoverPrefetchPlugin";
import { createResponsivePlugin } from "../src/custom-plugins/ResponsivePlugin";
import { createRetryOnErrorPlugin } from "../src/custom-plugins/RetryOnErrorPlugin";
import { performanceFirstPreset } from "../src/presets/performance-first";

type AnyHooks = LazyImageHooks & Record<string, any>;

function makeBus() {
  return {
    emit: vi.fn(),
    on: () => () => {},
    once: () => () => {},
    off: () => {},
    getData: () => undefined,
    setData: () => {},
    deleteData: () => {},
    hasData: () => false,
    getAll: () => ({}),
    clear: () => {},
  };
}

/** 构造最小领域上下文（只覆盖插件读取的字段） */
function makeContext(overrides: Partial<LazyImageContext> = {}): LazyImageContext {
  return {
    props: { src: "/demo.jpg" },
    bus: makeBus(),
    refs: {},
    state: {},
    setState: () => {},
    shared: new Map(),
    deviceInfo: {
      type: "desktop",
      os: "test",
      browser: "test",
      devicePixelRatio: 1,
      viewportWidth: 1024,
      viewportHeight: 768,
      isTouchDevice: false,
      isRetina: false,
    },
    forceUpdate: () => {},
    getSize: () => ({ width: 0, height: 0 }),
    logger: console,
    src: "/demo.jpg",
    imageState: { isIdle: false, isLoading: true, isLoaded: false, isError: false },
    isIntersecting: false,
    imageRef: { current: null },
    containerRef: { current: null },
    sharedData: new Map(),
    ...overrides,
  } as LazyImageContext;
}

function makeImg(src = "/demo.jpg") {
  const img = document.createElement("img");
  img.setAttribute("src", src);
  return img;
}

const FLUSH = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document
    .querySelectorAll('link[id^="lli-hoverprefetch-"], link[rel="preload"]')
    .forEach((n) => n.remove());
  const style = document.getElementById("lli-skeleton-style");
  if (style) style.remove();
});

describe("P0-3 CDN 回退有上限且可去重", () => {
  it("原始 + 每个 CDN 各尝试一次后终止，且默认不追加缓存击穿参数", async () => {
    const img = makeImg("/img/a.jpg");
    const sharedData = new Map<string, any>();
    const ctx = makeContext({ src: "/img/a.jpg", imageRef: { current: img }, sharedData });
    const hooks = createCDNFallbackPlugin({
      cdnBases: ["https://cdn1.example.com", "https://cdn2.example.com"],
    }).hooks as AnyHooks;

    expect(await hooks.onLoadError!(ctx, new Error("boom"))).toBe(true);
    expect(img.getAttribute("src")).toBe("https://cdn1.example.com/img/a.jpg");
    expect(img.getAttribute("src")).not.toContain("cdnFallback");

    expect(await hooks.onLoadError!(ctx, new Error("boom"))).toBe(true);
    expect(img.getAttribute("src")).toBe("https://cdn2.example.com/img/a.jpg");

    // 第三次（原始 + 2 个 CDN 共 3 次）达到上限 → 返回 false 且不再改写 src
    expect(await hooks.onLoadError!(ctx, new Error("boom"))).toBe(false);
    expect(img.getAttribute("src")).toBe("https://cdn2.example.com/img/a.jpg");
  });

  it("换图（onSrcChange）后尝试计数归零", async () => {
    const img = makeImg("/img/a.jpg");
    const sharedData = new Map<string, any>();
    const ctx = makeContext({ src: "/img/a.jpg", imageRef: { current: img }, sharedData });
    const hooks = createCDNFallbackPlugin({ cdnBases: ["https://cdn1.example.com"] }).hooks as AnyHooks;

    expect(await hooks.onLoadError!(ctx, new Error("boom"))).toBe(true);
    expect(await hooks.onLoadError!(ctx, new Error("boom"))).toBe(false);

    hooks.onSrcChange!(ctx, "/img/a.jpg", "/img/a.jpg");
    // 新图第一次失败应再次回退到第一个 CDN，而不是直接判定耗尽
    expect(await hooks.onLoadError!(ctx, new Error("boom"))).toBe(true);
    expect(img.getAttribute("src")).toBe("https://cdn1.example.com/img/a.jpg");
  });
});

describe("P0-4 SVG 占位符清洗与 data URL 渲染", () => {
  it("剥离 script / on* / javascript: 协议", () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script>' +
      '<rect width="10" height="10" onload="alert(2)" fill="red"/>' +
      '<a href="javascript:alert(3)">x</a></svg>';
    const safe = sanitizeSvg(dirty);
    expect(safe).not.toContain("<script");
    expect(safe).not.toContain("onload");
    expect(safe).not.toContain("javascript:");
    expect(safe).toContain("rect");
  });

  it("renderOverlay 以 <img src=data:image/svg+xml> 渲染，不含 HTML 注入", () => {
    const plugin = createSvgPlaceholderPlugin({
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect/></svg>',
    });
    const ctx = makeContext({
      imageState: { isIdle: false, isLoading: true, isLoaded: false, isError: false },
    });
    const html = renderToStaticMarkup(
      plugin.hooks.renderOverlay!(ctx) as React.ReactElement
    );
    expect(html).toContain("data:image/svg+xml;charset=utf-8,");
    expect(html).not.toContain("<script");
  });
});

describe("P1-6 FetchLoader 失败不再返回原始 URL", () => {
  it("fetch 失败时 onLoad 返回 undefined，并关闭沙箱超时", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    const plugin = createFetchLoaderPlugin({ maxRetries: 0, timeout: 5000 });
    expect(plugin.timeout).toBe(0);

    const result = await (plugin.hooks as AnyHooks).onLoad!(
      makeContext({ src: "/no-cache-" + Date.now() + ".jpg" })
    );
    expect(result).toBeUndefined();
  });
});

describe("P1-7 预设顺序与 CacheIDB 不二次下载", () => {
  it("performance-first 中 CacheIDB 排在 FetchLoader 之前", () => {
    const preset = performanceFirstPreset();
    expect(preset[0].name).toBe("cache-idb");
    expect(preset[1].name).toBe("fetch-loader");
  });

  it("onLoadSuccess 对普通 URL 不再发起二次 fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("indexedDB", undefined);
    const plugin = createIDBCachePlugin({ enabled: true });
    const ctx = makeContext({ src: "/no-refetch.jpg" });

    await plugin.hooks.onLoadSuccess!(ctx, "/no-refetch.jpg");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("P1-8 ScrollIdle 引用计数与监听释放", () => {
  it("最后一个使用方 unmount 时移除容器监听，先卸载的实例不提前释放", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const addSpy = vi.spyOn(container, "addEventListener");
    const removeSpy = vi.spyOn(container, "removeEventListener");
    const plugin = createScrollIdlePlugin({ target: "container" });

    const ctxA = makeContext({ containerRef: { current: container }, sharedData: new Map() });
    const ctxB = makeContext({ containerRef: { current: container }, sharedData: new Map() });

    plugin.hooks.onMount!(ctxA);
    plugin.hooks.onMount!(ctxB);
    // 同一容器复用同一份监听（引用计数为 2，不重复 addEventListener）
    expect(addSpy.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(1);

    plugin.hooks.onUnmount!(ctxA);
    expect(removeSpy.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(0);

    plugin.hooks.onUnmount!(ctxB);
    expect(removeSpy.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(1);
    container.remove();
  });
});

describe("P2 系列：占位 / 骨架 / 预取 / 响应式 / 重试 / 缓存", () => {
  it("P2-1 AspectRatioSpacer 在 transformProps 阶段写入 aspect-ratio，且尊重显式值", () => {
    const hooks = createAspectRatioSpacerPlugin({ ratio: 16 / 9 }).hooks as AnyHooks;
    const injected = hooks.transformProps!({ src: "/a.jpg" } as any);
    expect(String(injected.containerStyle?.aspectRatio)).toBe(String(16 / 9));

    const explicit = hooks.transformProps!({
      src: "/a.jpg",
      containerStyle: { aspectRatio: "1 / 1" },
    } as any);
    expect(explicit.containerStyle?.aspectRatio).toBe("1 / 1");
  });

  it("P2-1 BlurUp 未显式指定 opacity 时补 1，显式值保持", () => {
    const hooks = createBlurUpPlugin().hooks as AnyHooks;
    const injected = hooks.transformProps!({ src: "/a.jpg", imageStyle: {} } as any);
    expect(injected.imageStyle?.opacity).toBe(1);

    const explicit = hooks.transformProps!({
      src: "/a.jpg",
      imageStyle: { opacity: 0 },
    } as any);
    expect(explicit.imageStyle?.opacity).toBe(0);
  });

  it("P2-2 Skeleton 全局 keyframes 只注入一次，且覆盖层本身不含 <style>", () => {
    const plugin = createSkeletonPlugin({ showWhen: "always" });
    const ctx = makeContext({
      imageState: { isIdle: false, isLoading: false, isLoaded: true, isError: false },
    });
    const first = renderToStaticMarkup(plugin.hooks.renderOverlay!(ctx) as React.ReactElement);
    const second = renderToStaticMarkup(plugin.hooks.renderOverlay!(ctx) as React.ReactElement);
    expect(first).not.toContain("<style");
    expect(second).not.toContain("<style");
    // 只保留一个 <style id="lli-skeleton-style">
    expect(document.querySelectorAll("#lli-skeleton-style")).toHaveLength(1);
  });

  it("P2-3 HoverPrefetch 插入的 preload link 在卸载时移除", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const ctx = makeContext({
      src: "/product/1.jpg",
      containerRef: { current: container },
      sharedData: new Map(),
    });
    const plugin = createHoverPrefetchPlugin({
      target: "container",
      max: 2,
      getNextSrc: () => ["/product/2.jpg", "/product/3.jpg"],
    });

    plugin.hooks.onMount!(ctx);
    container.dispatchEvent(new MouseEvent("mouseenter"));
    await FLUSH();

    expect(document.querySelectorAll('link[id^="lli-hoverprefetch-image-"]')).toHaveLength(2);

    plugin.hooks.onUnmount!(ctx);
    expect(document.querySelectorAll('link[id^="lli-hoverprefetch-image-"]')).toHaveLength(0);
    container.remove();
  });

  it("P2-4 Responsive 在 transformProps 阶段写入 srcset/sizes，成功后跳过 blob/data", () => {
    const hooks = createResponsivePlugin().hooks as AnyHooks;
    const props: any = { src: "/img/a.jpg" };
    const next = hooks.transformProps!(props);
    expect(next.srcSet).toContain("w=400 400w");
    expect(next.srcSet).toContain("w=800 800w");
    expect(next.sizes).toBe("(max-width: 800px) 100vw, 800px");

    const img = makeImg("/img/a.jpg");
    hooks.onLoadSuccess!(makeContext({ imageRef: { current: img } }), "blob:mock");
    expect(img.getAttribute("srcset")).toBeNull();
    expect(img.getAttribute("sizes")).toBeNull();
  });

  it("P2-5 RetryOnError 计数按 src 隔离，换图后取消旧定时器", () => {
    vi.useFakeTimers();
    const sharedData = new Map<string, any>();
    const img = makeImg("/retry/a.jpg");
    const plugin = createRetryOnErrorPlugin({ baseDelayMs: 10, jitter: false, maxRetries: 2 });
    const hooks = plugin.hooks as AnyHooks;

    const ctxA = makeContext({ src: "/retry/a.jpg", imageRef: { current: img }, sharedData });
    hooks.onLoadError!(ctxA, new Error("e"));
    expect(sharedData.get("retry-count:/retry/a.jpg")).toBe(1);

    // 同一个 sharedData 下另一个 src 的计数必须独立（旧实现共用 "retry-count"）
    const ctxB = makeContext({ src: "/retry/b.jpg", sharedData });
    hooks.onLoadError!(ctxB, new Error("e"));
    expect(sharedData.get("retry-count:/retry/b.jpg")).toBe(1);
    expect(sharedData.get("retry-count:/retry/a.jpg")).toBe(1);

    // 换图取消旧定时器：到时后 img.src 不应被改成带 retry 参数的地址
    hooks.onSrcChange!(ctxA, "/retry/a.jpg", "/retry/b.jpg");
    vi.advanceTimersByTime(100);
    expect(img.getAttribute("src")).toBe("/retry/a.jpg");
  });

  it("P2-6 CacheMemory 缓存 Blob 并在读取时创建 objectURL", async () => {
    MemoryCache.clear();
    const original = (URL as any).createObjectURL;
    (URL as any).createObjectURL = vi.fn(() => "blob:memory-hit");
    try {
      const blob = new Blob(["x"], { type: "image/png" });
      const sharedData = new Map<string, any>([["fetch-loader:blob", blob]]);
      const plugin = createMemoryCachePlugin();
      const ctx = makeContext({ src: "/mem/a.jpg", sharedData });

      await plugin.hooks.onLoadSuccess!(ctx, "blob:whatever");
      expect(MemoryCache.get("/mem/a.jpg") instanceof Blob).toBe(true);

      const display = await (plugin.hooks as AnyHooks).onLoad!(
        makeContext({ src: "/mem/a.jpg", sharedData })
      );
      expect(display).toBe("blob:memory-hit");
      expect(sharedData.get("fetch-loader:object-url")).toBe("blob:memory-hit");
    } finally {
      (URL as any).createObjectURL = original;
      MemoryCache.clear();
    }
  });

  it("P2-6 CachePrewarm 预热只写 Blob，不创建 objectURL", async () => {
    MemoryCache.clear();
    const createSpy = vi.fn(() => "blob:prewarm");
    const original = (URL as any).createObjectURL;
    (URL as any).createObjectURL = createSpy;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Blob(["p"], { type: "image/png" }))));
    try {
      const src = `/prewarm-${Date.now()}-${Math.random()}.jpg`;
      const plugin = createCachePrewarmPlugin({ trigger: "enter", preferMemory: true });
      (plugin.hooks as AnyHooks).onEnterViewport!(makeContext({ src, isIntersecting: true }) as any, undefined);
      await FLUSH();
      await FLUSH();

      expect(MemoryCache.get(src) instanceof Blob).toBe(true);
      expect(createSpy).not.toHaveBeenCalled();
    } finally {
      (URL as any).createObjectURL = original;
      MemoryCache.clear();
    }
  });
});
