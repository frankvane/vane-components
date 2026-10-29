export * from "./create";
export { default } from "./create";
import { createVideoPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createVideoPreviewPlugin = Object.assign(create, { meta: doc });
