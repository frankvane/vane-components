import { defineConfig } from "vite";
import { createLibConfig } from "@vane/build-config";

/**
 * vane-card 库构建配置。
 * 入口由 build-config 自动发现（源码相对路径 == 发布子路径），
 * 新增 src/entries/xxx.ts 或 src/custom-plugins/XxxPlugin/index.ts 后
 * 跑 `pnpm sync:exports` 即可，不需要改这里。
 * publicDir: false —— 旧的 1.0.x 把 public/404.jpg、vite.svg 打进了包（381KB 里有 40KB 是演示图），
 * 新架构关闭它，且 demo 资源一律走 demo/ 目录，绝不进 dist。
 */
export default defineConfig({
  ...createLibConfig({ name: "VaneCard", minify: true }),
  publicDir: false,
});
