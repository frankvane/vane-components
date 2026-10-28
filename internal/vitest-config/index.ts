import { defineConfig } from "vitest/config";
import type { UserConfig } from "vite";

export interface VitestOptions {
  /** 默认 node：插件内核/工具类单测；组件测试传 "jsdom" / "happy-dom" */
  environment?: "node" | "jsdom" | "happy-dom";
  // 按文件匹配覆盖 environment，如 [["所有 tsx 测试", "happy-dom"]]
  // （注意：块注释里不要写 **/ 开头的 glob，*/ 序列会提前闭合注释）
  environmentMatchGlobs?: [string, "node" | "jsdom" | "happy-dom"][];
  setupFiles?: string[];
  include?: string[];
  coverage?: boolean;
}

export function createVitestConfig(options: VitestOptions = {}): UserConfig {
  const {
    environment = "node",
    environmentMatchGlobs,
    setupFiles,
    include = ["test/**/*.test.{ts,tsx}"],
    coverage = false,
  } = options;

  // 注意：不能写 coverage: undefined——显式的 undefined 会覆盖 vitest 内部默认值，
  // 导致 resolveConfig 阶段 resolved.coverage 为 undefined 而启动崩溃（vitest 2.1.9）。
  const test: UserConfig["test"] = {
    environment,
    include,
    globals: true,
    // Windows 下多 worker 各自建 happy-dom 临时目录会 EPERM；关掉文件级并行，
    // 单 worker 顺序跑测试文件，规避该竞态（vane 工程硬约束）。
    fileParallelism: false,
  };
  if (environmentMatchGlobs?.length) test.environmentMatchGlobs = environmentMatchGlobs;
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
