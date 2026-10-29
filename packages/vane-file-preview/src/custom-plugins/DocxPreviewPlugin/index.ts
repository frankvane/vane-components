export * from "./create";
export { default } from "./create";
import { createDocxPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createDocxPreviewPlugin = Object.assign(create, { meta: doc });
