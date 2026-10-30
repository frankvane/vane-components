<p align="center">
  <a href="https://www.npmjs.com/package/vane-coupon"><img src="https://img.shields.io/npm/v/vane-coupon.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-coupon"><img src="https://img.shields.io/npm/dm/vane-coupon.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 优惠券

> 券展示与领取：领取态 / 有效期 / 规则展开 / 叠加态
>
> 插件式组件：`CouponCore` 负责票券本体（面额区 + 标题），领取状态机、有效期判定、规则展开、叠加角标全部通过插件按需组合。

## 特性

- **领取状态机**：7 态相位流转（未开始 / 可领取 / 领取中 / 已领取 / 已使用 / 已抢空 / 已过期），终态不回退
- **有效期双模式**：绝对区间（validFrom/validTo）与相对（领取后 N 天）自动判定，紧迫态强调、过期联动领取状态机
- **规则展开**：按条数折叠展开，不用 line-clamp（避免纵向裁切）
- **叠加角标**：数据驱动的「可叠加 / 不可叠加」标识
- 插件化架构，核心稳定、能力可无限扩展；Tree-shaking 友好
- TypeScript 类型完备，与 `vane-plugin-core` 共用同一套插件规范

## 安装

```bash
npm install vane-coupon
```

## 30 秒上手

```tsx
import { createCouponCard } from "vane-coupon";
import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";
import { createValidityPlugin } from "vane-coupon/custom-plugins/ValidityPlugin";
import { createRuleExpandPlugin } from "vane-coupon/custom-plugins/RuleExpandPlugin";
import { createStackPlugin } from "vane-coupon/custom-plugins/StackPlugin";

const Coupon = createCouponCard([
  createStackPlugin({ showWhenNotStackable: true }),
  createValidityPlugin({ urgentDays: 3 }),
  createRuleExpandPlugin({ collapsedCount: 1 }),
  createClaimStatePlugin({
    claim: async () => {
      const res = await api.claimCoupon(couponId);
      return { ok: res.success, reason: res.message };
    },
  }),
]);

<Coupon
  coupon={{
    id: "c1",
    title: "新人专享券",
    amount: 10,
    threshold: 99,
    validTo: Date.parse("2026-11-11"),
    stackable: true,
    rules: ["仅限自营商品", "不与店铺券叠加", "核销后不找零"],
  }}
/>;
```

只要票券本体、不要状态机？用裸核心：

```tsx
import { CouponCard } from "vane-coupon";

<CouponCard coupon={{ id: "c1", title: "折扣券", amount: 8.5, amountType: "discount" }} />;
```

## 插件一览

| 插件 | 职责 | 子路径 |
| --- | --- | --- |
| ClaimStatePlugin | 领取状态机（7 态） | `vane-coupon/custom-plugins/ClaimStatePlugin` |
| ValidityPlugin | 有效期判定（绝对/相对） | `vane-coupon/custom-plugins/ValidityPlugin` |
| RuleExpandPlugin | 规则展开 / 收起 | `vane-coupon/custom-plugins/RuleExpandPlugin` |
| StackPlugin | 叠加态角标 | `vane-coupon/custom-plugins/StackPlugin` |

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 根入口（核心 + 装配，ADR-6 不含插件） | ~5.2 KB |
| 插件按子路径逐个按需引入 | 每个 1–2 KB |

## 样式与主题

组件样式随 `import "vane-coupon/style.css"` 引入（或不引入、完全自绘）。主题令牌以 `--vane-coupon-*` 前缀定义在 `:root`（面额色、按钮色、紧迫/过期提示色等），宿主直接覆盖变量即可换肤：

```css
:root {
  --vane-coupon-amount: #d03050;     /* 面额 / 主按钮 */
  --vane-coupon-claim-bg: #d03050;   /* 领取按钮底色 */
  --vane-coupon-urgent-color: #a54a00; /* 紧迫态文字 */
}
```

## 文档

- [API](../../docs/components/vane-coupon/api.md)
- [插件目录](../../docs/components/vane-coupon/plugins.md)
- [组合配方](../../docs/components/vane-coupon/recipes.md)

## License

MIT
