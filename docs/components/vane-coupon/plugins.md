# 优惠券 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [ClaimStatePlugin](./ClaimStatePlugin) | 领取状态机：7 态相位流转（未开始/可领取/领取中/已领取/已使用/已抢空/已过期），点击触发异步领取，联动有效期与库存自动降级终态。 | `initialPhase` = -<br/>`claim` = -<br/>`stock` = -<br/>`onPhaseChange` = -<br/>`onClaimError` = -<br/>`texts` = - | 0.1.0 | coupon, claim, state-machine, footer |
| [RuleExpandPlugin](./RuleExpandPlugin) | 规则展开/收起：使用规则按条数折叠（默认 1 条），展开态写内核 state，可被宿主复位；不用 line-clamp 避免纵向裁切。 | `collapsedCount` = 1<br/>`expandText` = "展开"<br/>`collapseText` = "收起"<br/>`showCount` = true<br/>`title` = "使用规则" | 0.1.0 | coupon, rules, expand, after |
| [StackPlugin](./StackPlugin) | 叠加态角标：按 coupon.stackable 渲染「可叠加」强调角标或「不可叠加」灰标，可强制展示；渲染在票面顶部角标区。 | `text` = "可叠加"<br/>`notStackableText` = "不可叠加"<br/>`showWhenNotStackable` = false<br/>`always` = false | 0.1.0 | coupon, stack, badge, before |
| [ValidityPlugin](./ValidityPlugin) | 有效期判定：绝对（validFrom/validTo）与相对（领取后 N 天）双模式，紧迫态（剩余 ≤ N 天）强调展示，过期结果写内核 state 供领取状态机联动。 | `now` = Date.now<br/>`urgentDays` = 3 | 0.1.0 | coupon, validity, date, after |
<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
