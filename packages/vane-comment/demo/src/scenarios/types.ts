/**
 * 场景卡元信息
 *
 * 一份场景 = 一个 `NN-xxx.tsx` 文件，同时导出 `meta` 与默认组件。
 * 页面右侧的「最小装配版」由 `meta` 现场生成（`minimal.ts`），
 * 「完整版」直接 `?raw` 读同一个文件 —— 同源，杜绝「文档写了没实现」的漂移。
 */
import type { ComponentType } from "react";

export interface ScenarioPlug {
  /** 插件工厂名，必须是 custom-plugins 的导出，如 createPriceLinkPlugin */
  fn: string;
  /** 最小装配版里传入的配置字面量（不含外层括号），无参则省略 */
  cfg?: string;
  /** 为什么这里需要它 —— 场景卡右侧逐条展示 */
  why: string;
  /**
   * 场景内联定义的自定义插件（不在 custom-plugins 里）。
   * 用来演示「自己的插件怎么写」，校验脚本按同一套规则双向核对源码。
   */
  local?: boolean;
}

export interface ScenarioMeta {
  /** 与文件名一致，如 "full-panel" */
  id: string;
  title: string;
  /** 分类，用于顶部分类筛选 */
  group: string;
  /** 对标站点 */
  ref: { label: string; url: string };
  /** 这个场景真正要解决的痛点（一行） */
  pain: string;
  /** 装配的插件，顺序 = 阅读顺序（实际执行顺序由 priority 决定） */
  plugs: ScenarioPlug[];
  /** 最小装配版里 Sku 组件的 props，每行一条，如 `defaultSelection={{ 颜色: "red" }}` */
  props: string[];
  /** 坑位提醒 / 与旧版的差别 */
  note?: string;
  /** 舞台底色 */
  tone?: "dark" | "light";
}

export interface ScenarioModule {
  meta: ScenarioMeta;
  default: ComponentType;
}
