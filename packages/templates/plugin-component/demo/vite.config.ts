import { fileURLToPath } from "node:url";
import { createDemoConfig } from "@vane/build-config";

const root = fileURLToPath(new URL("..", import.meta.url));

export default createDemoConfig({
  root,
  port: 3100,
  outDir: "demo-dist",
  // html 在 demo/ 子目录，dev 自动打开对应路径（根路径无 index.html）
  open: "/demo/index.html",
});
