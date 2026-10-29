export * from "./create";
import { createResponsivePlugin as create } from "./create";
import doc from "./doc.json";
export const createResponsivePlugin = Object.assign(create, { meta: doc });
