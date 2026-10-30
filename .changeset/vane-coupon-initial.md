---
"vane-coupon": minor
---

初始发布：插件式券展示与领取组件。

- `CouponCore`：票券本体（面额区 / 门槛 / 标题 + before/after/footer/overlay 四插槽）
- `ClaimStatePlugin`：7 态领取状态机（未开始/可领取/领取中/已领取/已使用/已抢空/已过期），联动有效期与库存自动降级终态
- `ValidityPlugin`：有效期绝对/相对双模式判定，紧迫态强调
- `RuleExpandPlugin`：使用规则按条数折叠展开
- `StackPlugin`：可叠加/不可叠加角标
