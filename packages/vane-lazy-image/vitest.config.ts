import { defineConfig } from "vitest/config";
import { createVitestConfig } from "@vane/vitest-config";

export default defineConfig(createVitestConfig({ environment: "happy-dom" }));
