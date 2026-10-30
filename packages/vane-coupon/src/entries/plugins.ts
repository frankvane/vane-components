/**
 * 子路径入口 `vane-coupon/entries/plugins` —— 插件系统 + 官方插件全家桶（4 个）。
 * 写自己的插件只用 `vane-coupon` 根入口的 withPlugins；要全量官方插件走这里。
 */
export { withPlugins } from "../components/CouponPlugin/withPlugins";
export type {
  CouponPlugin,
  CouponPluginContext,
  CouponPluginHooks,
  CouponPluginCreator,
} from "../components/CouponPlugin/plugins/types";

export * from "../custom-plugins";
