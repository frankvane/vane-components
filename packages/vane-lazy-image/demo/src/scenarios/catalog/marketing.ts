import type { ScenarioMeta } from "../types";

/** J · 营销创意：视觉即卖点，动效与版权保护同时要。 */
export const MARKETING: ScenarioMeta[] = [
  {
    id: "j1-brand-parallax",
    code: "J1",
    cat: "marketing",
    title: "品牌页视差首屏",
    ref: { site: "品牌落地页", page: "新品专题", url: "https://www.apple.com/" },
    pain: "静态大图撑不起「质感」，加动效又容易吃满主线程。",
    tone: "dark",
    plugs: [
      { fn: "createParallaxPlugin", arg: "{ strength: 0.18, axis: \"y\" }", why: "背景慢一层" },
      { fn: "createRevealAnimationPlugin", arg: '{ animation: "fade-up" }', why: "分块揭示" },
      { fn: "createFadeInPlugin", arg: "{ durationMs: 400 }", why: "整体淡入" },
    ],
  },
  {
    id: "j2-glitch-poster",
    code: "J2",
    cat: "marketing",
    title: "故障风海报",
    ref: { site: "音乐节 / 潮流活动", page: "主视觉海报", url: "https://www.boilerroom.tv/" },
    pain: "故障特效做不好就是掉帧；开成常驻动画更会一直占着合成层。",
    tone: "dark",
    plugs: [
      { fn: "createGlitchEffectPlugin", arg: "{ triggerOnHover: true, duration: 900 }", why: "悬停触发一次" },
      { fn: "createFilterPlugin", arg: '{ filter: "contrast" }', why: "底片先压对比" },
    ],
  },
  {
    id: "j3-watermark-guard",
    code: "J3",
    cat: "marketing",
    title: "版权图水印",
    ref: { site: "素材站", page: "预览图", url: "https://www.pexels.com/" },
    pain: "预览图要能被截图溯源，同时不能被别站直接外链。",
    tone: "dark",
    plugs: [
      { fn: "createWatermarkPlugin", arg: '{ text: "© VANE STUDIO" }', why: "可见水印" },
      { fn: "createAntiHotlinkPlugin", arg: '{ allowedDomains: ["picsum.photos"] }', why: "引用限制" },
    ],
    note: "水印是 DOM 叠层而非烧进图片，真实业务还要配合服务端签名 URL。",
  },
  {
    id: "j4-depth-card",
    code: "J4",
    cat: "marketing",
    title: "3D 深度卡片",
    ref: { site: "产品官网", page: "产品卡", url: "https://www.apple.com/" },
    pain: "产品图的「手感」靠位移与光影，但自己写 tilt 很容易飘。",
    tone: "dark",
    plugs: [
      { fn: "createDepthMapPlugin", arg: "{ style: \"tilt\", maxTilt: 18 }", why: "指针跟随倾斜" },
      { fn: "createAnimatedCursorPlugin", arg: "{ style: \"zoom-in\" }", why: "光标跟随放大" },
    ],
  },
];
