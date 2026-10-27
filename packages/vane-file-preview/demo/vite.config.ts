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
  /**
   * 样本文件在 `demo/public/`，不是包根的 `public/`。
   *
   * `createDemoConfig` 的 root 是**包根**（因为 entry 写的是 `demo/index.html`），
   * 而 Vite 的 `publicDir` 默认相对 root → 会去读 `packages/vane-file-preview/public`，
   * 那个目录不存在（库包不该有 public）。不显式指过来的话，`/samples/*.pdf`
   * 全是 404 —— 而且 PDF 的 iframe 拿到 404 页也照样撑满，肉眼很不容易发现。
   */
  publicDir: path.resolve(root, "demo/public"),
  resolve: {
    ...demo.resolve,
    alias: [
      { find: /^@\//, replacement: path.resolve(root, "src") + "/" },
      {
        find: /^vane-file-preview\/custom-plugins\/(.+)$/,
        // 插件入口是 .tsx（每个插件都渲染 React 节点）。
        // 写死扩展名而不是靠目录 index 探测：`$1` 里若带斜杠（未来出现
        // custom-plugins/X/sub）时，目录探测会绕过单文件入口，两种行为不一样。
        replacement: path.resolve(root, "src/custom-plugins/$1/index.tsx"),
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
