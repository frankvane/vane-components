export * from "./create";
import { createHoverPlugin as create } from "./create";
import doc from "./doc.json";
export const createHoverPlugin = Object.assign(create, { meta: doc });
