import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDemoConfig } from "@vane/build-config";

const root = fileURLToPath(new URL("..", import.meta.url));

const demo = createDemoConfig({
  root,
  port: 3302,
  outDir: "demo-dist",
  open: "/demo/index.html",
});

/**
 * demo 里的代码一律写成「消费者视角」：`from "vane-file-preview"` /
 * `from "vane-file-preview/core"` / `from "vane-file-preview/custom-plugins/XxxPreviewPlugin"`。
 *
 * 包名指回 `src/`，所以：
 *  - 页面右侧展示的源码可以原样复制到真实项目；
 *  - **构建 demo 不再需要先有 dist**（迁移前 13 个页面 import "vane-file-preview"
 *    靠 Node 包自引用解析到 `dist/index.es.js`，删掉 dist 就构不出来 —— 那是
 *    「demo 验的是构建产物」的根源，比 vane-card 那次更隐蔽，连 npm 旧包都不是）。
 *
 * 发布产物仍走 dist（exports 与这里一一对应，见 `pnpm sync:exports`）。
 */
export default {
  ...demo,
  resolve: {
    ...demo.resolve,
    alias: [
      { find: /^@\//, replacement: path.resolve(root, "src") + "/" },
      {
        find: /^vane-file-preview\/custom-plugins\/(.+)$/,
        replacement: path.resolve(root, "src/custom-plugins/$1/index.ts"),
      },
      {
        find: "vane-file-preview/custom-plugins",
        replacement: path.resolve(root, "src/custom-plugins/index.ts"),
      },
      { find: "vane-file-preview/plugins", replacement: path.resolve(root, "src/plugins.ts") },
      { find: "vane-file-preview/core", replacement: path.resolve(root, "src/core.ts") },
      { find: "vane-file-preview", replacement: path.resolve(root, "src/index.ts") },
    ],
  },
};
