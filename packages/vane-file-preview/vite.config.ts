import { defineConfig } from "vite";
import { createLibConfig } from "@vane/build-config";

/**
 * VaneFilePreview 库构建配置（标准外壳，7 包一致）。
 * 入口由 build-config 自动发现（源码相对路径 == 发布子路径），新增 src/entries/*.ts
 * 或 src/custom-plugins/XxxPlugin/index.ts 后跑 `pnpm sync:exports` 即可。
 * 差异仅 external：重型预览依赖不内联，由消费者按需安装。
 */
const HEAVY_DEPENDENCIES = [
  /^jszip$/,
  /^xlsx$/,
  /^docx-preview$/,
  /^mammoth(\/|$)/,
  /^@uiw\/react-json-view(\/|$)/,
  /^react-xml-viewer$/,
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
    external: HEAVY_DEPENDENCIES,
  }),
  publicDir: false,
});
