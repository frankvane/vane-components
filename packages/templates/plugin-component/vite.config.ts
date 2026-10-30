import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { createLibConfig } from "@vane/build-config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  ...createLibConfig({
    name: "__UMD_NAME__",
    root,
    formats: ["es"],
  }),
  // 门禁要求（check-config）：不复制 public/ 到产物，避免库构建混入静态目录
  publicDir: false,
});
