import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { createLibConfig } from "@vane/build-config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  ...createLibConfig({
    name: "VaneProfile",
    root,
    formats: ["es"],
    // 内核 peer 外部化（B1-A）：不把 vane-plugin-core 打进 dist，消费方提供一份共享内核
    external: [/^vane-plugin-core(\/|$)/],
  }),
  // 演示资产一律走 demo/ 目录，绝不进 dist（与 vane-card 一致）
  publicDir: false,
});
