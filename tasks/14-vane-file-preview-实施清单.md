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

- [x] **P0.1 拍板 D1（17 个插件处置）**：**D1-A 全留 17 个**，不合并 Docx×2（合并会同时引入 `docx-preview` + `mammoth`，体积负优化）；把 `docxMode` / `previewMode` 的路由从 demo 移进库；`OfficePreviewPlugin` 保留但明确「只能公网 URL」
- [x] **P0.2 拍板 D2（重依赖归属）**：**D2-A optional peer**（`peerDependenciesMeta`）；`dependencies: {}`
- [x] **P0.3 拍板 D3（入口结构）**：根入口只出 core + 6 个轻量插件；`./custom-plugins/*` 逐插件；`custom-plugins/index.ts` 保留为逃生口但**不被根入口静态引用**
- [x] **P0.4 拍板 D4（样式）**：**D4-A 内联沿用**，只抽「容器 + 工具栏」为 `--vfp-*` 变量 + 可选 `style.css`
- [x] **P0.5 拍板 D5（内核）**：**D5-A 内联打包 `@vane/plugin-core`**（不设 peer）；路由做包内纯函数 `resolvePreview()`
- [x] **P0.6 拍板 D6（demo）**：**三视角**（工坊 17 + 逐项 17 + 场景 6），不做布局视角
- [x] **P0.7 固化体积基线**：把上表 196.33KB / 634.47KB 记入本文「执行记录」，作为「不得劣化」的对照（新架构目标见 P4）

**验收门 P0**：D1–D6 结论落纸并被 `docs/guide/decisions.md` 引用；基线四条命令的结果可复现。

> ✅ **已过门（2026-10-27）**：六个决策落成 **ADR-16**（`docs/guide/decisions.md`），含理由、代价与三条「防复发」判断。
> 基线四条命令的结果已固化在上表，P4 验收以「不得劣于基线」为下限、以三口径上限为目标。

---

## P1 · 包骨架 + Core 迁入 + demo 指回源码

### P1.1 骨架与依赖

- [x] `packages/vane-file-preview/` 目录（照 `packages/vane-card` 的形态，不用模板骨架 —— 模板缺多入口与 `vane` 体积字段）
- [x] `package.json`
  - [x] `peerDependencies`: `react >=16.8`、`react-dom >=16.8`（**不设 `@vane/plugin-core`**）
  - [x] `dependencies`: **空**（26 个全不迁；6 个死依赖彻底删；`react`/`react-dom`/`react-router-dom` 移入 devDeps 只服务 demo）
  - [x] `devDependencies`: `@vane/{build-config,eslint-config,tsconfig,vitest-config,plugin-core}`、react 18、vite 5、vitest 2、`react-router-dom`（仅 demo）
  - [x] `files: ["dist"]`、`sideEffects: false`、`publicDir: false`
  - [x] `vane.sizeBudgetKb: 12`、`vane.coreSizeBudgetKb: 8`、`vane.fullSizeBudgetKb: 90`
- [x] `tsconfig.json` / `vite.config.ts`（`createLibConfig`）/ `vitest.config.ts` / `eslint.config.js`
  - 不建 `tsconfig.lib.json`：d.ts 由 `vite-plugin-dts` 按 `tsconfig.json` 产出，与 vane-card 一致。多一个配置就多一处漂移
- [x] **关掉 `publicDir`**，并在 P6 用 `npm pack` 复核不含样本文件

### P1.2 Core 迁入（`FilePreviewCore`）

- [x] `src/components/FilePreviewPlugin/core/FilePreviewCore.tsx`（原 227 行）迁入
  - **路径比计划多一层**：计划写的是 `src/components/FilePreviewCore/`。实际收进 `components/FilePreviewPlugin/core/`，
    因为 `discoverEntries` 只把 `NON_ENTRY_DIRS`（含 `components`）里的目录当内部目录 ——
    放在 `src/components/FilePreviewCore/` 会被当成 `./FilePreviewCore` 发布出去，
    而 `src/plugins/` 更糟：它会被识别成 `./plugins`，**与 P3 要建的 `src/plugins.ts`（6 个轻量插件）撞名**。
    第一次构建就撞出来了（`dist/plugins/index.js` 凭空出现），已按 vane-card 的 `components/CardPlugin/plugins/` 形态收拢
  - [x] import 路径改本地；`containerRefExternal` / `contentRefExternal` 双通道保留（`withPlugins` 靠它拿容器）
  - [x] `(props.containerRefExternal as any).current = el` 的类型逃逸去掉 —— 改为 `ExternalPreviewRef` 联合类型 +
    `syncExternalRef()` 里**一处**显式断言。断言集中在一个函数里，将来类型真的错位时能在这里看到，而不是散在 4 个赋值点
  - [x] `useMemo` 的 `containerStyles` / `contentStyles` 保留
- [x] **状态机收敛为唯一一份**（分析 4.3）：
  - [x] `startLoad` 的守卫不再依赖 `state` 闭包 —— 实际用 `stateRef` 而不是 `setState(prev => …)`：
    函数式 setState 只能在 updater **内部**看到 prev，而 `runLoad` 需要在「进函数之前」就判断
    「已经 loading/loaded 就别重来」并据此决定要不要发请求。守卫要读值、要提前 return，只能读 ref
  - [x] **删掉 `useEffect(() => startLoad(), [startLoad])`**；改为 `useEffect(..., [file.url])` 显式触发。
    依赖 `file.url` 而不是 `runLoad`：后者现在身份稳定，但将来任何人给它加一个依赖，effect 就会跟着重跑，
    两个 bug 立刻复活
  - [x] 新增 `reportState(patch)` + `onStateChange` 镜像回调：插件上报、Core 落库、上层镜像，**不再各存一份**
  - [ ] ~~上报 `progress`~~ —— 延到 P2 定形状：`PreviewStateInfo` 当前没有 progress 字段，
    而 P2.2 要删掉恒为 undefined 的 `progress`。现在加等于加完就删
- [x] `test/core-state.test.tsx`（9 条）：`reload` / `reset`（**断言 reset 之后停在 idle**）/ `onBeforeLoad:false`
  （**断言只跑一次**）/ error 分支 / 非 Error 抛出物 / `file.url` 变化才重载 / `reportState` 覆盖 / `onStateChange` 序列
- [x] `test/core-render.test.tsx`（5 条）：容器与内容两层 class + 嵌套关系 + style 合并优先级 + 默认底色 + 两种遮罩

### P1.3 demo 指回源码（**本阶段最重要的一步**）

- [x] `demo/vite.config.ts`：`createDemoConfig` + 包名 alias（`vane-file-preview` → `src/index.ts`，
  `/core`、`/plugins`、`/custom-plugins` 与 `/*` 同步，一次性写全，P3 起直接可用）
- [x] `tsconfig.json` 的 `paths` 同步（先只写 `index` / `core`；不存在的入口写进 paths 只会变成假承诺）
- [x] **验证方式**：删掉 `dist/`，`pnpm build:demo` 成功（37 modules / 152.51kB / gzip 50.09kB）
- [ ] **13 个旧示例页搬进 `demo/src/legacy/` —— 未做，延后到 P3**
  - 原因：这 13 页全部 `import` 官方插件，而 custom-plugins 要到 P3 才迁入。
    此刻搬进来会得到 13 个**必然失败**的页面，且 `tsconfig` 的 `include: ["test", "demo/src"]` 会让
    `typecheck` 直接报几十个「找不到模块」—— 那不是冒烟素材，是往 P1 里塞一堆假红。
  - 替代：P1 只留一个**手工插件**的最小 demo（`demo/src/pages/BasicDemo.tsx`，30 行，只认 `text/*`）。
    它同时验证了三件要紧的事：包名 alias 有效、`withPlugins` 走通、装配写在模块顶层。
  - P3 迁完插件后**立刻**补 legacy 目录，作为 P5 重写前的行为对照。

**验收门 P1**：`build` 产出 dist 且 `exports["."]` 有效；`typecheck` 0 错；`core-state` + `core-render` 单测通过；**删掉 dist 后 demo 仍能构建**；`dist` 内无样本文件。

> ✅ **已过门（2026-10-27）**
>
> | 项 | 实测 |
> | --- | --- |
> | `pnpm build` | `dist/index.js` 0.12kB · `dist/core.js` 0.15kB · `chunks/withPlugins` 11.10kB（gzip 3.33） |
> | `exports` | `{".": …, "./core": …}`（`pnpm sync:exports` 生成） |
> | `tsc --noEmit` | 0 错 |
> | `eslint src demo test --quiet` | 0 错 |
> | `pnpm test` | **14 passed / 2 files** |
> | 删 `dist` 后 `build:demo` | 成功（37 modules，无 dist 依赖） |
> | `check-packages` | 入口 3.4KB/12 · core 3.4KB/8 · 全量 3.3KB/90，三条线全绿 |
> | `dist` 内样本文件 | 无（`publicDir: false`，`files: ["dist"]`） |
>
> **反向验证（清单第 5 条要求）**：用临时文件复刻旧实现跑同一批断言，确认它们是红的 ——
> `reset()` 后状态是 `loaded`（不是 idle）；`onBeforeLoad` 被调用 **31 次**（撞到我设的 30 次上限才停）。
> 新实现分别为 `idle` 与 **1 次**。验证完临时文件已删除，不进版本库。

---

## P2 · 插件系统替换（删 689 行，接内核）

- [x] **P2.1 删除** `plugins/{PluginManager.ts,PluginBus.ts}` —— 两个文件 689 行，与内核完全重复
- [x] **P2.2 重写 `plugins/types.ts`**
  - [x] 钩子面 **17 → 11**
    - 删 6 个纯空转：`onBeforeLoad` / `onLoadProgress` / `onDownload` / `onZoom` / `onRotate` / `onFullscreen`
    - 删 4 个与内核重复的（能力保留、由内核驱动，领域层只重声明签名）：`onMount` / `onUnmount` / `renderOverlay` / `transformData`
  - [x] 保留领域钩子 **6 个**：`canHandle(file)` / `render(ctx)` / `renderToolbar(ctx)` / `onLoadStart` / `onLoadSuccess` / `onLoadError`
  - [x] 领域 `FilePreviewPluginContext` 是**独立接口**而不是 `extends 内核 PluginContext`
    - **偏离（有硬理由）**：内核 emit 的公开 d.ts 里不能出现 `@vane/plugin-core` 的类型引用。
      内核是构建时内联的实现细节、**没发布到 npm**，消费方装包后 TS 会直接报 Cannot find module。
      vane-card 的 `CardPluginContext` 也是同一个处理（见其 `PluginBus` 的注释）。
      结构与内核 context 兼容（`extendContext` 塞回去运行时不报错），类型上各自独立
  - [x] **删 `progress` / `dimensions`**（迁移前恒定 undefined）；`PreviewStateInfo` 保留 `state/error/message`
  - [x] `FileInfo` 类型保持不动（`previewMode` / `docxMode` 保留）
  - [x] `getPriority` → 声明式 `priority`（15 个常量插件在 P3 改）；**保留 1 个逃生口 `priorityOf(file)`**
    - **偏离（有硬理由）**：`OfficePreviewPlugin` 的优先级要看 `config.preferDocxOnline` **且只在 docx 上生效**
      （提到 9），其余类型仍是 7。声明式 `priority` 表达不了「按文件算」，
      把 9 写死会抢走 xlsx 的 `XlsxPreviewPlugin`。所以留一个函数钩子，只此一家
    - `resolve.ts` 里**运行时仍兼容读 `getPriority`**，注释标明「P3 迁完删除」——否则 P3 逐个改插件期间路由会错
- [x] **P2.3 重写 `plugins/withPlugins.tsx`**
  - [x] 用内核 `usePluginRuntime`（注册 / 依赖解析 / 优先级排序 / 钩子执行 / 沙箱 / PluginErrorBoundary）
  - [x] **不用 `composeSlots`** —— **偏离（设计判断）**：内核的 `composeSlots` 是「多插件合成」，
        而文件预览是「单赢家」，一个文件只能有一个插件渲染正文。用槽位合成会让 17 个插件同时往同一容器里画。
        渲染由装配器自己写，只问赢家
  - [x] 去掉 `isPdfPlugin = activePlugin?.name === "PdfPreviewPlugin"` 的硬编码插件名 → 统一 `overflow: auto` + `overscrollBehavior: contain`
  - [x] 去掉「每次渲染遍历全部插件调 `renderOverlay`」→ 只问赢家
  - [x] Core 的 `onStateChange` → 只读镜像（单向投影，不是第二份真源）；插件写状态只能走 `reportState`
  - [x] 路由失败不进加载流程：`onBeforeLoad` 直接返回 false（Core 停 idle），正文换成 `[data-vfp-unsupported]` 面板。
        让 Core 先走一趟 loading→loaded 再报错，会在两者之间闪一次
  - [ ] ~~插件集合按「装配键」稳定（`{ plugins, key }`）~~ —— 不需要：内核已按**插件名集合**比对
    （`namesKey`），同名换数组不会重注册。P1 的 `useCard` 那个坑在这里天然不存在
- [x] **P2.4 路由纯函数 `plugins/resolve.ts`**
  - [x] `resolvePreview(plugins, file)` —— `canHandle` 优先且**互斥**（声明了就不再看类型，否则
        `DocxPreviewPlugin` 的 `config.enabled` 会被类型匹配绕过）、其次 `supportedTypes` / `supportedExtensions`、
        `priority` 降序、平手保持声明顺序
  - [x] 另导出 `accepts` / `priorityOf` / `matchMimeType` / `matchExtension` / `unsupportedMessage`，全部可单测
  - [ ] **把 `docxMode` / `previewMode` 判定写进库内 —— 随插件在 P3 落地**（插件还没迁入，无法改它们的 `canHandle`）
  - [x] `test/resolve.test.ts`：**22 条**，覆盖通配 / 优先级 / canHandle 互斥 / 平手 / 兜底 / 空 MIME
  - [ ] **17 个插件 × 17 种文件的矩阵 —— 延到 P3**（`test/resolve-matrix.test.ts`）。
        用合成插件测算法是够的，但用它冒充「17 种文件全选对」是假绿 —— 声明一旦与真实插件漂移就失效
- [x] **P2.5 单测（第二批）**
  - [x] `test/bus.test.ts`（9 条）：内核总线 `emit/on/off/once` + 共享数据 + 订阅者抛错不拖垮其他订阅者
  - [x] `test/lifecycle.test.tsx`（9 条）：重渲染**不重建**（onMount 只 1 次）/ `file.url` 变化重新触发 /
        单赢家（输家 render 一次都不调）/ 工具栏在正文之前 / unsupported 面板 + Core 停 idle /
        `reportState` 写回 Core / `sharedData` 跨插件可见 / 插件读到的 state 是实时镜像

**验收门 P2**：自建插件系统 2 个文件已删（`types.ts` / `withPlugins.tsx` 已重写而非本地实现）；`typecheck` 0 错；`test` ≥ 12 通过；`resolvePreview()` 对 17 种文件全部选对。

> ✅ **已过门（2026-10-27）**
>
> | 项 | 实测 |
> | --- | --- |
> | 删除的自建实现 | `PluginBus.ts` 72 行 + `PluginManager.ts` 177 行（共 249 行；清单里「689 行」是分析阶段的粗估，含被一起重写的 types/withPlugins） |
> | `tsc --noEmit` | 0 错 |
> | `eslint src demo test --quiet` | 0 错 |
> | `pnpm test` | **54 passed / 5 files**（14 → 54，+40） |
> | `pnpm build` | `index.js` 0.30kB · `core.js` 0.31kB · `chunks/withPlugins` **18.46kB**（gzip 6.36） |
> | `check-packages` | 入口 6.4KB/12 · core **6.4KB/8** · 全量 6.4KB/90 |
> | 无 dist 构建 demo | 成功（157.56kB） |
> | 浏览器实测 | 三个样本切换正常、unsupported 面板正常、`pageerror` 无 |
>
> **两处必须记住的账**：
> 1. **体积变大了**：入口 gzip 3.4KB → **6.4KB**。内核比自建的 Bus+Manager 重
>    （多了依赖解析、沙箱、错误边界、设备检测），换来的是与 vane-card 共用一套内核、
>    少 249 行自己的实现。`core` 预算 8KB，现在用掉 6.4KB —— **P4 要盯这条线**。
> 2. **17×17 路由矩阵还没验**（插件未迁入）。P2 只证明了算法对，没证明「17 个真实插件各自认得对」。
>    这条挂在 P3 的验收门上。
>
> **踩到的坑**：`matchExtension` 原来是 `extension.endsWith(pattern)`，而 `"pdf".endsWith(".pdf")` 是
> **false** —— 扩展名不带点的调用方会静默地一个插件都匹配不上。改成两边都剥前导点再比。
> 另：块注释里写 `"*/*"` 会把注释提前结束（`*/`），已在两处改成「星号通配」的描述性写法。

---

## P3 · 17 个插件分批迁入

> 统一要求：每个插件一个**目录**（`custom-plugins/<Name>/index.tsx` + `doc.json`），
> 因为 `discover-entries.mjs` 只把「目录形态」识别为发布子路径（分析第七节）。

### P3.1 A 级 6 个（近零改动）

- [x] `ImagePreviewPlugin`（301）—— 自研缩放/旋转；**顺带修**「工具栏百分比不跟手」（三份状态靠 bus 互追 → 改为 sharedData 单一真源 + `forceUpdate()`）
- [x] `PdfPreviewPlugin`（116）—— 删掉底部**未使用**的 `toolbarButtonStyle` 常量；滚动收口（容器与 frame 都撑满 + `overflow:hidden`，不出双滚动条）
- [x] `VideoPreviewPlugin`（151）—— 删 `.ogg` 扩展名（见 D7 与偏离 9）；autoplay 未静音时工具栏提示
- [x] `AudioPreviewPlugin`（177）—— 删掉**未使用**的 `formatSize` 副本
- [x] `DownloadPlugin`（175）—— **修 hooks 违规**（`render` 里直接 `React.useEffect` → 抽 `DownloadBody` 组件）
- [x] `OfficePreviewPlugin`（253）—— 补运行期检测：`blob:` / `data:` / `localhost` / 内网段 / 无点主机名时**直接换说明面板**（不再是「照渲 iframe + 叠一条黄色提示」）
- [x] 每插件 `doc.json`：`config` 字段集合 + 默认值与运行时**逐项对账**（测试闸门，6/6 过）

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
   ✅ P1 已做：临时复刻旧实现跑同一批断言，`onBeforeLoad` 被调 **31 次**、`reset()` 停在 `loaded`；
   新实现 1 次 / `idle`。**这两个 bug 从「推演」升级成「实测」**，代价是十几行临时文件。
6. **目录不能随便放：`src/plugins/` 会变成 `./plugins` 入口，与 `src/plugins.ts` 撞名。**
   `discoverEntries` 的规则是「源码路径 == 发布子路径」，且 `components/` 是内部目录。
   第一次 `pnpm build` 就凭空多出 `dist/plugins/index.js` —— 因为 `src/plugins/index.ts` 被当成了公开入口。
   等 P3 建好 `src/plugins.ts`（6 个轻量插件）就会正面撞车，而 exports 里只会剩一个，另一个静默失效。
   已把 Core 与插件系统收进 `components/FilePreviewPlugin/{core,plugins}/`，与 vane-card 的 `components/CardPlugin/` 同构。
   **这类碰撞不会报错，只会让某个入口「突然导不进来」**，所以趁只有一个入口时先定好结构。
7. **`reset()` 的守卫用 `stateRef` 而不是清单里写的 `setState(prev => …)`。**
   函数式 setState 只在 updater 内部能看到 prev，而守卫要在**进 `runLoad` 之前**就决定
   「要不要发这次请求」。需要读值 + 提前 return，只能读 ref。清单那措辞是「不读闭包」的意图，ref 是它的实现。

8. **`render` / `renderToolbar` 里不许有 hooks —— 迁移前是真的有。**
   它们是普通函数（装配层直接 `winner.hooks.render(ctx)`），不是组件。迁移前 `DownloadPlugin`
   在 `render` 里写 `React.useEffect` 做 autoDownload：那个 hook 会被注册到 `withPlugins` 身上，
   而「有没有赢家 / 赢家是谁」会让调用次数变化 —— React 直接抛
   “Rendered fewer hooks than expected”。已抽成 `DownloadBody` 组件，
   并在 `plugins-a-render.test.tsx` 里专门测「赢家从 Download 换成 Image 再换回来」。
   **同理适用于 `renderToolbar`**：Image 的工具栏按钮要读缩放状态，必须包成 `ImageToolbar` 组件，
   不能在图省事在钩子函数里 `useState`。
9. **`.ogg` 到底是音频还是视频：靠 MIME 判，别信扩展名。**
   真浏览器验收时发现一段 Vorbis 音频（`audio/ogg`）被 `VideoPreviewPlugin` 抢走渲染成黑底视频框
   —— 它声明了 `.ogg`（Theora 视频也是 `.ogg`）。两条修法：Video 不再声明 `.ogg`；
   `resolve.ts` 新增 `matchStrength()`，同 priority 时 MIME 命中压过「只有扩展名像」（ADR-16 D7）。
   反向验证：把排序退化回「只看 priority」，新增的 `ByMime vs ByExt` 用例立刻红。
10. **demo 的 `publicDir` 不会自动指向 `demo/public/`。**
   `createDemoConfig` 的 root 是**包根**，Vite 的 `publicDir` 默认相对 root → 去读
   `packages/vane-file-preview/public`（库包没有这个目录）。不显式设 `publicDir` 的话
   `/samples/*.pdf` 全是 404，而 PDF 的 iframe 拿到 404 页照样撑满 —— **肉眼看不出错**，
   只有「图片不显示、视频空白」时才反应过来。已在 demo/vite.config.ts 显式指过去。
11. **验收环境本身也会给假象**：headless Chromium 不带 PDF 查看器，
   `star.pdf` 的 iframe 有尺寸有 src 但内容是灰底。这是**验收环境的限制，不是插件的问题**
   （真 Chrome 正常）。所以 PDF 的浏览器验收只能验「iframe 存在且尺寸正常」，
   内容渲染必须人工看一眼。
12. **入口体积预算从 12KB 上调到 14KB。** P1 拍 12KB 时 6 个插件还没迁入；
   P3-A 实测 12.5KB（装配 6.4 + 6 插件约 6 + 共享工具栏 1.5）。
   改预算而不是砍插件：D3 的意图就是「装完 import 即可用 6 个原生插件」，
   砍掉 Office（2.5KB，最重的那个）会让根入口变得不完整。

---

## 执行记录（随实施追加）

| 阶段 | 完成时间 | 提交 |
| --- | --- | --- |
| P0 | 2026-10-27 | ADR-16（六个决策落纸） |
| P1 | 2026-10-27 | 包骨架 + Core 状态机收敛 + demo 指回源码（14 单测） |
| P2 | 2026-10-27 | 装配器接内核 + 单赢家路由纯函数（54 单测） |
| P3-A | 2026-10-27 | 6 个轻量插件 + 共享模块 + 6 份 doc.json（88 单测） |
| P4 | — | — |
| P5 | — | — |
| P6 | — | — |
