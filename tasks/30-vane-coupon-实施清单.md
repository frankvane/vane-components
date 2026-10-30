# vane-coupon 实施清单（tasks/30）

> 分析见 `tasks/29-vane-coupon-分析.md`。逐项可勾选，每项附验证方式。

## P1 构建

- [x] 1. 脚手架：`node scripts/create-component.mjs vane-coupon --title "优惠券" --desc "券展示与领取：领取态 / 有效期 / 规则展开 / 叠加态"`
  - 验证：`packages/vane-coupon/` 存在、`docs/components/vane-coupon/` 4 篇种子、占位符已替换
- [x] 2. `pnpm install`；`node scripts/sync-exports.mjs`
  - 验证：包内 `node_modules/.bin/vite` 存在；`exports["."]` 非空
- [x] 3. 门禁扫描确认：`node scripts/check-structure.mjs | grep vane-coupon` 有输出
- [x] 4. 领域类型 `src/components/CouponPlugin/plugins/types.ts`（CouponData / CouponCoreProps / CouponCoreRef / CouponPluginContext / CouponPluginHooks + onPhaseChange/onValidityChange）
- [x] 5. 核心 `CouponCore.tsx`（票券：面额区 + 标题 + 四槽；根节点 position+color+padding 16）+ `index.ts`
  - 验证：≤150 行、无业务逻辑
- [x] 6. 装配器 `withPlugins.tsx`（extendContext 注入 coupon/setPhase/validity getters）+ `createCoupon.tsx` 工厂
- [x] 7. `src/index.ts` / `src/entries/{core,plugins}.ts` / `src/custom-plugins/index.ts`
- [x] 8. 4 插件三件套 `src/custom-plugins/{ClaimState,Validity,RuleExpand,Stack}Plugin/{create.tsx,doc.json,index.ts}`（priority 32/23/21/12；`.meta` 挂载；doc 有 example）
  - 验证：A2/A3/A4 全过
- [x] 9. 样式 `src/styles/tokens.css + components.css`（`vc-` 前缀、票券缺口伪元素、对比度：正文≥4.5 禁用≥3）；`sideEffects: ["**/*.css"]`
- [x] 10. P1 门禁：包内 `tsc --noEmit` 0 错 → 根 `eslint .` 0 error → 包内 `vite build --mode lib` → 根 `check-packages.mjs` 绿（体积门生效）
  - 验证：`dist/index.js` 存在且 gzip ≤ 8KB；超了写 `sizeBudgetNote`

## P2 DEMO

- [x] 11. `package.json` 的 `vane.demo` 五项（brand "C"、accent 橙红系）与 `demo/src/App.css` 令牌对齐
- [x] 12. `demo/vite.config.ts` alias：`@/` → `/^vane-coupon\/custom-plugins\/(.+)$/` → 裸名（**通配在前**）
- [x] 13. `demo/src/demos/` 7 页（00-quickstart / 01-claim-state / 02-validity / 03-rules / 04-stack / 05-combined / 06-limited），消费方视角 import
- [x] 14. `lib/selftest.tsx`（`?selftest=1` → `SELFTEST PASS n/n` 写 title；dispatchEvent + tick，无 React.act）+ `lib/audit-geometry.ts`（happy-dom 无布局守卫）
- [x] 15. `test/selftest.dom.test.tsx`（CI 可跑）
- [x] 16. P2 门禁：`build-demos --only vane-coupon` → `serve-demo.cjs demos 3350` → `/vane-coupon/?selftest=1` PASS n/n → `_audit.html?pkg=vane-coupon` 0 处不达标 → 几何体检（tasks/28 骨架，十档视口）

## P3 文档·测试·发布

- [x] 17. vitest 单测：工厂结构（name/hooks/meta）、装配 onMount、插件抛错沙箱隔离、状态机转移表、有效期三模式、规则展开往返
- [x] 18. docs 四件 `docs/components/vane-coupon/{index,api,recipes,plugins}.md`（plugins.md 保留 AUTO-GENERATED 标记）
- [x] 19. 顺序跑 `sync:exports → generate-plugin-docs → sync-readme`，`git status` 回滚无关包改动
- [x] 20. `pnpm verify` 等价逐条（pnpm 不在 PATH）：eslint → tsc → vitest → check-packages → check-structure **--strict** → check-config → sync-demo-shell --check
- [x] 21. changeset + 阶段性 commit + 双远端 push + `git ls-remote` 核 HEAD 一致
- [ ] 22. npm publish：**用户显式确认后**才执行（默认暂不发布）

## 契约冻结提醒

- exports 由 sync-exports 生成，禁止手改；README 禁止手写；demo 外壳四件套禁手改。
- 根入口不桶导出插件（ADR-6）；文档子路径必须逐字命中 exports（`custom-plugins/ClaimStatePlugin` 等全名）。
