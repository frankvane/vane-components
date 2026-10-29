/**
 * 逐项示例（registry 范式）的元信息
 *
 * 与 sku 的 demos/types.ts 同构，但分组按 lazy-image 的展示结构划分：
 *   - combo     组合示例：多插件协同的真实业务组合（demo/src/combos）
 *   - advanced  高级功能：底层能力与引擎设施（demo/src/advanced）
 *   - scenario  场景示例：虚拟滚动等长列表组合（demo/src/scenarios）
 *
 * 每个示例单位 = 一条 registry.ts 里的 DemoEntry，带 meta + 懒加载 Stage + 源码。
 * 既驱动二级导航（组合 / 高级），也驱动 /demo/:slug 单页视图。
 */
import type { ComponentType } from "react";

export type DemoGroup = "combo" | "advanced" | "scenario";

export const GROUP_META: Record<DemoGroup, { label: string; hint: string }> = {
  combo: { label: "组合示例", hint: "多插件协同的真实业务组合" },
  advanced: { label: "高级功能", hint: "底层能力与引擎设施" },
  scenario: { label: "场景示例", hint: "虚拟滚动等长列表组合" },
};

/** combo 专属：组合构成（本组合叠加了哪些插件 + 职责） */
export interface DemoComboPlug {
  name: string;
  role: string;
}

export interface DemoMeta {
  /** 与导航 / 路由一致，如 "error-resilience" */
  slug: string;
  title: string;
  group: DemoGroup;
  /** 一句话描述（首页卡片 / 索引网格复用） */
  description?: string;
  /** combo 专属：组合构成说明，交给 ComboPanel 渲染 */
  plugins?: DemoComboPlug[];
  /** combo 专属：装配源码，交给 ComboPanel 渲染 */
  code?: string;
}

/** 舞台组件：combos/advanced/scenario 的 demo 组件目前都不接收 props */
export type DemoStageProps = Record<string, unknown>;

export type DemoStage = ComponentType<DemoStageProps>;

export interface DemoEntry {
  meta: DemoMeta;
  Stage: DemoStage;
  /** 文件名，如 "ComboCacheDemo.tsx" */
  file: string;
  /** 原始源码（?raw 注入），用于单页视图的代码面板 */
  source: string;
}
