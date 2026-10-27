/**
 * 主题子路径的类型声明。
 *
 * `react-syntax-highlighter` 的 `dist/esm/styles/prism/*.js` 没有 `.d.ts`，
 * 而 `@types/react-syntax-highlighter` 只在根 `index.d.ts` 里声明了
 * `Prism` 等组件与 `styles/prism` 的具名导出，**没有**为每个子路径单独声明。
 * 只给用到的那两个加 shim —— 不为 41 套主题写 41 条声明（那 41 套已经删了）。
 *
 * 形状：`{ "code[class*=language-]": { … }, "comment": { … }, … }`，
 * 也就是 `Record<string, CSSProperties>`。
 */

declare module "react-syntax-highlighter/dist/esm/styles/prism/one-light" {
  import type { CSSProperties } from "react";
  const style: Record<string, CSSProperties>;
  export default style;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus" {
  import type { CSSProperties } from "react";
  const style: Record<string, CSSProperties>;
  export default style;
}
