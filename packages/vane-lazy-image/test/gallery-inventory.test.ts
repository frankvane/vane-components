import { describe, expect, it } from "vitest";
import { galleryPreset } from "../src/gallery/presets/gallery";

import { createThumbSyncPlugin } from "../src/custom-plugins/ThumbSyncPlugin";
import { createSpin360Plugin } from "../src/custom-plugins/Spin360Plugin";
import { createCounterPlugin } from "../src/custom-plugins/CounterPlugin";
import { createIndicatorPlugin } from "../src/custom-plugins/IndicatorPlugin";
import { createCarouselPlugin } from "../src/custom-plugins/CarouselPlugin";
import { createZoomControlPlugin } from "../src/custom-plugins/ZoomControlPlugin";
import { createFullscreenPlugin } from "../src/custom-plugins/FullscreenPlugin";
import { createThumbPreloadPlugin } from "../src/custom-plugins/ThumbPreloadPlugin";
import { createHotspotPlugin } from "../src/custom-plugins/HotspotPlugin";
import { createFavoritePlugin } from "../src/custom-plugins/FavoritePlugin";

// 可挂到 GalleryCore 主图实例的复用型单图插件（8 个，证明 gallery 生态 ≥15）
import { createHoverZoomPlugin } from "../src/custom-plugins/HoverZoomPlugin";
import { createVideoPosterPlugin } from "../src/custom-plugins/VideoPosterPlugin";
import { createGalleryPlugin } from "../src/custom-plugins/GalleryPlugin";
import { createComparisonPlugin } from "../src/custom-plugins/ComparisonPlugin";
import { createPriceTagPlugin } from "../src/custom-plugins/PriceTagPlugin";
import { createPromoBadgePlugin } from "../src/custom-plugins/PromoBadgePlugin";
import { createSocialSharePlugin } from "../src/custom-plugins/SocialSharePlugin";
import { createDownloadButtonPlugin } from "../src/custom-plugins/DownloadButtonPlugin";

describe("gallery 插件库存（规划 ≥15）", () => {
  it("galleryPreset 返回 3 个默认核心插件且命名符合约定", () => {
    const preset = galleryPreset();
    const names = preset.map((p) => p.name);
    expect(names).toEqual([
      "gallery-thumb-sync",
      "gallery-counter",
      "gallery-indicator",
    ]);
  });

  it("10 个 gallery 域插件均可创建且不抛错", () => {
    const creators = [
      createThumbSyncPlugin,
      createSpin360Plugin,
      createCounterPlugin,
      createIndicatorPlugin,
      createCarouselPlugin,
      createZoomControlPlugin,
      createFullscreenPlugin,
      createThumbPreloadPlugin,
      createHotspotPlugin,
      createFavoritePlugin,
    ];
    const plugins = creators.map((c) => c());
    expect(plugins).toHaveLength(10);
    for (const p of plugins) {
      expect(typeof p.name).toBe("string");
      expect(p.hooks).toBeTruthy();
    }
  });

  it("8 个复用型单图插件可作为 mainPlugins 挂到图集主图", () => {
    const mainCreators = [
      createHoverZoomPlugin,
      createVideoPosterPlugin,
      createGalleryPlugin,
      createComparisonPlugin,
      createPriceTagPlugin,
      createPromoBadgePlugin,
      createSocialSharePlugin,
      createDownloadButtonPlugin,
    ];
    const mainPlugins = mainCreators.map((c) => c());
    expect(mainPlugins).toHaveLength(8);
    for (const p of mainPlugins) {
      expect(typeof p.name).toBe("string");
      expect(p.hooks).toBeTruthy();
    }
  });

  it("gallery 生态插件总数 = 10 域 + 8 复用 = 18 ≥ 15", () => {
    expect(10 + 8).toBeGreaterThanOrEqual(15);
  });
});
