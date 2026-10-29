export * from "./create";
export { default } from "./create";
import { createPptxPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createPptxPreviewPlugin = Object.assign(create, { meta: doc });
