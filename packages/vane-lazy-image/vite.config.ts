import { defineConfig } from "vite";
import { createLibConfig } from "@vane/build-config";

/**
 * VaneLazyImage 库构建配置（标准外壳，7 包一致）。
 * 入口由 build-config 自动发现（源码相对路径 == 发布子路径），新增 src/entries/*.ts
 * 或 src/custom-plugins/XxxPlugin/index.ts 后跑 `pnpm sync:exports` 即可。
 * 本包不 external core（B6 决策：core devDep 内联）。
 */
export default defineConfig({
  ...createLibConfig({ name: "VaneLazyImage" }),
  publicDir: false,
});
