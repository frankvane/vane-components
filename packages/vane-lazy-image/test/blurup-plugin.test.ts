import { describe, expect, it } from "vitest";
import { createBlurUpPlugin } from "../src/custom-plugins/BlurUpPlugin";
import type { LazyImageContext, LazyImageHooks } from "../src/components/LazyLoadImagePlugin/plugins/types";

/** 构造最小领域上下文（只覆盖插件读取的字段） */
function makeContext(overrides: Partial<LazyImageContext> = {}): LazyImageContext {
  return {
    props: { src: "/demo.jpg" },
    bus: {
      emit: () => {},
      on: () => () => {},
      once: () => () => {},
      off: () => {},
      getData: () => undefined,
      setData: () => {},
      deleteData: () => {},
      hasData: () => false,
      getAll: () => ({}),
      clear: () => {},
    },
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
    imageState: { isIdle: true, isLoading: false, isLoaded: false, isError: false },
    isIntersecting: false,
    imageRef: { current: null },
    containerRef: { current: null },
    ...overrides,
  } as LazyImageContext;
}

describe("BlurUpPlugin（样板插件三件套）", () => {
  it("工厂返回合法领域插件", () => {
    const plugin = createBlurUpPlugin();
    const hooks = plugin.hooks as LazyImageHooks;
    expect(plugin.name).toBe("blur-up");
    expect(plugin.version).toBe("1.0.0");
    expect(typeof hooks.transformProps).toBe("function");
    expect(typeof hooks.onBeforeLoad).toBe("function");
    expect(typeof hooks.onLoadSuccess).toBe("function");
  });

  it("工厂挂载 .meta（文档数据）", () => {
    expect(createBlurUpPlugin.meta.name).toBe("BlurUpPlugin");
    expect(createBlurUpPlugin.meta.tags).toContain("visual");
  });

  it("transformProps 注入 blur 滤镜与过渡", () => {
    const plugin = createBlurUpPlugin({ startBlur: 12, durationMs: 600 });
    const hooks = plugin.hooks as LazyImageHooks;
    const next = hooks.transformProps!({
      src: "/a.jpg",
      imageStyle: { opacity: 0 },
    } as any);
    expect(next.imageStyle?.filter).toBe("blur(12px)");
    expect(next.imageStyle?.transition).toContain("filter 600ms ease");
    // 不破坏已有样式
    expect(next.imageStyle?.opacity).toBe(0);
  });

  it("transformProps 不重复叠加 blur（可重入）", () => {
    const plugin = createBlurUpPlugin({ startBlur: 8 });
    const hooks = plugin.hooks as LazyImageHooks;
    const first = hooks.transformProps!({ src: "/a.jpg" } as any);
    const second = hooks.transformProps!(first as any);
    expect(second.imageStyle?.filter).toBe("blur(8px)");
  });

  it("onBeforeLoad 无 img 时返回 true（不阻止加载）", () => {
    const plugin = createBlurUpPlugin();
    const hooks = plugin.hooks as LazyImageHooks;
    expect(hooks.onBeforeLoad!(makeContext())).toBe(true);
  });

  it("onLoadSuccess 移除模糊", () => {
    const plugin = createBlurUpPlugin({ endBlur: 0 });
    const hooks = plugin.hooks as LazyImageHooks;
    const img = document.createElement("img");
    img.style.filter = "blur(8px)";
    const ctx = makeContext({ imageRef: { current: img } });
    hooks.onBeforeLoad!(ctx);
    hooks.onLoadSuccess!(ctx, "blob:mock");
    expect(img.style.filter).toBe("");
  });

  it("自定义 endBlur 时保留对应模糊", () => {
    const plugin = createBlurUpPlugin({ endBlur: 2 });
    const hooks = plugin.hooks as LazyImageHooks;
    const img = document.createElement("img");
    img.style.filter = "blur(8px)";
    const ctx = makeContext({ imageRef: { current: img } });
    hooks.onLoadSuccess!(ctx, "blob:mock");
    expect(img.style.filter).toBe("blur(2px)");
  });
});
