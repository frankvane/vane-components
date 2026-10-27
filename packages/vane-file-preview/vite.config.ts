import { defineConfig } from "vite";
import { createLibConfig } from "@vane/build-config";

/**
 * vane-file-preview 库构建配置。
 *
 * 入口由 build-config 自动发现（源码路径 == 发布子路径）：
 *   src/index.ts                    → "."          根入口（Core + 装配 + 6 个轻量插件）
 *   src/core.ts                     → "./core"     只要 Core 与类型
 *   src/plugins.ts                  → "./plugins"  6 个零重依赖插件
 *   src/custom-plugins/<Name>/index.tsx → "./custom-plugins/<Name>"
 *
 * publicDir: false —— 归档仓的 public/ 里有 37 个真实样本文件（15MB），
 * 那是 demo 的素材，绝不能进包。demo 资源走 demo/public/。
 *
 * ## 为什么 external 用正则而不是包名
 *
 * 迁移前的 archive 包只 external 了 react/react-dom，结果 jszip + xlsx +
 * mammoth + docx-preview + 41 套 prism 主题全被内联，单文件 985.97 kB。
 * 更隐蔽的是**写包名没用**：`"mammoth"` 匹配不到 `"mammoth/mammoth.browser"`，
 * `"@uiw/react-json-view"` 匹配不到 `"@uiw/react-json-view/light"`——
 * rollup 不报错，只是把整库塞进 chunk，体积翻倍而构建日志全绿。
 *
 * 所以这里全部写 `/^pkg(\/|$)/` 形式的正则；闸门是 `dist-scan` 断言
 * （见 test/dist-external.test.ts）：dist 里不得出现这些库的特征串。
 */
const HEAVY_DEPENDENCIES = [
  // 文档 / 表格 / 压缩包：都是「几十 KB 到几 MB」的解析器
  /^jszip$/,
  /^xlsx$/,
  /^docx-preview$/,
  /^mammoth(\/|$)/,
  // 富展示组件
  /^@uiw\/react-json-view(\/|$)/,
  /^react-xml-viewer$/,
  // C 批还会用到（提前写在这里，迁入时不用再改构建配置）
  /^react-syntax-highlighter(\/|$)/,
  /^react-reader$/,
  /^papaparse$/,
  /^react-markdown$/,
  /^remark-/,
  /^rehype-/,
];

export default defineConfig({
  ...createLibConfig({
    name: "VaneFilePreview",
    minify: true,
    external: HEAVY_DEPENDENCIES,
  }),
  publicDir: false,
});
