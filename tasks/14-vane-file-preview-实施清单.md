# 14 · vane-file-preview 实施清单（阶段 / 任务 / 验收门）

> 用法：每完成一项打勾；**每个阶段末尾有验收门，不过门不进下一阶段**。
> 分析依据见 `tasks/13-vane-file-preview-迁移分析.md`（下称「分析」）。
> 参照实现：`packages/vane-card`（P3 已完成，阶段划分与取舍可直接对照 `tasks/12`）。

---

## 阶段总览

| 阶段 | 内容 | 交付物 | 验收门（一句话） |
| --- | --- | --- | --- |
| **P0** | 决策拍板 + 基线固化 | 6 个决策结论 + 体积/类型基线 | 决策落纸，基线可复现 |
| **P1** | 包骨架 + Core 迁入 + demo 指回源码 | 能 build 的空壳包 + demo 只读 src | `build` 出 dist，demo 不再依赖 dist 自引用 |
| **P2** | 插件系统替换 + 路由纯函数 | 删 689 行，接 `@vane/plugin-core` | `resolvePreview()` 单测全绿，17 插件能被路由到 |
| **P3** | 17 个插件分批迁入 | 17 个目录化插件 + 17 份 `doc.json` | 17/17 通过 schema，`typecheck` 0 错 |
| **P4** | 依赖边界与体积工程 | optional peer + 子路径 external + 降级面板 | 根入口 ≤12KB，`dist` 无重依赖特征串 |
| **P5** | demo 重写（三视角） | 工坊 17 + 逐项 17 + 场景 6 | 40 页逐页几何 0 命中 |
| **P6** | 文档 / README / 发布 | 文档四件套 + README + changeset | `check-packages` 全绿，`npm pack` 干净 |

---

## 基线（P0 固化，后续阶段以此为准）

```
包名            vane-file-preview
归档版本        1.0.4（npm latest 1.0.5，解包 2.09MB / 38 文件）
源码            54 文件 / 11275 行（.ts/.tsx）
插件            17 个（轻量 6 / 重依赖 11）
自建插件系统    5 文件 / 689 行（整体删除）
demo            13 个示例页 + Home + ReadmeDemo + _layout
样本文件        public/ 37 个真实文件 / 15MB
```

**实测基线（改动前，务必记录在案）**

| 项 | 值 |
| --- | --- |
| `npx tsc -b` | **15 error** |
| `npx vite build --mode lib` | 成功，`index.es.js` 985.97 kB / gzip 196.33 kB |
| dts 阶段 | 1 error（`TS2742`，`createIsolatedOverlay` 返回类型引用 `.pnpm/csstype`） |
| demo 构建 | **依赖 `dist/` 自引用**才能成功；`index.es-*.js` 2143.71 kB / gzip 634.47 |
| `dependencies` | **26 个**，其中死依赖 6 个 |

---

## P0 · 决策拍板与基线固化

- [ ] **P0.1 拍板 D1（17 个插件处置）**：**D1-A 全留 17 个**，不合并 Docx×2（合并会同时引入 `docx-preview` + `mammoth`，体积负优化）；把 `docxMode` / `previewMode` 的路由从 demo 移进库；`OfficePreviewPlugin` 保留但明确「只能公网 URL」
- [ ] **P0.2 拍板 D2（重依赖归属）**：**D2-A optional peer**（`peerDependenciesMeta`）；`dependencies: {}`
- [ ] **P0.3 拍板 D3（入口结构）**：根入口只出 core + 6 个轻量插件；`./custom-plugins/*` 逐插件；`custom-plugins/index.ts` 保留为逃生口但**不被根入口静态引用**
- [ ] **P0.4 拍板 D4（样式）**：**D4-A 内联沿用**，只抽「容器 + 工具栏」为 `--vfp-*` 变量 + 可选 `style.css`
- [ ] **P0.5 拍板 D5（内核）**：**D5-A 内联打包 `@vane/plugin-core`**（不设 peer）；路由做包内纯函数 `resolvePreview()`
- [ ] **P0.6 拍板 D6（demo）**：**三视角**（工坊 17 + 逐项 17 + 场景 6），不做布局视角
- [ ] **P0.7 固化体积基线**：把上表 196.33KB / 634.47KB 记入本文「执行记录」，作为「不得劣化」的对照（新架构目标见 P4）

**验收门 P0**：D1–D6 结论落纸并被 `docs/guide/decisions.md` 引用；基线四条命令的结果可复现。

---

## P1 · 包骨架 + Core 迁入 + demo 指回源码

### P1.1 骨架与依赖

- [ ] `packages/vane-file-preview/` 目录（复制 `packages/templates/plugin-component` 骨架）
- [ ] `package.json`
  - [ ] `peerDependencies`: `react >=16.8`、`react-dom >=16.8`（**不设 `@vane/plugin-core`**）
  - [ ] `dependencies`: **空**（删 26 个；6 个死依赖彻底删；`react`/`react-dom`/`react-router-dom` 移到 peer 或 demo devDeps）
  - [ ] `devDependencies`: `@vane/{build-config,eslint-config,tsconfig,vitest-config,plugin-core}`、react 18、vite 5、vitest 2、`react-router-dom`（仅 demo）
  - [ ] `files: ["dist"]`、`sideEffects: false`、`publicDir: false`
  - [ ] `vane.sizeBudgetKb: 12`、`vane.coreSizeBudgetKb: 8`、`vane.fullSizeBudgetKb: 90`
- [ ] `tsconfig.json` / `tsconfig.lib.json` / `vite.config.ts`（`createLibConfig`）/ `vitest.config.ts` / `eslint.config.js`
- [ ] **关掉 `publicDir`**，并在 P6 用 `npm pack` 复核不含样本文件

### P1.2 Core 迁入（`FilePreviewCore`）

- [ ] `src/components/FilePreviewCore/FilePreviewCore.tsx`（原 227 行）迁入，改动仅限：
  - [ ] import 路径改本地；`containerRefExternal` / `contentRefExternal` 双通道保留（`withPlugins` 靠它拿容器）
  - [ ] `(props.containerRefExternal as any).current = el` 的类型逃逸去掉（改 `MutableRefObject`）
  - [ ] `useMemo` 的 `containerStyles` / `contentStyles` 保留（它们只是对象，不涉逻辑）
- [ ] **状态机收敛为唯一一份**（分析 4.3）：
  - [ ] `startLoad` 的守卫改**函数式**（`setState(prev => …)`），不再依赖 `state` 闭包
  - [ ] **删掉 `useEffect(() => startLoad(), [startLoad])`**（它是 `reset()` 失效与 `onBeforeLoad` 死循环的来源）；改为 `useEffect(..., [file.url])` 显式触发
  - [ ] 新增 `reportState(patch)`：插件上报 `loading / loaded / error / progress`，Core 是唯一真源
- [ ] `test/core-state.test.ts`：`reload` / `reset`（**断言 reset 之后停在 idle，不会自己跑回 loaded**）/ `onBeforeLoad:false`（**断言只跑一次，不循环**）/ error 分支
- [ ] `test/core-render.test.ts`：容器/内容两层 class + style 合并优先级 + `children` 位置

### P1.3 demo 指回源码（**本阶段最重要的一步**）

- [ ] `demo/vite.config.ts`：`createDemoConfig` + 包名 alias（`vane-file-preview` → `src/index.ts`，`/core`、`/plugins`、`/custom-plugins/*` 同步）
- [ ] `tsconfig.json` 的 `paths` 同步（只服务 demo）
- [ ] **验证方式**：删掉 `dist/`，`pnpm build:demo` 仍必须成功（当前是「必须有 dist 才能构建」，见分析第三节）
- [ ] 把 13 个旧示例页原样搬进 `demo/src/legacy/`（**只作冒烟素材**，P5 重写），跑一次冒烟脚本记录问题

**验收门 P1**：`build` 产出 dist 且 `exports["."]` 有效；`typecheck` 0 错；`core-state` + `core-render` 单测通过；**删掉 dist 后 demo 仍能构建**；`dist` 内无样本文件。

---

## P2 · 插件系统替换（删 689 行，接内核）

- [ ] **P2.1 删除** `plugins/{PluginManager.ts,PluginBus.ts}`（`types.ts` / `withPlugins.tsx` 重写后保留；`index.ts` 改导出）
- [ ] **P2.2 重写 `plugins/types.ts`**
  - [ ] 钩子面 **17 → 11**：删 `onBeforeLoad` / `onLoadProgress` / `onDownload` / `onZoom` / `onRotate` / `onFullscreen`；
        删重复的 `onMount` / `onUnmount` / `renderOverlay` / `transformData`（内核已有）；
        `getPriority` 删掉（改声明式 `priority`）
  - [ ] 保留领域钩子 **6 个**：`canHandle(file)` / `render(context)` / `renderToolbar(context)` / `onLoadStart` / `onLoadSuccess` / `onLoadError`
  - [ ] `PluginContext` 继承内核 `PluginContext<TProps,TData>`，`TProps = FilePreviewCoreProps`、`TData = FileInfo`
  - [ ] **删 `progress` / `dimensions`**（永远 undefined，见分析 4.3），需要时用 `setState` 带 `progress`
  - [ ] `FileInfo` 类型保持不动（`previewMode` / `docxMode` 保留并**在库内生效**）
- [ ] **P2.3 重写 `plugins/withPlugins.tsx`**（照 vane-card 同名文件）
  - [ ] 用内核 `withPlugins` + `composeSlots`：`renderHeader` ← `renderToolbar`、默认段 ← `render`
  - [ ] 插件集合按「装配键」稳定（第二个参数允许 `{ plugins, key }`），避免 11 个 demo 页那种「每次渲染新数组」（13 个页面里 11 个未 memo）
  - [ ] 去掉 `isPdfPlugin = activePlugin?.name === "PdfPreviewPlugin"` 的**硬编码插件名**（分析 4.4）：改由插件 `render` 自己决定滚动容器，或统一 `overflow: auto` + 插件内部 `overscroll-behavior`
  - [ ] 去掉「每次渲染遍历全部插件调 `renderOverlay`」（0 个插件实现它）
- [ ] **P2.4 路由纯函数 `plugins/resolve.ts`**
  - [ ] `resolvePreview(plugins, file): FilePreviewPlugin | null` —— `canHandle` 优先，其次 `supportedTypes` / `supportedExtensions`，`priority` 降序
  - [ ] 把 `docxMode` / `previewMode` 的判定写进**库内**（不再散落 demo）：`DocxPreviewPlugin` 与 `MammothDocxPlugin` 各在 `canHandle` 里读
  - [ ] `test/resolve.test.ts`：17 个插件 + 17 种文件 → 断言赢家；同类型两个插件 → 按 `priority`；`docxMode` 切换 → 赢家切换
- [ ] **P2.5 单测（第二批）**
  - [ ] `test/bus.test.ts`：内核总线契约（`emit/on/off` + `sharedData` 跨插件可见）
  - [ ] `test/lifecycle.test.ts`：重渲染**不重建**插件实例（断言 `register` 只调一次）；`file` 变化时钩子重新触发

**验收门 P2**：自建插件系统 2 个文件已删（`types.ts` / `withPlugins.tsx` 已重写而非本地实现）；`typecheck` 0 错；`test` ≥ 12 通过；`resolvePreview()` 对 17 种文件全部选对。

---

## P3 · 17 个插件分批迁入

> 统一要求：每个插件一个**目录**（`custom-plugins/<Name>/index.tsx` + `doc.json`），
> 因为 `discover-entries.mjs` 只把「目录形态」识别为发布子路径（分析第七节）。

### P3.1 A 级 6 个（近零改动）

- [ ] `ImagePreviewPlugin`（301）—— 自研缩放/旋转，改 import 即可
- [ ] `PdfPreviewPlugin`（116）—— 删掉底部**未使用**的 `toolbarButtonStyle` 常量
- [ ] `VideoPreviewPlugin`（151）
- [ ] `AudioPreviewPlugin`（177）
- [ ] `DownloadPlugin`（175）
- [ ] `OfficePreviewPlugin`（253）—— 补运行期检测：`blob:` / `localhost` / 内网地址时改为「需要公网可访问的 URL」提示（分析 R5）
- [ ] 每插件 `doc.json`：`config` 从源码类型 + 工厂默认值抽取，一句话描述人工校对（6/6 过 schema）

### P3.2 B 级 7 个（依赖边界）

- [ ] `ZipPreviewPlugin`（233 / `jszip`）
- [ ] `JsonPreviewPlugin`（640 / `@uiw/react-json-view`）—— **10 个主题子路径收敛到 2 个**（亮 / 暗），或改 `style` 对象
- [ ] `XmlPreviewPlugin`（423 / `react-xml-viewer`）—— **修 `../../plugins/types` → `../plugins/types`**（当前 TS2307）；`style` prop 不在 `XMLViewerProps` 里，改外层容器控制
- [ ] `XlsxPreviewPlugin`（374 / `xlsx`）—— 大文件分块；文档注明 `xlsx` 的 license
- [ ] `PptxPreviewPlugin`（553 / `jszip`）—— **UI 标注「文本大纲预览」**（它只抽 `ppt/slides/*.xml` 的文本，无版式与图片）
- [ ] `DocxPreviewPlugin`（289 / `docx-preview`）—— `canHandle` 读 `file.docxMode`
- [ ] `MammothDocxPlugin`（237 / `mammoth/mammoth.browser`）—— 同上，默认值 `mammoth`

### P3.3 C 级 4 个（拆分 / 重构）

- [ ] `CodePreviewPlugin`（1572 / 7 文件）—— **41 套 prism 主题 → 2~3 套**（实测一个主题桶就拖出 792KB chunk）；`preferences.ts` 的 localStorage 键加前缀且可关
- [ ] `MarkdownPreviewPlugin`（601）—— `rehype-raw` **默认关闭**（XSS 面），开启需 `allowHtml: true`；`remark-breaks` 可内联实现
- [ ] `CsvPreviewPlugin`（730 / 单文件）—— 拆 `parse.ts` / `Table.tsx` / `Toolbar.tsx`；37 处内联样式只留几何值
- [ ] `SimpleReactReaderEpubPlugin`（186 / `react-reader`）—— 独立子路径；文档标注「引入约 200KB+（epub.js）」
- [ ] `shared/ToolbarComponents.tsx` —— **`FileInfo` 组件改名 `FileMeta`**（与文件元数据类型 `FileInfo` 撞名，分析 4.6）
- [ ] `styles/isolatedStyles.ts` —— 显式标 `React.CSSProperties` 返回类型（修 `TS2742`），并升级为公共 toolkit

### P3.4 桶文件与 doc

- [ ] `custom-plugins/index.ts`：17 个导出，按 `media`（5）/ `document`（5）/ `data`（3）/ `archive`（1）/ `other`（3）分组
- [ ] `src/plugins.ts`：**只出 6 个轻量插件**（Image / Pdf / Video / Audio / Download / Office）
- [ ] `pnpm docs:plugins` 生成 17 行

### P3.5 单测（第三批）

- [ ] 每个插件：工厂返回 `{ name, hooks }`、`doc.json` 可解析、`config` 字段完整（17 × 3 表驱动）
- [ ] 端到端 3 个：CSV 解析出首行表头 / DOCX 两种模式命中不同插件 / 未知类型落到 `unsupported`

**验收门 P3**：`doc.json` **17/17**；桶文件 17 导出无遗漏；`docs:plugins` 生成 17 行；`typecheck` 0 错；`test` ≥ 40 通过。

---

## P4 · 依赖边界与体积工程（本包独有，前三包没有这一关）

- [ ] **P4.1 单插件子路径入口**：17 个 `custom-plugins/<Name>/index.tsx`，每人的重依赖只在该文件里 import
- [ ] **P4.2 external 支持子路径**（基础设施改动，`internal/build-config`）
  - [ ] `LibOptions.external` 放宽为 `(string | RegExp)[]`，透传给 `rollupOptions.external`
  - [ ] 本包传 `/^mammoth(\/|$)/`、`/^react-syntax-highlighter(\/|$)/`、`/^@uiw\/react-json-view(\/|$)/`、`/^react-reader(\/|$)/`、`/^docx-preview$/`、`/^xlsx$/`、`/^jszip$/`、`/^papaparse$/`、`/^react-markdown$/`、`/^rehype-/`、`/^remark-/`、`/^react-xml-viewer$/`
  - [ ] **闸门断言**：`dist/**/*.js` 内不得出现 `mammoth` / `prism` 主题特征串（当前 986KB 的根因，分析 1.4）
- [ ] **P4.3 optional peer 声明**（**16 个，一个字都不多不少**——这是代码里真实 import 的完整集合，已用脚本核对）
  - [ ] 文本 / 结构：`docx-preview`、`mammoth`、`xlsx`、`jszip`、`papaparse`、`react-xml-viewer`
  - [ ] Markdown 链：`react-markdown`、`remark-breaks`、`remark-gfm`、`remark-math`、`rehype-highlight`、`rehype-katex`、`rehype-raw`
  - [ ] 富组件：`@uiw/react-json-view`、`react-syntax-highlighter`、`react-reader`
  - [ ] 全部 `peerDependenciesMeta.*.optional: true`
  - [ ] `pdfjs-dist` / `react-pdf` / `react-player` / `react-h5-audio-player` / `pptx-parser` / `highlight.js` **一个都不声明**（代码 0 引用）
- [ ] **P4.4 友好降级面板**
  - [ ] `custom-plugins/shared/MissingDependency.tsx`：`未安装 <pkg>，请 npm i <pkg>`（带包名与一行命令）
  - [ ] 每个重依赖插件：`try { const m = await import("x") } catch { return <MissingDependency pkg="x" /> }`
  - [ ] 单测：mock `import` reject → 断言渲染出提示而不是抛错
- [ ] **P4.5 体积三口径**：根入口 ≤12KB / `./core` ≤8KB / 全量并集 ≤90KB，写进 `vane` 字段

**验收门 P4**：`node scripts/check-packages.mjs` 三条线全绿；根入口 gzip ≤12KB；`dist` 无重依赖特征串；`dependencies` 为 `{}`；未安装 optional peer 时**渲染提示而不是白屏**。

---

## P5 · demo 重写（三视角）

- [ ] **P5.1 骨架**：`demo/vite.config.ts`（`createDemoConfig`）、`App.tsx`（4 项导航）、`pages/{HomePage,WorkshopPage,DemosPage,ScenariosPage}.tsx`
- [ ] **P5.2 样本资产**：`public/` 37 个真实文件（15MB）搬进 `demo/public/`（**绝不进 dist**）
- [ ] **P5.3 工坊（17 张卡）**：每卡 = 一个插件 + 一个默认文件 + 配置项说明 + 一句「拿手的活」
- [ ] **P5.4 逐项示例（17 页）**
  - [ ] 一文件一页：`demo/src/demos/<NN>-<slug>.tsx`，双 glob（eager 组件 + `?raw` 同源，同 vane-card）
  - [ ] 每页 = 左预览（可切 2~3 个样本文件）+ 右事件/状态 + 下通栏源码
  - [ ] **装配写成模块顶层常量**（`const Preview = makePreview([...])`），禁止在函数体内调 `withPlugins`（当前 11 个页面就是这么写的）
- [ ] **P5.5 场景（6 个）**
  - [ ] 上传即预览（拖拽 + 类型分流）/ 邮件附件列表 / 文档审批（左右对比）/ 素材库（图 + 视频混合）/ 数据导入（CSV 映射列）/ 代码评审（diff 视角）
- [ ] **P5.6 体检闸门**
  - [ ] `scripts/audit-pages.mjs`：真浏览器逐页断言「预览器容器存在 + 非零尺寸 + 无 pageerror + 无 overflow」，块锚点 `[data-demo]` / `[data-scenario]` / `[data-plugin]`
  - [ ] `demo/src/lib/audit.ts` 同源判据（浏览器里可手点复现）

**验收门 P5**：40 页（17 逐项 + 17 工坊 + 6 场景）逐页几何 **0 命中**；每页有可复制源码；17 插件在 demo 中**至少装配一次**（脚本化覆盖闸门）。

---

## P6 · 文档 / README / 体积 / 发布

- [ ] **P6.1** `docs/components/vane-file-preview/` 四件套
  - [ ] `index.md`：卖点 + 安装 + 30 秒示例 + **按文件类型装依赖的表格**（这是本包最容易踩的坑）+ 插件速览 + 1.x 迁移差异
  - [ ] `api.md`：`FilePreviewCoreProps` / `FilePreviewCoreRef` / 插件 context / **11 个钩子** / `resolvePreview` 契约
  - [ ] `plugins.md`：17 个插件 × （职责 / 依赖 / 能力边界 / 配置）——**必须写清 4 条边界**：Office 需公网 URL、Pptx 只出文本、Epub 引入 200KB+、Docx 两种模式二选一
  - [ ] `recipes.md`：3 个配方（上传即预览 / 附件列表 / 多类型分流）
- [ ] **P6.2 README**：`node scripts/sync-readme.mjs` 生成
- [ ] **P6.3** `docs/guide/decisions.md` 补 ADR（17→11 钩子面、路由纯函数、optional peer、主题收敛）
- [ ] **P6.4** `.changeset/vane-file-preview-200.md`（major）：exports 变更 + 依赖变更 + 钩子面变更
- [ ] **P6.5** `npm pack --dry-run`：只含 `dist` + `README` + `package.json`；**不含 `public/` 样本、不含 demo**
- [ ] **P6.6** 回归：`eslint` 0 / `tsc --noEmit` 0 / `vitest` ≥40 / `check-packages` 三线全绿 / `vitepress build` 通过
- [ ] **P6.7** 发布 `vane-file-preview@2.0.0`（**发布动作单独确认**）

**验收门 P6**：`check-packages` 全绿；`docs:build` 通过；README 由 docs 同步；pack 干净；changeset 就位。

---

## 关键偏离与判断记录（随实施追加）

1. **`XmlPreviewPlugin` 的路径错误只在类型层暴露。** 它是 `import { FilePreviewPlugin, PluginContext } from "../../plugins/types"`（纯类型导入），
   esbuild 抹掉后运行时不炸，所以 `vite build` 一路绿灯、只有 `tsc -b` 报 TS2307。**「构建通过」不等于「类型正确」**——P3.2 修掉。
2. **external 名单对子路径静默失效**，是 986KB 的直接原因。字符串 `"mammoth"` 匹配不到 `"mammoth/mammoth.browser"`。
   P4.2 把 `external` 放宽到 RegExp，并加「dist 特征串」断言——**否则同一个坑会以「体积悄悄变大」的形式复发**。
3. **不合并 Docx 两个实现。** 直觉上「两个 DOCX 插件该合成一个」，但合成会让一个文件同时 import `docx-preview` 与 `mammoth`，
   消费者再也没法只装一个。**体积优先于插件数量整齐**。
4. **不把 17 个插件塞进 vane-card 那种槽位合成。** 它是单赢家路由（一个文件只有一个插件渲染正文），
   槽位合成会让 17 个插件同时渲染。保留 `resolvePreview()` 纯函数，可单测。
5. **`reset()` 与 `onBeforeLoad:false` 的两个推演级 bug 要先用单测复现再改。** 目前是代码推演（effect 依赖 `startLoad` 身份），
   P1.2 的第一步就是写测试把现象钉住——**没有红灯的修复不算修复**。

---

## 执行记录（随实施追加）

| 阶段 | 完成时间 | 提交 |
| --- | --- | --- |
| P0 | — | — |
| P1 | — | — |
| P2 | — | — |
| P3 | — | — |
| P4 | — | — |
| P5 | — | — |
| P6 | — | — |
