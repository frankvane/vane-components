export * from "./create";
import { createImagePlugin as create } from "./create";
import doc from "./doc.json";
export const createImagePlugin = Object.assign(create, { meta: doc });
