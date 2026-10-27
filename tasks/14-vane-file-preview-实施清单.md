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

- [x] `ZipPreviewPlugin`（233 / `jszip`）—— 动态 import + 缺失依赖面板；`maxFiles` / `showFileSize` **从死配置变成真生效**；**删掉 `.rar` / `.7z`**（jszip 解不开，认领了只是把「兜底下载」变成「报错」）
- [x] `JsonPreviewPlugin`（640 / `@uiw/react-json-view`）—— **9 个主题子路径收敛到 2 个**（light / dark + auto 跟随系统）；删 12 处 `console.log`；导出改 Blob URL（5MB 的 JSON 拼 data URL 会得到十几 MB 的 href）；非对象 JSON 退化成 `<pre>`
- [x] `XmlPreviewPlugin`（423 / `react-xml-viewer`）—— 修 `../../plugins/types` → `../plugins/types`；**`hooks.toolbar` 是空转钩子**（装配层读 `renderToolbar`），改掉；`style` 不在 `XMLViewerProps` 里 → 外层容器控制；**删掉 4 个从未生效的配置**（enableValidation / showAttributes / showComments / showProcessingInstructions）与「格式化」按钮（正则切分会改坏 CDATA）；`collapsedLevels` 终于接上 `initialCollapsedDepth`；`name` 从 `xml-preview` 改回 PascalCase
- [x] `XlsxPreviewPlugin`（374 / `xlsx`）—— 删 16 处 `console.log`；**Sheet 切换从假变真**（sharedData 单一真源 + `forceUpdate`）；**行列上限**（`maxRows` / `maxCols`，按 `!ref` 裁 range）；doc.json 与 notes 注明 Apache-2.0 与「npm 上停在 0.18.5」
- [x] `PptxPreviewPlugin`（553 / `jszip`）—— UI 三处标注「文本大纲」；**标题启发式修了个真 bug**（`lvl` 在 `a:pPr` 上，不在 `a:p` 上 → 原来每段都当标题）；缩略图导航重写成窗口化页码条
- [x] `DocxPreviewPlugin`（289 / `docx-preview`）—— `canHandle` 读 `file.docxMode`（**只在 `"docx-preview"` 时命中**）；priority 7 → **8**（平手会输给 Office）；删掉 `* { display: block !important }` 死样式（一旦生效会让表格散架）
- [x] `MammothDocxPlugin`（237 / `mammoth/mammoth.browser`）—— `docxMode` 未设或 `"mammoth"` 时命中（默认实现）；删 `styleMap: []` 与「Mammoth 模式」调试横幅

### P3.3 C 级 4 个（拆分 / 重构）

- [x] `CodePreviewPlugin`（1572 / 7 文件）—— **41 套 prism 主题 → `one-light` + `vsc-dark-plus` + `auto`**（`auto` 走 `prefers-color-scheme`）；`preferences.ts` 的 localStorage 键加 `vane-file-preview:code:prefs` 前缀且 `storage: false` 时全 noop；语言按**扩展名**存；`detectLanguageFromFilename` 从 `includes` 改精确基名匹配（`Makefile.js` 不再被判成 makefile）；`maxBytes` 默认 2MB 超限退化成 `<pre>`
- [x] `MarkdownPreviewPlugin`（601）—— `rehype-raw` **默认关闭**，`allowHtml: true` 才加载 `loadMarkdownWithRaw`（两个 loader 分离，不把 raw 进主 chunk）；删 `remark-math`/`rehype-katex` 留 `remarkPlugins`/`rehypePlugins` 扩展点；`resolveMarkdownUrl` 白名单协议 + `urlTransform`（相对路径按 `file.url` 解析）；170 行内联 CSS 收成一份 `MARKDOWN_CSS` + CSS 变量双主题
- [x] `CsvPreviewPlugin`（730 / 单文件）—— 拆 `parse.ts`（`decodeText` BOM→UTF-8(fatal)→GB18030→宽容、`parseCsv` 用 `meta.delimiter`、`toCsvText` RFC 4180）/ `CsvTable.tsx` / `CsvToolbar.tsx` / `index.tsx`；排序按**列下标** + `numeric: true`；`supportedExtensions` 只留 `.csv`/`.tsv`（不再抢 `.txt`）
- [x] `EpubPreviewPlugin`（186 / `react-reader`）—— 独立子路径；旧名 `createSimpleReactReaderEpubPlugin` 留别名；**两级前置校验**（zip 魔数 + `META-INF/container.xml`）；内容以 **ArrayBuffer** 交给 epub.js（不是 `blob:` URL，见偏离 21）；删掉正文里第二条工具栏
- [x] `shared/ToolbarComponents.tsx` —— **`FileInfo` 组件改名 `FileMeta`**（与文件元数据类型 `FileInfo` 撞名，分析 4.6）
- [x] `isolatedStyles.ts` —— 显式 `import type React` + 三个函数标 `React.CSSProperties` 返回类型（修 `TS2742`），落地在 `components/FilePreviewPlugin/shared/isolatedStyles.ts`（与 P4.4 面板同目录，而不是清单里写的 `src/styles/`）

### P3.4 桶文件与 doc

- [x] `custom-plugins/index.ts`：17 个导出，按 `media`（5）/ `document`（5）/ `data`（3）/ `archive`（1）/ `other`（3）分组，另出 `PLUGIN_FACTORIES` + `createAllPlugins()`
- [x] `src/plugins.ts`：**只出 6 个轻量插件**（Image / Pdf / Video / Audio / Download / Office）—— P3-A 已建
- [x] `pnpm docs:plugins` 生成 17 行

### P3.5 单测（第三批）

- [x] 每个插件：工厂返回 `{ name, hooks }`、`doc.json` 可解析、`config` 字段完整（17 × 3 表驱动，`plugins-a/b/c.test.ts` 三批合起来覆盖 17/17）
- [x] 端到端 3 个：CSV 解析出首行表头（`csv-parse.test.ts`）/ DOCX 两种模式命中不同插件（`plugins-b.test.ts` 三种 `docxMode` × 两种注册顺序）/ 未知类型落到 `unsupported`（`lifecycle.test.tsx`）

**验收门 P3**：`doc.json` **17/17** ✅；桶文件 17 导出无遗漏 ✅；`docs:plugins` 生成 17 行 ✅；`typecheck` 0 错 ✅；`test` **240 通过 / 16 文件**（清单写 ≥ 40）✅。

---

## P4 · 依赖边界与体积工程（本包独有，前三包没有这一关）

- [x] **P4.1 单插件子路径入口**：17 个 `custom-plugins/<Name>/index.tsx`，每人的重依赖只在该文件里 import（P3 完成，`sync:exports` 已生成 17 条子路径）
- [x] **P4.2 external 支持子路径**（基础设施改动，`internal/build-config`）—— **P3-B 提前完成**：
  B 批一迁入就会把 jszip / xlsx / mammoth / docx-preview 全内联（实测反证：退化成包名字符串后
  出现 `chunks/mammoth.browser-*.js = 492.4KB`），体积闸门根本过不去。
  - [x] `LibOptions.external` 放宽为 `(string | RegExp)[]`，透传给 `rollupOptions.external`
  - [x] 本包传 `/^mammoth(\/|$)/`、`/^react-syntax-highlighter(\/|$)/`、`/^@uiw\/react-json-view(\/|$)/`、`/^react-reader$/`、`/^docx-preview$/`、`/^xlsx$/`、`/^jszip$/`、`/^papaparse$/`、`/^react-markdown$/`、`/^rehype-/`、`/^remark-/`、`/^react-xml-viewer$/`（C 批要用的也提前写好了，迁入时不用再改构建配置）
  - [x] **闸门断言**：`test/dist-external.test.ts` 三条 —— ① 9 个 `import("pkg")` 必须原样留在对应入口；② 不得出现 `JSZip` / `SheetJS` / `--w-rjv-` / `docx-wrapper` 这四个「整库内联才有」的标识；③ **单文件 ≤60KB、全量 ≤220KB**（签名漏掉的库由体积兜底）。**注**：清单原来写「不得出现 mammoth / prism 特征串」，实测发现 `import("mammoth/mammoth.browser")` 与 `docxMode === "docx-preview"` 会假阳性，改用内部标识 + 体积双判据
- [x] **P4.3 optional peer 声明**（**14 个**——这是代码里真实 import 的完整集合，由 `test/peer-manifest.test.ts` 反向扫源码守住）
  - [x] 文本 / 结构（6）：`docx-preview`、`mammoth`、`xlsx`、`jszip`、`papaparse`、`react-xml-viewer`
  - [x] Markdown 链（5）：`react-markdown`、`remark-breaks`、`remark-gfm`、`rehype-highlight`、`rehype-raw`
  - [x] 富组件（3）：`@uiw/react-json-view`、`react-syntax-highlighter`、`react-reader`
  - [x] **清单原写 16 个含 `remark-math` / `rehype-katex`**：C 批把 KaTeX 链路整段删了（KaTeX 要额外引 CSS + 一整包数学字体，只为公式；而 17 类文件里只有 Markdown 可能带公式，按需由宿主自己通过 `remarkPlugins` 扩），两个包已不 import，故不声明（见偏离 29）
  - [x] **已声明 6 个**（P3-B）：`jszip` / `xlsx` / `docx-preview` / `mammoth` / `@uiw/react-json-view` / `react-xml-viewer`，全部 `peerDependenciesMeta.*.optional: true`；余下 10 个等 C 批迁入
  - [x] 全部 `peerDependenciesMeta.*.optional: true`
  - [x] `pdfjs-dist` / `react-pdf` / `react-player` / `react-h5-audio-player` / `pptx-parser` / `highlight.js` **一个都不声明**（代码 0 引用；`peer-manifest.test.ts` 的「幽灵声明」用例反向守着这条）
- [x] **P4.4 友好降级面板**（P3-B 完成，落在 `components/FilePreviewPlugin/shared/` 而不是 `custom-plugins/shared/` —— 与 A 批的共享模块同目录）
  - [x] `shared/panels.tsx`：`MissingDependency`（包名 + `npm i <pkg>` + 可选 hint + 折叠的错误原文）、`LoadingPanel`、`ErrorPanel`，三者都带 `data-vfp-panel` / `data-vfp-missing` 断言锚点
  - [x] `shared/useDynamicModule.ts`：模块级 loader → `{ status, mod, error }`，插件只在 `status === "ready"` 时才发 fetch
  - [x] 7 个插件全部改动态 import；`test/missing-dependency.test.tsx` 用 `vi.mock("jszip", () => { throw … })` 让 import 真的 reject，断言出现 `[data-vfp-missing="jszip"]` 而不是崩溃
- [x] **P4.5 体积三口径**：根入口 ≤**16KB** / `./core` ≤8KB / 全量并集 ≤90KB，写进 `vane` 字段
  - 实测（闸门口径，`check-packages.mjs`）：**13.7 / 6.6 / 69.0**；消费方口径（esbuild 单入口 bundle + gzip、peer external）：**10.5 / 5.3 / 61.3**
  - 预算从 12 → 14（P3-A，插件从 6 个到 17 个）→ **16**（P3-D，错误面板统一到 `ErrorPanel`）。两套口径的差值写进了 `sizeBudgetNote`，避免下次拿两个数对比得出「超预算」的结论

**验收门 P4**：`check-packages.mjs` 三条线全绿（13.7/16 · 6.6/8 · 69.0/90，且 README 已同步）；`dist` 无重依赖特征串；`dependencies` 为 `{}`；`peer-manifest.test.ts` 6 条把「漏声明 / 幽灵声明 / 非 optional」三种错法都堵住（反向验证：删 `papaparse` + 加 `remark-math` → 3 条立刻红）；未安装 optional peer 时**渲染提示而不是白屏**。

---

## P5 · demo 重写（三视角）

- [x] **P5.1 骨架**：`demo/vite.config.ts`（`createDemoConfig`）、`App.tsx`（4 项导航）、`pages/{HomePage,WorkshopPage,DemosPage,ScenariosPage}.tsx`
  - 实为 5 条路由：`/` · `/demos`（目录）· `/demos/:id`（17 页，同一组件按 id 取）· `/workshop` · `/scenarios`
  - 视觉照 `packages/vane-lazy-image/demo` 抄：琥珀橙 `#ff7a29` + 暖墨黑 `#0b0a09` + Chakra Petch/JetBrains Mono 自托管
  - **唯一的关键偏离**：新增一套 `--paper*` 灯箱令牌。文件预览的内容天生是白底（PDF 页、docx 纸面、Markdown 正文），
    暗场里直接放白底内容会糊成一片；外框仍是仪器暗色，形成「暗房里的灯箱」。理由写在 `App.css` 文件头
- [x] **P5.2 样本资产**：`archive-plugins/vane-file-preview/public` 的 36 个根级真实文件（15MB）全部搬进 `demo/public/samples/`（**绝不进 dist**：`demo-dist/` 在 .gitignore 里，库产物无 samples）
  - 当前 39 个 = 归档 36 + 自建 3（`gbk-data.csv` GB18030 / `xss-demo.md` XSS 样本 / `fake-book.epub` zip 改名的假书）
  - 归档里的 `sample-epub/` 是**解压后的目录书**，本插件只吃单文件，故不搬（已记录）
  - 逐个真机点开确认：GIF / WebP / 两个 PDF / WebM / MP3 / WAV / package.json / 竖线 CSV / 混排 CSV 全部正常，控制台无错误
- [x] **P5.3 工坊（17 张卡）**：每卡 = 一个插件 + 一个默认文件 + 配置项说明 + 一句「拿手的活」
  - 17 张卡都是**真的预览器**（不是截图），可切样本；`LazyMount`（IntersectionObserver + rootMargin 240px）延迟装载：
    epub/docx/pptx/xlsx 各要解一个 zip，17 个同时挂会把主线程堵住
  - 工坊卡复用 `.stage-mount` 而不是自造 `.ws-mount`，让 17 张卡和 17 个逐项页走同一套体检判据
- [x] **P5.4 逐项示例（17 页）**
  - [x] 一文件一页：`demo/src/demos/<NN>-<slug>.tsx`，双 glob（eager 组件 + `?raw` 同源，同 vane-card）
  - [x] 每页 = 左预览（可切 2~3 个样本文件 + 2~3 个装配档位）+ 右事件/状态 + 下通栏源码（官方用法 / 本页源码 两个 tab）
  - [x] **装配写成模块顶层常量**（`const Preview = withPlugins(...)`），禁止在函数体内调 `withPlugins`
  - 全站 36 套装配**集中在一个文件**（`demo/src/lib/previews.tsx`）的模块顶层；页面只能 `previewOf(key).Comp` 取引用
- [x] **P5.5 场景（6 个）**
  - [x] 上传即预览（拖拽 + 类型分流）/ 邮件附件列表 / 文档审批（左右对比）/ 素材库（图 + 视频混合）/ 数据导入（CSV 映射列）/ 代码评审（diff 视角）
  - 每个场景带「最小装配」自动生成（`minimalCode()` 只留 import + withPlugins + `<Preview file>`），证明几十行就能落地
- [x] **P5.6 体检闸门**
  - [x] `scripts/audit-pages.mjs`：真浏览器逐页断言「预览器容器存在 + 非零尺寸 + 无 pageerror + 无 overflow」，块锚点 `[data-demo]` / `[data-scenario]` / `[data-plugin]`
  - [x] `demo/src/lib/audit.ts` 同源判据（浏览器里可手点复现）
  - [x] 静态覆盖闸门：catalog 的 17 个 id 与 17 个逐项页**一一对应**，缺/多都在开浏览器之前抛错
  - [x] **内容级判据 `no-plugin`**：挂载点里是 Core 的「没有插件能预览这个文件」即判红（几何全绿也可能内容为空，见偏离 40）
  - [x] 已知噪声分流（打印但不判失败），见偏离 33
  - [x] 两条链路都验：vite dev（3302）与 `build:demo` + `serve:demo`（3303）
  - 单轮耗时从 ~7 分钟降到 ~110 秒：原因见偏离 42（等了永远不存在的 `main .page`）

**验收门 P5**：40 页（17 逐项 + 17 工坊 + 6 场景）逐页几何 **0 命中**；每页有可复制源码；17 插件在 demo 中**至少装配一次**（脚本化覆盖闸门）。
→ 实测（最终代码）：dev（3302）21 页 / **40 块 / 0 命中 / 退出码 0**；构建产物（3303）同样 21 页 / 40 块 / 0 命中。
   `tsc` 0 错、`eslint` 0 error / 76 warning、`vitest` **18 文件 258 条全过**、`build:demo` 通过。

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

13. **`docx` 的赢家必须由 `docxMode` 决定，不能由 priority 决定 —— 平手就是定时炸弹。**
   两个 docx 插件最初都是 priority 7，与 `OfficePreviewPlugin` 的 7 相同，于是
   `resolvePreview` 走到「平手按声明顺序」，测试里把 office 挪到数组第一位，赢家就从
   `DocxPreviewPlugin` 变成 `OfficePreviewPlugin`。修法：`DocxPreviewPlugin` 提到 **8**。
   这条是单测先红才发现的 —— 说明「互斥的 canHandle」还不够，priority 也必须留出空档。
14. **`lvl` 属性不在 `<a:p>` 上，而在子节点 `<a:pPr lvl="…">` 上。**
   Pptx 的标题启发式原来写 `p.getAttribute("lvl") ?? "1"`，读不到就默认 1 → **每一段都被判成标题**。
   真浏览器截图里一页 PPT 的「标题 / 汇报人 / 时间」三行全被涂成蓝色粗体，才暴露出来。
   改成读 `a:pPr`，读不到时退到「只有第一段算标题」。
15. **`hooks.toolbar` 是一个不存在的钩子名。** Xml 插件的下载工具栏写的是 `toolbar:`，
   装配层读 `renderToolbar:` —— 那段代码从来没被执行过，`tsc` 也不报错（对象字面量里多一个键，
   而 `FilePreviewPluginHooks` 是可选属性集合，多出的键在 `as` 之后就被接受）。
   修完之后 Xml 的工具栏第一次真的出现。
16. **「声明了但没生效」是本包最容易积累的技术债，B 批一次清掉 9 个。**
   Zip 的 `maxFiles` / `showFileSize`、Xml 的 4 个开关 + `collapsedLevels`、Xlsx 的 `defaultSheetIndex`、
   Json 的 `collapsed` —— 全都在 `config` 里、也都进了文档，但渲染时不读。
   判断标准很简单：**doc.json 里的每个 config 必须在渲染路径上被读到**，所以
   `plugins-b.test.ts` 对账的是「字段集合 + 默认值」，人眼对账的是「有没有真的用」。
17. **`dist` 特征串断言差点写成假阳性机器。**
   第一版按包名扫（`mammoth` / `xlsx` / `docx-preview`），结果 `import("mammoth/mammoth.browser")`
   与 `docxMode === "docx-preview"` 全部命中；换成 `SheetJS` 后又撞上我自己写的一句
   「离线解析 xlsx 需要 SheetJS」。最终用「只有整库内联才会出现的内部标识」
   （`JSZip` 类名 / `SheetJS` banner / `--w-rjv-` CSS 变量前缀 / `docx-wrapper` class）
   **加上体积双判据**，并在源码里避免用这些词写用户文案。
18. **`xlsx` 在 npm 上停在 0.18.5。** SheetJS 从 0.19 起改在自己的 CDN 分发，
   npm 包不再更新（License 仍是 Apache-2.0）。这条写进了 `doc.json` 的 notes 与插件头注释，
   免得消费方以为 `npm i xlsx` 拿到的是最新版。
19. **`matchExtension` 必须按「段边界」匹配，否则 `"rar".endsWith("r")` 成立。**
   17 个插件全接入后跑矩阵，`a.rar` 的赢家是 `CodePreviewPlugin` —— 它声明了 `.r`（R 语言），
   而旧实现是 `ext.endsWith(pat)`，于是压缩包被当成 R 脚本渲染成一片乱码。
   改成 `ext === pat || ext.endsWith("." + pat)`。**这条错误只有在「短扩展名 + 长扩展名同后缀」时触发**，
   17 个插件单测各自都绿，只有两两组合的矩阵能抓到 —— 所以 `routing-all.test.ts` 不是重复劳动。
20. **桶入口的体积口径要单独算，不能混进单文件上限。**
   `dist/custom-plugins/index.js` 是「17 个插件的并集」，必然大于任何一个单独插件（实测 86.5KB），
   按「单文件 ≤ 60KB」直接红。给它**独立上限 140KB**，并且**不计入 220KB 总量**
   —— 否则总量 267KB 也红。理由：桶文件是「一次装齐 17 个」的便利入口，
   真正该守住的是「单个子路径入口 ≤ 60KB」，这才是消费者按需引入时的真实代价。
21. **EPUB 不能把 `blob:` URL 交给 epub.js —— 它只按扩展名猜类型。**
   第一版 `URL.createObjectURL(blob)` 后在 happy-dom 单测里「通过」（那里根本没跑 epub.js），
   真浏览器里是 react-reader 内部一句 `Error loading book`、iframe 数量 0。
   根因在 `Book.determineType()`：`blob:http://host/8f3a-…` 没有扩展名 →
   `if (!extension) return INPUT_TYPE.DIRECTORY` → 走 `openContainer()` 去请求相对的
   `META-INF/container.xml`（相对 blob URL 必然失败）→ `openFailed`。
   改成把 **ArrayBuffer 直接传进去**：非字符串输入走 `INPUT_TYPE.BINARY` → `openEpub()` → JSZip 原地解压，
   一次网络都不发，还省掉 `revokeObjectURL` 的时机问题。
   **教训：happy-dom 里「渲染不报错」对这类重依赖插件几乎零证明力**，必须看真浏览器。
22. **EPUB 的两级校验：zip 魔数拦不住「普通 zip 改后缀」。**
   EPUB 就是 zip，`sample.zip` 与真 EPUB 的魔数完全相同，所以第一版的「魔数校验应报错」
   在真浏览器里既没报错也没渲染 —— 它一路交给了 epub.js 去炸。
   加第二级：在原始字节里扫 `META-INF/container.xml`（zip 的 local header / 中央目录都把文件名明文存着，
   不解析 zip 也能判断），普通 zip 就落到「这看起来是一个普通 ZIP，不是 EPUB」。
   同时把 demo 的样本换成一个真的 zip 改名 `fake-book.epub` —— 原来那条 `sample.zip`
   是 `application/zip` + `.zip`，压根不会路由到 EPUB 插件，**样本和它声称的验证目标不是一回事**。
23. **Office 的扩展名声明不全，`.dotx` / `.xlsm` 这些会掉到兜底下载。**
   矩阵里 `a.dotx` 的赢家是 `DownloadPlugin`：Office 只声明了 `.docx/.xlsx/.pptx` 等 6 个主扩展名。
   补齐 `.docm/.dotx/.xlsm/.xltx/.pptm/.potx`（这几种 LibreOffice / OnlyOffice 一样能打开）。
24. **StrictMode 下 dev 会多一条 `META-INF/container.xml` 404，生产没有。**
   `Book.destroy()` 会把 `archived` 重置为 `false`，而 epub.js 的 open 链是异步的；
   组件在打开途中被销毁（React StrictMode 双挂载必然发生一次）后，链尾的 `openContainer()`
   退回网络请求，按页面基址拼出 `/demo/META-INF/container.xml`。
   **验证方式**：`build:demo` 后起静态服务（无 SPA fallback）重跑同一探针，
   `errors=[]` 且 `failed-requests=[]` —— 否则这条只能算「猜的」。
   写进 `doc.json` 的 notes，免得后来者去追这条只在 dev 出现的 404。
25. **Core 的失败态是英文 + 死路，17 个插件里只有它一处英文。**
   迁移前是手写的 `❌ Load Failed` + 裸文案，红底绝对定位盖住内容区，
   用户既不能重试也拿不到文件。现在复用插件层的 `ErrorPanel`（同一套视觉、同一句中文化），
   并给 `ErrorPanel` 加了可选的 `action`（失败面板不能是死路：走到这一步基本只有
   「链路出错」和「浏览器不解这个格式」两种，两种情况下「先拿到文件」都是唯一有意义的动作）。
   顺带把 `Loading...` 与 `ProgressIndicator` 的默认文案一起中文化 —— 同一类问题。
26. **视频失败提示的「可能」是错的。** AVI / WMV / FLV 在现代浏览器内核里
   **必然**没有解码器，写「浏览器可能不支持该编码」会让用户去怀疑自己的文件、反复重试。
   改成按容器分组：必然不支持的直接讲原因（DivX/Xvid、Flash 技术栈）+ 替代方案（转 MP4），
   只有未知格式才用保守措辞。
27. **失败面板里打印二进制头部 = 满屏乱码。** Epub 第一版 `new TextDecoder().decode(head)`
   直接把 zip 开头当 UTF-8 输出，面板上是 `PK☐☐☐UO☐` 加一堆替换符。
   改为三档：认得出格式就说格式（PNG/JPEG/PDF/HTML…），是纯文本才引原文，都不是才给十六进制。
28. **列 zip 条目必须走中央目录（EOCD），不能全文扫 `PK\x01\x02`。**
   第一版线性扫描 + 固定偏移读长度：真 zip 的压缩数据里可能恰好含这四个字节，
   读出来的就是随机字节当文件名 —— 面板又是乱码。**而当时的合成样本里没有数据区，
   单测是绿的**（又一次「单测绿、真文件红」）。现在测试样本用 jszip 生成、并故意
   用 STORE 存一段内容含 `PK\x01\x02` 的数据，让旧实现必然踩到；
   断言也改成完整的条目串（多出任何一条都会红）。
   展示上再做一层：深路径只留 `…/文件名`、最多 5 条 —— 否则路径前缀把面板撑成十几行，
   文件名（唯一有信息量的部分）反而被截掉。
29. **optional peer 是 14 个，不是清单里写的 16 个。**
   清单按迁移前的代码统计，含 `remark-math` / `rehype-katex`；C 批把 KaTeX 链路删掉后
   这两个包已不再 import（子路径归一后扫源码可确认）。留着的后果是消费方包管理器提示
   「缺少 peer 依赖」，装上来却永远用不到。现在由 `test/peer-manifest.test.ts` 双向守住：
   漏声明（import 了但没写 peer）、幽灵声明（写了但没 import）、该 optional 却没标，
   三种错法各一条用例，且反向验证过。
30. **体积预算第三次上调：14 → 16KB（闸门口径）。**
   这次不是加插件，而是 P3-D 让 Core 的失败态复用 `ErrorPanel`（原本是内联的一行文字）。
   关键是把**两套口径**的差值写进 `vane.sizeBudgetNote`：闸门口径（入口 + 静态引用 chunk
   逐个 gzip 相加）会把 `index` / `withPlugins` 共享 chunk 在根入口与 `core` 里各算一遍，
   所以 13.7KB；消费方口径（esbuild 单入口 bundle + gzip、peer external）只有 10.5KB，
   后者才是用户真实付出的字节。以前混用两个数得出过「看起来超预算」的错误结论。
31. **`data-plugin` 的语义是「这块是一个真的预览舞台」，不能拿来标索引卡。**
   首轮体检报 57 块（期望 40），因为 `/demos` 目录里 17 张链接卡也带了 `data-plugin`
   → 被判成「块里没有 `.stage-mount`」。改成 `data-idx`。教训：**锚点属性一旦同时承担
   「语义标签」和「脚本判据」两个职责，多打一处就是一条假红**（或更糟：假绿）。
32. **「没有块」在脚本里不算错，在页面手检里算错 —— 这个分歧必须写下来。**
   `/` 和 `/demos` 本来就没有舞台；`lib/audit.ts` 却是人在预览页上手点的，0 块一定是装配漏了。
   两边各按自己的场景判，注释写清差异，免得后来者「统一」成一种而让其中一边失效。
33. **epub.js 的 `META-INF/container.xml` / `OEBPS/OEBPS/content.opf` 404 是同一件事。**
   `Book.archived === false` 时 `load()` 不走 `archive.request()` 而回落成裸 XHR（路径相对文档基址）。
   触发源是 React StrictMode 双挂载：第一本书被 `destroy()` 后仍有在途的容器解析。
   实测三条（别凭猜）：书**渲染正常**、工坊 idle 8 秒内 `[data-vfp-epub]` 重建 **0** 次、
   同一本书两次跑出**两条不同**的失败路径 → 是回落，不是固定逻辑。
   处理方式是**已知噪声分流**（打印出来 + 写清原因），不是静默忽略。
34. **`withPlugins` 把用户的 `onStateChange` 吞了（库级 bug）。**
   它只做内部镜像（`setState` 触发重渲），没往下透传 → 消费方拿不到状态，
   demo 的状态读数永远停在 `IDLE`。修完补 `test/with-plugins-callbacks.test.tsx`（4 条，
   含「没有插件能预览」这条失败路径），否则下次重构还会掉。
35. **Markdown `allowHtml: true` 下，一个 `<img onerror>` 能把整棵 React 树打崩。**
   `rehype-raw` 只负责把 HTML 变成节点，不管属性。加了 rehype 插件剥离 `on*` 处理器与
   `javascript:` 协议；`doc.json` 里「开启前请自行清洗」改成「已剥离事件处理器与 js: 协议，
   但仍然建议服务端再洗一遍」——写「你别用」不如写「我做到了哪一步」。
36. **右栏参数表的 `nowrap` 把整页顶宽 62px。**
   `.demo-side` 的 grid 列少了 `minmax(0, 1fr)`，子元素 `white-space: nowrap` 就把列撑到 393px。
   体检的 `page-overflow` 判据（body 比视口宽）当场抓到 —— 这是**块自己没溢出、整页溢出**的
   典型形态，只在挂载点上量尺寸是查不出来的。
37. **「装配代码」必须从真装配对象反推，不能另写一份文案。**
   写一份就等于有了两份事实；改插件参数忘了改文案，页面就会拿一段跑不起来的代码骗人。
   反推时**只输出与默认档的差异**（否则 8 个默认参数把真正的信息埋掉），
   切档位时 `{allowHtml: true}` 会实时出现在代码里。
38. **`useFile` 被 eslint 当成 Hook**（`rules-of-hooks` 两条 error）：普通函数用了 `use` 前缀。
   改名 `adoptFile`。命名空间这种东西，工具是认前缀的，不认意图。
39. **demo 产物单 chunk 1.5MB（gzip 525KB），这是演示台的代价，不是库的。**
   36 套装配全在 `lib/previews.tsx` 模块顶层（这是硬约束），17 个插件工厂因此都被静态引入。
   库产物的体积闸门另算（16KB / 8KB / 90KB 三档），`npm pack` 也不含 demo。
   如果哪天要把 demo 部署成公开站点，再考虑按路由拆装配 —— 现在不值得为它牺牲「装配在顶层」这条。
40. **`docxMode` 让「几何全绿、内容为空」成了可能 —— 这是 P5 最值钱的一条。**
   docx 的两个渲染器由 `file.docxMode` **互斥**决定：`DocxPreview` 只在
   `=== "docx-preview"` 时命中，Mammoth 在不等于时命中。demo 的样本是同一个
   `sample.docx`，没有这个字段 → `/demos/docx`、工坊 docx 卡、邮件附件场景
   **全都静默变成 Core 的「没有插件能预览这个文件」**。
   而几何体检一条都没红：块在、尺寸 327×165、无溢出、无 pageerror。**三个绿，内容是空的。**
   修法分两层：
   - 数据层：`PluginMeta.filePatch`，由 `DemoDetailPage` / `WorkshopPage` 合并进 file；
     场景里就地补 `docxMode`。**不能靠页面自觉**，一处忘了就是一次假绿。
   - 判据层：新增 `no-plugin` 判据（只认 Core 那句，不认 DownloadPlugin 的兜底文案）。
     **反向验证过**：删掉 `filePatch` 后 `/demos/docx` 立刻红、mammoth 页仍绿。
41. **`shortMime` 截前缀会把三种 OOXML 截成同一个字符串。**
   `application/vnd.openxmlformats-officedocument.` 这 44 个字符三者完全相同，
   差别在尾巴（`wordprocessingml.document` / `spreadsheetml.sheet` /
   `presentationml.presentation`）。截前 18 字 → 三行长得一模一样，等于没显示。
   改成保留尾两段：`application/…wordprocessingml.document`。
42. **体检跑 7 分钟，大半在等一个永远不存在的选择器。**
   `/demos/:id` 的根节点是 `<section class="demo">`，不是 `.page`；脚本里
   `waitForSelector("main .page")` 在那 17 个页面上必然超时，然后被 `.catch(() => {})` 吞掉
   —— 17 × 20 秒空转。改成等 `main .page, [data-demo], [data-plugin], [data-scenario]`
   且 `state: "attached"`，单轮 7 分钟 → 110 秒。
   **教训：`.catch(() => {})` 会把「逻辑错误」伪装成「只是慢」。**
43. **本机沙箱下 `--pool=threads` 偶发 worker EPERM（写 Temp 被拦），表现为「文件数变少但全绿」。**
   同一份代码三次跑出 211 / 223 / 258 条 —— 只有 258（18 文件）是真的全跑完。
   复跑用 `--pool=forks --no-file-parallelism` 稳定 18/258。判据是**文件数与用例数**，
   不是「绿不绿」：绿但少跑了几条，比红更危险。
44. **`.demos-index` 不能改成「单网格 + 通栏标题」。**
   它是 1px 隔线拼出来的表格感网格；通栏标题要求网格跨行，于是只有一张卡的分组会在
   同一行里留下两个**带边框的空格**，看起来像数据缺失（试过，比原来的右侧留白更糟，已回退）。
   工坊是无边框的 gap 网格，用单网格 + 通栏标题就没这个问题（那部分保留）。
---

## 执行记录（随实施追加）

| 阶段 | 完成时间 | 提交 |
| --- | --- | --- |
| P0 | 2026-10-27 | ADR-16（六个决策落纸） |
| P1 | 2026-10-27 | 包骨架 + Core 状态机收敛 + demo 指回源码（14 单测） |
| P2 | 2026-10-27 | 装配器接内核 + 单赢家路由纯函数（54 单测） |
| P3-A | 2026-10-27 | 6 个轻量插件 + 共享模块 + 6 份 doc.json（88 单测） |
| P3-B | 2026-10-27 | 7 个重依赖插件动态化 + external 正则 + 缺失依赖面板 + demo 文档页（126 单测） |
| P3-C | 2026-10-27 | Code（41→2 主题）/ Markdown（raw 默认关）/ Csv（拆 4 文件）/ Epub（ArrayBuffer + 两级校验）+ 桶文件 + 17 行文档 + demo 第三页（240 单测） |
| P3-D | 2026-10-27 | 失败态返工：Core 英文 `Load Failed` → 中文化 ErrorPanel + 下载出路；视频按容器分组措辞；EPUB 头部诊断三档 + EOCD 列条目（242 单测） |
| P4 | 2026-10-27 | 依赖边界收口：`peer-manifest.test.ts`（6 条，双向校验 14 个 optional peer）+ README 生成 + 体积三口径写实（13.7/16 · 6.6/8 · 69.0/90，消费方 10.5/5.3/61.3，248 单测） |
| P5 | 2026-10-27 | demo 三视角重写：工坊 17 卡（LazyMount）+ 逐项 17 页（档位/日志/参数表/双份源码）+ 场景 6 个 + `audit-pages.mjs`（21 页 / 40 块 / 0 命中，dev 与构建产物两条链路）。顺带修了 `withPlugins` 吞 `onStateChange`、Markdown `allowHtml` 下 `<img onerror>` 打崩树、`docxMode` 假绿（新增 `no-plugin` 判据）。258 单测 |
| P6 | — | — |
