export * from "./create";
import { createAnalyticsPlugin as create } from "./create";
import doc from "./doc.json";
export const createAnalyticsPlugin = Object.assign(create, { meta: doc });
