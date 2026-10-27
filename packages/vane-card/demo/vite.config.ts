import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDemoConfig } from "@vane/build-config";

const root = fileURLToPath(new URL("..", import.meta.url));
const demo = createDemoConfig({
  root,
  port: 3301,
  outDir: "demo-dist",
  open: "/demo/index.html",
});

/**
 * 让 demo 里的代码写成「消费者视角」：`from "vane-card"` /
 * `from "vane-card/custom-plugins/SKUPlugin"` / `from "vane-card/compound"`。
 *
 * 包名指回源码，场景卡右侧展示的源码可以原样复制到真实项目；
 * 发布产物仍走 dist（exports 与这里一一对应，见 `pnpm sync:exports`）。
 */
export default {
  ...demo,
  build: {
    ...demo.build,
    rollupOptions: {
      ...demo.build?.rollupOptions,
      // 两个页面：正常（引样式）与对照（不引样式），C4.3 的验收需要这一组对照
      input: {
        main: path.resolve(root, "demo/index.html"),
        "no-style": path.resolve(root, "demo/no-style.html"),
      },
    },
  },
  resolve: {
    ...demo.resolve,
    alias: [
      { find: /^@\//, replacement: path.resolve(root, "src") + "/" },
      {
        find: /^vane-card\/custom-plugins\/(.+)$/,
        replacement: path.resolve(root, "src/custom-plugins/$1/index.ts"),
      },
      { find: "vane-card/custom-plugins", replacement: path.resolve(root, "src/custom-plugins/index.ts") },
      { find: /^vane-card\/presets\/(.+)$/, replacement: path.resolve(root, "src/presets/$1/index.ts") },
      { find: "vane-card/compound", replacement: path.resolve(root, "src/compound.ts") },
      { find: "vane-card/plugins", replacement: path.resolve(root, "src/plugins.ts") },
      { find: "vane-card/core", replacement: path.resolve(root, "src/core.ts") },
      { find: "vane-card", replacement: path.resolve(root, "src/index.ts") },
    ],
  },
};
