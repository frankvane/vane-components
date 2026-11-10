# 76 · vane-asset-library 实施清单

> 对应分析：[75-vane-asset-library-分析.md](./75-vane-asset-library-分析.md)
> 每项都带验证方式；打勾前必须真的跑过验证命令。

## P2 脚手架

- [ ] `node scripts/create-component.mjs vane-asset-library --title "素材库" --desc "插件式 React 素材网格墙"` → 包目录存在
- [ ] `pnpm install` → `packages/vane-asset-library/node_modules/.bin/{vite,vitest,tsc}` 存在
- [ ] `node scripts/sync-exports.mjs` → `package.json` 的 `exports["."]` 有值
- [ ] `node scripts/check-structure.mjs 2>&1 | grep vane-asset-library`、`node scripts/check-config.mjs 2>&1 | grep vane-asset-library` → 两条都能扫到新包（说明门禁动态发现生效）
- [ ] 删模板示例层：`src/custom-plugins/ExamplePlugin`、`test/ExamplePlugin.test.ts`、`demo/src/demos/00-basic.tsx` 与 registry 里的模板条目
- [ ] 改 `package.json`：`keywords`、`vane.{demo,sizeBudgetKb,...}`、peer 依赖版本对齐 vane-resume

## P3 内核与类型

- [ ] `src/components/AssetLibraryPlugin/plugins/types.ts`：`AssetItem` / `AssetFolder` / `AssetLibraryState` / `AssetSlots` / `CoreProps` / `CoreRef` / `AssetLibraryContext` / `AssetPluginHooks` / `AssetPlugin`
- [ ] `src/components/AssetLibraryPlugin/domain.ts` 纯函数：`normalizeAssets` `normalizeSelection` `filterAssets` `sortAssets` `paginateAssets` `isAssetSelectable` `formatDuration` `formatSize` `toTimestamp` `buildTagFacets`
- [ ] `src/components/AssetLibraryPlugin/AssetLibraryCore.tsx` ≤150 行：网格 `role="listbox"` + 卡片 `role="option"` + roving tabindex + 方向键/空格/Enter + 三处 per-card 槽 + 空态分支
- [ ] `src/components/AssetLibraryPlugin/plugins/slots.tsx`：槽 provider（`renderPluginSlot` 逐槽包装 + 记忆化）
- [ ] `src/components/AssetLibraryPlugin/withPlugins.tsx`：状态机（filter/sort/page/select）+ `extendContext` + 受控/非受控选择 + `transformData` 管道 + `page` 夹紧
- [ ] `src/index.ts` / `src/entries/{core,plugins}.ts` 三处入口（根入口 **不** 桶导出插件）
- [ ] `src/styles/{tokens.css,components.css}`：`--vane-asset-*` 变量 + `vc-` class；容器自带 `color`+`background`；`sideEffects:["**/*.css"]`
- [ ] 验证：`./node_modules/.bin/tsc --noEmit -p tsconfig.json` → 0 错；`../../node_modules/.bin/eslint .` → 0 error

## P4 插件家族（20 个，三件套齐全）

- [ ] dropzone(5) / search(10) / kind-filter(11) / tag-filter(12) / folder-filter(13) / sort(14) / view-switch(15) / count(16) / select-all(17)
- [ ] select-mark(20) / kind-badge(21) / duration(22) / status-badge(23) / favorite(24) / card-actions(25) / meta-line(26)
- [ ] bulk-bar(30) / pagination(31)
- [ ] empty-state(40) / lightbox(45)
- [ ] 每个插件：`create.tsx`（无 React hooks）+ `doc.json`（含 `example`）+ `index.ts`，`create<Name>.meta = doc`
- [ ] `src/custom-plugins/index.ts` 汇总导出
- [ ] 验证：`node scripts/sync-exports.mjs` → 20 个子路径进 exports；`node scripts/generate-plugin-docs.mjs` 后 `git status` 回滚无关包

## P5–P7 DEMO

- [ ] `demo/src/demo.config.tsx`：pkg/brand/subtitle/nav(≥3)/routes/crumb/demos/footer，与 `package.json vane.demo` 五项一致
- [ ] `demo/src/App.css`：只改四行 accent token + 品牌文案
- [ ] `demo/vite.config.ts`：alias 通配在前、裸名在后；`port` 与其它包不冲突
- [ ] `demo/src/data/samples.ts`：`SAMPLE_ASSETS`（48 项，含视频/processing/failed/分组/标签，图片用内联 SVG data-URI）+ `bulkAssets(n)`
- [ ] `demo/src/data/plugins.ts`：glob doc.json + create.tsx 提 priority
- [ ] `demo/src/demos/NN-<slug>.tsx` ×20：每页 `meta` + Stage，展示源码走 `?raw` glob
- [ ] `demo/src/demos/codegen.ts`：`buildDemoCode` / `buildFullSource`（**内联完整 `SAMPLE_ASSETS`**，`renderPluginArg` 先剥一层花括号）
- [ ] `demo/src/pages/{HomePage,PluginsPage,ScenariosPage}.tsx` + `scenarios/*`
- [ ] 验证：`pnpm build:demo` 成功；`node scripts/build-demos.mjs --only vane-asset-library`；`serve-demo` 后 `?selftest=1` 读到 `SELFTEST PASS n/n`

## P8 自测与体检

- [ ] `demo/src/lib/selftest.tsx`：装配/过滤/排序/分页/选择/不可选/受控 逐条断言，结果写 `document.title`
- [ ] `demo/src/lib/audit-asset.ts`：几何体检（越界/负坐标/零尺寸/重叠/scrollHeight）+ 无布局引擎守卫
- [ ] `test/*.test.ts(x)`：工厂结构、withPlugins 装配、过滤排序分页、选择上限与 blocked、受控回传、空态原因
- [ ] 验证：`./node_modules/.bin/vitest run` 全绿；对比度体检该包 0 处不达标；clip 截图核验

## P9–P10 文档与门禁

- [ ] `docs/components/vane-asset-library/{index,api,recipes,plugins}.md`（plugins.md 保留 AUTO-GENERATED 双标记）
- [ ] `node scripts/sync-readme.mjs` 生成 README（首屏含 `npm install vane-asset-library`）
- [ ] 先 `vite build --mode lib` 再 `node scripts/check-packages.mjs`
- [ ] `node scripts/check-structure.mjs --strict` 0 FAIL；`check-config` 绿；`sync-demo-shell --check` 绿
- [ ] 体积：按实测写 `sizeBudgetNote`（禁止静默调大）

## P11–P12 聚合与发布

- [ ] `node scripts/build-demos.mjs` + `serve-demo.cjs demos 3350` → 访问 `/vane-asset-library/` 正常
- [ ] 阶段性 commit（脚手架 / 内核 / 插件 / demo / 文档 分开），推 origin main，`git ls-remote` 核 HEAD
- [ ] 【需用户确认】changeset → 版本 → npm 发布 → registry 复核 → 真产物冒烟
