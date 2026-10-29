export * from "./create";
export { default } from "./create";
import { createAudioPreviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createAudioPreviewPlugin = Object.assign(create, { meta: doc });
