export * from "./create";
export { default } from "./create";
import { createJsonPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createJsonPreviewPlugin = Object.assign(create, { meta: doc });
