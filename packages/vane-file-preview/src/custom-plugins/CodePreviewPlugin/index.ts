export * from "./create";
export { default } from "./create";
export { AVAILABLE_THEMES } from "./themes";
export { AVAILABLE_LANGUAGES } from "./languages";
import { createCodePreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createCodePreviewPlugin = Object.assign(create, { meta: doc });
