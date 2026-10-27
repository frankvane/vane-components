import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDemoConfig } from "@vane/build-config";

const root = fileURLToPath(new URL("..", import.meta.url));
const demo = createDemoConfig({
  root,
  port: 3300,
  outDir: "demo-dist",
  open: "/demo/index.html",
});

/**
 * 让 demo 里的代码写成「消费者视角」：`from "vane-card"` / `from "vane-card/custom-plugins/BadgePlugin"`。
 * 包名指回源码，场景卡右侧展示的源码可以原样复制到真实项目；发布产物仍走 dist。
 */
export default {
  ...demo,
  resolve: {
    ...demo.resolve,
    alias: [
      { find: /^@\//, replacement: path.resolve(root, "src") + "/" },
      {
        find: /^vane-card\/custom-plugins\/(.+)$/,
        replacement: path.resolve(root, "src/components/CardPlugin/custom-plugins/$1"),
      },
      {
        find: "vane-card/custom-plugins",
        replacement: path.resolve(root, "src/components/CardPlugin/custom-plugins/index.ts"),
      },
      { find: "vane-card/compound", replacement: path.resolve(root, "src/components/CardPlugin/compound/index.ts") },
      { find: "vane-card/plugins", replacement: path.resolve(root, "src/entries/plugins.ts") },
      { find: "vane-card/core", replacement: path.resolve(root, "src/entries/core.ts") },
      { find: "vane-card", replacement: path.resolve(root, "src/index.ts") },
    ],
  },
};
