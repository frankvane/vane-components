/**
 * 版式（layout）元信息
 *
 * 版式和「插件示例」「场景」是三个不同的东西，别混：
 *   插件示例  一个插件一页，参数可拖 —— 回答「这个插件做什么」
 *   场景      几个插件装进一个真实版式 —— 回答「真实业务怎么组合」
 *   版式      同一份数据摆成九种形状 —— 回答「卡片怎么排」
 *
 * 版式的关键从来不是插件，是 **children 的结构**：谁在上谁在下、图占多少、
 * 文字区留多少 padding、什么时候让图通栏。所以每个版式一个文件，页面上的
 * 源码用 `?raw` 读同一份，读者抄走就能改。
 */
import type { ComponentType } from "react";

export interface LayoutMeta {
  /** 与文件名去掉序号后一致，如 "vertical" */
  id: string;
  title: string;
  /** 英文短名，用来做视觉标识 */
  en: string;
  /** 适用场景，一句话 */
  use: string;
  /** 舞台卡片宽度（版式本身就是宽高比的差别，这个值必须准） */
  width: number;
  /** 结构要点：3–5 条，讲「为什么这样排」而不是「这里有什么」 */
  structure: string[];
  /** 这个版式用到的插件（空数组 = 纯 children） */
  plugins: string[];
  /** 舞台底色，默认浅色样纸 */
  tone?: "light" | "dark";
}

export interface LayoutModule {
  meta: LayoutMeta;
  default: ComponentType;
}
