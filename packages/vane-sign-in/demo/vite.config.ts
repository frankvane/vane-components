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
 * 消费者视角别名：demo 代码里 `from "vane-sign-in/custom-plugins/XxxPlugin"` 直接指回 src，
 * 场景卡展示的源码可以原样复制到真实项目。**通配在前、裸名在后**，反了会 ENOENT。
 */
export default {
  ...demo,
  resolve: {
    ...demo.resolve,
    alias: [
      { find: /^@\//, replacement: path.resolve(root, "src") + "/" },
      {
        find: new RegExp(`^vane-sign-in\\/custom-plugins\\/(.+)$`),
        replacement: path.resolve(root, "src/custom-plugins/$1"),
      },
      {
        find: "vane-sign-in/custom-plugins",
        replacement: path.resolve(root, "src/custom-plugins/index.ts"),
      },
      { find: "vane-sign-in", replacement: path.resolve(root, "src/index.ts") },
    ],
  },
};
