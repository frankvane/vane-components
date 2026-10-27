/**
 * 代码高亮主题 —— **两套**，不是 41 套。
 *
 * ## 为什么砍到两套
 *
 * 迁移前 `themes.ts` 是 41 条静态 `import`（a11y-dark、atom-dark、cb、coy、
 * duotone-*、gruvbox-*、synthwave84、z-touch……），全都挂在 `THEME_MAP` 上。
 * 因为每一条都是**静态子路径 import**，而 external 当时只写了包名
 * （`"react-syntax-highlighter"` 匹配不到 `"…/styles/prism/atom-dark"`），
 * 于是 41 套主题全被内联 —— 实测单个主题桶就拖出 792KB chunk。
 *
 * 即使 external 修好了，41 套主题仍然是消费方的负担：真正会被用到的主题
 * 不超过两三个，而每多一套就多一次模块解析与一个无法 tree-shake 的对象。
 * 所以留 **One Light / VS Code Dark+** 两套，加一个 `auto` 跟随系统
 * （`prefers-color-scheme`），覆盖「亮色 / 暗色 / 跟随系统」三种真实需求。
 *
 * 想要别的主题：`style` 直接传 `react-syntax-highlighter` 的任意主题对象，
 * 或者用自己的组件替换 `render`。这是逃生口，不是配置项。
 */

import type { ComponentType, CSSProperties } from "react";

export type CodeTheme = "auto" | "light" | "dark";
export type ResolvedCodeTheme = "light" | "dark";

export const AVAILABLE_THEMES: ReadonlyArray<{
  value: CodeTheme;
  label: string;
}> = [
  { value: "auto", label: "跟随系统" },
  { value: "light", label: "One Light" },
  { value: "dark", label: "VS Code Dark+" },
];

/** 主题对象是 `{ "选择器": CSSProperties }` 的形状 */
export type SyntaxTheme = Record<string, CSSProperties>;

export interface CodeDependencies {
  /** `react-syntax-highlighter` 的 Prism 版（含全部 prismjs 语言） */
  Prism: ComponentType<Record<string, unknown>>;
  light: SyntaxTheme;
  dark: SyntaxTheme;
}

/**
 * 三个 `import()` 都是**模块级常量**，引用稳定 —— `useDynamicModule` 的 effect
 * 靠引用判等，每次渲染新建箭头函数就会反复 import + 反复 setState。
 *
 * 主题子路径没有类型声明（`@types/react-syntax-highlighter` 只覆盖根入口），
 * 声明在 `src/types/react-syntax-highlighter-themes.d.ts`。
 */
const loadPrism = () => import("react-syntax-highlighter");
const loadLightTheme = () =>
  import("react-syntax-highlighter/dist/esm/styles/prism/one-light");
const loadDarkTheme = () =>
  import("react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus");

/**
 * 一次性把「组件 + 两套主题」都拉回来。
 *
 * 分开加载没有意义：没有主题的高亮器渲染出来是白底黑字，用户会以为是坏了。
 * 三者都在同一个 optional peer 里，缺就一起缺，`MissingDependency` 面板只说一次。
 */
export async function loadCodeDependencies(): Promise<CodeDependencies> {
  const [prismMod, lightMod, darkMod] = await Promise.all([
    loadPrism(),
    loadLightTheme(),
    loadDarkTheme(),
  ]);

  return {
    Prism: prismMod.Prism as unknown as CodeDependencies["Prism"],
    light: lightMod.default,
    dark: darkMod.default,
  };
}

/**
 * `auto` 在渲染时解析成实际的亮 / 暗。
 *
 * 刻意**不监听** `prefers-color-scheme` 的变化：监听要给每个实例挂
 * `matchMedia` 的 listener（并在卸载时摘掉），而代码预览通常是一次性查看，
 * 系统主题在打开面板的两秒内变的概率极低。刷新页面/重新打开即可。
 */
export function resolveTheme(theme: CodeTheme): ResolvedCodeTheme {
  if (theme !== "auto") return theme;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function pickTheme(
  deps: CodeDependencies,
  theme: CodeTheme
): SyntaxTheme {
  return resolveTheme(theme) === "dark" ? deps.dark : deps.light;
}
