export * from "./create";
export { default } from "./create";
import { createImagePreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createImagePreviewPlugin = Object.assign(create, { meta: doc });
