export * from "./create";
import { createGalleryPlugin as create } from "./create";
import doc from "./doc.json";
export const createGalleryPlugin = Object.assign(create, { meta: doc });
