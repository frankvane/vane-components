import { defineConfig } from "vitest/config";
import { createVitestConfig } from "@vane/vitest-config";

// happy-dom：家族统一（vane-lazy-image / vane-profile / vane-sku 同）。
// fileParallelism 已在共享配置里关闭（Windows 下多 worker 建 happy-dom 临时目录会 EPERM）。
export default defineConfig(createVitestConfig({ environment: "happy-dom" }));
