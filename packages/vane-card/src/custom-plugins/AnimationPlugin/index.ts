export * from "./create";
import { createAnimationPlugin as create } from "./create";
import doc from "./doc.json";
export const createAnimationPlugin = Object.assign(create, { meta: doc });
