export * from "./create";
export { default } from "./create";
import { createXmlPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createXmlPreviewPlugin = Object.assign(create, { meta: doc });
