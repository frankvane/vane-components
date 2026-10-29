export * from "./create";
import { createCouponRecommendPlugin as create } from "./create";
import doc from "./doc.json";
export const createCouponRecommendPlugin = Object.assign(create, { meta: doc });
