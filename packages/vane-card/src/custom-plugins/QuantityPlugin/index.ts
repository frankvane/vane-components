export * from "./create";
import { createQuantityPlugin as create } from "./create";
import doc from "./doc.json";
export const createQuantityPlugin = Object.assign(create, { meta: doc });
