import { defineConfig } from "vitest/config";
import type { UserConfig } from "vite";

export interface VitestOptions {
  /** 默认 node：插件内核/工具类单测；组件测试传 "jsdom" */
  environment?: "node" | "jsdom";
  setupFiles?: string[];
  include?: string[];
  coverage?: boolean;
}

export function createVitestConfig(options: VitestOptions = {}): UserConfig {
  const { environment = "node", setupFiles, include = ["test/**/*.test.{ts,tsx}"], coverage = false } = options;

  // 注意：不能写 coverage: undefined——显式的 undefined 会覆盖 vitest 内部默认值，
  // 导致 resolveConfig 阶段 resolved.coverage 为 undefined 而启动崩溃（vitest 2.1.9）。
  const test: UserConfig["test"] = {
    environment,
    include,
    globals: true,
  };
  if (setupFiles?.length) test.setupFiles = setupFiles;
  if (coverage) {
    test.coverage = {
      provider: "istanbul",
      reporter: ["text", "json-summary"],
      include: ["src/**"],
    };
  }

  return defineConfig({ test } as UserConfig);
}

export default createVitestConfig;
