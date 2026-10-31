# 32 · vane-sign-in 实施清单

> 对应 `tasks/31-分析.md`。每阶段完成后提交并双远端推送（已授权）。

## P1 构建

- [x] 1. 脚手架：`node scripts/create-component.mjs vane-sign-in --title "每日签到" --desc "..."` → `pnpm install` → `node scripts/sync-exports.mjs`
- [x] 2. 门禁自检：check-structure / check-config 能 grep 到 `vane-sign-in`（动态扫描，无需登记）
- [x] 3. 包元数据：`package.json` 填 name/description/keywords/vane.demo(title/accent/bg)/sizeBudgetKb(14)；exports 由 sync 生成
- [x] 4. 核心类型：`src/components/SignInPlugin/plugins/types.ts`（SignInData / RewardInfo / DayCell / MakeupInfo / LevelInfo / ClaimRecord / 插件 config 联合类型 / 回调类型）
- [x] 5. 内核：`SignInCore.tsx`（header/calendar/rewards/actions/footer 五槽渲染）；`withPlugins.tsx`（领域 HOC，extendContext 注入 data/callbacks）；`index.ts`（根 facade）；`entries/core.ts`、`entries/plugins.ts`
- [x] 6. 命名四件套：StreakStatePlugin / CalendarStripPlugin / RewardPreviewPlugin / MakeupSlotPlugin（各 create.tsx+doc.json+index.ts，挂 .meta）
- [x] 7. 其余 12 插件（PointsBalance / StatRow / LevelBadge / Countdown / CalendarGrid / RewardClaim / Milestone / Share / Remind / Invite / RuleExpand / RewardHistory）三件套齐 + 命名合规 + 分配 priority 区间（header 10–14 / calendar 20–21 / rewards 30–32 / actions 40–45 / footer 50–51）= 共 17 插件
- [x] 8. 新增插件后固定两跑：sync-exports + generate-plugin-docs（后者跑完 git status 回滚无关包）
- [x] 9. P1 门禁：`tsc --noEmit` 0 → `eslint .` 0 errors → `vite build --mode lib` 成功 → 根 `check-packages.mjs` 绿 → `check-structure --strict` 0 → `check-config` 通过
- [x] 10. 阶段提交 + 双远端 push

## P2 DEMO

- [x] 11. `demo.config.tsx`：pkg/brand/subtitle/nav/routes/demos/footer；vane.demo 五项与 config 对齐
- [x] 12. `App.css` 仅改 accent 四行 + 品牌文案（外壳四件套由 sync-demo-shell 生成，勿手改）
- [x] 13. `demos/` 逐项示例层：00-basic + 17 插件各一页（共 18 页，每页 meta + Stage）；模块级装配常量，渲染体内不调工厂
- [x] 14. demo vite alias：通配在前、裸名在后；消费者视角包名导入
- [x] 15. `lib/selftest.tsx`：签到主流程断言（todaySigned 切换 / 连签数 / 补签入口 / 奖励领取）+ 几何体检（无布局引擎自动跳过）；SignInCore 与四插件补 data-testid
- [x] 16. `test/selftest.dom.test.tsx`：CI 可跑的等价断言（happy-dom 全过）
- [x] 17. P2 门禁：`build:demo` 成功 ✓；`?selftest=1` 确定性等价（happy-dom）全过 ✓；对比度静态核对全过 ✓（无头浏览器不可用，直播与 _audit.html 未跑；强调橙由 #ff7a29 加深到 #cf4407 满足 ADR-13）
- [x] 18. 阶段提交 + 双远端 push（27e2125）

## P3 文档·测试·门禁·发布

- [ ] 19. docs 四件：`docs/components/vane-sign-in/{index,api,recipes,plugins}.md`；plugins.md 保留 AUTO-GENERATED 标记
- [ ] 20. `generate-plugin-docs.mjs` → 跑完回滚无关包；`sync-readme.mjs` 生成 README（首屏含 `npm install vane-sign-in`）
- [ ] 21. `test/*.test.tsx`：工厂结构 / withPlugins onMount / renderOverlay 进 DOM / 插件抛错隔离 / happy-dom 无布局引擎时 layout-skip
- [ ] 22. 全量门禁 `pnpm verify`（lint+typecheck+test+check+check:structure --strict+check:config+check:demo）全绿
- [ ] 23. 聚合：`build-demos.mjs` → `serve-demo` → 访问 `/vane-sign-in/`（带尾斜杠）→ `?selftest=1` 复核
- [ ] 24. changeset：`.changeset/vane-sign-in-initial.md`（minor，列 17 插件 + demo 项）
- [ ] 25. 提交 + 双远端 push + `git ls-remote` 核 HEAD 一致
- [ ] 26. 发布门禁（**须用户显式确认**）：workspace:* 临时改 * → `--dry-run` → 正式 `npm publish --registry https://registry.npmjs.org` → `git checkout -- package.json` → registry API 复核版本与 latest
