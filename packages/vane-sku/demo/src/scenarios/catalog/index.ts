import type { ComponentType } from "react";

/**
 * 场景目录：与 vane-lazy-image 演示站同一套机制——
 * 每个场景是一个独立 .tsx（见 ./specs），既作为实时预览组件按需加载，
 * 又通过 import.meta.glob(..., { query: "?raw" }) 直接读原文作为「源码展示」。
 * 这样「看到的」和「跑起来的」一定是同一份，杜绝文档漂移。
 */
export interface ScenarioMeta {
  id: string;
  no: number;
  title: string;
  hint: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  { id: "disable", no: 1, title: "禁用推导", hint: "缺 blue-l 变体 —— 点「蓝」后 L 自动置灰，点不中" },
  { id: "range", no: 2, title: "价格区间", hint: "未选全时展示 ¥199–¥269；选了颜色后区间随选择收窄" },
  { id: "price-stock", no: 3, title: "价格联动 + 库存状态", hint: "命中变体后显单价与原价删除线，并提示现货 / 仅剩 N 件" },
  { id: "quota-qty", no: 4, title: "限购 + 数量上限", hint: "限购 2 / 已购 1，库存 5 → 数量上限取较小值 2，另有货号与清空重选" },
  { id: "image", no: 5, title: "规格切主图", hint: "ImageLink 只发事件，主图由外层渲染" },
  { id: "ignore-stock", no: 6, title: "缺货是否参与推导", hint: "green-l 库存 0：默认（开启）被置灰；关闭 ignoreOutOfStock 后可选" },
  { id: "keyboard", no: 7, title: "键盘漫游", hint: "点中任一规格按钮后，用 ←→ 同行切换、↑↓ 跨行跳转（自动跳过置灰项）" },
  { id: "two-attr", no: 8, title: "双属性简版", hint: "只留红/蓝两色，对比禁用推导在更小矩阵下的表现" },
  { id: "analytics", no: 9, title: "埋点上报", hint: "Analytics 事件出口：挂载/命中/未命中都上报，回调接到这里画事件流水" },
  { id: "url-sync", no: 10, title: "URL 同步", hint: "UrlSync 把选择写进查询串（?sku_颜色=…），复制链接打开即还原，清空自动删参" },
  { id: "persistence", no: 11, title: "状态持久化", hint: "StatePersistence 记住上次选择（localStorage），重挂载即还原，清空自动删键" },
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

/** 预览组件：按需懒加载，切换分类时才拉对应实现。 */
export function loadComponent(id: string): (() => Promise<{ default: ComponentType }>) | undefined {
  return COMPONENTS[keyOf(id)];
}

/** 完整版源码：直接读场景文件的原文，保证「看到的就是跑起来的」。 */
export function loadSource(id: string): (() => Promise<string>) | undefined {
  return SOURCES[keyOf(id)];
}
