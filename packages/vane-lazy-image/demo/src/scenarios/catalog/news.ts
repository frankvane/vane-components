import type { ScenarioMeta } from "../types";

/** E · 资讯门户：正文图决定 CLS，外链图常年失效，无障碍是硬指标。 */
export const NEWS: ScenarioMeta[] = [
  {
    id: "e1-news-mixed",
    code: "E1",
    cat: "news",
    title: "头条大图 + 列表小图",
    ref: { site: "新浪 / 网易", page: "新闻首页", url: "https://news.sina.com.cn/" },
    pain: "首屏只有一张图该抢带宽，剩下几十张小图应该等滚动停稳。",
    tone: "light",
    plugs: [
      { fn: "createPriorityLoadingPlugin", arg: '{ priority: "high" }', why: "头条就是 LCP" },
      { fn: "createResponsivePlugin", arg: "{ variants: [400, 800, 1200] }", why: "按容器宽度出图" },
      { fn: "createViewportDebouncePlugin", arg: "{ debounceMs: 160 }", why: "滚动停稳再发" },
    ],
  },
  {
    id: "e2-photo-set",
    code: "E2",
    cat: "news",
    title: "组图 / 图集翻页",
    ref: { site: "门户图集", page: "组图浏览", url: "https://news.sina.com.cn/" },
    pain: "一图一页地翻，每张都要等；没有进度反馈就会以为卡住了。",
    tone: "dark",
    plugs: [
      { fn: "createGalleryPlugin", arg: "{ enableLightbox: true }", why: "全屏看图" },
      { fn: "createProgressOverlayPlugin", arg: "{ height: 3 }", why: "细进度条" },
      { fn: "createPreconnectPlugin", arg: '{ domains: ["https://picsum.photos"] }', why: "翻页前先建连" },
    ],
  },
  {
    id: "e3-inline-anti-cls",
    code: "E3",
    cat: "news",
    title: "正文图防 CLS",
    ref: { site: "资讯正文", page: "内嵌图", url: "https://news.sina.com.cn/" },
    pain: "图片没有预设高度，加载完成的一瞬间把下面几段全推下去。",
    tone: "light",
    plugs: [
      { fn: "createAspectRatioSpacerPlugin", arg: "{ ratio: 4 / 3 }", why: "先把高度占住" },
      { fn: "createSkeletonPlugin", arg: '{ type: "shimmer" }', why: "占位有质感" },
      { fn: "createSEOPlugin", arg: '{ aspectRatio: "4:3" }', why: "alt 与结构化" },
    ],
  },
  {
    id: "e4-dead-links",
    code: "E4",
    cat: "news",
    title: "失效外链",
    ref: { site: "老牌资讯站", page: "历史文章配图", url: "https://news.sina.com.cn/" },
    pain: "2019 年的图床早就迁移了，没人上报你就永远不知道有多少破图。",
    tone: "light",
    plugs: [
      { fn: "createCDNFallbackPlugin", arg: "{ cdnBases: [...] }", why: "备域兜一次" },
      { fn: "createFallbackImagePlugin", arg: "{ fallbackSrc: … }", why: "兜底图收场" },
      { fn: "createErrorTrackingPlugin", arg: "{ report, showBadge: true }", why: "失败可上报" },
    ],
    note: "控制台执行 window.__vaneDeadLink 可看到失败上报的原始记录。",
  },
  {
    id: "e5-a11y-gov",
    code: "E5",
    cat: "news",
    title: "无障碍政务站",
    ref: { site: "公共服务站点", page: "政策图解", url: "https://www.gov.cn/" },
    pain: "读屏软件读不出「图片加载中」，运营漏填 alt 就是一次合规风险。",
    tone: "light",
    plugs: [
      { fn: "createA11yPlugin", arg: "{ statusText: … }", why: "朗读状态" },
      { fn: "createAltTextPlugin", arg: '{ derive: true, prefix: "示意图：" }', why: "alt 自动推导" },
      { fn: "createSEOPlugin", arg: "{ enabled: true }", why: "alt + 结构化" },
    ],
    note: "第一张故意留空 alt，插件会按标题推导出「示意图：办事大厅引导图」。",
  },
];
