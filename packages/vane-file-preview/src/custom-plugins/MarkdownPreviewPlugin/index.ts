export * from "./create";
export { default } from "./create";
import { createMarkdownPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createMarkdownPreviewPlugin = Object.assign(create, { meta: doc });
