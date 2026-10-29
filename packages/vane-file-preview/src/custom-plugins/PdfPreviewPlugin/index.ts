export * from "./create";
export { default } from "./create";
import { createPdfPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createPdfPreviewPlugin = Object.assign(create, { meta: doc });
