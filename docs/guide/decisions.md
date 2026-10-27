# 关键决策记录（ADR）

每个决定都记录"为什么"，避免后人（包括自己）重复纠结。

## ADR-1 · 抽 `@vane/plugin-core` 共用内核，而不是各包自带插件系统

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
