/**
 * 样式隔离辅助（公共 toolkit）。
 *
 * 用途：让插件正文自己成为独立层叠上下文与包含块，避免
 *  - 被预览文件的样式泄漏出去改坏宿主页面；
 *  - 宿主页面的 `line-height` / `box-sizing` 之类渗进来把预览版面挤歪。
 *
 * 迁移前这个文件**没有 import React** 却写着 `React.CSSProperties` —— 靠
 * `vite-env.d.ts` 的隐式全局 React 类型救活（运行时被 esbuild 抹掉、构建不报错），
 * 但消费方 `tsc` 对着产出的 `.d.ts` 时拿不到该全局，直接 TS2742
 * 「推断的类型无法命名」。P3 修法就两件事：显式 `import type React` + 三个函数
 * 都标注 `React.CSSProperties` 返回类型，不再依赖推断。
 *
 * `isolation` / `contain` 用 `as const` 而不是宽泛的 string：`React.CSSProperties`
 * 对这两个属性的字面量联合有要求，赋 string 会报 TS2322。
 */

import type React from "react";

export function createIsolatedContainer(
  baseStyles: React.CSSProperties = {}
): React.CSSProperties {
  return {
    height: "100%",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    // 新建层叠上下文，隔离 mix-blend-mode / z-index 的相互影响
    isolation: "isolate",
    // 布局与样式影响不外溢（paint 不在此列：裁切由 overflow 负责）
    contain: "layout style",
    ...baseStyles,
  };
}

export function createIsolatedContent(
  baseStyles: React.CSSProperties = {}
): React.CSSProperties {
  return {
    position: "relative",
    zIndex: 1,
    ...baseStyles,
  };
}

export function createIsolatedOverlay(
  baseStyles: React.CSSProperties = {}
): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    // 默认不接收鼠标事件：叠加层多数是提示/水印，不该吃掉正文的交互
    pointerEvents: "none",
    ...baseStyles,
  };
}
