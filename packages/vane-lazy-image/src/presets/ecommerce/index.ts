/**
 * 配方：电商核心（ecommerce）
 *
 * 场景：电商商品图，覆盖「电商核心」分组的全部 8 个插件——
 *   价格标签 / 促销角标 / 库存状态 / 取色色板 / 社交分享 / 视频海报 / 多语言换图 / 一键下载。
 * 这是一个「全家桶」式配方，演示一个商品图能叠加多少电商能力；
 * 生产环境通常按需挑选 2~4 个即可（配方是快捷方式不是白名单）。
 *
 * 用法：withPlugins(LazyLoadImageCore, ecommercePreset())
 */
import { createPriceTagPlugin } from "../../custom-plugins/PriceTagPlugin";
import { createPromoBadgePlugin } from "../../custom-plugins/PromoBadgePlugin";
import { createInventoryStatusPlugin } from "../../custom-plugins/InventoryStatusPlugin";
import { createColorSwatchPlugin } from "../../custom-plugins/ColorSwatchPlugin";
import { createSocialSharePlugin } from "../../custom-plugins/SocialSharePlugin";
import { createVideoPosterPlugin } from "../../custom-plugins/VideoPosterPlugin";
import { createLocalizationPlugin } from "../../custom-plugins/LocalizationPlugin";
import { createDownloadButtonPlugin } from "../../custom-plugins/DownloadButtonPlugin";
import type { LazyImagePlugin } from "../../components/LazyLoadImagePlugin/plugins/types";

export const ecommercePreset = (): LazyImagePlugin[] => [
  createInventoryStatusPlugin({ status: "low-stock", stockCount: 8, autoRefresh: false }),
  createPromoBadgePlugin({ type: "sale", text: "限时特惠", pulse: true }),
  createPriceTagPlugin({
    price: 199,
    originalPrice: 299,
    currency: "¥",
    showSavings: true,
    animate: true,
  }),
  createColorSwatchPlugin({ maxColors: 5, interactive: true }),
  createSocialSharePlugin({
    platforms: ["wechat", "twitter", "pinterest"],
    showOnHover: true,
  }),
  createVideoPosterPlugin({
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    playInModal: true,
  }),
  createLocalizationPlugin({
    localeMap: {
      zh: "https://picsum.photos/seed/vane-ec-zh/800/600",
      en: "https://picsum.photos/seed/vane-ec-en/800/600",
    },
    currentLocale: "zh",
  }),
  createDownloadButtonPlugin({ filename: "product.jpg", showOnHover: false }),
];
