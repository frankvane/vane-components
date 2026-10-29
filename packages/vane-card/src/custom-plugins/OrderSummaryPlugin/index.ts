export * from "./create";
import { createOrderSummaryPlugin as create } from "./create";
import doc from "./doc.json";
export const createOrderSummaryPlugin = Object.assign(create, { meta: doc });
