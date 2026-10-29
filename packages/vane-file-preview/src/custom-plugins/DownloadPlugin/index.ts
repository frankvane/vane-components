export * from "./create";
export { default } from "./create";
import { createDownloadPlugin as create } from "./create";
import doc from "./doc.json";
export const createDownloadPlugin = Object.assign(create, { meta: doc });
