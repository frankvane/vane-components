export * from "./create";
export { default } from "./create";
import { createEpubPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createEpubPreviewPlugin = Object.assign(create, { meta: doc });
