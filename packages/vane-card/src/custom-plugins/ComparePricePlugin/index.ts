export * from "./create";
import { createComparePricePlugin as create } from "./create";
import doc from "./doc.json";
export const createComparePricePlugin = Object.assign(create, { meta: doc });
