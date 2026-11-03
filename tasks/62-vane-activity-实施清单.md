# 62 · vane-activity 实施清单

> 配套 61 分析。每项标注验证方式；阶段性 commit（骨架/插件/demo/修复分开），双远端 push 已授权。

## S2 脚手架
- [ ] `node scripts/create-component.mjs vane-activity --title "营销活动" --desc "插件式 React 营销活动容器：任务/进度/奖励/规则按需装配"`
- [ ] `pnpm install`（模板不进 workspace，必须跑）
- [ ] `node scripts/sync-exports.mjs`（模板 exports 为 `{}`，不跑 check FAIL）
- [ ] 验证新包被门禁扫到：`node scripts/check-structure.mjs 2>&1 | grep -A2 vane-activity` 有输出
- [ ] 验证：`node scripts/check-config.mjs 2>&1 | grep vane-activity` 有输出

## S3 内核与入口
- [ ] `src/components/ActivityPlugin/domain.ts`：任务/奖励/进度纯函数引擎（不依赖 React）
- [ ] `src/components/ActivityPlugin/plugins/types.ts`：ActivityPlugin / Context / Hooks / SlotName / 领域数据类型
- [ ] `src/components/ActivityPlugin/plugins/slots.tsx`：`ActivitySlotProvider` / `renderActivitySlot` / `useActivitySlot` / `useActivityContext`
- [ ] `src/components/ActivityPlugin/ActivityCore.tsx`：≤150 行，仅渲染 + 转发生命周期，布局骨架 + 5 槽位
- [ ] `src/components/ActivityPlugin/withPlugins.tsx`：装配器（模块顶层调用工厂）
- [ ] `src/entries/core.ts` / `src/entries/plugins.ts` / `src/index.ts`（根不桶导出插件）
- [ ] P1 基础门禁：`tsc --noEmit` 0 错 → `eslint .` 0 error → `vite build --mode lib` 成功

## S4 四个插件三件套
- [ ] `src/custom-plugins/TaskListPlugin/{create.tsx, doc.json, index.ts}`（priority 20，主槽 renderTasks）
- [ ] `src/custom-plugins/ProgressFxPlugin/{create.tsx, doc.json, index.ts}`（priority 10 + overlay 50，renderProgress + renderOverlay）
- [ ] `src/custom-plugins/RewardClaimPlugin/{create.tsx, doc.json, index.ts}`（priority 30，renderRewards）
- [ ] `src/custom-plugins/RuleExpandPlugin/{create.tsx, doc.json, index.ts}`（priority 40，renderRules）
- [ ] 每插件挂 `.meta = doc`；`doc.json` 含 `example` + `examples` 双字段
- [ ] `src/custom-plugins/index.ts` re-export 四插件
- [ ] 固定两跑：`sync-exports` + `generate-plugin-docs`（后者跑完回滚无关包）
- [ ] 验证：A2 命名 / A3 三件套 / A5 根桶导出 / A6 双结构 全绿

## S5 DEMO 外壳
- [ ] `package.json` 补 `vane.demo` 五项（brand/subtitle/title/accent/bg）与 config 对齐
- [ ] `demo/src/demo.config.tsx`：pkg/brand/subtitle/nav[]/routes[]/demos{...}/footer[]（含总览+插件工坊+场景示例三项）
- [ ] `demo/src/App.css`：只改 `--accent`/`--accent-ink`/`--accent-wash`/`--accent-line` 四行 + 品牌文案
- [ ] `demo/vite.config.ts`：alias 通配在前、裸名在后（`@/` → src/、`/^vane-activity\/custom-plugins\/(.+)$/` → src/custom-plugins/$1、`vane-activity` → src/index.ts）
- [ ] `demo/src/main.tsx` 去 StrictMode

## S6 三页套
- [ ] 总览 HomePage：stats 数字从注册表实时算（DEMOS/PLUGINS/SCENARIOS .length）
- [ ] 插件工坊 PluginsPage：数据源 `data/plugins.ts`（glob doc.json + create.tsx 提 priority/槽/config）
- [ ] 场景示例 ScenariosPage：≥2 个 `ScenarioCard`，真跑真装配

## S7 逐项示例层
- [ ] `demos/NN-tasklist.tsx` / `NN-progressfx.tsx` / `NN-rewardclaim.tsx` / `NN-ruleexpand.tsx` 每插件一页
- [ ] `lib/codegen.ts`：buildDemoCode / buildFullSource，`{{key}}` 占位 + `renderPluginArg` 剥一层花括号
- [ ] `highlight.ts` + `CodeBlock`（禁止 innerHTML 裸 `<pre>`）
- [ ] 展示源码 = `import.meta.glob("./[0-9]*.tsx", { query:"?raw", eager:true })`

## S8 自测与对比度
- [ ] `lib/selftest.tsx`：`?selftest=1` 写 `document.title = SELFTEST PASS n/n`
- [ ] `test/selftest.dom.test.tsx`：CI 可跑
- [ ] 几何体检 `lib/audit-*.ts`（happy-dom rect 恒 0 守卫）
- [ ] 对比度：`build-demos` → `serve-demo 3350` → `/_audit.html?pkg=vane-activity` → 该包 0 处不达标

## S9 文档四件
- [ ] `docs/components/vane-activity/{index,api,recipes}.md` 手写 + `plugins.md` 骨架 + AUTO-GENERATED 标记
- [ ] `node scripts/generate-plugin-docs.mjs`（跑完 `git status` 回滚无关包）
- [ ] `node scripts/sync-readme.mjs`（README 首屏含 `npm install vane-activity`）
- [ ] 子路径与 exports 逐字对齐（custom-plugins/TaskListPlugin 等）

## S10 测试与门禁
- [ ] `vitest run`：工厂结构 / withPlugins onMount + renderOverlay 进 DOM / 插件抛错隔离
- [ ] 先 `vite build --mode lib` 再 `node scripts/check-packages.mjs`（体积门只在 dist/index.js 存在时量）
- [ ] `pnpm verify`（lint+typecheck+test+check+check:structure --strict+check:config+check:demo）全绿

## S11 聚合预览
- [ ] `node scripts/build-demos.mjs --only vane-activity`
- [ ] `node scripts/serve-demo.cjs demos 3350` → 访问 `/vane-activity/`（带尾斜杠）
- [ ] `?selftest=1` 读到 `SELFTEST PASS n/n`

## S12 提交双远端 + 发布
- [ ] 阶段性 commit（骨架/插件/demo/修复）
- [ ] `git push origin main` + `git push github main` + `git ls-remote` 核 HEAD 一致
- [ ] changeset 写版本 → `release:version` → commit
- [ ] 临时 `workspace:*` → `*` → `npm publish --registry https://registry.npmjs.org --access public --no-git-checks` → `git checkout -- package.json`
- [ ] 用户显式确认后发；registry API 复核版本与 latest

## S13 SKILL 优化（贴合用户目标）
- [ ] 汇总本组件从建包→发布的真实命令、踩坑、决策
- [ ] 产出 SKILL 增补/修订建议（vane-activity 专属范式、坑表条目、门禁技巧）交用户审阅回填
