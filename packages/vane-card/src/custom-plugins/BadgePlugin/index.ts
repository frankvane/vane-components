export * from "./create";
import { createBadgePlugin as create } from "./create";
import doc from "./doc.json";
export const createBadgePlugin = Object.assign(create, { meta: doc });
