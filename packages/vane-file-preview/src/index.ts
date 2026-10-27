/**
 * vane-file-preview 根入口。
 *
 * 只聚合「内核 + 装配器 + 契约类型 + 6 个零重依赖的插件」。
 * 刻意**不**桶导出那 11 个重依赖插件（ADR-16 D3）：
 * 它们各自有子路径（`vane-file-preview/custom-plugins/X`），谁要谁引，
 * 顺带谁要谁装对应的 optional peer。
 *
 * 迁移前这里是 `export * from "./custom-plugins"` —— 一个桶文件把 mammoth 整库
 * 和 41 套 prism 主题全带进包，单文件 196.33KB gzip。根入口不引桶，是那个坑的正面修法。
 */

export * from "./core";

// P3 会把 6 个零重依赖插件聚合到 ./plugins 并在此再导出：
//   export * from "./plugins";
// 它们全用原生标签（img / iframe / video / audio），装包不增加任何依赖。
