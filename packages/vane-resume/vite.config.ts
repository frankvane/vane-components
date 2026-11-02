import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { createLibConfig } from "@vane/build-config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  ...createLibConfig({
    name: "VaneResume",
    root,
    formats: ["es"],
    // qrcode 是可选的按需依赖（二维码插件运行时才需要），不进库产物，由消费方自行安装
    external: [/^qrcode(\/|$)/],
  }),
  // 门禁要求（check-config）：不复制 public/ 到产物，避免库构建混入静态目录
  publicDir: false,
});
