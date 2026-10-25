import { defineConfig } from "vite";
import { createLibConfig } from "@vane/build-config";

/**
 * vane-lazy-image 库构建配置。
 * 入口由 build-config 自动发现（源码相对路径 == 发布子路径），
 * 新增 src/entries/xxx/index.ts 或 src/custom-plugins/XxxPlugin/index.ts
 * 后跑 `pnpm sync:exports` 即可，不需要改这里。
 */
export default defineConfig(
  createLibConfig({
    name: "VaneLazyImage",
    minify: true,
  })
);
