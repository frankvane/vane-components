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

  return defineConfig({
    test: {
      environment,
      include,
      setupFiles,
      globals: true,
      coverage: coverage
        ? { provider: "istanbul", reporter: ["text", "json-summary"], include: ["src/**"] }
        : undefined,
    },
  } as UserConfig);
}

export default createVitestConfig;
