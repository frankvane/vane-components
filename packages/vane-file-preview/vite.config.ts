import { defineConfig } from "vite";
import { createLibConfig } from "@vane/build-config";

/**
 * vane-file-preview 库构建配置。
 *
 * 入口由 build-config 自动发现（源码路径 == 发布子路径）：
 *   src/index.ts                    → "."          根入口（Core + 装配 + 6 个轻量插件）
 *   src/core.ts                     → "./core"     只要 Core 与类型
 *   src/plugins.ts                  → "./plugins"  6 个零重依赖插件
 *   src/custom-plugins/<Name>/index.ts → "./custom-plugins/<Name>"
 *
 * publicDir: false —— 归档仓的 public/ 里有 37 个真实样本文件（15MB），
 * 那是 demo 的素材，绝不能进包。demo 资源走 demo/public/。
 */
export default defineConfig({
  ...createLibConfig({ name: "VaneFilePreview", minify: true }),
  publicDir: false,
});
