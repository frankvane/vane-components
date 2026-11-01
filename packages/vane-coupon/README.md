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

- **领取状态机**：8 态相位流转（未开始 / 可领取 / 领取中 / 已领取 / 已使用 / 已抢空 / 已过期 / 已达限领上限），终态不回退
- **展示与门控同口径**：库存（`stock ≤ 0` 或 `claimed ≥ total`）、限领、过期、订单可用性都走同一组纯函数（`stock.ts` / `quota.ts` / `validity.ts` / `eligibility.ts`），不会出现「进度条已抢完但按钮还能领」
- **有效期双模式**：绝对区间（validFrom/validTo）与相对（领取后 N 天）自动判定，到点自动复查、紧迫态强调、过期联动领取状态机
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
| ClaimStatePlugin | 领取状态机（8 态，库存/限领/过期联动门控） | `vane-coupon/custom-plugins/ClaimStatePlugin` |
| EligibilityPlugin | 订单可用性判定（门槛/范围/互斥/叠加/限领/库存） | `vane-coupon/custom-plugins/EligibilityPlugin` |
| ValidityPlugin | 有效期判定（绝对/相对，到点自动复查） | `vane-coupon/custom-plugins/ValidityPlugin` |
| ProgressPlugin | 领取进度条（与领取门控共用库存口径） | `vane-coupon/custom-plugins/ProgressPlugin` |
| QuotaPlugin | 每人限领提示（超限写 state 供按钮门控） | `vane-coupon/custom-plugins/QuotaPlugin` |
| RuleExpandPlugin | 规则展开 / 收起 | `vane-coupon/custom-plugins/RuleExpandPlugin` |
| StackPlugin | 叠加态角标 | `vane-coupon/custom-plugins/StackPlugin` |
| RemindPlugin | 开抢提醒（idle / 倒计时中 / validFrom 未到） | `vane-coupon/custom-plugins/RemindPlugin` |
| CopyCodePlugin | 券码复制（失败经 onError 上报） | `vane-coupon/custom-plugins/CopyCodePlugin` |

### 订单可用性（可选）

传入 `order` 后组件才能判定「当前订单能否用这张券」；不传则只做券面展示与库存/限领/有效期门控：

```tsx
import { createEligibilityPlugin } from "vane-coupon/custom-plugins/EligibilityPlugin";
import { createClaimStatePlugin } from "vane-coupon/custom-plugins/ClaimStatePlugin";

const Coupon = createCouponCard([
  createEligibilityPlugin(),
  createClaimStatePlugin({ claim: async () => ({ ok: true }) }),
]);

<Coupon
  coupon={{ id: "c1", title: "满 199 减 20", amount: 20, threshold: 199 }}
  order={{ amount: 199, items: [{ sku: "A", amount: 199 }], purchasedCount: 1 }}
/>;
```

门槛按「分」比较（刚好等于视为满足），商品范围支持 `scope.sku / scope.category / scope.excludeSku`，互斥用 `exclusiveGroup`，叠加用 `stackable`。判定结果写 `state.eligible`，领取按钮与宿主提示共用同一口径。

> **破坏性变更（类型层面）**：`CouponPhase` 新增 `"quota-limited"`。若外部用 `Record<CouponPhase, T>` 穷举相位，升级时需补该键；运行时向后兼容。

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 根入口（核心 + 装配，ADR-6 不含插件） | ~5.2 KB |
| 插件按子路径逐个按需引入 | 每个 1–2 KB |

## 样式与主题

组件样式**全部内联**（与 vane-sku / vane-comment 同一家族口径）：自带白底 + 字色 + 内边距，消费者零配置，不需要额外引入样式文件。

换肤两种方式：

```tsx
// 方式一：containerStyle 覆盖根节点（内联样式之前置的宿主入口）
<Coupon coupon={data} containerStyle={{ borderRadius: 4, borderColor: "#f3c9d2" }} />;

// 方式二：宿主包裹层统一改色（组件背景白、字色深，包裹层可控的是留白与外框）
<div style={{ background: "#fff8f9", padding: 16 }}>
  <Coupon coupon={data} containerStyle={{ background: "transparent" }} />
</div>;
```

调色板常量在 `src/components/CouponPlugin/plugins/tokens.ts`（面额红 #d03050、紧迫 #a54a00/#fff7e6、过期 #b32d08/#fff1f0 等，正文对比度 ≥ 4.5:1、禁用态 ≥ 3:1），自定义插件可直接 import 复用。

## 文档

- [API](../../docs/components/vane-coupon/api.md)
- [插件目录](../../docs/components/vane-coupon/plugins.md)
- [组合配方](../../docs/components/vane-coupon/recipes.md)

## License

MIT
