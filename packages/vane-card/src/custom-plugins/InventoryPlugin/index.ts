export * from "./create";
import { createInventoryPlugin as create } from "./create";
import doc from "./doc.json";
export const createInventoryPlugin = Object.assign(create, { meta: doc });
