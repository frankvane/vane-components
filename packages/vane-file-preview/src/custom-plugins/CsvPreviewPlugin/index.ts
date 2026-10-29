export * from "./create";
export { default } from "./create";
import { createCsvPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createCsvPreviewPlugin = Object.assign(create, { meta: doc });
