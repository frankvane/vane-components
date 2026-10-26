import { defineConfig } from "vitest/config";
import { createVitestConfig } from "@vane/vitest-config";

/**
 * happy-dom 每个 worker 都会写自己的临时目录，多文件并行时在 Windows
 * （尤其是被安全软件/容器托管的环境）会撞 EPERM 并让某个测试文件静默不跑。
 * 组件测试量不大，直接串行跑，换来稳定可复现的结果。
 */
export default defineConfig({
  ...createVitestConfig({ environment: "happy-dom" }),
  test: {
    ...createVitestConfig({ environment: "happy-dom" }).test,
    fileParallelism: false,
  },
});
