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
 * 让 demo 里的代码写成「消费者视角」：`from "vane-comment"` / `from "vane-comment/custom-plugins/LikePlugin"`。
 * 这里把包名指回源码，好处是场景卡右侧展示的源码可以**原样复制**到真实项目里，
 * 不用把 import 路径改写一遍。发布产物仍走 dist（构建时不受影响）。
 */
export default {
  ...demo,
  resolve: {
    ...demo.resolve,
    alias: [
      // demo 内部用的 @ → src（createDemoConfig 原本带的一条，覆盖 alias 时要保留）
      { find: /^@\//, replacement: path.resolve(root, "src") + "/" },
      // 子路径优先于裸包名：vane-comment/<x> → src/<x>（preset / 入口等都走这里）
      {
        find: /^vane-comment\/custom-plugins\/(.+)$/,
        replacement: path.resolve(root, "src/custom-plugins/$1"),
      },
      {
        find: /^vane-comment\/(.+)$/,
        replacement: path.resolve(root, "src/$1"),
      },
      // 裸包名 → 根入口
      { find: /^vane-comment$/, replacement: path.resolve(root, "src/index.ts") },
    ],
  },
};
