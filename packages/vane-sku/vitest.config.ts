import { defineConfig } from "vitest/config";
import { createVitestConfig } from "@vane/vitest-config";

// 标准外壳（7 包一致）：@vane/vitest-config 已内置 fileParallelism:false（规避 Windows happy-dom EPERM）。
export default defineConfig(createVitestConfig({ environment: "happy-dom" }));
