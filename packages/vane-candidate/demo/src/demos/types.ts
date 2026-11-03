/**
 * 逐插件示例页的类型契约
 *
 * 与「场景卡」是两种视角，故意分开：
 *  - 场景（scenarios/）→ 组合视角：一个真实招聘流程里几个插件怎么配合；
 *  - 示例（demos/）   → 单点视角：一个插件一页，只装它，参数可拖，随时看装配代码。
 *
 * 一页 = 一个 `NN-slug.tsx` 文件，导出 `meta` 与默认的舞台组件。
 * 舞台多数由 `_factory` 的 makeStage 生成（传入插件目录名即可），
 * 少数需要特殊交互（受控数据、流转日志）的页面自己写。
 */
import type { ComponentType } from "react";

/** 侧栏分组。新增分组记得同时在 GROUP_META 补 label，否则导航会显示 key */
export type DemoGroup = "basic" | "badge" | "action" | "toolbar" | "pipeline";

export const GROUP_META: Record<DemoGroup, { label: string; hint: string }> = {
  basic: { label: "基础装配", hint: "内核 + 最小插件链" },
  badge: { label: "徽章与标记", hint: "卡片上的信息密度" },
  action: { label: "动作与浮层", hint: "卡片操作区与弹层" },
  toolbar: { label: "工具栏与视图", hint: "筛 / 搜 / 批量 / 视图 / 导出" },
  pipeline: { label: "管道与统计", hint: "transformData 与只读面板" },
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
}

/** 装配代码里的一行 props；`when` 为假时该行不生成 */
export type DemoPropLine =
  | string
  | { text: string; when?: (cfg: DemoCfg) => boolean };

export interface DemoPlug {
  /** 插件工厂名，必须是 custom-plugins 的导出（如 createScorePlugin） */
  fn: string;
  /** 装配代码里传入的配置字面量（不含外层花括号），可用 `{{key}}` 引用控件当前值 */
  cfg?: string;
  /** 这一页为什么需要它 */
  why: string;
}

export interface DemoMeta {
  /** 与文件名去掉序号后一致，如 "score" */
  slug: string;
  title: string;
  group: DemoGroup;
  /** 关联的官方插件目录名（插件工坊跳转与覆盖率用） */
  plugin?: string;
  /** 一句话：这页演示什么 */
  intro: string;
  /** 什么时候该用它（不是「它是什么」） */
  why: string;
  plugs: DemoPlug[];
  /** 装配代码里 `<Board>` 上的 props，每行一条；支持 `{{key}}` 替换 */
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
  /** 舞台内部要改控件值时用；等同于用户拖控件 */
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
