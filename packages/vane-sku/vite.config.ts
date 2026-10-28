import { fileURLToPath } from "node:url";
import { createLibConfig } from "@vane/build-config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default createLibConfig({
  name: "VaneSku",
  root,
  formats: ["es"],
});
