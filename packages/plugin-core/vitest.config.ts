import { defineConfig } from "vitest/config";
import { createVitestConfig } from "@vane/vitest-config";

// 默认 node（内核纯逻辑测试）；React 装配层测试（*.test.tsx）需要 DOM。
export default defineConfig(
  createVitestConfig({
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "happy-dom"]],
  })
);
