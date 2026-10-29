export * from "./create";
export { default } from "./create";
import { createXlsxPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createXlsxPreviewPlugin = Object.assign(create, { meta: doc });
