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
 * 消费者视角别名：demo 代码里 `from "vane-resume/custom-plugins/XxxPlugin"` 直接指回 src，
 * 场景卡展示的源码可以原样复制到真实项目。**通配在前、裸名在后**，反了会 ENOENT。
 */
export default {
  ...demo,
  resolve: {
    ...demo.resolve,
    alias: [
      { find: /^@\//, replacement: path.resolve(root, "src") + "/" },
      // qrcode 是 CJS 依赖，vite 构建时会把动态 import("qrcode") 当成裸说明符外置，
      // 运行时浏览器无法解析 → "Failed to resolve module specifier 'qrcode'"。
      // 直接指到具体入口文件，强制 vite 把它打进 bundle。
      {
        find: /^qrcode$/,
        replacement: path.resolve(root, "node_modules/qrcode/lib/browser.js"),
      },
      // 裸桶别名（vane-resume/custom-plugins 指向桶 index），必须在裸 vane-resume 之前
      {
        find: new RegExp(`^vane-resume\\/custom-plugins$`),
        replacement: path.resolve(root, "src/custom-plugins/index.ts"),
      },
      {
        find: new RegExp(`^vane-resume\\/custom-plugins\\/(.+)$`),
        replacement: path.resolve(root, "src/custom-plugins/$1"),
      },
      { find: "vane-resume", replacement: path.resolve(root, "src/index.ts") },
    ],
  },
};
