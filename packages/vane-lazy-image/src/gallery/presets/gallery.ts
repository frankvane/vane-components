/**
 * galleryPreset —— 图集默认插件组合（gallery 域插件）。
 *
 * 仅含 gallery 域插件（缩略联动 / 360 / 计数 / 指示点 / …）；单图插件（放大镜/视频位/
 * 灯箱/价格/促销）由调用方经 GalleryCore 的 mainPlugins 注入，不进此预设，
 * 以保证 ./gallery 子路径体积可控（B7）。
 *
 * 注：剩余 gallery 域插件（Carousel / ZoomControl / Fullscreen / ThumbPreload /
 * Hotspot / Favorite）将在后续迭代补入此预设。
 */

// 注意：预设直接引入各插件的工厂实现（./create），而非带 .meta 的 index.ts，
// 以把 doc.json 排除在 ./gallery 入口闭包之外（独立子路径 ./custom-plugins/XxxPlugin
// 仍保留 .meta，不破坏约定）。doc.json 仅用于 demo 文档生成，运行时不需要。
import { createThumbSyncPlugin } from "../../custom-plugins/ThumbSyncPlugin/create";
import { createCounterPlugin } from "../../custom-plugins/CounterPlugin/create";
import { createIndicatorPlugin } from "../../custom-plugins/IndicatorPlugin/create";
import type { GalleryPlugin } from "../types";

export function galleryPreset(): GalleryPlugin[] {
  // 注：Spin360 是「有意开启的专门模式」（用 images 当帧序列、全屏覆盖主图），
  // 不应默认开启——否则默认图集主图被黑底遮罩盖死（首屏黑屏）。改为调用方按需注入。
  return [
    createThumbSyncPlugin(),
    createCounterPlugin(),
    createIndicatorPlugin(),
  ];
}
