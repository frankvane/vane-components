/**
 * 示例目录
 *
 * 与 waterfall 版不同：页面不再「一文件一页」，而是每组一个 catalog 文件，
 * 一个文件里放同组的几条 `{ meta, Stage }`。原因很实在 —— 卡片示例每页只有
 * 十几行（装哪几个插件、摆什么内容），拆成 37 个文件后，改一个公共版式要动 37 处。
 *
 * 顺序由 catalog 数组顺序 + 分组顺序决定，不依赖构建器枚举顺序。
 */
import { GROUP_ORDER, type DemoEntry, type DemoGroup } from "./types";
import { CORE_DEMOS } from "./catalog/core";
import { MEDIA_DEMOS } from "./catalog/media";
import { BUY_DEMOS } from "./catalog/buy";
import { DISPLAY_DEMOS } from "./catalog/display";
import { INTERACTION_DEMOS } from "./catalog/interaction";
import { INFRA_DEMOS } from "./catalog/infra";
import { COMPOUND_DEMOS } from "./catalog/compound";

export const DEMOS: DemoEntry[] = [
  ...CORE_DEMOS,
  ...MEDIA_DEMOS,
  ...BUY_DEMOS,
  ...DISPLAY_DEMOS,
  ...INTERACTION_DEMOS,
  ...INFRA_DEMOS,
  ...COMPOUND_DEMOS,
];

/** 只保留真有页面的分组（新增分组时不会出现空目录） */
export const DEMO_GROUPS: DemoGroup[] = GROUP_ORDER.filter((g) =>
  DEMOS.some((d) => d.meta.group === g)
);

export function demosOf(group: DemoGroup): DemoEntry[] {
  return DEMOS.filter((d) => d.meta.group === group);
}

export function findDemo(slug: string): DemoEntry | undefined {
  return DEMOS.find((d) => d.meta.slug === slug);
}

/** 本目录覆盖到的官方插件（目录名），供总览统计与校验脚本核对 */
export const DEMO_PLUGINS: string[] = Array.from(
  new Set(DEMOS.map((d) => d.meta.plugin).filter((p): p is string => Boolean(p)))
).sort();
