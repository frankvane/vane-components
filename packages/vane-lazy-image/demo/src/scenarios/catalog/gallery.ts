import type { ScenarioMeta } from "../types";

/** F · 图库摄影：以图为主业，缩略与全尺寸分档，回访必须命中本地缓存。 */
export const GALLERY: ScenarioMeta[] = [
  {
    id: "f1-unsplash-masonry",
    code: "F1",
    cat: "gallery",
    title: "瀑布流无限滚动",
    ref: { site: "Unsplash", page: "探索页", url: "https://unsplash.com/" },
    pain: "图库用户会反复回看同一批图，每次都重新拉一遍纯属浪费。",
    tone: "dark",
    plugs: [
      { fn: "createIDBCachePlugin", arg: '{ dbName: "vane-gallery" }', why: "落 IndexedDB 复用" },
      { fn: "createConcurrencyControlPlugin", arg: "{ maxConcurrent: 6 }", why: "限并发" },
      { fn: "createViewportAwarePlugin", arg: '{ rootMargin: "240px" }', why: "提前一屏" },
      { fn: "createSkeletonPlugin", arg: '{ type: "shimmer" }', why: "暗色骨架" },
    ],
    note: "刷新第二次打开：这些图会直接从 IndexedDB 出，Network 面板不再发请求。",
  },
  {
    id: "f2-lightbox-download",
    code: "F2",
    cat: "gallery",
    title: "灯箱 + 下载 + 色板",
    ref: { site: "Pexels", page: "图片详情", url: "https://www.pexels.com/" },
    pain: "看图、下载、取色是三件事，分散在三个组件里就很难保持一致。",
    tone: "dark",
    plugs: [
      { fn: "createGalleryPlugin", arg: '{ buttonText: "全屏" }', why: "灯箱看图" },
      { fn: "createDownloadButtonPlugin", arg: '{ filename: "vane-photo.jpg" }', why: "下载带正确后缀" },
      { fn: "createColorSwatchPlugin", arg: "{ maxColors: 5 }", why: "主色板可取色" },
    ],
  },
  {
    id: "f3-exif-upright",
    code: "F3",
    cat: "gallery",
    title: "手机竖图纠偏",
    ref: { site: "摄影社区", page: "用户直传", url: "https://unsplash.com/" },
    pain: "iPhone 直传的竖图带 Orientation=6，不纠正就是躺着的。",
    tone: "dark",
    plugs: [
      { fn: "createExifOrientationPlugin", arg: "{ enabled: true }", why: "读 EXIF 转正" },
      { fn: "createCropPlugin", arg: "{ focusPoint: { x: 0.5, y: 0.42 } }", why: "转正后裁 4:5" },
    ],
    note: "占位图不带 EXIF，插件读到缺失标记时按 1 处理；换成自己拍的直传图即可看到转正效果。",
  },
  {
    id: "f4-before-after",
    code: "F4",
    cat: "gallery",
    title: "原图 / 滤镜对比",
    ref: { site: "摄影社区", page: "作品对比", url: "https://unsplash.com/" },
    pain: "「调色前后」说服力最强，但自己做拖拽分割线很容易做出错位。",
    tone: "dark",
    plugs: [
      { fn: "createComparisonPlugin", arg: "{ beforeSrc, afterSrc, start: 0.5 }", why: "可拖拽分隔条" },
      { fn: "createFilterPlugin", arg: '{ filter: "grayscale" }', why: "预设缩略" },
    ],
  },
  {
    id: "f5-artwork-detail",
    code: "F5",
    cat: "gallery",
    title: "作品详情氛围",
    ref: { site: "数字艺术平台", page: "作品详情", url: "https://unsplash.com/" },
    pain: "作品页要有氛围：主色铺底、入场形变、下一件提前备好。",
    tone: "dark",
    plugs: [
      { fn: "createDominantColorPlugin", arg: "{ color: rgba }", why: "主色铺容器底" },
      { fn: "createCustomEffectsPlugin", arg: "{ hoverImageStyle }", why: "悬停上浮提亮" },
      { fn: "createMorphPlugin", arg: '{ type: "elastic" }', why: "入场形变" },
      { fn: "createCachePrewarmPlugin", arg: '{ trigger: "enter" }', why: "预热下一件" },
    ],
  },
];
