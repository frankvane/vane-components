export * from "./create";
import { createReviewPlugin as create } from "./create";
import doc from "./doc.json";
export const createReviewPlugin = Object.assign(create, { meta: doc });
