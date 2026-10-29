export * from "./create";
import { createA11yPlugin as create } from "./create";
import doc from "./doc.json";
export const createA11yPlugin = Object.assign(create, { meta: doc });
