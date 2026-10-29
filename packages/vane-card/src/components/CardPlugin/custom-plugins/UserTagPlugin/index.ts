export * from "./create";
import { createUserTagPlugin as create } from "./create";
import doc from "./doc.json";
export const createUserTagPlugin = Object.assign(create, { meta: doc });
