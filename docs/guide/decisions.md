# 关键决策记录（ADR）

每个决定都记录"为什么"，避免后人（包括自己）重复纠结。

## ADR-1 · 抽 `vane-plugin-core` 共用内核，而不是各包自带插件系统

**背景**：`vane-card` / `vane-waterfall` / `vane-file-preview` / `vane-lazy-image` 各自实现了一份 `PluginBus` + `PluginManager` + `withPlugins`，且已经漂移（card 没有沙箱与依赖解析，lazy-image 有）。

**决定**：内核独立成包，各组件包以 `peerDependencies` 依赖它。

**理由**：
1. 四份实现的修 bug 成本是四倍；
2. 跨包插件复用（重试、缓存、监控、A11y）只有在单实例前提下才成立；
3. peer 依赖保证全站只有一份内核实例。

**代价**：破坏性变更，四个旧包需要发 2.0.0。

## ADR-2 · `react` 只进 `peerDependencies`

**背景**：三个旧包把 `react` / `react-dom` 写进 `dependencies`，消费方可能装到两份 React；demo 依赖（react-markdown、react-router-dom）也混在 `dependencies` 里。

**决定**：`react` / `react-dom` 永远在 `peerDependencies`；demo 依赖永远在 `devDependencies`；运行时第三方库（如 `localforage`）才进 `dependencies`。

**强制**：`pnpm check` 在 CI 拦这条。

## ADR-3 · 源码路径 == 发布子路径

**背景**：旧包 exports 指向 `dist/entries/core/index.d.ts` 这类深层路径，而 d.ts 实际镜像源码目录，两边容易对不上。

**决定**：入口文件按发布结构摆放（`src/index.ts`、`src/entries/*.ts`、`src/custom-plugins/*/index.ts`），JS 与 d.ts 输出路径天然一致；`exports` 由 `pnpm sync:exports` 从源码自动生成，不手写。

## ADR-4 · 插件文档是数据（`doc.json`），不是散文

**背景**：插件一多，README 的插件目录必然和实际实现漂移。

**决定**：每个插件必须带 `doc.json`；`pnpm docs:plugins` 生成表格与导航，`pnpm docs:sync` 生成 npm README。README 是产物，不是源。

## ADR-5 · 只发 ESM（默认），UMD/CJS 可选

**背景**：现代打包器（Vite / webpack 5 / Rollup / esbuild / Next）都消费 ESM。

**决定**：默认 `formats: ["es"]`；确需兼容 CJS 时在 `vite.config.ts` 里显式传 `["es","cjs"]`。

## ADR-6 · 插件数量不设上限：多即选择，永不淘汰

**背景**：插件覆盖的是长尾需求，每个插件解决一类具体问题；"用得少"不等于"不该存在"。插件数量增长真正带来的只有两个副作用——选择成本、消费方体积——而两者都有比限制数量更合适的解法，所以数量本身不构成约束。

**决定**：

1. **不设插件数量上限，永不淘汰，只增不减**。插件是本仓库的核心资产；有 bug 就修，过时就标替代关系，不删除；
2. "多"不影响消费方体积：ESM + `sideEffects: false` + 源码路径即子路径导出，未引入的插件被 tree-shaking，零成本；
3. 超过 20 个插件必须**按业务域分组**（目录 + `doc.json` 的 `tags`），分组可递归细化。分组是导航，不是裁剪；
4. 每个包维护 3-5 个以上 **presets 配方**作为推荐组合入口。配方是"快捷方式"，不是"白名单"——任何插件都可以被单独引入；
5. 选择成本靠「分组 + 标签 + 配方 + 文档站导航 + `pnpm docs:plugins` 自动目录」解决，不靠删插件。

**理由**：

1. tree-shaking 让"数量"与"消费方体积"解耦，"怕体积"不构成限制数量的理由；
2. 长尾需求不可预知——今天删掉的插件，明天可能正好是某个用户的刚需；留下的成本只是一份 `doc.json`；
3. 分组 / 标签 / 配方都是增量基础设施，插件越多反而越能验证这套导航体系的价值。

**代价与边界**：

- 插件越多，`doc.json` 与分组目录的维护量越大——由 `pnpm docs:plugins` 自动生成兜底，防止文档漂移；
- 单插件体积红线（≤ 2 KB gzip）保留，防止单个插件失控；
- "不淘汰"指不因"用得少"而删；若插件被更好的实现取代，保留旧版并标注替代关系，迁移时机由用户决定。

## ADR-7 · 演示站与库解耦，demo 不发布

**背景**：旧包把演示页和库源码混在一个 `src/` 下，`files: ["dist"]` 虽然挡住了发布，但 demo 依赖仍然污染 `dependencies`。

**决定**：`demo/` 独立目录 + 独立 vite 配置（`createDemoConfig`），demo 依赖只进 `devDependencies`。

## ADR-8 · 领域钩子面收口：48 → 20，只保留有执行点的钩子

**背景**：旧 `vane-waterfall` 声明了 48 个插件钩子，逐条对着 Core 的调用点核对后发现**只有 17 个真的会被执行**，其余 31 个（`filterItem` / `sortItems` / `searchItem` / `renderContainer` / `renderEmpty` / `renderLoadingMore` / `transformItem` / `calculateVisibleRange` …）从来没有执行者。插件写进去不报错，也不生效——比"没实现"更糟，因为它看起来是实现了的。

**决定**：

1. 钩子面收口到 **20 个**，每个都必须在 Core 或装配层有明确调用点；
2. 新增钩子必须同时落地「调用点 + 单测断言」，否则不进 `WaterfallPluginHooks`；
3. 布局类钩子（`calculateColumns` / `calculateColumnWidth` / `calculateItemPosition`）必须走 D1-A 的布局纯函数执行点，不允许在插件里直接改 DOM 绕过布局。

**代价**：1.x 的插件若依赖被删钩子，迁移时行为会"少一点"——但那部分行为本来就没生效，用户感知不到回退。

**连带修复**：`PinItemPlugin` 在 1.x 是彻底空转（逻辑全在 `calculateItemPosition` 上，而该钩子无执行点），收口后它第一次真正工作。

## ADR-9 · 虚拟化归属 Core，不做成插件

**背景**：1.x 的 `VirtualWaterfallPlugin` 把 `renderItem` 置空、用 overlay 自绘卡片，等于架空 Core；且未渲染项量不到高度就 `continue`，总高严重偏小，滚动条会乱跳、最后一屏滚不到。

**决定**：

1. 虚拟化下沉 Core，作为 `virtualize?: boolean | { overscan, estimateHeight, dynamicHeights }`；
2. **只裁渲染，不裁测量**：未渲染项按 `estimateHeight` 占位，列高照常推进；
3. 已测到的真实高度缓存在 `measuredHeights`，项被卸载后仍然记得；
4. `RecyclePlugin` 保留（不卸载、只 `visibility: hidden`），与 `virtualize` **互斥**：几百项用 Recycle，上千项用 virtualize。

**理由**：虚拟化是布局问题，不是渲染装饰。放在插件里意味着插件要和 Core 抢渲染权，任何一次 Core 升级都会互相打架。

## ADR-10 · `priority` 语义同向：大 = 先执行，不做反转

**背景**：`vane-lazy-image` 迁移时把 `priority` 做了 `1000 - x` 反转以适配新内核。瀑布流旧版的语义本来就是「越大越先注册」，与内核「越大越先执行」同向。

**决定**：不做反转，直接沿用。任何"照抄 lazy-image 的适配代码"都会引入 bug。

**验证**：`test/withPlugins.test.tsx` 里锁了「priority 大的插件先跑」，数据管线的 `Filter(40) → Sort(30) → Search(20) → Pagination(10)` 靠这条语义成立。

## ADR-11 · 卡片领域钩子面 24 → 15，删掉 9 个从未被执行的钩子

**背景**：旧 `vane-card` 声明了 24 个插件钩子。逐条对着 Core 的调用点核对后发现，`onSelectionChange` / `onCartChange` / `onWishlistChange` / `onBeforeDataChange` / `onDataChange` / `renderContainer` / `renderContentWrapper` / `renderBadge` / `renderActions` 这 9 个**没有任何执行者**。插件写进去不报错，也不生效 —— 和 ADR-8 是同一类病。

**决定**：

1. 钩子面收口到 **15 个** = 内核 9（`onMount` / `onUnmount` / `onPropsChange` / `onError` / `transformProps` / `transformData` / `renderOverlay` / `renderHeader` / `renderFooter`）+ 领域 6（`onClick` / `onHover` / `onVisibilityChange` / `onResize` / `onStateChange` / `renderPriceArea`）；
2. 被删钩子的能力用两条替代路径承接：状态变化走 **`onStateChange`（带 prev / next 快照）**，装饰性 DOM 走 **`renderOverlay`**；
3. 新增钩子必须同时有「调用点 + 单测」，否则不进 `CardPluginHooks`。

**代价**：1.x 插件里对着死钩子写的代码会失效 —— 但那部分本来就没跑过。

**连带修复**：旧 `StatePlugin` 的 `onCartChange` / `onWishlistChange` 是死钩子（名字保留在 config 上是为了兼容旧配置，现在由 `onStateChange` 差分驱动）；`ActionsPlugin` 加购状态改为写卡片 `state` + 抛 `cart:change` 事件，不再依赖不存在的 `onCartChange`。

## ADR-12 · 价格区做成「包内领域槽」，不进内核

**背景**：价格区是「插件 ↔ 复合组件」的接缝：`PriceCalculator` / `ComparePrice` / `CouponRecommend` 要往价格区里加片段（划线价、省钱标签、竞品最低价），而**插在哪一段是复合组件的布局决定**，不是插件的决定。两个选择：给内核再加一个 `renderPriceArea` 槽，或者在包内做一层领域槽。

**决定**：

1. 走**包内领域槽**：`usePluginSlot("priceArea")` / `renderDomainSlot(plugins, ctx, "renderPriceArea")`，实现 40 行，放在 `plugins/slots.tsx`；
2. 排序规则与内核 `composeSlots` 完全一致（`config.order` 升序 → `priority` 降序），单个片段套一层 `PluginErrorBoundary`，一个插件渲染抛错只丢它自己；
3. 内核不认识「价格」这个概念 —— 它是通用插件内核，不该有电商语义。

**代价**：多一层 Context（`CardSlotProvider`）。换来的是内核保持干净，且价格区以后要加新的领域槽（比如 `stickyBar`）不必改内核版本。

**验证**：`test/plugin-runtime.test.tsx` 装 3 个价格插件 → 断言三段都在且按 `order` 升序（受 `config.order` 而不是 `priority` 控制）。

## ADR-13 · 样式抽到 CSS 变量 + `vc-` class，但核心保留三处内联

**背景**：旧包 127 处内联 `style`，宿主无法覆盖（内联优先级最高），也没法换肤。

**决定**：

1. `src/styles/tokens.css`（变量）+ `components.css`（`vc-` 前缀 class），产出 `dist/style.css`，由 `exports["./style.css"]` 暴露；
2. 暗色用 `data-vc-theme="dark"` 整套覆盖，**不接管**宿主整站的 `prefers-color-scheme`；
3. **核心保留三处内联**：`position: relative`（overlay 插件靠它定位）、`box-sizing: border-box`（padding 计算）、以及用户显式传入的 `padding` / `containerStyle`。这三处是功能性的，样式文件缺失也必须成立；
4. `sideEffects` 改成 `["**/*.css"]` 而不是 `false` —— 否则 webpack / Rspack 生产构建会把 `import "vane-card/style.css"` 整条摇掉。
5. **容器必须自带 `color` 与 `background`，不许靠继承**。卡片是白底容器，一旦只给底色不给字色，宿主换成深色页面就会「浅字压白底」。同理，插件里凡是**内联了 `background` 的元素，也必须内联 `color`** —— 内联背景不会被宿主的文字色策略照顾到。

第 5 条是踩出来的：`.vc-card` 原本只有 `position` + `box-sizing`，文字色继承宿主；`QuantityPlugin` 的 `-/+` 按钮内联了 `background:#fff` 却没内联 `color`，于是继承到 demo 深色外壳的浅色墨，两个按钮**完全看不见**（禁用态的 `-` 本来就是浅灰，肉眼更容易漏）。

**代价**：宿主不能再靠内联样式覆盖视觉（要改就得改 CSS 变量），这是有意的：变量是契约，内联不是。

**验证**：`test/styles.test.ts` 静态对账「源码 class ↔ CSS 定义」（拼错即红、孤儿类即红），外加一条「容器自带文字色」——断言 `.vc-card` / `.vc-product-card` 的规则体里同时有 `color` 与 `background`（剥掉注释再断言，否则注释里写的 `background:#fff` 会假绿）；`demo/no-style.html` 证明不引 `style.css` 也能渲染。

## ADR-14 · 根入口不桶导出，插件与复合组件走子路径

**背景**：旧根入口把 22 个插件 + 38 个复合组件 + 3 个配方全桶导出，只用一张卡也要吃下整包（全量并集 41.52KB gzip）。这与 ADR-6「插件多即选择」直接矛盾 —— 选择的前提是「不选的不进产物」。

**决定**：

1. 根入口只聚合 **Core + 装配 + 总线键 + 契约类型**（实测 6.8KB gzip）；
2. 其余走子路径：`/core`（1.7KB）、`/plugins`（5.2KB）、`/compound`（17.6KB）、`/custom-plugins/*`（单个 1.6–1.8KB）、`/presets/*`；
3. 22 个插件的实现仍在 `src/components/CardPlugin/custom-plugins/`，但**新增 `src/custom-plugins/<Name>/` 薄壳转发**，让「源码路径 == 发布子路径」（ADR-3）继续成立，且不必搬动实现目录引发全仓 import 改动；
4. `exports` 由 `scripts/sync-exports.mjs` 扫描源码目录生成（5 → 32 条），不手写、不漂移。

**代价**：消费者的 import 变长；文档必须明确「哪个东西在哪个子路径」，否则会照抄旧写法报 `Module not found`。README 与 `docs/components/vane-card/` 都按子路径写。

**验证**：`pnpm check` 设三条线 —— 根入口 ≤12KB、`core` ≤5KB、全量并集 ≤36KB（dist 下所有 `.js` 一起去重压缩）。后两条是这次新加的口径：只量 `index.js` 会掩盖「全用上」的真实成本。

## ADR-15 · 示例页的装配随控件重建；插件读的字段以公开类型为准

**背景**：BadgePlugin 示例页上拖动「文案 / 语义 / 位置」，代码块在变、舞台纹丝不动。查下去是三件事叠在一起：

1. `withPlugins(CardCore, { plugins })` 返回的组件类型**闭包住那批插件实例**，而 demo 的 `useCard` 只按「插件名」做 memo key —— 名字没变就命中缓存，拿回第一次那个类型，配置永远停在初值。全量盘点后 **13 个页面、21 个由插件配置驱动的控件**都是这个病，不止 Badge。
2. `PriceCalculatorPlugin` 只读 `data.originalPrice`，而公开类型 `ProductData` 里叫 `oldPrice` —— 原价恒为 0，`showDiscount` / `showSavings` 两个开关**从设计上就不可能生效**。
3. `UserTagPlugin` 拿 `UserTag[]` 的类型去读 `data.tags`（`string[]`），渲染出一排空标签；而且 data 优先于 config，示例页里自己配的标签永远不出现。

**决定**：

1. 示例页的 memo key = **插件名集合 + 控件世代号**（`DemoPage` 用 `JSON.stringify(cfg)` 提供，`stage.tsx` 的 `useCard` 消费）。控件变了就换一个组件类型，装配跟着重建；
2. 用 cfg（扁平 `Record<string, number|boolean|string>`）而不是插件对象本身当世代号：插件配置里有 `new Date(...)`、内联回调这类每次渲染都新的东西，拿它做 key 会**每帧重挂**；
3. 插件读数据字段时**以公开类型 `ProductData` 为准**，历史字段做兼容兜底（`oldPrice ?? originalPrice`）；同一份数据两种形态（`string[]` 与对象数组）要归一化，不许让调用方猜；
4. config 与 data 同时存在时，**显式 config 优先**（与 `BadgePlugin` 一致）。「用户维度数据」不该悄悄顶掉调用方写死的配置。

**代价**：拖动控件会让卡片重挂一次，卡内状态（选中的规格、步进器数量）复位。这是有意的：`withPlugins` 的语义就是「装配定型一次」，改配置等于换一张卡，代码块里显示的也正是这张新卡的装配。

**验证**：新增两道闸门。`scripts/verify-controls.mjs` 静态对账「控件 ↔ `cfg.key` ↔ `{{key}}`」三方；`scripts/audit-controls.mjs` 用真浏览器把 19 个页面 31 个控件逐个拨到另一端，判据是「卡片 DOM 被换掉或内容变了」，悬停才生效 / 只改 console 的控件显式放过。另加两条单测锁住字段契约（`oldPrice` 画出划线价与折扣；`tags` 字符串归一 + config 优先）。

## ADR-16 · vane-file-preview 迁移：17 个插件全留、optional peer、单赢家路由

**背景**：`vane-file-preview` 是四个包里唯一带运行时依赖的（`dependencies` 26 个，前三个包全是 `{}`），
也是唯一有真实「文件类型分流」问题的。迁移前实测基线：`tsc -b` **15 错**，
`vite build --mode lib` 产出 **985.97 kB / gzip 196.33 kB**，demo 构建必须依赖 `dist/` 自引用（删掉就构不出来）。
分析见 `tasks/13-vane-file-preview-迁移分析.md`，清单见 `tasks/14`。

**决定**：

1. **D1 · 17 个插件全留，不合并两个 DOCX 实现。** `DocxPreviewPlugin`（`docx-preview`）与
   `MammothDocxPlugin`（`mammoth`）语义不同：前者保留原版式，后者出干净 HTML 便于二次排版。
   合并会让一个文件同时 `import` 两个重库，消费者再也没法只装一个 —— **体积优先于插件数量整齐**。
   `docxMode` / `previewMode` 的路由从 demo 移进库内（各自 `canHandle` 里读），demo 不再掌握业务规则。

2. **D2 · 重依赖走 optional peer，`dependencies: {}`。** 用户装 `vane-file-preview` 不该被迫拖进 15MB 的解析器。
   16 个包声明为 `peerDependenciesMeta.*.optional`，只列**代码里真实 import** 的集合；
   6 个死依赖（`pdfjs-dist` / `react-pdf` / `react-player` / `react-h5-audio-player` / `pptx-parser` / `highlight.js`）彻底删掉。
   未安装时渲染 `MissingDependency` 提示面板（带包名与安装命令），**不许白屏**。

3. **D3 · 根入口只出 Core + 6 个轻量插件。** `Image` / `Pdf` / `Video` / `Audio` / `Download` / `Office`
   全是原生标签，零重依赖。其余 11 个走 `./custom-plugins/<Name>` 子路径。
   `custom-plugins/index.ts` 保留为逃生口（一次引全），但**根入口不静态引用它** ——
   否则桶文件会把 16 个重库全带进来，这正是一次 986KB 的成因。

4. **D4 · 样式沿用内联，只抽容器与工具栏。** 旧实现 7318 行里有大量内联样式，全量重构会淹没真正的
   依赖边界问题。只把**外层容器与工具栏**抽成 `--vfp-*` CSS 变量 + 可选 `style.css`，
   插件内部几何值继续内联（与 ADR-13 对 vane-card 的处理同一口径）。

5. **D5 · 内核内联打包 `vane-plugin-core`，不设 peer。** 与 vane-card 一致：内核进 chunk，
   消费者不需要额外装包。路由做成包内纯函数 `resolvePreview(plugins, file)` ——
   给定插件列表与文件，返回唯一赢家，**可单测**。

6. **D6 · demo 三视角（工坊 17 + 逐项 17 + 场景 6）**，不做「布局视角」。
   file-preview 的版式差异来自**被预览的文件**而不是卡片排布，布局维度在这里不成立。

7. **D7 · 路由排序键是「priority → MIME 置信度 → 声明顺序」**（P3-A 实装时补的）。
   `resolve.ts` 里 `matchStrength()` 把「认不认」拆成三级：`canHandle` / MIME 命中 = 2，
   仅扩展名命中 = 1，不认 = 0。同 `priority` 时**置信度高的赢**。
   起因是一次真浏览器验收：一段 Vorbis 音频（`audio/ogg`）被 `VideoPreviewPlugin`
   靠 `supportedExtensions: [".ogg"]` 抢走，渲染成黑底视频框、工具栏还写着 "OGG Video"。
   `.ogg` 是容器不是编码（Vorbis 音频 / Theora 视频同名），`.ts`（TypeScript / MPEG-TS）、
   `.m4a`（音频 / MP4 家族）同理。浏览器给的 MIME 是权威类型，扩展名只是文件名的一部分，
   冲突时 MIME 该赢。配套把 `.ogg` 从 Video 的扩展名列表里拿掉（视频 ogg 走 `video/ogg` 或 `.ogv`）。
   注意 `priority` 仍排在置信度**之前** —— 它是插件的显式意图，不该被「碰巧 MIME 命中」推翻。

8. **D8 · 重依赖一律「动态 import + 可选 peer + 降级面板」**（P3-B 实装时补的）。
   7 个重依赖插件（Zip / Json / Xml / Xlsx / Pptx / Docx×2）迁移前都是**顶层静态 import**，
   于是「消费方没装 jszip」不是一种状态，而是一次崩溃：模块图加载阶段就炸，整页白屏，
   控制台只有一句 Failed to fetch dynamically imported module —— 用户既不知道少装了什么，
   也不知道该装哪个。改成 `import("pkg")` 之后，缺依赖变成**可渲染的状态**：
   `shared/panels.tsx` 的 `MissingDependency` 写明包名、给出一行 `npm i <pkg>`、
   附带备选方案（例如 mammoth 缺失时提示改用 docx-preview）。
   配套约束：`render` / `renderToolbar` 里不许有 hooks（见 P3-A），所以「加载依赖」这件事
   由 `shared/useDynamicModule.ts` 的钩子承担，插件正文只读它的 `status`。
   两个 docx 实现的取舍由 `file.docxMode` 决定、`canHandle` 互斥 —— **不靠 priority 抢**，
   因为「注册顺序决定渲染器」是没人能调试的隐式规则（P3-B 单测里把 office 挪到第一位就换过赢家，
   所以 `DocxPreviewPlugin` 的 priority 从 7 提到 8，与 Office 的 7 拉开）。

9. **D9 · C 批四个「拆分 / 重构」级插件的四条硬约束**（P3-C 实装时补的）。

   - **`rehype-raw` 默认关闭（安全边界，不是可选优化）。** Markdown 预览的输入是**用户上传的文件**，
     而 `rehype-raw` 会把文件里的 `<img onerror>` 原样变成 DOM —— 这是存储型 XSS 的教科书入口。
     所以拆成两个 loader：`loadMarkdownSafe`（默认，不含 raw）与 `loadMarkdownWithRaw`
     （`allowHtml: true` 才动态 import）。**双向断言**：默认关时断言 `<img>` 不进 DOM，
     开启时断言它真的进 —— 只测「默认关」的话，把开关写死成永久关闭也会通过。
     顺带删掉 `remark-math` / `rehype-katex`（两个都没在用），保留 `remarkPlugins` / `rehypePlugins` 扩展点。
   - **41 套 prism 主题 → `one-light` + `vsc-dark-plus` + `auto`。** 一个主题桶实测拖出 792KB chunk。
     `auto` 用 `prefers-color-scheme` 跟随系统，用户仍可用工具栏切到显式主题（选择存 localStorage，
     键带 `vane-file-preview:code:prefs` 前缀且 `storage: false` 时全 noop —— 组件库不经允许不该写宿主存储）。
     语言偏好按**扩展名**存（`detectLanguageFromFilename` 从 `includes` 改精确基名匹配，
     否则 `Makefile.js` 会被判成 makefile）。
   - **CSV 拆成 4 个文件，且让出 `.txt`。** `parse.ts` 是纯函数（`decodeText`：BOM → UTF-8(fatal) →
     GB18030 → 宽容 UTF-8；`parseCsv` 用 papaparse 的 `meta.delimiter`；`toCsvText` 按 RFC 4180），
     可以脱离 DOM 单测（12 条）。`supportedExtensions` 只留 `.csv`/`.tsv` ——
     迁移前它声明了 `.txt` 与 `text/plain`，把纯文本、日志、代码全抢了。
   - **EPUB 用 ArrayBuffer 而不是 `blob:` URL，并做两级前置校验。** 详见偏离 21 / 22：
     epub.js 的 `determineType()` 只按扩展名猜类型，无扩展名的 `blob:` URL 会被判成
     「已解压目录」再去请求 `META-INF/container.xml`；校验则必须两级，因为 EPUB 与普通 zip
     魔数完全相同。**这两条都只有在真浏览器里才暴露**，happy-dom 单测全绿。
   - **桶入口的体积口径独立。** `dist/custom-plugins/index.js` 是 17 个插件的并集（实测 raw 86.5KB），
     按「单文件 ≤60KB」必然红。给它独立上限 140KB 且**不计入 220KB 总量**：
     该守的是「单个子路径入口 ≤60KB」—— 那才是按需引入的真实代价。

**关键判断（写在这里防止复发）**：

- **这是「单赢家路由」，不是 vane-card 的「多插件合成」。** 一个文件只能有一个插件渲染正文，
  把 17 个插件塞进槽位合成会让它们同时渲染。所以不套用 vane-card 的槽位模型。
- **`external` 对子路径静默失效** 是 986KB 的直接原因：字符串 `"mammoth"` 匹配不到
  `"mammoth/mammoth.browser"`，`"react-syntax-highlighter"` 匹配不到它的主题子路径。
  P4.2 把 `internal/build-config` 的 `external` 放宽为 `(string | RegExp)[]`。
  **实测反证**（P3-B）：把 external 退化成包名字符串重建，立刻多出
  `chunks/mammoth.browser-*.js = 492.4KB`，`@uiw/react-json-view/light` 也被内联 ——
  而构建日志全绿。所以闸门是 `test/dist-external.test.ts` 的三条判据：
  ① 9 个 `import("pkg")` 必须原样留在入口；② 不得出现「整库内联才有」的内部标识
  （`JSZip` / `SheetJS` / `--w-rjv-` / `docx-wrapper`）；③ 单文件 ≤60KB、全量 ≤220KB。
  第三条件是真正的兜底：**按包名扫会一直假阳性**（`import("mammoth/…")`、
  `docxMode === "docx-preview"` 都是合法字符串），而体积骗不了人。
- **`manualChunks` 与 `external` 互斥**：旧配置里 9 个 chunk 全写的是外部模块名，等于没写。
  改为多入口后自然分片，不需要手写 chunk。

**代价**：消费者要按文件类型自己装 peer（文档里给一张「文件类型 → 需要装什么」的表）；
根入口只管 6 个轻量插件，剩下 11 个要写子路径 import。

**验证**：体积三口径 + `dist` 内联断言 + `resolvePreview` 对 17 种文件的赢家断言 +
`MissingDependency` 的 mock reject 单测。P3-B 时根入口预算从 12KB 上调到 **14KB**
（P1 定的 12KB 是在插件还没迁入时拍的，不是真实上限）。

**体积口径（P3-C 澄清，此前两批混用过两种算法）**：

| 口径 | 根入口 | `./core` | 17 个子路径 |
| --- | --- | --- | --- |
| **A · 消费方真实代价**（esbuild 压缩 + gzip，peer 全部 external） | **9.7KB** | 4.9KB | 59.2KB（各自独立打包后合计） |
| B · `dist` 各文件 gzip 之和（入口静态闭包） | 15.2KB | 6.5KB | 65.1KB |
| 预算 | ≤14KB | ≤8KB | ≤90KB |

**以 A 为准**：它算的才是 `import { FilePreviewCore } from "vane-file-preview"` 真正加进
用户 bundle 的字节数。B 会把同一个共享 chunk（`withPlugins` / `ToolbarComponents`）
在多个入口里重复计入，所以 B 的根入口数比 A 大 5.5KB，看起来像「超预算」。
历史提交里写的 12.9 / 6.5 / 32.2（P3-B）与 13.0 / 6.5 / 64.7（P3-C 施工中）属于 B 类口径，
且早期几次连「闭包里算哪些 chunk」都没统一，**数值不可严格对比** —— 从这一版起固定用 A。
复现：`esbuild dist/index.js --bundle --minify --format=esm --packages=external` 后 gzip。
`dist` 的三条硬闸门（`import("pkg")` 原样保留 / 无整库内联标识 / raw 单文件 ≤60KB、总量 ≤220KB、桶 ≤140KB）
仍由 `test/dist-external.test.ts` 断言，与上面这张表不是同一件事。

## ADR-17 · 文件预览领域层收口：11 钩子面、纯函数路由、optional peer、主题收敛

**背景**：ADR-16 定了 vane-file-preview 的迁移总方向（17 插件全留、optional peer、单赢家路由、内核内联）。
但「领域层到底暴露哪些能力、路由放哪、主题怎么收敛」在 ADR-16 里是散落的，落地时又补了几条独立判断，这里汇总成一篇，防止后人各自发挥。

**决定**：

1. **钩子面收口到 11（迁移前 17）**，只保留有真实调用点的钩子。
   - 领域 6（由 `withPlugins` 直接调）：`canHandle` / `render` / `renderToolbar` / `onLoadStart` / `onLoadSuccess` / `onLoadError`；
   - 内核 5（重声明为领域 context，语义不变）：`onMount` / `onUnmount` / `renderOverlay` / `transformData` / `onError`；
   - 逃生口 `priorityOf(file)`（非钩子，仅 `OfficePreviewPlugin` 需要按文件算优先级）。
   - 被删的 6 个（`onBeforeLoad` / `onLoadProgress` / `onDownload` / `onZoom` / `onRotate` / `onFullscreen`）在旧实现里 0 调用点；其中 `onZoom` / `onRotate` 是被图片/PDF 工具栏内部状态吸收的，不进插件钩子面。
   - 新增钩子必须同时有「调用点 + 单测」，否则不进 `FilePreviewPluginHooks`。

2. **路由是包内纯函数 `resolvePreview(plugins, file)`，不放进 `withPlugins` 内部逻辑。**
   - 无 React 依赖，可脱离 DOM 单测（30 种真实文件 × 17 插件，正序 + 反转赢家必须一致）；
   - 排序键固定为 `priority 降序 → matchStrength 降序 → 声明顺序`，`matchStrength` 把「认不认」拆成 2（canHandle 命中 / MIME 命中）与 1（仅扩展名命中），同 priority 时 MIME 命中压过「只有扩展名像」。

3. **重依赖一律 optional peer，`dependencies: {}`**，缺失是「可渲染状态」而非崩溃。
   - 16 个包声明为 `peerDependenciesMeta.*.optional`，只列代码里真实 import 的集合；
   - 全部走动态 `import()`，失败时 `shared/panels.tsx` 的 `MissingDependency` 渲染「包名 + `npm i <pkg>` + 备选方案 + 折叠错误原文」，**不白屏**；
   - 约束顺带成立：`render` / `renderToolbar` 里不许有 hooks（加载依赖的副作用由 `useDynamicModule` 钩子承担，插件正文只读它的 `status`），否则赢家一换就抛 "Rendered fewer hooks than expected"。

4. **主题收敛到「跟随系统 + 三选一」**，不再提供九选一配色。
   - 所有带主题概念的插件（Code / Json / Xml / Markdown）只暴露 `theme: "auto" | "light" | "dark"`，`auto` 按 `prefers-color-scheme` 解析并监听变化；
   - Code 的高亮主题从「41 套 prism 主题桶」收敛到 `one-light` + `vsc-dark-plus` + `auto`（一个主题桶实测拖出 792KB chunk）；
   - 偏好持久化统一键前缀 `vane-file-preview:`，且 `storage: false` 时全 noop —— 组件库不经允许不该写宿主存储。

**代价与边界**：

- 11 钩子比 17 少了表达能力，但那 6 个被删钩子本来就没被执行，删掉只是让「写了不生效」的假象消失；
- optional peer 把「装包即全能力」变成「预览前先装 peer」，代价由文档的「按文件类型装依赖」表兜底；
- 主题三选一牺牲了定制深度，但换来了零额外体积与一致的深浅色行为，对「预览组件」这个定位是合理的。

**验证**：`test/routing-all.test.ts`（路由赢家一致性）、`test/dist-external.test.ts`（optional peer 降级 + 体积）、各插件 `doc.json` notes（边界提示）、`test/with-plugin-hooks.test.tsx`（11 钩子逐一有调用点与断言）。

## ADR-18 · 个人主页引擎：领域槽 + 内核 state 驱动页签，装配器置于根入口

**背景**：`vane-profile` 是首版个人主页引擎，要把「头图 / 数据行 / 页签栏 / 认证 / 关注」拆成可插拔插件，且页签切换要能联动内容区重渲染（消费方用同一份 `children` 渲染不同页签内容）。

**决定**：

1. **结构化段落走包内领域槽，不挤内核 header/overlay/footer**。内核插槽模型只有 header / overlay / footer 三类，没有「内容段落」插入点；主页的「头图区 / 数据行 / 页签栏 / 徽标 / 关注区」是结构化段落，因此建包内 `renderProfileSlot`（复用内核的 `config.order` 升序 + `priority` 降序排序 + `PluginErrorBoundary` 单槽隔离），而非硬塞进 header/footer。叠加类（徽标绝对定位浮在头图右上）仍可用 `renderOverlay` 兜底。

2. **页签联动用内核 state，不用事件总线**。`TabSync` 把 `activeTab` 经 `extendContext` 注入 `ProfilePluginContext`，内容区 `useProfileContext().activeTab` 订阅即可实现「切页签 → 内容重渲染」；比 `bus` 事件更可预测、更易在单测里断言（`onTabChange` 事件钩子仍由 `withPlugins` 在 state 变化后触发，用于滚顶 / `onChange`）。

3. **关注态受控**。`FollowEcho` 只做乐观 UI，真实关系由消费方回写 `props.followState`；`onPropsChange` 在关系由非 mutual 变 mutual 时触发 `onMutual`。主页不持用户关系真相，复用方（如 CRM）的存储逻辑不被绑架。

4. **`withPlugins` 置于根入口，领域槽无法剥离**。根入口（≈3.0KB / 预算 3.5KB）含 `ProfileCore + withPlugins + ProfileSlotProvider/slots`；因 `withPlugins` 必须包 `ProfileSlotProvider`、`ProfileCore` 又消费 slots，slots 无法从根导入图剥离——与家族一致（vane-card / vane-waterfall 装配器均置于根入口）。5 个官方插件严格走子路径 `./custom-plugins/*`（ADR-6 严格），不进根入口。

5. **体积预算 3.5KB 写在 `vane.sizeBudgetKb` + `sizeBudgetNote`**。规划文档的 2.5KB 是组件实现前的乐观估计，实测根入口约 3.0KB（含三件套），故上调并写明理由，不静默调大。

**代价与边界**：

- 领域槽与内核三槽是两套机制，叠加类需求要分清「走领域槽」还是「走 `renderOverlay`」；
- 内容联动的唯一接线点是 `TabSync` + `useProfileContext().activeTab`——没装 `TabSync` 时 `activeTab` 恒为 `defaultActiveTab`，内容区静态；
- `priority` 目前仅作同槽位多插件叠放顺序的扩展位（每个槽位暂只有一个官方插件）。

**验证**：`test/core-render.test.tsx`（三段式壳 + 单槽错误隔离）、`test/plugins.test.tsx`（TabSync 切换经 `activeTab` 联动内容、FollowEcho `onMutual`、meta 契约），12/12 通过；`pnpm check` 体积闸门 3.0KB ≤ 3.5KB 通过。
