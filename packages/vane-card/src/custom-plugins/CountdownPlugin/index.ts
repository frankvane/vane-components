export * from "./create";
import { createCountdownPlugin as create } from "./create";
import doc from "./doc.json";
export const createCountdownPlugin = Object.assign(create, { meta: doc });
