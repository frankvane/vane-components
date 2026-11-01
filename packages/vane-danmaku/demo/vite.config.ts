import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDemoConfig } from "@vane/build-config";

const root = fileURLToPath(new URL("..", import.meta.url));
const demo = createDemoConfig({
  root,
  port: 3100,
  outDir: "demo-dist",
  // html 在 demo/ 子目录，dev 自动打开对应路径（根路径没有 index.html）
  open: "/demo/index.html",
});

/**
 * 消费者视角别名：demo 代码里 `from "vane-danmaku/custom-plugins/XxxPlugin"` 直接指回 src，
 * 场景卡展示的源码可以原样复制到真实项目。**通配在前、裸名在后**，反了会 ENOENT。
 */
export default {
  ...demo,
  /**
   * 样本视频在 `demo/public/samples/`，不是包根的 `public/`。
   * `createDemoConfig` 的 root 是**包根**，而 Vite 的 `publicDir` 默认相对 root →
   * 会去读 `packages/vane-danmaku/public`（不存在），导致 dev 下 `/samples/x.mp4` 404、
   * 构建时也不会把样本平铺到产物根。显式指到 `demo/public` 后 dev 与构建都能命中。
   */
  publicDir: path.resolve(root, "demo/public"),
  resolve: {
    ...demo.resolve,
    alias: [
      { find: /^@\//, replacement: path.resolve(root, "src") + "/" },
      {
        find: new RegExp(`^vane-danmaku\\/custom-plugins\\/(.+)$`),
        replacement: path.resolve(root, "src/custom-plugins/$1"),
      },
      // 裸桶别名必须排在通用 `vane-danmaku` 之前：否则 `vane-danmaku/custom-plugins`
      // 会被通用别名兜底成 `src/index.ts/custom-plugins` 而 ENOENT（data/plugins.ts 与
      // 场景文件都从桶导入全部工厂）。对齐 vane-profile / vane-sign-in 的写法。
      {
        find: "vane-danmaku/custom-plugins",
        replacement: path.resolve(root, "src/custom-plugins/index.ts"),
      },
      { find: "vane-danmaku", replacement: path.resolve(root, "src/index.ts") },
    ],
  },
};
