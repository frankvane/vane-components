/**
 * 逐项示例页的元信息
 *
 * 与「场景卡」是两种视角，故意分开：
 *  - 场景（scenarios/）→ 组合视角：一个真实版式里几个插件怎么配合；
 *  - 示例（demos/）   → 单点视角：**一个插件（或一个复合组件组）一页**，
 *    只装它，参数可拖，随时看装配代码。
 *
 * 一页 = 一条 `DemoEntry`（meta + Stage）。页面骨架由 `DemoPage` 统一提供，
 * 于是新增一页只需要写「装什么插件 + 怎么摆」，不用再抄一遍版式。
 */
import type { ComponentType } from "react";

export type DemoGroup = "core" | "media" | "buy" | "display" | "interaction" | "infra" | "compound";

export const GROUP_META: Record<DemoGroup, { label: string; hint: string }> = {
  core: { label: "Core 内核", hint: "props / ref / 生命周期" },
  media: { label: "媒体", hint: "图 / 视频 / 轮播" },
  buy: { label: "交易链路", hint: "SKU → 数量 → 价格 → 券 → 汇总" },
  display: { label: "展示", hint: "角标 / 标签 / 倒计时 / 评价 / 入场" },
  interaction: { label: "交互", hint: "操作按钮 / 悬停" },
  infra: { label: "基础设施", hint: "状态 / 埋点 / 无障碍 / 响应式" },
  compound: { label: "复合组件", hint: "ProductCard 与 38 个子组件" },
};

export const GROUP_ORDER: DemoGroup[] = [
  "core",
  "media",
  "buy",
  "display",
  "interaction",
  "infra",
  "compound",
];

/** 可调参数：由 meta 声明，页面统一渲染成控件，值以 `cfg[key]` 交给舞台 */
export interface DemoControl {
  key: string;
  label: string;
  kind: "number" | "switch" | "select";
  init: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
  hint?: string;
  when?: (cfg: DemoCfg) => boolean;
  /** 不影响几何，体检脚本据此放过 */
  nonLayout?: boolean;
}

/** 装配代码里的一行 props；`when` 为假时该行不生成 */
export type DemoPropLine = string | { text: string; when?: (cfg: DemoCfg) => boolean };

export interface DemoPlug {
  /** 工厂名，如 createSKUPlugin */
  fn: string;
  /** 装配代码里传入的配置字面量（不含外层花括号），可用 `{{key}}` 引用控件值 */
  cfg?: string;
  /** 这一页为什么需要它 */
  why: string;
  /** 页内内联写的插件（不在官方 22 个里） */
  local?: boolean;
}

export interface DemoMeta {
  /** URL 片段，如 "sku" */
  slug: string;
  title: string;
  group: DemoGroup;
  /** 关联的官方插件目录名（覆盖率统计用） */
  plugin?: string;
  /** 内核能力页（不是插件）：如 ref 契约、生命周期 */
  capability?: string;
  /** 一句话：这页演示什么 */
  intro: string;
  /** 什么时候该用它 */
  why: string;
  plugs: DemoPlug[];
  /** 装配代码里 `<Card>` 上的 props，每行一条；支持 `{{key}}` 替换 */
  props: DemoPropLine[];
  /** 卡片上的 children（有些页需要给内容才能看出效果） */
  children?: string;
  note?: string;
  controls?: DemoControl[];
  /** 舞台里卡片的宽度，默认 360 */
  stageWidth?: number;
  tone?: "dark" | "light";
  /** 数据对象代码块（默认给当前种子数据的关键字段） */
  dataCode?: string;
}

export type DemoCfg = Record<string, number | boolean | string>;

export type DemoLogKind = "info" | "event" | "warn";
export type DemoLog = (line: string, kind?: DemoLogKind) => void;

export interface DemoStageProps {
  cfg: DemoCfg;
  log: DemoLog;
  /** 舞台内部要改控件值（点选规格、翻页）时用；等同于用户拖控件 */
  setCfg: (key: string, value: number | boolean | string) => void;
}

export interface DemoEntry {
  meta: DemoMeta;
  Stage: ComponentType<DemoStageProps>;
}

/** 把控件初值摊平成 cfg */
export function initialCfg(meta: DemoMeta): DemoCfg {
  const cfg: DemoCfg = {};
  for (const c of meta.controls ?? []) cfg[c.key] = c.init;
  return cfg;
}
