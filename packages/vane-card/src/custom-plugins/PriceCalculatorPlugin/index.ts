export * from "./create";
import { createPriceCalculatorPlugin as create } from "./create";
import doc from "./doc.json";
export const createPriceCalculatorPlugin = Object.assign(create, { meta: doc });
