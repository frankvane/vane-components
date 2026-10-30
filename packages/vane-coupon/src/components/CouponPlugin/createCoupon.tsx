import { CouponCore } from "./CouponCore";
import { withPlugins } from "./withPlugins";
import type { CouponPlugin } from "./plugins/types";

/**
 * 工厂：把插件装到 CouponCore 上，返回一个可直接使用的组件。
 *
 * 与内核 withPlugins 的差别是这里已绑定 Core，调用方只需给插件数组：
 *   const Coupon = createCouponCard([createClaimStatePlugin(), createValidityPlugin()]);
 */
export function createCouponCard(plugins: CouponPlugin[] = []) {
  return withPlugins(CouponCore, plugins);
}

/** 不带任何插件的裸券（面额 + 门槛 + 标题） */
export const CouponCard = createCouponCard([]);
