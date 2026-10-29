export * from "./create";
export { default } from "./create";
import { createCodePreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createCodePreviewPlugin = Object.assign(create, { meta: doc });
