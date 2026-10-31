/**
 * 逐项示例的类型契约（模板版，够用即止）
 *
 * 示例页与外壳之间只靠 `meta` 通信：外壳拿 slug 生成 `/demo/:slug` 路由，
 * 拿 title/group 生成侧栏导航与编号。页面内部怎么写外壳不管。
 */
import type { ComponentType } from "react";

/** 侧栏分组。新增分组记得同时在 GROUP_META 补 label，否则导航会显示 key */
export type DemoGroup = "basic" | "advanced" | "plugin";

export interface DemoMeta {
  /** 路由片段，与文件名去序号一致（01-basic.tsx → "basic"） */
  slug: string;
  title: string;
  group: DemoGroup;
  /** 这页在演示什么，一句话 */
  intro?: string;
}

/** 页内控件的值。模板只给空壳，需要控件时按 key 自行扩展 */
export type DemoCfg = Record<string, boolean | number | string>;

export interface DemoStageProps {
  cfg?: DemoCfg;
}

/** `import.meta.glob` 拿到的模块形状 */
export interface DemoModule {
  meta: DemoMeta;
  default: ComponentType<DemoStageProps>;
}

export const GROUP_META: Record<DemoGroup, { label: string }> = {
  basic: { label: "基础用法" },
  advanced: { label: "进阶用法" },
  plugin: { label: "插件示例" },
};
