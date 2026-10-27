# 13 · vane-file-preview 迁移分析（资产盘点 / 架构差距 / 逐插件分级）

> 状态：**分析完成 · 6 个决策待拍板**（本文不改任何代码）
> 基线：`旧仓库/vane-file-preview`（`package.json` 1.0.4，npm 已发布 **1.0.5**，解包 2.09MB / 38 文件），本机实测于 2026-10-27
> 参照范式：`packages/vane-lazy-image`（P1 样板）+ `packages/vane-waterfall`（P2）+ `packages/vane-card`（P3，四视角 demo 已跑通）+ `tasks/11` / `tasks/12`
> 实施步骤见 `tasks/14-vane-file-preview-实施清单.md`

---

## 一、结论先行

1. **它是四个包里第一个「真的有运行时依赖」的包。**
   前三包 `dependencies` 全是 `{}`，只有 `react` / `react-dom` 两个 peer。vane-file-preview 声明了 **26 个运行时依赖**（解包 2.09MB），其中 **6 个是死的**、
   **3 个是框架本身的**（`react` / `react-dom` / `react-router-dom` 塞在 `dependencies` 里）。
   所以这次迁移的核心矛盾不是「插件系统怎么接内核」——那部分照抄 vane-card 就行——
   而是 **「怎么让消费者只为他真用的文件类型付体积」**。

2. **按需加载的文档写了，代码一行没做。**
   `docs/BUNDLE_OPTIMIZATION.md` 用整篇文档教用户 `import ... from "vane-file-preview/core"` 和 `"vane-file-preview/plugins"` 来减肥，
   而这两个子路径 **在产物里根本不存在**（`dist/core/index.es.js`、`dist/plugins/index.es.js` 均未产出，只有 `.d.ts`）。
   顺着文档做的人第一步就 Module not found。

3. **零动态 import，全量静态引入。**
   17 个插件里 11 个挂着重依赖，全是顶层 `import`。根入口 `index.ts` 又写着 `export * from "./custom-plugins"`，
   于是 **只要 `import { FilePreviewCore } from "vane-file-preview"`，就把 pdf/xlsx/mammoth/epub/高亮 全拉进来**。
   实测 lib 构建（**已经配了 external**）：`dist/index.es.js` **985.97 kB / gzip 196.33 kB`。

4. **external 名单对子路径依赖是静默失效的。**
   `external: ["mammoth"]` 匹配不上 `mammoth/mammoth.browser`；`external: ["react-syntax-highlighter"]` 匹配不上
   `react-syntax-highlighter/dist/esm/styles/prism/*`。后果：**mammoth 整个库 + 41 套 prism 主题被打进 dist**
   （986KB 里绝大部分是这两块）。这一条是本次分析里最值钱的发现——它不报错，只是白胖。

5. **`vite.config.ts` 的 `manualChunks` 与 `external` 互斥，等于没写。**
   `manualChunks: { pdf: ["pdfjs-dist", "react-pdf"], office: [...], ... }` 全部只有外部模块名，
   而外部模块根本不进 chunk。更矛盾的是 `pdfjs-dist` / `react-pdf` / `react-player` / `pptX-parser` / `highlight.js` **代码里一次都没 import**。

6. **demo 验的是构建产物，不是源码。**
   13 个示例页写的是 `import { ... } from "vane-file-preview"`，靠 **Node 包自引用**（`package.json` 有 `name` + `exports`）
   解析到 `dist/index.es.js`。实测：**先把 dist 构建出来，demo 才能构建**——删掉 `dist/` 后 demo 必然解析失败。
   这和 vane-card 的「demo 跑的是 npm 旧包」是同一类病，只是这里连旧包都不是，是本地磁盘上某一次构建的残留。

7. **`tsc -b` 不过：15 个错误。**
   - `XmlPreviewPlugin.tsx` 写的是 `from "../../plugins/types"`（应为 `"../plugins/types"`）→ **TS2307**。运行时不炸只因它是类型导入，被 esbuild 抹掉了；
   - 13 个 demo 页 `Cannot find module 'vane-file-preview'`（原因即第 6 条）。

8. **钩子面 17 个声明 / 7 个真生效 / 10 个空转。**
   生效：`canHandle`(3) `getPriority`(16) `onLoadStart`(5) `onLoadSuccess`(1) `onLoadError`(1) `render`(17) `renderToolbar`(15)。
   空转：`onMount` `onUnmount` `onBeforeLoad` `onLoadProgress` `renderOverlay` `transformData` `onDownload` `onZoom` `onRotate` `onFullscreen`。
   其中 `renderOverlay` 尤其典型：`withPlugins` 每次渲染都遍历全部插件去调它，**没有一个插件实现**。

9. **它是「单赢家路由」，不是 vane-card 的「多插件合成」。**
   `findPluginForFile` 按 `canHandle` + `getPriority` 选出**一个**插件渲染正文，其余插件连 `renderToolbar` 都不参与。
   所以迁移不能照搬 vane-card 的槽位组合思路，得保留「路由」这个领域概念，只把「注册 / 排序 / 隔离 / 生命周期」交给内核。

10. **状态机有两份，且插件的工作量不上报。**
    `FilePreviewCore` 一份 `state`，`withPlugins` 又一份；插件的真实异步工作（pdf 渲染、docx 解析、csv 解析）**不通知 Core**，
    Core 的 `startLoad` 只是「立刻置 loaded」。上下文里声明了 `progress` / `dimensions`，**永远 undefined**。
    推论（未实测）：`reset()` 会被 effect 立刻拉回 loaded；`onBeforeLoad` 返回 `false` 会**无限循环**。

---

## 二、资产盘点

### 2.1 体量

| 模块 | 文件 | 行数 | 处置 |
| --- | --- | --- | --- |
| `components/FilePreviewPlugin/core/` | 2 | 260 | **迁入**（Core 契约基本不变；`FilePreviewCore.tsx` 227 行里约 90 行是注释与内联样式） |
| `components/FilePreviewPlugin/plugins/` | 5 | 689 | **整体删除**，能力由 `vane-plugin-core` 提供 |
| `components/FilePreviewPlugin/custom-plugins/` | 26 | 7318 | **迁入** + 每个补 `doc.json` + 目录化（`XxxPlugin/index.tsx`） |
| `pages/`（demo） | 16 | 2787 | **重写**（13 个示例页 + `Home` + `ReadmeDemo` + `_layout`） |
| `src/types/` | 1 | 5 | 丢弃（`FileInfo` 已在 `plugins/types.ts` 定义） |
| `FilePreviewPlugin/index.ts`（桶） | 1 | 45 | 拆成 `index.ts`（只出 core）+ `plugins.ts` + 逐插件子路径 |
| 壳（`App.tsx` 159 / `main.tsx` 12 / `App.css` 93） | 3 | 264 | 丢弃，走新 demo 骨架 |
| **合计** | **54** | **11275**（`.ts`/`.tsx`） | 迁入 7578，删除 689，重写 2787，丢弃 309 |

> 口径说明：11275 只含 `.ts`/`.tsx`；`App.css` 93 行不计入。`public/` 另有 **37 个真实样本文件 / 15MB**（见 2.4）。

### 2.2 源码地图

```
src/components/FilePreviewPlugin/
├── index.ts                     ← 桶：Core + 装配 + 类型 + export * from "./custom-plugins"
├── core/
│   ├── FilePreviewCore.tsx      ← 容器 + 加载/错误覆盖层 + ref（reload/reset/getState）
│   └── index.ts
├── plugins/                     ← 自建插件系统（689 行，整体删除）
│   ├── PluginManager.ts         ← register / findPluginForFile / executeHook
│   ├── PluginBus.ts             ← emit/on/getData/setData
│   ├── withPlugins.tsx          ← 289 行，装配 + 工具栏条 + 覆盖层
│   ├── types.ts                 ← 17 钩子 + PluginContext
│   └── index.ts
└── custom-plugins/              ← 17 个插件（7318 行）
    ├── shared/ToolbarComponents.tsx       ← ToolbarContainer / Button / Separator / FileInfo / ProgressIndicator
    ├── styles/isolatedStyles.ts           ← isolation:isolate + contain 的样式隔离助手
    ├── CodePreviewPlugin/                 ← 7 文件 1572 行（组件 / 工具栏 / 语言表 / 主题表 / 偏好）
    ├── CodePreviewPlugin.tsx              ← 352B 兼容 shim（`export * from "./CodePreviewPlugin/index"`）
    └── 其余 15 个 *.tsx 单文件
```

### 2.3 17 个插件清单（按目标分组）

| # | 插件 | 行数 | 重依赖 | 拿手的活 |
| --- | --- | --- | --- | --- |
| 1 | ImagePreviewPlugin | 301 | — | 图片，缩放 / 旋转 / 适应 |
| 2 | PdfPreviewPlugin | 116 | — | PDF，`<iframe>` / `<embed>` |
| 3 | VideoPreviewPlugin | 151 | — | 视频，原生 `<video>` |
| 4 | AudioPreviewPlugin | 177 | — | 音频，原生 `<audio>` |
| 5 | OfficePreviewPlugin | 253 | —（但需**公网 URL**） | Office 在线预览（Microsoft / Google viewer） |
| 6 | DownloadPlugin | 175 | — | 下载按钮 / 链接 |
| 7 | ZipPreviewPlugin | 233 | `jszip` | Zip 目录树 |
| 8 | JsonPreviewPlugin | 640 | `@uiw/react-json-view` + **10 个主题子路径** | JSON 树 |
| 9 | XmlPreviewPlugin | 423 | `react-xml-viewer` | XML 树 |
| 10 | CsvPreviewPlugin | 730 | `papaparse` | CSV/TSV 表格（自研分页/列宽/筛选） |
| 11 | XlsxPreviewPlugin | 374 | `xlsx` | Excel 多 sheet |
| 12 | PptxPreviewPlugin | 553 | `jszip` | PPTX **仅抽文本**（无版式/图片） |
| 13 | DocxPreviewPlugin | 289 | `docx-preview` | DOCX 保真渲染 |
| 14 | MammothDocxPlugin | 237 | `mammoth/mammoth.browser` | DOCX → HTML（轻） |
| 15 | SimpleReactReaderEpubPlugin | 186 | `react-reader` | EPUB 阅读器 |
| 16 | CodePreviewPlugin | 1572 | `react-syntax-highlighter` + **41 个主题** | 代码高亮 + 工具栏 |
| 17 | MarkdownPreviewPlugin | 601 | `react-markdown` + 6 个 remark/rehype | Markdown（GFM/数学/高亮） |

**重依赖 11 个，轻量 6 个**（1–6 只用浏览器原生标签）。这是分层结构的直接依据。

### 2.4 demo 与样本资产

- 页面 16 个文件：13 个示例页 + `Home` + `ReadmeDemo` + `_layout/DemoPage.tsx`（用 `?raw` 动态导入展示源码，思路与 vane-card 的「双 glob 同源」一致）。
- 路由 13 条，`HashRouter`，`/file-preview/{image,pdf,video,audio,code,markdown,office,csv,json,xml,zip,epub}` + `/fp-plugin/example`。
- **`public/` 37 个真实文件 / 15MB**：`sample.{pdf,docx,xlsx,pptx,epub,zip,csv,tsv,json,xml,md,js,ts,tsx,vue,css,html,rss,svg,png,jpg,gif,webp,mp3,wav,ogg,mp4,webm,avi,flv}` + `star.pdf` / `danmu.pdf` / `white-screen.pdf` / `mixed-data.csv` / `sales-data.tsv` / `sample-data-{pipe,semicolon}.csv`。
  **这是本次迁移最该保住的资产**——文件预览演示没法造假，必须真文件。它们要搬进 `demo/public/`（绝不能进 `dist`）。

### 2.5 依赖声明问题

| 问题 | 明细 |
| --- | --- |
| **框架依赖错位** | `react` / `react-dom` / `react-router-dom` 在 `dependencies`（应在 peer / 仅 demo） |
| **6 个死依赖** | `pdfjs-dist`、`react-pdf`、`react-player`、`react-h5-audio-player`、`pptx-parser`、`highlight.js` —— 全库 0 处 import |
| **1 个位置错** | `@types/papaparse` 在 `dependencies`（应在 devDependencies） |
| **无 peerDependencies** | 两个版本都是（1.0.5 复核） |
| **外部化漏子路径** | `mammoth/mammoth.browser`、`react-syntax-highlighter/dist/esm/styles/prism/*`、`@uiw/react-json-view/{basic,dark,...}` 均未命中 `external` |

> 死依赖的来历可从 `TODO.md` 看到：`PDF.js 增强（PdfJsPreviewPlugin.tsx）` 列在「优先拓展」里但**从未实现**，`pdfjs-dist` / `react-pdf` 是提前装上的；
> `react-player` / `react-h5-audio-player` 同理被原生标签替代。

### 2.6 发布产物问题

| 项 | 1.0.5（npm latest） |
| --- | --- |
| `exports["./core"]` | `→ ./dist/core/index.es.js` —— **文件不存在**（只有 `.d.ts`） |
| `exports["./plugins"]` | `→ ./dist/plugins/index.es.js` —— **文件不存在** |
| `exports["./plugins/*"]` | `→ ./dist/plugins/*/index.es.js` —— **目录结构不存在** |
| `dependencies` | **26 个**（含 react / react-dom / react-router-dom） |
| 解包 | 2.09MB / 38 文件 |

> 三个子路径是 `docs/BUNDLE_OPTIMIZATION.md` 明确推荐给消费者的入口。等号右边没有东西。

---

## 三、现状体检基线（可复现）

在本机 `旧仓库/vane-file-preview` 实测（依赖已装好）：

| 命令 | 结果 |
| --- | --- |
| `npx tsc -b` | **15 error**（XmlPreviewPlugin 2 + 13 个 demo 页） |
| `npx vite build --mode lib` | 成功，`dist/index.es.js` **985.97 kB / gzip 196.33 kB**；`index.umd.js` 629.67 / gzip 163.00 |
| 同上，dts 阶段 | 1 error `TS2742`：`createIsolatedOverlay` 的返回类型无法命名（引用到 `.pnpm/csstype@3.2.3`） |
| `npx vite build`（demo） | **必须先有 `dist/` 才能成功**（自引用）；`index.es-*.js` **2,143.71 kB / gzip 634.47**，`tomorrow-*.js` **792.05 kB**（一个主题桶拖出全部 prism 主题） |
| `dist/` 实际内容 | `index.{es,umd}.js` + `index.d.ts` + `core/*.d.ts` + `plugins/*.d.ts` + `custom-plugins/*.d.ts` —— **只有类型，没有子路径 JS** |

**据此可下的三条结论**：① 源码类型不过关；② lib 体积比文档承诺的「核心包 ~50KB」大 4 倍、比「单插件 100–500KB」也大；③ demo 验的是构建产物。

---

## 四、新旧架构差距映射

### 4.1 钩子面：17 声明 / 7 生效 / 10 空转

| 钩子 | 实现插件数 | 迁移后去向 |
| --- | --- | --- |
| `render` | 17 | **保留**，映射到领域钩子 `renderBody`（单赢家） |
| `getPriority` | 16 | **保留**，改由内核 `priority` + `config.order` 统一 |
| `renderToolbar` | 15 | **保留**，映射到 `renderHeader`（内核已有） |
| `onLoadStart` | 5 | **保留**，但语义改为「插件开始自己的工作」 |
| `onLoadSuccess` / `onLoadError` | 1 / 1 | **保留**，与 Core 状态机打通（见 4.3） |
| `canHandle` | 3 | **保留**（其余 14 个靠 `supportedTypes`/`supportedExtensions` 声明式匹配） |
| `onMount` / `onUnmount` | 0 / 0 | 内核已有，留给未来插件 |
| `onBeforeLoad` | 0 | **删**（且当前实现有无限循环风险，见 4.3） |
| `onLoadProgress` | 0 | **删**（`progress` 字段一并删） |
| `renderOverlay` | 0 | 内核已有，留给未来插件（不再由装配层无条件遍历） |
| `transformData` | 0 | 内核已有，删掉本包重复声明 |
| `onDownload` / `onZoom` / `onRotate` / `onFullscreen` | 0 / 0 / 0 / 0 | **删**（这 4 个是「交互意图」，各插件各自实现即可，不该进插件契约） |

### 4.2 排序：`getPriority`（越大越优先）→ 内核 `priority` 降序 / `config.order` 升序

旧版只有一个 `getPriority`，且**只用于选路由赢家**（`findPluginForFile`），不参与渲染顺序。
内核是双轴：`config.order` 管位置、`priority` 管钩子顺序。迁移要点：**「谁是赢家」用 `priority`，「工具栏里谁在前」用 `order`**，
两者语义分开后，`getPriority` 这个钩子可以整体删掉（17 个插件的 `getPriority: () => 10/20/...` 全部换成声明式 `priority` 常量）。

### 4.3 状态机：两份 → 一份

```
旧：Core.state  ──onLoadStart/Success/Error──▶  withPlugins.state  ──▶  context.state  ──▶  插件 render 里判断
      ↑                                              
      └── startLoad() 只做「置 loaded」，与插件真实进度无关
```

问题与其说是「多一份 state」，不如说是 **「插件的异步工作量没有任何上行通道」**：
`PdfPreviewPlugin` 用 `<iframe>` 让浏览器自己去渲染，`DocxPreviewPlugin` 在组件内部 `await docx-preview`，
但 Core 早已宣布 `loaded`。于是：

- `PreviewProgress`（`loaded/total/percent`）声明了却没人写；
- `PreviewDimensions`（`width/height`）同理；
- `reset()` 只是把 state 置回 `idle`，而 effect 依赖 `startLoad` 的身份（`startLoad` 又依赖 `state.state`），
  **state 一变 identity 就变 → effect 重跑 → 立刻又置 loading/loaded**，所以 `reset` 实际等价于 `reload`（推演，未实测）；
- `onBeforeLoad` 返回 `false` 时：`loading → false → idle → identity 变 → effect 重跑 → loading → …`，**无限循环**（推演，未实测）。

**迁移决定**：Core 保留唯一状态机，新增 `reportState(patch)` 走 `context.setState`；插件在真正开始/结束时上报。
插件用原生标签的（pdf/video/audio/image）就报 `loaded` 即可——它们的工作确实是同步的。

### 4.4 路由模型 vs 槽位模型（本次最需要想清楚的一条）

| | vane-card | vane-file-preview |
| --- | --- | --- |
| 插件关系 | **多插件合成**一张卡（图 + 价 + 按钮各一段） | **单赢家路由**（一个文件只由最适合的一个插件渲染正文） |
| 内核能力 | `composeSlots` 五段 + 领域槽 `renderPriceArea` | 需要「选一个」：`canHandle` + `priority` |
| 迁移手法 | 槽位排序 + `renderDomainSlot` | **保留一个 `resolvePreview()` 纯函数**，不硬塞进槽位 |

> 结论：不要为了「和 vane-card 一致」把 17 个插件改成并行合成。`resolvePreview(plugins, file)` 抽成纯函数后
> 可以单测（给定 17 个插件 + 一个 `.docx` 文件 → 断言赢家是 `DocxPreviewPlugin`），比塞进渲染流程可测得多。

### 4.5 注册时机：渲染期 → effect（照抄 vane-card 的结论）

旧 `withPlugins` 在 effect 里 `plugins.forEach(register)`，依赖数组是 `[plugins]`；而 demo 里 **13 个页面**都调用了
`withPlugins(FilePreviewCore, [createPdfPreviewPlugin()])`，其中 **11 个直接在函数体内调**（无 memo）——
每次渲染都是**新的数组 + 新的插件实例**，于是「卸载全部 → 重新注册全部」每次都跑一遍。
只有 2 个包了 `useMemo`：`Example.tsx`（依赖是正确的）与 `OfficePreviewDemo.tsx`（依赖含 `selectedFile`，
所以换文件时依然重建，只是渲染抖动时省下重建）。

**迁移决定**：`withPlugins` 的第二个参数改为「插件集合 + 装配键」，装配键变化才重建（vane-card 的 `useCard` 同理）；
demo 侧一律 `makeCard` 化的模块顶层常量或 `useCard`。

### 4.6 样式：0 个 CSS / 241 处内联

和 vane-card（130 个文件、230 处内联）几乎同构。`styles/isolatedStyles.ts` 是个好设计（`isolation:isolate` + `contain:layout style`），
应当保留并升级为公共 toolkit；但它的返回类型引用了 `.pnpm/csstype`，导致 dts 阶段 `TS2742`，必须显式写 `React.CSSProperties`。

### 4.7 依赖边界（前三包没有过的问题）

| 包 | dependencies | peer |
| --- | --- | --- |
| vane-lazy-image | `{}` | `vane-plugin-core` / `react` / `react-dom` |
| vane-waterfall | `{}` | 同上 |
| vane-card | `{}` | `react` / `react-dom`（内核内联打包） |
| **vane-file-preview（现状）** | **26 个** | **无** |

11 个重依赖怎么放，是本轮第一个要拍板的事（D2）。

---

## 五、待拍板决策

### D1 · 17 个插件：全留 / 合并 / 删减？

**选项**
- **D1-A 全留 17 个，靠子路径 + 文档区分**（推荐）
- D1-B 把 `DocxPreviewPlugin` + `MammothDocxPlugin` 合成一个 `DocxPlugin`，用 `mode: "fidelity" | "light"` 选
- D1-C 删掉 `OfficePreviewPlugin`（只能预览公网 URL，能力边界尴尬）

**推荐 D1-A，理由**：
1. 合并 Docx 两个实现 **对体积是负优化**——合成一个文件就同时 `import` 了 `docx-preview` 和 `mammoth`，消费者再也无法只装一个。
2. `docxMode: "mammoth" | "docx-preview"` 这个字段已经存在于 `FileInfo`，但它**只在 demo 里被读**（`Example.tsx` L300 决定启用哪个插件）。
   正确做法不是合并插件，而是把 `docxMode` / `previewMode` 的路由**从 demo 移进库**：两个插件各自在 `canHandle` 里读它，让 `resolvePreview()` 选。
3. `OfficePreviewPlugin` 保留但明确边界：它需要**公网可达的 URL**（viewer 是服务端去抓的），本地 `blob:` / 内网地址一律不可用。文档与 demo 都要写清。

**代价**：插件数从 vane-card 的 22 变成 17，但「形似神不似」的两对（Docx×2、Office vs Docx）需要靠文档讲清，否则使用者会随手装错。

### D2 · 11 个插件的 16 个第三方库放哪？

> 口径：**11 个插件**挂重依赖，它们合起来 import 了 **16 个第三方包**（`docx-preview` `mammoth` `xlsx` `jszip` `papaparse` `react-xml-viewer` `react-markdown` `remark-breaks` `remark-gfm` `remark-math` `rehype-highlight` `rehype-katex` `rehype-raw` `@uiw/react-json-view` `react-syntax-highlighter` `react-reader`）。
> 另有 **6 个已声明但 0 引用的死依赖**，无论选哪个方案都该直接删掉。

- **D2-A `peerDependencies` + `peerDependenciesMeta.*.optional: true`**（推荐）
- D2-B 仍放 `dependencies`
- D2-C 全部 `peer` 且不加 optional（强制装全）

**推荐 D2-A**：
- 与其余三包「库本身零依赖」的口径一致；consumer 只为真用的文件类型付出安装成本。
- 每插件子路径 = 一个独立入口，`import "vane-file-preview/custom-plugins/DocxPreviewPlugin"` 时 bundler 才会去 resolve `docx-preview`。
- **必须配友好降级**：插件在最外层 `try { const mod = await import("docx-preview") } catch { return <Panel>未安装 docx-preview，请 npm i docx-preview</Panel> }`。
  这条比什么都重要——optional peer 装不上时，用户看到的不能是一串 module not found 堆栈。

**代价**：`peerDependenciesMeta.optional` 在 pnpm 下不自动安装，文档必须给出「按文件类型逐条 npm i」的表格。

### D3 · 入口结构

- **D3-A 根入口只出 core；`./core` + `./plugins`（6 个轻量桶）+ `./custom-plugins/<Name>`（17 个）**（推荐）
- D3-B 根入口保持 `export *`（兼容 1.x 的 `import { createXxxPlugin } from "vane-file-preview"`）

**推荐 D3-A，但保留一个受控的兼容层**：根入口 `export * from "./custom-plugins"` 是体积杀手（vane-card 之所以敢留，是因为它 22 个插件加起来 31KB）。
这里一个 `react-syntax-highlighter` 就顶它全量。折中：**根入口只出 core + 6 个轻量插件**，11 个重插件一律走子路径；
`custom-plugins/index.ts` 保留为「全量逃生口」，但**不被根入口静态引用**（与 `discover-entries.mjs` 的既有约定一致）。

### D4 · 样式策略

- **D4-A 沿用内联，只把「容器 / 工具栏」抽成一套 CSS 变量**（推荐）
- D4-B 全面抽 class + `style.css`（照抄 vane-card D4-B）
- D4-C 原样不动

**推荐 D4-A**：vane-card 抽 CSS 是因为它的复合组件是「商品卡」——语义 class（`.vc-card__price`）对使用方有主题化价值。
文件预览的 UI 是**查看器**：表格单元格、目录树缩进、代码行号，241 处里绝大多数是这种一次性几何值，抽成 class 既没人覆盖也难命名。
但**容器与工具栏这一层必须可主题化**（背景、边框、圆角、字色），给 `--vfp-*` 变量 + 一层 `.vfp-root` 即可，`style.css` 保持可选。

### D5 · 内核用法

- **D5-A 内联打包 `vane-plugin-core`（同 vane-card）**，不设 peer（推荐）
- D5-B 设为 peer（同 lazy-image / waterfall）

**推荐 D5-A**：内核 gzip < 5KB，打成 peer 只是让消费者多一步安装、多一个版本错配来源；vane-card 已验过这条路（`dist/chunks/*.js` 里无 `vane-plugin-core` 外部引用）。
**同时**：把 `resolvePreview()`（路由）做成包内纯函数，不往内核加东西——内核不该知道「文件」这个概念。

### D6 · demo 形态

- **D6-A 四视角（工坊 17 + 逐项 17 + 场景 6 + 布局 0）**（推荐，稳妥）
- D6-B 只做逐项 17 页（最小成本）
- D6-C 五视角，额外加「对比」页（同一文件在 2 个插件下的效果差异）

**推荐 D6-A 的前三视角**：工坊（17 个插件卡片，点开即用）+ 逐项（每插件一页，左预览右源码，`?raw` 同源）+ 场景（6 个真实业务：上传即预览、邮件附件、文档审批、素材库、数据导入、代码评审）。
**不硬凑布局视角**：文件预览没有「版式」这件事，强行分区只会造出空页。样本继续用 `public/` 的 37 个真实文件（15MB），搬进 `demo/public/`。

---

## 六、逐插件迁移分级

### A 级 · 近零改动（6 个）

只改 import 路径与类型来源，UI 不动。**共同特征：只用浏览器原生标签，零第三方依赖。**

| 插件 | 行数 | 备注 |
| --- | --- | --- |
| ImagePreviewPlugin | 301 | 自研缩放/旋转，无依赖，最干净 |
| PdfPreviewPlugin | 116 | `<iframe>`/`<embed>`；底部有个**未使用的** `toolbarButtonStyle` 常量（删） |
| VideoPreviewPlugin | 151 | 原生 `<video>` |
| AudioPreviewPlugin | 177 | 原生 `<audio>` |
| DownloadPlugin | 175 | 纯 UI |
| OfficePreviewPlugin | 253 | 需补「只能公网 URL」的文档与 demo 提示 |

### B 级 · 需改造依赖边界（7 个）

需要处理「重依赖只在该插件子路径下加载」这件事。

| 插件 | 行数 | 依赖 | 改造点 |
| --- | --- | --- | --- |
| ZipPreviewPlugin | 233 | `jszip` | 顶层 import → 子路径入口内 import 即可；解析失败要降级 |
| JsonPreviewPlugin | 640 | `@uiw/react-json-view` **+10 个主题子路径** | **10 个主题收敛成 2 个**（亮/暗），或改用 `style` 对象 |
| XmlPreviewPlugin | 423 | `react-xml-viewer` | **修掉 `../../plugins/types` 的路径错误**；`style` prop 不在 `XMLViewerProps` 里（TS 报错），改为外层容器控制 |
| XlsxPreviewPlugin | 374 | `xlsx` | 大文件分块；`xlsx` 的 license 需在文档注明 |
| PptxPreviewPlugin | 553 | `jszip` | **明确边界：只抽文本**，不含版式/图片；文档与 UI 都要写「基础预览」 |
| DocxPreviewPlugin | 289 | `docx-preview` | 与 Mammoth 的二选一策略移进库（见 D1） |
| MammothDocxPlugin | 237 | `mammoth/mammoth.browser` | 子路径 import 的 external 匹配（见 4.7 / D2） |

### C 级 · 需拆分或重构（4 个）

| 插件 | 行数 | 问题 | 处置 |
| --- | --- | --- | --- |
| CodePreviewPlugin | 1572 / 7 文件 | `themes.ts` 静态导入 **41 套 prism 主题**（构建时实测拖出 792KB chunk）；`preferences.ts` 用 localStorage | 主题从 41 → 2~3 套，其余改为「传入 style 对象」；`preferences` 的存储键要带前缀且可关 |
| MarkdownPreviewPlugin | 601 | 静态挂 6 个 remark/rehype；`rehype-raw` 有 **XSS 面**（渲染未清洗 HTML） | 默认关 `rehype-raw`，或要求显式 `allowHtml: true`；插件数收敛（`remark-breaks` 可内联实现） |
| CsvPreviewPlugin | 730 | 单文件 730 行：解析 + 分页 + 列宽 + 筛选 + 导出挤在一起；37 处内联样式 | 拆 `parse.ts` / `Table.tsx` / `Toolbar.tsx`；分页与虚拟滚动二选一（当前是分页） |
| SimpleReactReaderEpubPlugin | 186 | `react-reader` 深耦合（它自带 epub.js 与样式），子路径必须独立 | 独立子路径 + 明确「引入约 200KB+（epub.js）」；或降级为「元数据 + 下载」 |

**合计 6 + 7 + 4 = 17**，与清单核对一致。

---

## 七、迁移后目标结构

```
packages/vane-file-preview/
├── src/
│   ├── index.ts                    → "."            只出 core（Core + withPlugins + 类型）
│   ├── core.ts                     → "./core"       Core + 装配 + resolvePreview
│   ├── plugins.ts                  → "./plugins"    6 个轻量插件的桶（零重依赖）
│   ├── components/FilePreviewCore/  （内部目录，不发布为入口）
│   │   ├── FilePreviewCore.tsx
│   │   └── plugins/{types.ts,withPlugins.tsx,resolve.ts}
│   ├── custom-plugins/
│   │   ├── index.ts                → "./custom-plugins"   全量逃生口（不被根入口引用）
│   │   ├── ImagePlugin/{index.tsx,doc.json}
│   │   ├── …（17 个，目录化）
│   │   └── shared/{ToolbarComponents.tsx,isolatedStyles.ts}
│   └── styles/toolbar.css          → dist/style.css（可选引入）
├── demo/                           ← 新骨架（vite.config 用 createDemoConfig）
│   ├── public/                     ← 37 个真实样本文件（15MB）
│   └── src/{pages,demos,scenarios}/
├── docs/{index,api,plugins,recipes}.md
├── test/
└── package.json
```

**exports 目标**：`.` / `./core` / `./plugins` / `./custom-plugins` / `./custom-plugins/*` / `./style.css`
——全部由 `pnpm sync:exports` 从源码路径推导，**不再手写**（手写正是 1.0.5 断链的根因）。

---

## 八、风险清单

| # | 风险 | 影响 | 对策 |
| --- | --- | --- | --- |
| R1 | optional peer 未安装 → 运行期报错 | 使用方体验差 | 每插件入口 catch 动态 import，渲染「未安装 X」面板（不是白屏） |
| R2 | `external` 漏子路径 → 体积静默膨胀 | 986KB 重演 | 闸门：`check-packages` 增加「入口图 gzip」断言 + 断言 `dist` 内不含 `mammoth`/`prism` 特征串 |
| R3 | 41 套主题 / 10 个 json 主题 | 构建产物倍级膨胀 | 收敛到 2~3 套；其余走 `style` 对象 |
| R4 | `rehype-raw` XSS | 安全问题 | 默认关闭；开启需显式配置并在文档警示 |
| R5 | `OfficePreviewPlugin` 只能公网 URL | 使用者以为能预览本地文件 | 文档 + demo 文案 + 运行期检测 `blob:`/`localhost` 给提示 |
| R6 | 15MB 样本文件进包 | 发布体积失控 | `demo/public/` + `publicDir:false`；`npm pack` 复核 |
| R7 | Pptx 仅抽文本 | 期望落差 | UI 标注「文本大纲预览」 |
| R8 | 双份 state 合并改动面大 | 引入回归 | 先写「状态机契约」单测（reload / reset / error / 插件上报），再改实现 |

---

## 九、验收口径

| 项 | 目标 |
| --- | --- |
| `typecheck` | 0 错（当前 15） |
| `eslint` | 0 error |
| `vitest` | ≥ 40 passed（Core 契约 + 路由 + 17 插件 doc.json + 3 个端到端） |
| 根入口 gzip | **≤ 12KB**（core only；参考 vane-card 6.3KB） |
| `./core` gzip | ≤ 8KB |
| 全量并集 gzip | ≤ 90KB（17 插件 UI + 内联内核；重依赖全外部） |
| `dist` 纯净 | 不含 `mammoth` / prism 主题 / `public/` 样本；`npm pack` 只含 `dist` + `README` + `package.json` |
| `exports` | 6 条全部指向真实存在的文件（脚本断言） |
| 17 插件 | 全部可单独子路径导入；`doc.json` 17/17 通过 schema；工坊里至少装配一次 |
| demo | 三视角可跑（工坊 17 / 逐项 17 / 场景 6）；38 页几何体检 0 命中 |
| 依赖 | `dependencies: {}`；11 个重依赖为 optional peer；0 个死依赖 |
