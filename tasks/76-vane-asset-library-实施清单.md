# 76 · vane-asset-library 实施清单

> 对应分析：[75-vane-asset-library-分析.md](./75-vane-asset-library-分析.md)
> 每项都带验证方式；打勾前必须真的跑过验证命令。

## P2 脚手架

- [x] `node scripts/create-component.mjs vane-asset-library --title "素材库" --desc "插件式 React 素材网格墙"` → 包目录存在
- [x] `pnpm install` → `packages/vane-asset-library/node_modules/.bin/{vite,vitest,tsc}` 存在
- [x] `node scripts/sync-exports.mjs` → `package.json` 的 `exports["."]` 有值（26 个子路径）
- [x] `node scripts/check-structure.mjs` / `check-config.mjs` → 两条都能扫到新包
- [x] 删模板示例层：`src/custom-plugins/ExamplePlugin`、`test/ExamplePlugin.test.ts`、`demo/src/demos/00-basic.tsx` 与 registry 里的模板条目
- [x] 改 `package.json`：`keywords`、`vane.{demo,sizeBudgetKb,...}`、peer 依赖版本对齐 vane-resume

## P3 内核与类型

- [x] `plugins/types.ts`：`AssetItem` / `AssetFolder` / `AssetLibraryState` / `AssetSlots` / `CoreProps` / `CoreRef` / `AssetLibraryContext` / `AssetPluginHooks` / `AssetPlugin`
- [x] `domain.ts` 纯函数：`normalizeAssets` `normalizeSelection` `filterAssets` `sortAssets` `paginateAssets` `isAssetSelectable` `formatDuration` `formatSize` `toTimestamp` `buildTagFacets` `buildFolderFacets` `resolveEmptyReason`
- [x] `AssetLibraryCore.tsx` ≤150 行：网格 `role="listbox"` + 卡片 `role="option"` + roving tabindex + 方向键/空格/Enter + 三处 per-card 槽 + 空态分支
- [x] `plugins/slots.tsx`：槽 provider（逐槽 `PluginErrorBoundary` + 记忆化 + empty 单值槽）
- [x] `withPlugins.tsx`：状态机（filter/sort/page/select）+ `extendContext` + 受控/非受控选择 + `page` 夹紧
- [x] `src/index.ts` / `src/entries/{core,plugins}.ts` 三处入口（根入口 **不** 桶导出插件）
- [x] `src/styles/{tokens.css,components.css}`：`--vane-asset-*` 变量 + `vc-` class；容器自带 `color`+`background`；`sideEffects:["**/*.css"]`
- [x] 验证：`tsc --noEmit -p tsconfig.json` → 0 错；`eslint .` → 0 error / 0 warning

> 修正（P3 实施时发现）：`AssetLibraryState` 不能 `extends AssetFilter, AssetSort` —— TS 对多
> `Partial` 派生接口的成员访问会报「属性不存在」。改为 `extends AssetFilter` 并显式声明
> `sortKey` / `sortDir` / `previewId`。

## P4 插件家族（20 个，三件套齐全）

- [x] dropzone(5) / search(10) / kind-filter(11) / tag-filter(12) / folder-filter(13) / sort(14) / view-switch(15) / count(16) / select-all(17)
- [x] select-mark(20) / kind-badge(21) / duration(22) / status-badge(23) / favorite(24) / card-actions(25) / meta-line(26)
- [x] bulk-bar(30) / pagination(31)
- [x] empty-state(40) / lightbox(45)
- [x] 每个插件：`create.tsx` + `doc.json`（含 `example`）+ `index.ts`，`create<Name>.meta = doc`
- [x] `src/custom-plugins/index.ts` 汇总导出
- [x] 验证：`sync-exports` → 20 个子路径进 exports；`generate-plugin-docs` 后回滚无关包

> 修正（P4 收尾）：`react-refresh/only-export-components` 的 21 条 warning 不能用包级
> eslint config 关掉（`check-config` 会判「配置漂移」），改为在每个插件 `create.tsx` 顶部
> 加一行行内注释并写明理由。

## P5–P7 DEMO

- [x] `demo/src/demo.config.tsx`：pkg/brand/subtitle/nav(3)/routes/crumb/demos/footer，与 `package.json vane.demo` 一致
- [x] `demo/src/App.css`：accent 四行换成本包琥珀橙（`#ff7a29`）+ 品牌文案
- [x] `demo/vite.config.ts`：alias 顺序 = `@/` → `custom-plugins`（barrel，精确）→ `custom-plugins/*`（通配）→ 裸包名；port 3100
- [x] `demo/src/data/samples.ts`：`SAMPLE_ASSETS`（48 项，含 5 视频 / 2 processing / 1 failed / 4 分组 / 标签，图片全内联 SVG data-URI）+ `bulkAssets(n)` + `makeUploadingAsset`
- [x] `demo/src/data/plugins.ts`：glob `doc.json` + `create.tsx?raw` 提 priority + `make()` 演示配置
- [x] `demo/src/demos/NN-<slug>.tsx` ×20：每页 `meta` + Stage（多数走 `makeStage`，需要宿主状态的 4 页自写 Stage），源码走 `?raw` glob
- [x] `demo/src/demos/codegen.ts`：`buildDemoCode` / `buildFullSource`（内联完整 `SAMPLE_ASSETS`，`renderPluginArg` 剥一层花括号，子路径 import）
- [x] `demo/src/pages/{HomePage,PluginsPage,ScenariosPage}.tsx` + `scenarios/*`（4 个场景：品牌素材库 / 投稿审核 / 视频选题 / 商品选图单选）
- [x] `demo/src/demos/{panels,_factory,DemoPage}.tsx` + `components/ScenarioCard.tsx`
- [x] 验证：`vite build --config demo/vite.config.ts` 成功（376 KB main / 122 KB gzip，含 20 页 + 4 场景）

> 偏离（如实记录）：
> 1. `App.css` 不是「只改四行」——模板自带的 299 行只有令牌与基础排版，通用页面版式
>    （校样板 / 首页 / 工坊 / 代码块 / 场景库 / 示例页 / 响应式）在各包里是重复实现的历史
>    包袱。本次整段复用 `vane-waterfall` 的通用分区（与具体组件无关），删掉 waterfall
>    专属的卡片与场景零件，再补第 9 节「素材墙舞台专属」（浅色令牌覆盖），共 2440 行。
> 2. alias 必须**先精确匹配 barrel** 再匹配子路径：先写通配时
>    `vane-asset-library/custom-plugins` 会被拼成 `src/index.ts/custom-plugins`（ENOENT）。
> 3. 组件样式在 `src/styles/*.css`，demo 用相对路径引入（`main.tsx` 里 tokens → components），
>    与 `vane-card` 一致；消费方写 `import "vane-asset-library/style.css"`。

## P8 自测与体检

- [x] `demo/src/lib/selftest.tsx`：38 条断言（结构 / 选择 / 单选 / 上限 / 键盘 / 分页 / 全选 / 过滤链路 / 空态分叉 / 浮层 / 插件沙箱 / 几何体检 / 外壳与路由），结果写 `document.title`
- [x] `demo/src/lib/audit-asset.ts`：几何体检（舞台高度 / 横向溢出 / 网格 0 列 / 卡片零尺寸 / 缺空态）
- [x] `test/library.test.tsx`（21）+ `test/domain.test.ts`（28）= 49 条：结构、选择语义、blocked、受控、筛选排序分页、槽位、沙箱隔离、生命周期、归一化告警
- [x] 验证：`vitest run` → 49/49；`?selftest=1` → `SELFTEST OK 38/38`（`/plugins`、`/scenarios` 两条路由各复跑一次）

> 关于断言名的口径：实现写的是 `SELFTEST OK n/n` / `SELFTEST FAIL n/n :: 失败项`（不是 PASS），
> 与 `vane-sku` / `vane-comment` 等包一致，便于跨包统一抓取。
>
> 关于「无布局引擎守卫」：本包的 audit 不做「有无布局引擎」判断 —— happy-dom 下所有
> `offsetHeight` 都是 0，加守卫只会让断言静默跳过。做法反过来：audit 只在
> `?selftest=1` 的真实浏览器里跑，happy-dom 里跑的是 49 条纯逻辑单测。
>
> 关于「对比度体检」：见下（P10 补充执行）。

## P9–P10 文档与门禁

- [x] `docs/components/vane-asset-library/{index,api,recipes,plugins}.md`（plugins.md 保留 AUTO-GENERATED 双标记）
- [x] `sync-readme.mjs` 生成 README（首屏含 `npm install vane-asset-library`）
- [x] 先 `vite build --mode lib` 再 `check-packages` → 入口 11.6 KB / 预算 12；全量并集 25.1 / 70
- [x] `check-structure --strict` 0 FAIL；`check-config` 绿；`sync-demo-shell --check` 绿
- [x] 体积：按实测写 `sizeBudgetNote`（两套口径 + 不可裁理由，禁止静默调大）

## P11–P12 聚合与发布

- [ ] `node scripts/build-demos.mjs --only vane-asset-library` + `serve-demo.cjs demos 3350` → 访问 `/vane-asset-library/`（带尾斜杠）正常
- [ ] 阶段性 commit，推 origin main，`git ls-remote` 核 HEAD
- [ ] 【需用户确认】changeset → 版本 → npm 发布 → registry 复核 → 真产物冒烟
