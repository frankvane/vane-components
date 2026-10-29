export * from "./create";
export { default } from "./create";
import { createMammothDocxPlugin as create } from "./create";
import doc from "./doc.json";
export const createMammothDocxPlugin = Object.assign(create, { meta: doc });
