export * from "./create";
import { createActionsPlugin as create } from "./create";
import doc from "./doc.json";
export const createActionsPlugin = Object.assign(create, { meta: doc });
