export * from "./create";
import { createStatePlugin as create } from "./create";
import doc from "./doc.json";
export const createStatePlugin = Object.assign(create, { meta: doc });
