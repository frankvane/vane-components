export * from "./create";
import { createSKUPlugin as create } from "./create";
import doc from "./doc.json";
export const createSKUPlugin = Object.assign(create, { meta: doc });
