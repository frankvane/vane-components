# 34 · vane-danmaku 实施清单

> 对应 `tasks/33-vane-danmaku-分析.md`。阶段性完成自动提交推送（user 已授权），不逐项问。
> 顺序铁律：`sync:exports` → `docs:plugins` → `docs:sync`；先 `vite build --mode lib` 再 `check-packages.mjs`。

## P1 构建

- [ ] **脚手架**：`node scripts/create-component.mjs vane-danmaku --title "弹幕" --desc "插件式 React 弹幕组件（canvas 渲染 + 业务语义插件）"` → `pnpm install` → `node scripts/sync-exports.mjs`
- [ ] **自检扫描**：`check-structure.mjs` / `check-config.mjs` grep 得到 `vane-danmaku`（动态扫描，无需登记）
- [ ] **依赖派系**：确认 `vane-plugin-core` 在 `peerDependencies`（`workspace:*`）；react/react-dom 仅 peer；MediaPipe 不进 dependencies
- [ ] **入口聚合**：`src/index.ts`（DanmakuCore + withDanmakuPlugins + 类型）/ `src/entries/core.ts` / `src/entries/plugins.ts`；根不桶导出插件（ADR-6）
- [ ] **内核 DanmakuCore / TrackRender**：`<canvas>` + rAF 循环；`Renderer` 抽象（`Canvas2DRenderer` 起步）；轨道调度 + `computeLayout` 补坐标；每帧消费 `avoidZones`；纯 canvas 绘制文字/粉丝牌/高赞环。自检 ≤150 行（渲染+生命周期，可变需求全交插件）
- [ ] **契约**：`forwardRef` + `useImperativeHandle`(getContainer/forceUpdate/getSize) + `containerRefExternal` + onMount/onUnmount；工厂模块顶层调用；context 用 getter
- [ ] **数据面插件 18 个**（priority 10–29，三件套 + doc.json + `.meta`）：SensitiveFilter / FanBadge / PinnedTop / CmdParse / Dedup / RateLimit / KeywordHighlight / KeywordBlock / UserMute / EmojiRender / AtMention / GiftCombo / LangFilter / AuditLog / StylePreset / TrackStrategy / SpeedControl / ColorPolicy
- [ ] **UI 面插件 5 个**（priority 30–49，DOM slot）：SettingsPanel(renderOverlay) / FilterToggle(renderToolbar) / CommandInput(renderFooter) / StatsBar(renderToolbar) / SafeZone(lifecycle+data, `getAvoidZones` 契约 + 静态安全区默认)
- [ ] **插件三件套**：`src/custom-plugins/<Name>Plugin/{create.tsx,doc.json,index.ts}`，缺一 A3 FAIL；实现放 `src/custom-plugins/`（勿放 `components/**/custom-plugins/`）
- [ ] **P1 门禁**：`./node_modules/.bin/tsc --noEmit` 0 → `../../node_modules/.bin/eslint .` 0 → `vite build --mode lib` 成功 → 仓库根 `node scripts/check-packages.mjs` 绿（先 build 再 check）；`check-structure.mjs --strict` 0

## P2 DEMO

- [ ] **外壳四件生成物**：只写 `demo/src/demo.config.tsx` + `demo/src/App.css`；`vane.demo` 五项(brand/subtitle/title/accent/bg)与 config 一致
- [ ] **demos/ 逐项示例层**：`import.meta.glob("./[0-9]*.tsx",{eager:true})` + `?raw` 同源；每页 `meta`(slug/plugin) + 默认 Stage；渲染体内严禁无条件调装配工厂
- [ ] **codegen.ts + components/data**：最小装配生成；`highlight.ts`(ReactNode,禁 innerHTML) / `CodeBlock` / `ScenarioCard` / `data/plugins.ts`(glob doc.json + create.tsx 提 priority + DEFS make())
- [ ] **demo vite alias**：通配在前(`/^vane-danmaku\/custom-plugins\/(.+)$/`)、裸名在后(`vane-danmaku`→`src/index.ts`)；`createDemoConfig({root,port,outDir:"demo-dist",open:"/demo/index.html"})`
- [ ] **防遮挡 demo 集成**：demo 内（非发布包）接 MediaPipe Selfie Segmentation，可视化避让区矩形；走 SafeZonePlugin 的 `setAvoidZones` 注入
- [ ] **样式/可访问性**：DOM slot 层全内联 tokens；容器有 bg 必有 color；不用 opacity 压字；ADR-13 门槛(正文≥4.5/禁用≥3/UI≥3)
- [ ] **自测 + 体检**：`lib/selftest.tsx`(`?selftest=1`→`document.title`=SELFTEST PASS n/n) + `lib/audit-geometry.ts`(越界/负坐标/重叠/scrollHeight)；`test/selftest.dom.test.tsx`(happy-dom,布局探测 guard)
- [ ] **P2 门禁**：`build:demo` 成功 → `serve:demo` → `?selftest=1` PASS n/n → 对比度 0 处不达标

## P3 文档·测试·门禁·发布

- [ ] **文档四件**：`docs/components/vane-danmaku/{index,api,recipes,plugins}.md`；`plugins.md` 留 AUTO-GENERATED 标记；`recipes.md` 写 MediaPipe 消费方集成（SafeZonePlugin + Selfie Seg 示例）
- [ ] **生成物 sync**：`generate-plugin-docs.mjs`（跨包副作用，**跑完 `git status` 回滚无关包**）→ `sync-readme.mjs`；子路径与 exports 逐字对齐（`<Name>Plugin` 非 `<Name>`）
- [ ] **测试**：`vitest run`（happy-dom，`fileParallelism:false` 已内置）；覆盖工厂结构/meta、withPlugins 装配 onMount 被调、renderOverlay 进 DOM、单插件抛错隔离、CmdParse 拦截、SensitiveFilter 打码
- [ ] **门禁全量**：`pnpm verify` 全绿（含 `--strict`）；先 build 再 check
- [ ] **聚合预览**：`build-demos` → `serve-demo` → 访问 `/vane-danmaku/`（带尾斜杠）→ `?selftest=1` PASS
- [ ] **双远端**：阶段 commit（骨架/插件/demo/修复分开）→ `git push origin main`(gitee) + `git push github main`(github) → `git ls-remote` 核两端 HEAD
- [ ] **发布【须用户显式确认】**：changeset → `workspace:*` 临时改 `*` → `--dry-run` → 正式发 `--registry https://registry.npmjs.org` → `git checkout -- package.json` → registry API 复核版本与 latest
