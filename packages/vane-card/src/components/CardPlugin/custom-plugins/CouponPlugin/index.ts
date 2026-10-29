export * from "./create";
import { createCouponPlugin as create } from "./create";
import doc from "./doc.json";
export const createCouponPlugin = Object.assign(create, { meta: doc });
