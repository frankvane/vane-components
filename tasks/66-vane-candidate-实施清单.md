# 66 · vane-candidate 实施清单

> 对应分析：tasks/65。按项推进，阶段性完成自动提交推送。

## S2 脚手架
- [ ] `node scripts/create-component.mjs vane-candidate --title "候选人流水线" --desc "插件式 React 候选人流水线（ATS）"` → `pnpm install` → `node scripts/sync-exports.mjs`
- [ ] 验证：check-structure / check-config grep 得到 vane-candidate

## S3 内核入口
- [ ] `src/components/CandidatePlugin/plugins/types.ts`（数据模型 + 槽名 + Creator）
- [ ] `src/components/CandidatePlugin/domain.ts`（stageIndexOf / moveStage / 纯函数）
- [ ] `src/components/CandidatePlugin/plugins/tokens.tsx`（令牌 + toolbarBtn + cloneData）
- [ ] `src/components/CandidatePlugin/plugins/overlay.tsx`（共用弹层，移植 vane-resume）
- [ ] `src/components/CandidatePlugin/plugins/slots.tsx`（per-card 双参槽 + renderCards 覆盖槽）
- [ ] `src/components/CandidatePlugin/withPlugins.tsx`（internalData + candidate:update / candidate:change + moveCandidate/updateCandidate 上下文扩展）
- [ ] `src/components/CandidatePlugin/CandidateCore.tsx`（工具栏/阶段列/卡片骨架/页脚/浮层 children）
- [ ] `src/index.ts` / `src/entries/core.ts` / `src/entries/plugins.ts` / `src/custom-plugins/index.ts`
- [ ] 验证：`tsc --noEmit` 0 错

## S4 插件家族（19 个三件套）
- [ ] Score / DupCheck / Tag / Offer / Star / StageFlow / Note / InterviewSlot / RejectTpl
- [ ] Filter / Search / BatchOp / ViewSwitch / ArchivePool / Export / Stats / ActivityLog / RecommendSort / ContactMask
- [ ] `sync-exports` + 验证 exports 含 19 子路径

## S5 P1 门禁
- [ ] `tsc --noEmit` 0 错 → `eslint .` 0 error → `vite build --mode lib` 成功 → `node scripts/check-packages.mjs` 绿
- [ ] 体积超标则真减或写 sizeBudgetNote
- [ ] 阶段提交推送

## S6-S7 DEMO
- [ ] demo.config.tsx + App.css 四令牌（accent #2563eb）+ vane.demo 五项对齐
- [ ] data/sample.ts（SAMPLE_CANDIDATES）+ data/plugins.ts + codegen.ts
- [ ] demos/：_factory / DemoPage / panels / types / registry + 19 页逐项示例
- [ ] pages/ 三页套 + scenarios/（≥3 场景）
- [ ] lib/audit-candidate.ts + lib/selftest.tsx + test/selftest.dom.test.tsx
- [ ] 验证：build:demo 成功 → serve → ?selftest=1 PASS n/n → 对比度 0 处不达标

## S9-S10 文档与门禁
- [ ] docs/components/vane-candidate/{index,api,recipes,plugins}.md
- [ ] generate-plugin-docs（回滚无关包）→ sync-readme
- [ ] vitest run + pnpm verify 全绿 + check-structure --strict
- [ ] build-demos 聚合 + /vane-candidate/ 可访问

## S11-S12 提交发布
- [ ] 阶段 commit + 双远端 push + ls-remote 核 HEAD
- [ ] npm 发布需用户显式确认（changesets 流程）
