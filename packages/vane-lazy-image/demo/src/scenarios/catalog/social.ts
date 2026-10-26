import type { ScenarioMeta } from "../types";

/** D · 图文社区：UGC 主导，比例、数量、可用性都不可控。 */
export const SOCIAL: ScenarioMeta[] = [
  {
    id: "d1-xhs-masonry",
    code: "D1",
    cat: "social",
    title: "三列不等高瀑布流",
    ref: { site: "小红书", page: "首页发现", url: "https://www.xiaohongshu.com/" },
    pain: "每条笔记比例不同，没有按条占位，滑到一半整列会突然错位。",
    tone: "light",
    plugs: [
      { fn: "createAspectRatioSpacerPlugin", arg: "{ ratio: item.ratio }", why: "按条占位，列不跳动" },
      { fn: "createViewportAwarePlugin", arg: '{ rootMargin: "150px" }', why: "进视口才加载" },
      { fn: "createBlurUpPlugin", arg: "{ startBlur: 10 }", why: "糊图先出" },
      { fn: "createConcurrencyControlPlugin", arg: "{ maxConcurrent: 5 }", why: "瀑布流限并发" },
    ],
    note: "比例逐条不同，所以 withPlugins 放进 useMemo 按比例缓存组件身份。",
  },
  {
    id: "d2-nine-grid-lightbox",
    code: "D2",
    cat: "social",
    title: "九宫格 → 灯箱",
    ref: { site: "微博 / 小红书", page: "笔记详情的九宫格", url: "https://www.xiaohongshu.com/" },
    pain: "九张图铺满屏，用户真正想看的是其中一张的高清版。",
    tone: "light",
    plugs: [
      { fn: "createGalleryPlugin", arg: "{ enableLightbox: true }", why: "点开进灯箱" },
      { fn: "createTransitionPlugin", arg: "{ durationMs: 240 }", why: "切换不闪" },
      { fn: "createSkeletonPlugin", arg: '{ type: "pulse" }', why: "空格有稳定视觉重量" },
    ],
  },
  {
    id: "d3-article-images",
    code: "D3",
    cat: "social",
    title: "长文配图",
    ref: { site: "知乎 / 公众号", page: "长文正文", url: "https://www.zhihu.com/" },
    pain: "正文图一旦晚到，段落就被整体推下去；没有 alt 还会丢检索流量。",
    tone: "light",
    plugs: [
      { fn: "createAspectRatioSpacerPlugin", arg: "{ ratio: 16 / 9 }", why: "先占住高度" },
      { fn: "createLqipPlugin", arg: "{ lqipSrc: (src) => …, blur: 18 }", why: "24px 低清先出" },
      { fn: "createSEOPlugin", arg: '{ altFallback: "文章配图" }', why: "alt 与结构化" },
    ],
  },
  {
    id: "d4-follow-avatars",
    code: "D4",
    cat: "social",
    title: "关注推荐列表",
    ref: { site: "社交产品", page: "关注推荐", url: "https://www.xiaohongshu.com/" },
    pain: "几十个 38px 小头像，单个失败会留下一个空洞，整行都显得脏。",
    tone: "light",
    plugs: [
      { fn: "createCropPlugin", arg: "{ focusPoint: { x: 0.5, y: 0.45 } }", why: "人脸居中裁方" },
      { fn: "createRetryOnErrorPlugin", arg: "{ maxRetries: 2, jitter: true }", why: "抖动重试一次" },
      { fn: "createFallbackImagePlugin", arg: "{ fallbackSrc: … }", why: "最后给默认剪影" },
    ],
  },
  {
    id: "d5-share-card",
    code: "D5",
    cat: "social",
    title: "分享卡片",
    ref: { site: "内容社区", page: "图片分享/图注", url: "https://www.xiaohongshu.com/" },
    pain: "分享位、图注、拍摄参数都要贴在图上，还得在悬停时才出现。",
    tone: "dark",
    plugs: [
      { fn: "createSocialSharePlugin", arg: '{ showOnHover: true }', why: "分享入口" },
      { fn: "createCaptionPlugin", arg: '{ position: "bottom" }', why: "图注常驻" },
      { fn: "createOverlayInfoPlugin", arg: '{ position: "top", trigger: "hover" }', why: "参数蒙层" },
    ],
  },
];
