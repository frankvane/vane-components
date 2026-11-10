/**
 * 逐插件示例页的元信息
 *
 * 与「场景卡」是两种视角，故意分开：
 *  - 场景（scenarios/）→ 组合视角：一个真实业务里几个插件怎么配合；
 *  - 示例（demos/）   → 单点视角：一个插件一页，只装它，参数可拖，随时看装配代码。
 *
 * 一页 = 一个 `NN-slug.tsx` 文件，导出 `meta` 与默认的舞台组件。
 * 舞台多数由 `_factory.tsx` 的 `makeStage("<Dir>Plugin")` 生成，
 * 少数需要特殊交互（Ref 方法台、键盘导航、事件日志）的页面自己写。
 */
import type { ComponentType } from "react";

export type DemoGroup = "basic" | "advanced" | "plugin";

export const GROUP_META: Record<DemoGroup, { label: string; hint: string }> = {
  basic: { label: "基础功能", hint: "Core 自身的 props" },
  advanced: { label: "高级功能", hint: "受控选择 / 键盘 / 空态" },
  plugin: { label: "插件功能", hint: "一插件一页" },
};

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
  /** 条件显示：返回 false 时不出现（值仍留在 cfg 里） */
  when?: (cfg: DemoCfg) => boolean;
  /** 这一项不影响版式（体检脚本据此放过它） */
  nonLayout?: boolean;
}

/** 装配代码里的一行 props；`when` 为假时该行不生成 */
export type DemoPropLine =
  | string
  | { text: string; when?: (cfg: DemoCfg) => boolean };

export interface DemoPlug {
  /** 插件工厂名，必须是 custom-plugins 的导出，如 createSearchPlugin */
  fn: string;
  /** 装配代码里传入的配置字面量（不含外层花括号），可用 `{{key}}` 引用控件当前值 */
  cfg?: string;
  /** 这一页为什么需要它 */
  why: string;
  /** 页内内联的自定义插件（不在 custom-plugins 里） */
  local?: boolean;
}

export interface DemoMeta {
  /** 与文件名去掉序号后一致，如 "search-plugin" */
  slug: string;
  title: string;
  group: DemoGroup;
  /** 关联的官方插件目录名（覆盖率与校验用） */
  plugin?: string;
  /** 内核能力页（不是插件）：如 keyboard、controlled */
  capability?: string;
  intro: string;
  why: string;
  plugs: DemoPlug[];
  /** 装配代码里 `<Library>` 上的 props，每行一条；支持 `{{key}}` 替换 */
  props: DemoPropLine[];
  note?: string;
  controls?: DemoControl[];
  stageHeight?: number;
  tone?: "light" | "dark";
}

export type DemoCfg = Record<string, number | boolean | string>;

export type DemoLogKind = "info" | "event" | "warn";
export type DemoLog = (line: string, kind?: DemoLogKind) => void;

export interface DemoStageProps {
  cfg: DemoCfg;
  log: DemoLog;
  /** 舞台内部要改控件值（翻页、清空筛选）时用；等同于用户拖控件 */
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
