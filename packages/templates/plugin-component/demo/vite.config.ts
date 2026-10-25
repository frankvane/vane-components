import { fileURLToPath } from "node:url";
import { createDemoConfig } from "@vane/build-config";

const root = fileURLToPath(new URL("..", import.meta.url));

export default createDemoConfig({ root, port: 3100, outDir: "demo-dist" });
