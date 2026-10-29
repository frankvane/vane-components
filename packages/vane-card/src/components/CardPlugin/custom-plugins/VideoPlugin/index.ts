export * from "./create";
import { createVideoPlugin as create } from "./create";
import doc from "./doc.json";
export const createVideoPlugin = Object.assign(create, { meta: doc });
