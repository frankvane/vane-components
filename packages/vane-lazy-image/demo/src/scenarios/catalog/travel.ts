import type { ScenarioMeta } from "../types";

/** H · 出行房产：图集横滑 + 价格角标，弱网与离线是常态。 */
export const TRAVEL: ScenarioMeta[] = [
  {
    id: "h1-listing-gallery",
    code: "H1",
    cat: "travel",
    title: "房源图集横滑",
    ref: { site: "贝壳 / Airbnb", page: "房源详情", url: "https://www.ke.com/" },
    pain: "1 主图 + 4 缩略，切一次拉一次；比例不统一就上下跳。",
    tone: "dark",
    plugs: [
      { fn: "createAspectRatioSpacerPlugin", arg: "{ ratio: 4 / 3 }", why: "统一比例不跳" },
      { fn: "createGalleryPlugin", arg: "{ enableLightbox: true }", why: "看图集" },
      { fn: "createHoverPrefetchPlugin", arg: "{ max: 1, getNextSrc }", why: "悬停预取下一张" },
    ],
  },
  {
    id: "h2-hotel-card",
    code: "H2",
    cat: "travel",
    title: "酒店列表卡",
    ref: { site: "携程", page: "酒店搜索结果", url: "https://www.ctrip.com/" },
    pain: "会员价、促销标、剩余房量——三条业务信息必须压在同一个图上。",
    tone: "light",
    plugs: [
      { fn: "createPriceTagPlugin", arg: "{ price: 486, discount }", why: "会员价 + 划线价" },
      { fn: "createPromoBadgePlugin", arg: '{ text: "限时特惠" }', why: "促销标" },
      { fn: "createBadgePlugin", arg: '{ text: "仅剩 2 间" }', why: "库存角标" },
    ],
  },
  {
    id: "h3-offline-favs",
    code: "H3",
    cat: "travel",
    title: "离线收藏夹",
    ref: { site: "出行 App", page: "我的收藏", url: "https://www.ctrip.com/" },
    pain: "用户在高铁上打开收藏夹，断网时不该只剩一片空框。",
    tone: "light",
    plugs: [
      { fn: "createIDBCachePlugin", arg: '{ dbName: "vane-travel" }', why: "提前落库" },
      { fn: "createOfflinePlugin", arg: "{ warm: true, showBadge: true }", why: "断网切占位" },
      { fn: "createErrorBadgePlugin", arg: '{ text: "离线" }', why: "说明当前状态" },
    ],
  },
];
