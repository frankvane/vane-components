import type { ComponentType } from "react";
import type { CategoryMeta, ScenarioMeta } from "../types";
import { VOD } from "./vod";
import { VIDEO } from "./video";
import { COMMERCE } from "./commerce";
import { SOCIAL } from "./social";
import { NEWS } from "./news";
import { GALLERY } from "./gallery";
import { ADMIN } from "./admin";
import { TRAVEL } from "./travel";
import { MOBILE } from "./mobile";
import { MARKETING } from "./marketing";

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "vod",
    label: "影视点播",
    en: "VOD",
    blurb: "图少但单图大，LCP 与付费墙失败态决定体验。",
  },
  {
    id: "video",
    label: "视频社区",
    en: "VIDEO",
    blurb: "封面海量且单图小，唯一目标是别和视频抢带宽。",
  },
  {
    id: "ecommerce",
    label: "电商",
    en: "COMMERCE",
    blurb: "主图/缩略/评价图并存，SKU 切换要秒开。",
  },
  {
    id: "social",
    label: "图文社区",
    en: "SOCIAL",
    blurb: "不等高瀑布流，UGC 图质量与可用性都不可控。",
  },
  {
    id: "news",
    label: "资讯门户",
    en: "NEWS",
    blurb: "正文图决定 CLS，外链图常年失效。",
  },
  {
    id: "gallery",
    label: "图库摄影",
    en: "GALLERY",
    blurb: "以图为主业，缩略与全尺寸要分档，回访要命中缓存。",
  },
  {
    id: "admin",
    label: "后台 SaaS",
    en: "ADMIN",
    blurb: "表格里的小图与受保护附件，失败必须可解释。",
  },
  {
    id: "travel",
    label: "出行房产",
    en: "TRAVEL",
    blurb: "图集横滑 + 价格角标，弱网与离线是常态。",
  },
  {
    id: "mobile",
    label: "移动弱网",
    en: "MOBILE",
    blurb: "3G、低电量、内存压力、断网恢复的全链路。",
  },
  {
    id: "marketing",
    label: "营销创意",
    en: "MARKETING",
    blurb: "视觉即卖点，动效与版权保护同时要。",
  },
];

export const SCENARIOS: ScenarioMeta[] = [
  ...VOD,
  ...VIDEO,
  ...COMMERCE,
  ...SOCIAL,
  ...NEWS,
  ...GALLERY,
  ...ADMIN,
  ...TRAVEL,
  ...MOBILE,
  ...MARKETING,
];

const COMPONENTS = import.meta.glob("../specs/*.tsx") as Record<
  string,
  () => Promise<{ default: ComponentType }>
>;

const SOURCES = import.meta.glob("../specs/*.tsx", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const keyOf = (id: string) => `../specs/${id}.tsx`;

/** 预览组件：按需拉取，切换分类时才加载对应实现。 */
export function loadComponent(id: string): (() => Promise<{ default: ComponentType }>) | undefined {
  return COMPONENTS[keyOf(id)];
}

/** 完整版源码：直接读组件文件的原文，保证「看到的就是跑起来的」。 */
export function loadSource(id: string): (() => Promise<string>) | undefined {
  return SOURCES[keyOf(id)];
}

export function scenariosOf(cat: CategoryMeta["id"]): ScenarioMeta[] {
  return SCENARIOS.filter((s) => s.cat === cat);
}

/** 该场景用到的插件工厂去重列表（顺序即装配顺序）。 */
export function pluginFns(m: ScenarioMeta): string[] {
  return Array.from(new Set(m.plugs.map((p) => p.fn)));
}

/**
 * 最小可用版：只有装配，没有版式。
 * 用户把它贴到自己已有的列表/详情页里即可，不依赖演示站任何代码。
 */
export function minimalCode(m: ScenarioMeta): string {
  const fns = pluginFns(m).sort();
  const importLines = ["import {", "  LazyLoadImageCore,", ...fns.map((f) => `  ${f},`), '  withPlugins,', '} from "vane-lazy-image";'].join("\n");
  const composeLines = m.plugs.map((p) => `  ${p.fn}(${p.arg ?? ""}),`).join("\n");
  return [
    `// ${m.code} ${m.title} · 最小可用版`,
    `// ${m.pain}`,
    importLines,
    "",
    "const LazyImage = withPlugins(LazyLoadImageCore, [",
    composeLines,
    "]);",
    "",
    "// 版式与数据由业务侧负责，这一层只解决「怎么取图」",
    '<LazyImage src={src} alt={alt} loading="lazy" />',
  ].join("\n");
}
