/**
 * 逐项示例页的元信息
 *
 * 与「场景卡」是两种视角，故意分开：
 *  - 场景（scenarios/）→ 组合视角：一个真实版式里几个插件怎么配合；
 *  - 示例（demos/）   → 单点视角：**一个插件一页**，只装它，参数可拖，随时看装配代码。
 *
 * 一页 = 一个 `NN-slug.tsx` 文件，导出 `meta` 与默认的舞台组件。
 * 基础页（basic）演示内核自身的 props 与推导行为，一个插件都不装；
 * 插件页（plugin）一插件一页；高级页（advanced）做全量装配的组合示范。
 */
import type { ComponentType } from "react";

export type DemoGroup = "basic" | "advanced" | "plugin";

export const GROUP_META: Record<DemoGroup, { label: string; hint: string }> = {
  basic: { label: "基础功能", hint: "Core 自身的 props 与推导行为" },
  advanced: { label: "高级功能", hint: "全量装配 / 组合" },
  plugin: { label: "插件功能", hint: "一插件一页" },
};

/** 可调参数：由 meta 声明，页面统一渲染成控件，值以 `cfg[key]` 交给舞台 */
export interface DemoControl {
  key: string;
  label: string;
  kind: "number" | "switch" | "select";
  /** 初值 */
  init: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  /** select 的选项；value 一律用字符串，舞台自行转换 */
  options?: Array<{ label: string; value: string }>;
  hint?: string;
  /**
   * 条件显示：返回 false 时这一项不出现在控件条里（值仍留在 cfg 里）。
   * 用于「A 生效时 B 没意义」的成对参数，例如预选颜色为 none 时
   * 生成的装配代码里就不该出现 defaultSelection 行。
   */
  when?: (cfg: DemoCfg) => boolean;
  /**
   * 这一项不改版式，只影响事件流水 / 触发阈值 / 持久化行为。
   * 校验脚本据此放过它（否则会把「关掉埋点也没有几何变化」当成缺陷）。
   */
  nonLayout?: boolean;
}

/** 装配代码里的一行 props；`when` 为假时该行不生成 */
export type DemoPropLine =
  | string
  | { text: string; when?: (cfg: DemoCfg) => boolean };

export interface DemoPlug {
  /** 插件工厂名，必须是 custom-plugins 的导出（如 createPriceLinkPlugin） */
  fn: string;
  /** 装配代码里传入的配置字面量（不含外层花括号），可用 `{{key}}` 引用控件当前值 */
  cfg?: string;
  /** 这一页为什么需要它 */
  why: string;
  /** 页内内联的自定义插件（不在 custom-plugins 里） */
  local?: boolean;
}

export interface DemoMeta {
  /** 与文件名去掉序号后一致，如 "price-link" */
  slug: string;
  title: string;
  group: DemoGroup;
  /** 关联的官方插件目录名（覆盖率与校验用），如 "PriceLink" */
  plugin?: string;
  /**
   * 内核能力页（不是插件）：如 core-assembly、disable-derivation、matrix。
   * 插件页必须二选一填 `plugin` 或 `capability`，否则校验脚本报「缺 plugin」。
   */
  capability?: string;
  /** 一句话：这页演示什么 */
  intro: string;
  /** 什么时候该用它（不是「它是什么」） */
  why: string;
  plugs: DemoPlug[];
  /** 装配代码里 `<Sku>` 上的 props，每行一条；支持 `{{key}}` 替换 */
  props: DemoPropLine[];
  /** 坑位提醒 */
  note?: string;
  controls?: DemoControl[];
  /** 舞台容器高度，默认 420 */
  stageHeight?: number;
  tone?: "dark" | "light";
}

export type DemoCfg = Record<string, number | boolean | string>;

export type DemoLogKind = "info" | "event" | "warn";
export type DemoLog = (line: string, kind?: DemoLogKind) => void;

export interface DemoStageProps {
  cfg: DemoCfg;
  log: DemoLog;
  /** 舞台内部要改控件值（预选切换、重挂载开关）时用；等同于用户拖控件 */
  setCfg: (key: string, value: number | boolean | string) => void;
}

export interface DemoModule {
  meta: DemoMeta;
  default: ComponentType<DemoStageProps>;
}

/** 把控件初值摊平成 cfg */
export function initialCfg(meta: DemoMeta): DemoCfg {
  const cfg: DemoCfg = {};
  for (const c of meta.controls ?? []) cfg[c.key] = c.init;
  return cfg;
}
