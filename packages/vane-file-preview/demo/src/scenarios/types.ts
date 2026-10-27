/**
 * 场景卡的契约
 *
 * 与「逐项示例」的区别：示例证明「一个插件能干什么」，场景证明「它们在一个真
 * 版式里能一起干什么」。所以场景自带布局（列表 / 左右对比 / 网格 / 表头映射），
 * 预览器只是版式里的一格。
 */
import type React from "react";

export interface ScenarioMeta {
  /** D01…D06，展示用编号 */
  code: string;
  title: string;
  /** 这段版式在真实产品里要解决的痛点 */
  pain: string;
  /** 这一格里装了哪些插件、各自负责什么 */
  plugs: Array<{ fn: string; why: string }>;
  /** 坑位 / 边界，可选 */
  note?: string;
}

export interface ScenarioModule {
  meta: ScenarioMeta;
  default: React.ComponentType;
}
