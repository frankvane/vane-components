export * from "./create";
export { default } from "./create";
import { createOfficePreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createOfficePreviewPlugin = Object.assign(create, { meta: doc });
