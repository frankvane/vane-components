/**
 * 场景卡元信息
 *
 * 一份场景 = 一个 `NN-xxx.tsx` 文件，同时导出 `meta` 与默认组件。
 * 右侧「最小装配版」由 `meta` 现场生成（`minimal.ts`），「完整版」用 `?raw`
 * 读同一个文件 —— 同源，杜绝「文档写了没实现」的漂移。
 *
 * 与逐项示例的分工：场景是**组合视角**（几个插件一起用在一个真实版式里），
 * 示例是**单点视角**（一个插件一页，参数可拖）。
 */
import type { ComponentType } from "react";

export interface ScenarioPlug {
  /** 插件工厂名，必须是 custom-plugins 的导出 */
  fn: string;
  /** 最小装配版里传入的配置字面量（不含外层括号），无参则省略 */
  cfg?: string;
  /** 为什么这个场景需要它 */
  why: string;
  /** 场景内联写的插件（不在官方 22 个里） */
  local?: boolean;
}

export interface ScenarioMeta {
  /** 与文件名去掉序号后一致，如 "sku-detail" */
  id: string;
  title: string;
  /** 分类：列表 / 商详 / 交易 / 内容 —— 回答「这是链路的哪一段」 */
  group: string;
  /**
   * 行业 —— 回答「这是哪种平台」。
   *
   * 同一件商品在不同行业里，卡的形状是不一样的：生鲜要「称重 + 时效」，
   * 3C 要「参数 + 以旧换新」，票务要「场次 + 票档」。只给一套通用电商示例，
   * 读者看不出这些差别，就会把「服饰的 SKU 写法」套到票务上。
   */
  industry: string;
  /** 对标形态 */
  ref: { label: string; url: string };
  /** 这个场景真正要解决的痛点（一行） */
  pain: string;
  /** 装配的插件，顺序 = 阅读顺序（执行顺序由 priority 决定） */
  plugs: ScenarioPlug[];
  /** 最小装配版里 <Card> 的 props，每行一条 */
  props: string[];
  note?: string;
  /** 舞台底色 */
  tone?: "dark" | "light";
  /** 卡片宽度，默认 380 */
  cardWidth?: number;
}

export interface ScenarioModule {
  meta: ScenarioMeta;
  default: ComponentType;
}
