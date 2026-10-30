# 优惠券 · 组合配方

配方 = 一组插件的预设组合，用来降低「不知道装哪几个」的成本。

## 领券中心标准位

角标 + 有效期 + 规则折叠 + 领取按钮，四槽各归其位：

```tsx
import { createCouponCard } from "vane-coupon";
import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";
import { createValidityPlugin } from "vane-coupon/custom-plugins/ValidityPlugin";
import { createRuleExpandPlugin } from "vane-coupon/custom-plugins/RuleExpandPlugin";
import { createStackPlugin } from "vane-coupon/custom-plugins/StackPlugin";

export const ClaimCenterCoupon = createCouponCard([
  createStackPlugin({ showWhenNotStackable: true }),
  createValidityPlugin({ urgentDays: 3 }),
  createRuleExpandPlugin({ collapsedCount: 1 }),
  createClaimStatePlugin({
    claim: async () => ({ ok: await api.claim(coupon.id) }),
  }),
]);
```

## 限量抢购位

```tsx
export const FlashCoupon = createCouponCard([
  createClaimStatePlugin({
    stock: stockFromApi, // ≤ 0 自动「已抢光」
    claim: api.claim,
  }),
  createValidityPlugin(),
]);
```

## 纯展示位（无领取动作）

```tsx
export const DisplayCoupon = createCouponCard([
  createValidityPlugin(),   // 只展示有效期文案
  createStackPlugin({ always: true }),
]);
```

## 推荐做法

- 常用组合沉淀为配方导出在包内（建议 3-5 个起步，不设上限），让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- 插件按子路径逐个引入（`vane-coupon/custom-plugins/XxxPlugin`），根入口不桶导出插件（ADR-6），tree-shaking 才守得住体积门。
