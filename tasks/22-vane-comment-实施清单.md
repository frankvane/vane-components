# vane-comment 实施清单（P1 实施 · 偶数编号，配 21-分析）

> 阶段门禁（全绿才准进下一阶段）：P1 见技能卡"P1 门禁"；P2/P3 见技能卡对应门禁。
> 进度：勾选 + 一行结果。阶段性完成自动 commit + 双远端 push（已授权，不逐项问）。

---

## P1 构建

- [x] **1. 分析文档** — `tasks/21-vane-comment-分析.md`（派系/入口/插槽/插件/数据模型/预算/平台策略全拍板）· 完成
- [ ] **2. 包骨架** — `package.json`(peer 外置 core, exports, sizeBudgetKb:4, subpathBudgets) / `tsconfig.json` / `vite.config.ts` / `eslint.config.js` / `README.md`(首屏 `npm install vane-comment`)
  - 验证：`pnpm sync:exports` 后 exports 含 `.` / `./entries/core` / `./entries/plugins` / `./custom-plugins/*` / `./presets/*`
- [ ] **3. 内核三件套 + 类型 + 插槽**
  - `src/components/CommentPlugin/plugins/types.ts`（Comment/CommentNode/Props/Context/Hooks/SlotName）
  - `src/components/CommentPlugin/plugins/slots.tsx`（CommentSlotProvider / renderCommentSlot(paylaod?) / useCommentSlot / useCommentContext）
  - `src/components/CommentPlugin/CommentCore.tsx`（数据驱动列表：toolbar→list→loadmore→footer；逐条渲染 avatar/name/time/rich content/actions/nested；置顶/删除/空态/loading）
  - `src/components/CommentPlugin/withCommentPlugins.tsx`（接 usePluginRuntime，extendContext 注入 comments(经 transformData)/sortMode/setSortMode；onMount/onPropsChange 桥接；把 transformedData 透给 Core）
  - `src/index.ts` + `src/entries/core.ts` + `src/entries/plugins.ts`
  - 验证：`tsc --noEmit -p tsconfig.json` 0 错误
- [ ] **4. 四个核心插件**（各 create.tsx + doc.json + index.ts）
  - [ ] `LikePlugin` — `renderCommentActions` 点赞按钮 + 本地爆裂动画，调 `props.onLike`
  - [ ] `SortPlugin` — `renderToolbar` 排序栏 + `transformData` 按 `state.sortMode` 重排（newest/oldest/hottest/mostLiked）
  - [ ] `ThreadPlugin` — `renderNested` 递归楼中楼 + `maxDepth` 限深/展开收起 + `renderCommentActions` 内联回复框，调 `onReply`
  - [ ] `RichComposerPlugin` — `renderFooter` 根评论框（emoji/图片/@提及 → `CommentNode[]`），`features` 配置开关，调 `onSubmit`
  - 验证：四个插件 `meta` 挂载正确（Object.assign(create,{meta:doc})）；`tsc`/`eslint` 0 error
- [ ] **5. 三平台预设 + 桶**
  - `src/presets/{video,social,ecommerce}.ts`（同内核 + 四插件差异化配置）
  - `src/custom-plugins/index.ts`（桶）
  - 验证：`pnpm sync:exports` 后 `./presets/video` 等存在
- [ ] **6. P1 门禁**
  - `tsc --noEmit -p tsconfig.json` → 0 错误
  - `eslint .` → 0 error
  - `vite build --mode lib` → 成功（dist 含 index/custom-plugins/*/presets/* ）
  - `node scripts/check-packages.mjs` → 体积门 + 包卫生绿
  - 验证方式：CI 可跑；本地逐项执行
- [ ] **7. 阶段性提交推送** — commit（骨架/内核/插件/预设分开或合一，视进度） + `git push origin main` + `git push github main` + `git ls-remote` 核实两端 HEAD 一致

---

## P2 DEMO（profile 模式四层：App 单体外壳 + demos/ 逐项示例 + scenarios 场景板）

- [ ] **8. demo 四层结构** — `App.tsx`(NAV+面包屑+可折叠导航) / `demos/`(import.meta.glob 逐项 + `?raw` 源码面板) / `pages/`(Home/Plugins/Scenarios/DemoRoute key={slug}) / `lib/`(selftest + audit 几何体检) / `components/`(CodeBlock/highlight/ScenarioCard)
- [ ] **9. 消费者视角包名导入** — demo 一律 `from "vane-comment/custom-plugins/Xxx"`；`demo/vite.config.ts` 加 alias 包名→src（具体在前、通配在后，保留 `@/`）
- [ ] **10. CSS 移植** — 复制 profile 模式 `App.css` 基底，`:root` 令牌换评论区识别色，自查 `var(--` 均有定义
- [ ] **11. 自测** — `lib/selftest.tsx`(`?selftest=1`→`document.title="SELFTEST PASS n/n"`) + `audit-*.ts` 几何体检（无布局引擎守卫）+ `test/selftest.dom.test.tsx`
- [ ] **12. demo 场景** — 视频/社交/电商三套（对应预设）+ 四插件逐项示例 + 总览 + 工坊
- [ ] **13. P2 门禁** — `build:demo` 成功 → serve-demo 起服务 → `?selftest=1` 读回 PASS n/n → 关键卡片截图核验

---

## P3 发布

- [ ] **14. 文档四件** — `docs/components/vane-comment/{index.md,api.md,recipes.md,plugins.md}`；`sync-readme.mjs` 从 index.md 生成 README；`docs:plugins` 生成插件目录（跑完 `git checkout` 回滚其他包）
- [ ] **15. changeset** — `.changeset/vane-comment-0.1.0.md`
- [ ] **16. 全量验证** — tsc 0 → eslint 0 → vitest 全过 → check-packages 绿 → lib+demo build 成功 → 浏览器自测 PASS
- [ ] **17. 双远端推送 + npm 发布** — `git push origin/github` + `npm publish`（Clash 7890 + `CODEBUDDY_SAFE_DELETE_ENABLED=0`）+ registry API 复核 dist-tags

---

## 关键验收点（贯穿 P1–P3）

- 楼中楼：≥3 层嵌套渲染、限深折叠、内联回复提交后数据回流
- 富编辑：emoji/图片/@提及 产出结构化 `CommentNode[]` 并被 Core 正确渲染
- 排序：切 mode 后列表即时重排（经内核 state，非本地数组）
- 点赞：点击回调 `onLike(id,next)` + 局部爆裂动画，consumer 数据回流后计数/态更新
- 通用：video/social/ecommerce 三预设各自装配，内核零改动
