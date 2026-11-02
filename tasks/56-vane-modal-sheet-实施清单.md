# 56 · vane-modal-sheet 实施清单

> 对应 `tasks/55-vane-modal-sheet-分析.md`。阶段性完成自动提交推送（user 已授权），不逐项问。
> 顺序铁律：`sync:exports` → `docs:plugins` → `docs:sync`；先 `vite build --mode lib` 再 `check-packages.mjs`。
> 批次：本清单覆盖 **MVP 10 插件**（A 全部 + KeyboardAvoid / ScrollLock / FocusTrap）；二批（B 剩余 6 + C 全部 5）、三批（D 领域 5）在 MVP 验收后另列增补项。

## P1 构建

- [ ] **脚手架**：`node scripts/create-component.mjs vane-modal-sheet --title "底部弹层" --desc "插件式 React 底部弹层（snap 吸附 + 原生拖拽 + 零第三方依赖）"` → `pnpm install` → `node scripts/sync-exports.mjs`
- [ ] **自检扫描**：`check-structure.mjs` / `check-config.mjs` grep 得到 `vane-modal-sheet`（动态扫描，无需登记）
- [ ] **依赖派系**：确认 `vane-plugin-core` 在 `peerDependencies`（`workspace:*`）；react/react-dom 仅 peer；运行时零第三方依赖（无 motion）
- [ ] **入口聚合**：`src/index.ts`（ModalSheetCore + withModalSheetPlugins + 类型）/ `src/entries/core.ts` / `src/entries/plugins.ts`；根不桶导出插件（ADR-6）
- [ ] **内核 ModalSheetCore**：Portal + snap 状态机（closed/opening/open@snap/dragging/resolve）+ Pointer Events 拖拽引擎（setPointerCapture、逐帧速度采样、拖拽期 transition:none 直写 translate3d）+ CSS transition 补间（prefersReducedMotion 跳过）；自检 ≤150 行（渲染+生命周期+几何，可变需求全交插件）
- [ ] **决策引擎**：`resolveSnap({y, velocity, snapPoints, velocityThreshold, closeThreshold}) → {type:'snap',index} | {type:'close'}` 纯函数独立文件（`_shared` 或内核目录，非入口），供 CI 全量单测
- [ ] **契约**：`forwardRef` + `useImperativeHandle`(snapTo/getProgress/getCurrentSnap/getContainer/forceUpdate) + `containerRefExternal` + onMount/onUnmount；工厂模块顶层调用；context 时基值（progress/currentSnap/height）用 getter；`getDragProps()` 拖拽面注册
- [ ] **A 结构视觉槽插件 7 个**（三件套 + doc.json + `.meta`）：Backdrop(10) / DragHandle(20) / SnapDots(24) / Header(30) / StepFlow(32) / SearchBar(34) / Footer(40)
- [ ] **B 行为插件 MVP 3 个**：KeyboardAvoid(50) / ScrollLock(52) / FocusTrap(54)
- [ ] **插件三件套**：`src/custom-plugins/<Name>Plugin/{create.tsx,doc.json,index.ts}`，缺一 A3 FAIL；实现放 `src/custom-plugins/`（勿放 `components/**/custom-plugins/`）
- [ ] **样式**：`src/styles/{tokens,components}.css`（`--vane-modal-sheet-*`，class 前缀 `vc-ms-`）→ css-copy 产 `dist/style.css` + `exports["./style.css"]`；`sideEffects: ["**/*.css"]`
- [ ] **P1 门禁**：`./node_modules/.bin/tsc --noEmit` 0 → `../../node_modules/.bin/eslint .` 0 → `vite build --mode lib` 成功 → 仓库根 `node scripts/check-packages.mjs` 绿（先 build 再 check）；`check-structure.mjs --strict` 0

## P2 DEMO

- [ ] **外壳四件生成物**：只写 `demo/src/demo.config.tsx` + `demo/src/App.css`；`vane.demo` 五项(brand/subtitle/title/accent/bg)与 config 一致
- [ ] **demos/ 逐项示例层**：`import.meta.glob("./[0-9]*.tsx",{eager:true})` + `?raw` 同源；每页 `meta`(slug/plugin) + 默认 Stage；MVP 至少：基础联系人选择 / 多档 snap+SnapDots / detent:content / 无遮罩 unstyled / 键盘避让表单 / 命令式 snapTo+progress 联动
- [ ] **codegen.ts + components/data**：最小装配生成（拖控件=改代码）；`highlight.ts`/`CodeBlock`/`ScenarioCard`/`data/plugins.ts`
- [ ] **demo vite alias**：通配在前(`/^vane-modal-sheet\/custom-plugins\/(.+)$/`)、裸名在后(`vane-modal-sheet`→`src/index.ts`)；`createDemoConfig({root,port,outDir:"demo-dist",open:"/demo/index.html"})`
- [ ] **样式/可访问性**：容器自带 color+background；拖拽指示条 UI ≥3:1；不用 opacity 压字；ADR-13 门槛(正文≥4.5/禁用≥3/UI≥3)
- [ ] **自测 + 体检**：`lib/selftest.tsx`(`?selftest=1`→`document.title`=SELFTEST PASS n/n)；拖拽用 dispatchEvent(pointer) + await tick 模拟；`test/selftest.dom.test.tsx`(happy-dom,布局探测 guard)
- [ ] **P2 门禁**：`build:demo` 成功 → `serve:demo` → `?selftest=1` PASS n/n → 对比度 0 处不达标

## P3 文档·测试·门禁·发布

- [ ] **文档四件**：`docs/components/vane-modal-sheet/{index,api,recipes,plugins}.md`；`plugins.md` 留 AUTO-GENERATED 标记；`recipes.md` 写与 react-modal-sheet 的迁移对照（motion 联动 → progress getter 范式）
- [ ] **生成物 sync**：`generate-plugin-docs.mjs`（跨包副作用，**跑完 `git status` 回滚无关包**）→ `sync-readme.mjs`；子路径与 exports 逐字对齐（`<Name>Plugin` 非 `<Name>`）
- [ ] **测试**：`vitest run`（happy-dom，`fileParallelism:false` 已内置）；覆盖：`resolveSnap` 纯函数全分支（速度关/比例关/最近档）、工厂结构/meta、withPlugins 装配 onMount 被调、renderBackdrop/renderHandle 进 DOM、单插件抛错隔离、snapTo 命令式换档、getDragProps 拖拽面挂载
- [ ] **门禁全量**：`pnpm verify` 全绿（含 `--strict`）；先 build 再 check
- [ ] **聚合预览**：`build-demos` → `serve-demo` → 访问 `/vane-modal-sheet/`（带尾斜杠）→ `?selftest=1` PASS
- [ ] **双远端**：阶段 commit（骨架/插件/demo/修复分开）→ `git push origin main`(gitee) + `git push github main`(github) → `git ls-remote` 核两端 HEAD
- [ ] **发布【须用户显式确认】**：changeset → `workspace:*` 临时改 `*` → `--dry-run` → 正式发 `--registry https://registry.npmjs.org` → `git checkout -- package.json` → registry API 复核版本与 latest

## 二批/三批增补（MVP 验收后启动）

- [ ] 二批 B 剩余：EscClose(56) / NestedScroll(58) / SafeArea(60) / Responsive(62) / KeepMounted(64) / History(66)
- [ ] 二批 C 全部：ModalEffect(80) / Haptics(82) / Announcer(84) / LoadingState(86) / EmptyState(88)
- [ ] 三批 D 全部：ListSelect(90) / ActionSheet(92) / Confirm(94) / SharePanel(96) / FilterPanel(98)
- [ ] 四批 E 跨包组合：CartSheet / CommentSheet / ImageBrowser / CouponSelector / SignInSheet / ProfileCardSheet（逐项单独排期）
