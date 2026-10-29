export * from "./create";
export { default } from "./create";
import { createZipPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createZipPreviewPlugin = Object.assign(create, { meta: doc });
