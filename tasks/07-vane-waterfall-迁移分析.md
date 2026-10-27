# 07 · vane-waterfall 迁移分析（资产盘点 / 架构差距 / 逐插件分级）

> 状态：**分析完成 · 待评审**（本文不改任何代码）
> 基线：`旧仓库/vane-waterfall`（`package.json` 1.0.4，npm 已发布 1.0.5），本机实测于 2026-10-26
> 参照范式：`packages/vane-lazy-image`（P1 完成的样板包）+ `tasks/01` / `tasks/02`
> 实施步骤见 `tasks/08-vane-waterfall-实施清单.md`

---

## 一、结论先行

1. **不能「复制即迁移」——旧仓当前不可运行、也不可重建。**
   - 37 个 demo 页里 **35 个** `import { WaterfallCore } from "vane-waterfall"`（自引用包名），而 `dist/` 不存在、`node_modules/vane-waterfall` 自链接也不存在 → `npm run dev` 一启动就模块解析失败；
   - `build` 脚本是 `tsc -b && vite build`，实测 **`tsc -b` 退出码 2（66 个类型错误）** → 打包在第一步就中断。npm 上的 1.0.5 是历史产物，**当前源码无法复现该产物**。

2. **迁移主体很小：2418 行。** core 836 行 + 27 个插件 1582 行（不含 30 行桶文件）。其余 5976 行是旧插件系统（1600，全部删除）、demo（4025，重写）与壳/入口（348，丢弃）。

3. **插件系统 1600 行整体删除**，换 `@vane/plugin-core`。`plugins/types.ts` 声明了 **48 个钩子，只有 17 个真的会被调用**，其余 31 个是死钩子——迁移前必须做钩子收口，否则把噪音一起搬过去。

4. **一个真 bug：`PinItemPlugin` 完全空转。** 它依赖 `calculateItemPosition` 定位置，`renderOverlay` 恒返回 `null`；而 Core 里 **0 处 `executeHook`**，这个钩子从来没有执行者。

5. **不需要 priority 适配（与 lazy-image 相反）。** 旧版「数字越大越先注册」，新版「数字越大越先执行」——同向。照抄 lazy-image 的 `priority.ts`（`1000 - x`）在这里是错的。

6. **27 个插件：14 个可近零改动迁入**（纯 `transformProps` 管道）、**11 个需改造**（渲染 / 持久化 / 事件）、**2 个需重写或降级**（PinItem / VirtualWaterfall）。

7. **风险集中在三处**：① VirtualWaterfall 靠「把 `renderItem` 置空、在 overlay 里自绘」接管渲染，与 Core 的 `totalHeight` / `itemPositions` 脱钩；② 数据流插件（Filter / Sort / Search / Pagination）靠改写 `props.items` 生效，这是**领域约定不是内核能力**，新架构必须显式保留执行顺序；③ 旧版 `withPlugins` 丢弃 `onMount` 返回值，**清理函数语义从未生效**，迁移后会「突然开始清理」。

---

## 二、资产盘点

### 2.1 体量

| 模块 | 文件 | 行数 | 处置 |
| --- | --- | --- | --- |
| `components/WaterfallPlugin/core/WaterfallCore.tsx` | 1 | 836 | **迁入**，props / ref 契约不变 |
| `components/WaterfallPlugin/plugins/`（自建插件系统） | 5 | 1600 | **整体删除**，能力由 `@vane/plugin-core` 提供 |
| `components/WaterfallPlugin/custom-plugins/` | 28（27 插件 + 桶文件） | 1585 | **迁入** + 补 `doc.json` + 分组 |
| `pages/`（demo，38 个 `.tsx` 含 `_layout/DemoPage`） | 38 | 4025 | **重写**（沿用 lazy-image 的「工坊 + 场景库」形态） |
| 壳与入口（`App.tsx` / `App.css` / `main.tsx` / `index.ts` / `WaterfallPlugin/index.ts` / `vite-env.d.ts` / `assets`） | 7 | 348 | 丢弃，走新 demo 骨架与多入口 |
| **合计** | **79** | **8394**（`.ts` / `.tsx`，`wc -l`） | 迁入 2418 行，删除 1600 行，重写 4373 行 |

### 2.2 源码地图

```
旧仓库/vane-waterfall/src/
├── index.ts                                  # 单入口桶导出（Core + 插件系统 + 27 插件）
├── main.tsx / App.tsx / App.css              # demo 壳
├── components/WaterfallPlugin/
│   ├── index.ts                              # { WaterfallCore, withPlugins, ... }
│   ├── core/WaterfallCore.tsx                # 836 行：布局 + 滚动 + ResizeObserver + 生命周期 hooks
│   ├── plugins/
│   │   ├── types.ts                          # 755 行：48 个钩子 + context + manager 接口
│   │   ├── withPlugins.tsx                   # 520 行：HOC 装配（渲染期注册 + 逐钩子桥接）
│   │   ├── PluginManager.ts                  # 181 行
│   │   ├── PluginBus.ts                      # 109 行
│   │   └── index.ts                          # 35 行
│   └── custom-plugins/                       # 27 个插件，一目录一插件（单文件，无 doc.json）
└── pages/WaterfallPlugin/                    # 37 个 demo 页 + _layout/DemoPage.tsx
```

### 2.3 27 个插件清单（按目标分组）

分级见第六章；「生效钩子」= 实际会被调用的钩子。

| 分组 | 插件 | 行数 | 生效钩子 | 作用 | 分级 |
| --- | --- | --- | --- | --- | --- |
| **layout** 布局 | ResponsiveColumns | 37 | transformProps, onResize | 按容器宽度算列数 | A |
| | AutoColumn | 54 | transformProps, onResize | 按最小列宽反推列数 | A |
| | Alignment | 27 | transformProps, onResize | 列分配策略（shortest/balanced/sequential） | A |
| | Gap | 49 | transformProps, onResize | 列/行间距 | A |
| | FixedHeight | 33 | transformProps, onResize | 固定项高度 | A |
| | PinItem | 46 | onBeforeLayout, ~~calculateItemPosition~~, renderOverlay(null) | 置顶某列 | **C** |
| **perf** 性能 | Throttle | 27 | transformProps | 滚动节流 | A |
| | DebounceLayout | 21 | transformProps | 布局防抖 | A |
| | ReducedMotion | 43 | transformProps | 尊重 `prefers-reduced-motion` | A |
| | Transition | 37 | onItemMount, onLayout | 给项挂 transform/opacity 过渡 | A |
| | Recycle | 48 | onItemEnter/Leave Viewport, onItemUnmount, onUnmount | 视口外 `visibility:hidden` | B |
| | VirtualWaterfall | 254 | transformProps（置空 renderItem）, renderOverlay（自绘） | 像素范围虚拟化 | **C** |
| **data** 数据 | Filter | 48 | transformProps（改写 items）, onPropsChange | 条件过滤 | A |
| | Sort | 48 | transformProps（改写 items）, onPropsChange | 排序 | A |
| | Search | 52 | transformProps（改写 items）, onPropsChange | 关键字过滤 | A |
| | Pagination | 46 | transformProps（切片 items）, onPropsChange | 页码切片 | A |
| | InfiniteScroll | 39 | transformProps（包装 onReachBottom） | 触底加载 | A |
| | StatePersistence | 113 | transformProps, onMount, onPropsChange, onUnmount | localStorage 快照 | B |
| | URLSync | 96 | onMount, onPropsChange | hash/search 同步 | B |
| **interaction** 交互 | Bookmark | 78 | onMount | 书签定位 | B |
| | ScrollAnchor | 32 | onMount, onUnmount | bus 触发 scrollToItem | B |
| | DragReorder | 62 | ~~renderItemWrapper~~（实际直调，生效） | 拖拽记录 from/to | B |
| | ClickAnalytics | 61 | onMount, onItemClick, renderOverlay | 点击统计叠层 | B |
| | HeatmapAnalytics | 72 | onLayoutComplete, onItemEnterViewport, onItemClick, renderOverlay | 热力叠层 | B |
| **ui** 界面 | StickyHeader | 45 | renderOverlay | 吸顶条 | B |
| | Grouping | 63 | onPropsChange, renderOverlay | 分组统计面板 | B |
| | A11y | 51 | renderOverlay, renderItemWrapper | ARIA role + 项语义 | B |

> 统计：A 级 **14**、B 级 **11**、C 级 **2**，合计 27。
> 代码里自带「实验版 / 简化实现 / 占位」标注的有 5 个：DragReorder、Grouping、ScrollAnchor、StickyHeader、VirtualWaterfall。

### 2.4 37 个 demo 页

| 类别 | 页面 | 数量 |
| --- | --- | --- |
| 元信息 | Home、ReadmeDemo | 2 |
| 基础 | BasicDemo、ColumnsDemo、CustomGapDemo | 3 |
| 布局插件 | ResponsiveColumns、AutoColumn、Alignment、GapPlugin、FixedHeight | 5 |
| 性能 | ThrottlePlugin、DebounceLayoutPlugin、RecyclePlugin、Transition、ReducedMotion | 5 |
| 数据 | Filter、Sort、Search、Pagination、InfiniteScroll、StatePersistence、URLSync | 7 |
| 交互 | DragReorder、Bookmark、ScrollAnchor、ClickAnalytics、HeatmapAnalytics | 5 |
| UI / 可访问 | A11y、Grouping、StickyHeader | 3 |
| 虚拟化 | VirtualDynamic、VirtualImage、VirtualImage（图集） | 3 |
| 内核能力 | Lifecycle、RefMethods、AdvancedConfig | 3 |
| 集成 | LazyImageIntegration（依赖 `vane-lazy-image@1`） | 1 |

现状问题：**没有一页能跑**（见 3.1）；页面平均 109 行，全部手写内联样式，无代码块、无复制、无分类导航。

### 2.5 依赖声明问题

| 包 | 声明位置 | 实际用途 | 处置 |
| --- | --- | --- | --- |
| `react` / `react-dom` ^18.3.1 | **dependencies** | peer | → `peerDependencies: >=16.8`（`check-packages` 现在会直接 FAIL） |
| `localforage` ^1.10.0 | dependencies | **全库 0 处引用** | 删除 |
| `vane-lazy-image` ^1.0.14 | dependencies | 仅 `LazyImageIntegrationDemo` | → devDependencies，并升到 **2.0.0**（现行版本） |
| `react-router-dom` ^7.9.3 | dependencies | 仅 demo（仓库其他包用 `^6`） | → devDependencies，统一 `^6` |
| `react-markdown` / `remark-gfm` / `react-syntax-highlighter` | dependencies | 仅 `ReadmeDemo` | → devDependencies（与 lazy-image 一致） |
| `@vane/plugin-core` | 缺失 | 新架构必需 | → `peerDependencies` + dev |

---

## 三、现状体检基线（可复现）

```bash
cd 旧仓库/vane-waterfall
npx tsc -b                       # exit=2，66 个错误
[ -d dist ] || echo 无产物        # 无 dist
[ -e node_modules/vane-waterfall ] || echo 无自链接
npm view vane-waterfall version dist.unpackedSize   # 1.0.5 / 212283
```

| 指标 | 实测值 | 说明 |
| --- | --- | --- |
| `tsc -b` 退出码 | **2** | `build = tsc -b && vite build`，因此构建必失败 |
| 类型错误 | **66** | `TS2307` 38 个（找不到 `vane-waterfall`）+ `TS7006` 28 个（隐式 any） |
| `dist/` | 不存在 | 包无法自引用 → dev / demo 全部不可运行 |
| 单测 | **0** | 无 vitest、无 test 目录 |
| `doc.json` | **0 / 27** | 文档生成脚本无法驱动 |
| `as any` / `@ts-ignore` | 32 处 | 集中在 demo 与 VirtualWaterfall |
| demo 可运行性 | **不可运行** | 35/37 页自引用包名 |
| npm 已发布 | 1.0.5，解包 212KB | 单入口打包，无子路径按需引入 |

> 结论：旧仓是「一次性发布的快照」，不能作为迁移的可执行基线。**迁移 = 按新规范重建**，源码只作为算法与插件逻辑的参考。

---

## 四、新旧架构差距映射

### 4.1 钩子面：48 声明 / 17 生效 / 31 死

`types.ts` 里 `WaterfallPluginHooks` 声明 48 个钩子。真正有调用点的只有 17 个：

| 调用通道 | 钩子 |
| --- | --- |
| `pluginManager.executeHook(...)`（14） | onMount、onUnmount、onPropsChange、onBeforeLayout、onLayout、onLayoutComplete、onItemMount、onItemUnmount、onItemEnterViewport、onItemLeaveViewport、onScroll、onResize、onReachBottom、onItemClick |
| 直接调 `plugin.hooks.x()`（2） | renderOverlay、renderItemWrapper |
| 直接循环调用（1） | transformProps |

**31 个死钩子**（声明了、从没人调）：

```
calculateColumns  calculateColumnWidth  calculateItemPosition  calculateVisibleRange
onItemVisibilityChange  onScrollStart  onScrollEnd  onReachTop  onItemResize
onBeforeItemsChange  onItemsChange  onItemChange  onLoadMore  onRefresh
onDragStart  onDrag  onDragEnd  onDrop  onItemSelect  onSelectionChange
filterItem  sortItems  searchItem  onPerformanceMetric  onError  onItemLoadError
renderContainer  renderLoadingMore  renderEmpty  renderError  transformItem
```

影响面：**只有 `PinItemPlugin` 真的被这个坑到**（它把全部逻辑压在 `calculateItemPosition` 上，且 `renderOverlay` 返回 `null`，等于什么都没做）。其余 30 个死钩子没有插件实现，属纯噪音。

> 迁移策略：钩子面从 48 收口到 **20**（17 生效 + 3 个布局钩子在接线后启用），其余 28 个**不迁**。详见 D3。

### 4.2 priority 语义：同向，零成本

| | 旧版 | 新内核 | 结论 |
| --- | --- | --- | --- |
| 含义 | 越大越先**注册** | 越大越先**执行** | 同向 ✅ |
| 默认 | 0 | 0 | 一致 |
| 使用情况 | 27 个插件 0 处设置 | — | 无存量依赖 |

⚠️ 注意：lazy-image 当年需要 `priority.ts` 做 `1000 - x` 反转，是因为**旧图片插件是「越小越优先」**。瀑布流不是，别照抄。

### 4.3 context 结构：靠 `extendContext` 补齐

| 旧 `WaterfallPluginContext` | 新内核 `PluginContext` | 迁移做法 |
| --- | --- | --- |
| `items` / `itemCount` | — | Core props 透传，`extendContext` 注入 |
| `layout`（columns/columnWidth/columnHeights/totalHeight…） | — | Core 已有 `getLayoutInfo()`，注入快照 |
| `itemPositions` / `getItemPosition` | — | Core 已有，注入 Map + getter |
| `viewport` / `visibleItems` / `visibleRange` | — | 注入；`visibleRange` 现在每次渲染现算（旧版同） |
| `isLayouting` / `isLoading` / `hasMore` / `error` | `state` / `setState` | 领域字段，注入到 context |
| `containerRef` | `refs.container` | 别名直通 |
| `itemRefs` / `getItemRef` | — | Core 的 `itemRefsMap` 经 ref 暴露 |
| `sharedData: Map` | `shared: Map` | 别名 `sharedData: base.shared`（27 个插件零改动） |
| `deviceInfo` | `deviceInfo` | 同构，内核对齐 |
| `networkInfo` | — | 包内自建（旧版 `detectNetwork` 逻辑搬过来） |
| `relayout` / `scrollToItem` / `scrollToTop` / `scrollToBottom` / `measureItem` / `forceUpdate` | `forceUpdate` | 其余经 coreRef 注入（同 lazy-image 的 `reload/reset` 做法） |
| `bus` | `bus` | 同签名，直接用内核实现 |

**语义差异**：旧 context 是 `useMemo` 出来的不可变快照（React state 驱动）；新 context 每次渲染重建。行为等价，但插件里 `context.layout` 读到的仍是「上一次渲染的布局」，迁移时保持这一点，不要改成实时读 DOM——否则 `onLayoutComplete` 里的计算会和 Core 不同步。

### 4.4 渲染插槽：6 → 3

| 旧钩子 | 使用者 | 新方案 |
| --- | --- | --- |
| `renderOverlay` | 7 个（A11y / ClickAnalytics / Grouping / HeatmapAnalytics / PinItem / StickyHeader / VirtualWaterfall） | 内核 `renderOverlay`（`composeSlots` 合成） |
| `renderItemWrapper` | 2 个（A11y / DragReorder） | **包内实现**：在 `withPlugins` 里把 `props.renderItem` 逐层包裹（`transformProps` 链），不扩内核槽位 |
| `renderEmpty` / `renderLoadingMore` | 0 个 | 不迁；需要时由 demo / 业务侧渲染 |
| `renderError` | 0 个 | 不迁 |
| `renderContainer` | 0 个 | 不迁 |
| `children` 透传 | Core 已有 | 保留（overlay 需要落在滚动容器内部，靠这条通道） |

⚠️ **overlay 的挂载位置**：旧 Core 把 `children` 放在滚动容器内、绝对定位项层之上。新架构 `composeSlots` 的 overlay 也在 children 里，但**必须保持「在滚动容器内部」**，否则 `StickyHeader` 的 `position: sticky` 会失效。这条要在 W2 的单测里锁住。

### 4.5 transformProps 的执行顺序：从「数组顺序」变「priority / order」

15 个插件都用 `transformProps`，且**相互有语义依赖**：

```
Filter → Sort → Search → Pagination     （先筛再排再搜再切页，顺序错了结果就错）
ResponsiveColumns / AutoColumn / Gap / FixedHeight   （都改 columns/gap，后者覆盖前者）
```

旧版按**数组顺序**（注册顺序）串行执行；新版内核按 `priority` 降序 + `config.order`。**如果不显式标 priority，迁移后数据类插件的组合行为会变**——这是本次迁移最容易漏的一处。处置：给数据类 4 个插件固定 `priority`（Filter 40 > Sort 30 > Search 20 > Pagination 10），布局类按「更具体的赢」定序，并写进 `doc.json` 的 notes。

### 4.6 生命周期与清理语义：旧版丢返回值

```ts
// 旧 withPlugins：返回值被丢掉
onMount: () => { pluginManager.executeHook("onMount", pluginContext).catch(() => {}); }
```

`PluginManager.executeHook` 会 `return result`，但 `withPlugins` 不接收 → **插件从 `onMount` 返回的清理函数从来没有执行过**。现在只有 `ScrollAnchor` 通过 `onUnmount` 手动兜底（`unsubscribe?.()`），恰好绕开了这个坑；其余插件没有依赖它。

新内核的语义是「返回函数 = 注册清理，`manager.clear()` 时逆序执行」，**迁移后清理会真的发生**。逐个复核 5 个用 `onMount` 的插件（Bookmark / ClickAnalytics / ScrollAnchor / StatePersistence / URLSync），确认「开始清理」不会破坏既有行为（例如 Bookmark 若在 onMount 里返回了写快照的函数，之前不写、之后会写）。

### 4.7 其余维度

| 维度 | 旧版 | 新内核 | 结论 |
| --- | --- | --- | --- |
| Bus 实现 | 自建 109 行，含 raf 批处理 | `createPluginBus`，同签名 | 删旧实现，直接用 |
| Manager | enable/disable + 依赖仅 `console.warn` | 依赖解析排序 + 沙箱 + 超时 + `getErrors()` | 升级，无行为回退 |
| 错误隔离 | 每钩子 try/catch + warn | `PluginErrorBoundary`（渲染）+ 沙箱（事件） | 升级 |
| 短路语义 | **任意 truthy 返回值都中断整链** | `false` 中断；其他值短路返回 | 旧版更危险（`onPropsChange` 返回对象会掐断后面的插件）；迁移后行为更可预期 |
| 注册时机 | **渲染期**副作用（`if (...) pluginManager.registerAll()`） | `usePluginRuntime` 内 effect/ref | 升级；但要注意 Core 的 `onMount` 在 effect 中触发，插件 `onMount` 顺序需在单测里锁住 |
| 包形态 | 单入口 + 全量桶导出 | 多入口（core / plugins / custom-plugins/* / presets/*） | 按需引入，`sync-exports` 自动生成 |
| 类型来源 | 自带一套 `PluginManager` / `WaterfallPlugin` | 从 `@vane/plugin-core` 派生 | 与 lazy-image 一致 |
| 数据管道 | 插件改写 `props.items` | **同**（内核无此概念，纯领域约定） | 必须显式保留 + 文档写明 |

---

## 五、四个待拍板决策

### D1 · 布局钩子接不接线？

| 方案 | 做法 | 影响 | 代价 |
| --- | --- | --- | --- |
| **D1-A（推荐）** | Core 在 `calculateLayout` 里补 3 个执行点：`calculateColumns` → `calculateColumnWidth` → 每项 `calculateItemPosition`；插件返回值优先于 props | PinItem 变成真插件；ResponsiveColumns / AutoColumn / Gap / FixedHeight 可从「改 props」升级为「语义正确的布局钩子」 | Core +约 40 行；需 4 个布局插件回归 |
| D1-B | 不接线，**删掉 PinItem**，45 行死钩子声明一并删 | 少一个插件（27 → 26）；布局类插件继续走 `transformProps`（已验证可用） | 零风险，但丢掉一个宣称过的能力 |

> 推荐 D1-A：代价可控（Core 加 3 个调用点），且能把「README 里宣称、代码里没有」的能力补上。**若选 D1-B，07 文档与 README 里所有提到 `calculateItemPosition` 的地方都要删**。

### D2 · VirtualWaterfall（254 行）怎么处置？

现状：`transformProps` 把 `renderItem` 置空 → Core 不渲染任何项、`totalHeight` 趋近 0；真正的项由 overlay 内的 `<Overlay>` 自绘并按绝对定位摆放。等于**用插件把 Core 架空**，滚动高度靠 overlay 自己撑，与 `itemPositions` / `scrollToItem` / `measureItem` 全部脱钩。

| 方案 | 做法 | 代价 | 风险 |
| --- | --- | --- | --- |
| **D2-A（推荐）** | 下沉为 **Core 选项** `virtualize?: { overscan, estimateHeight, dynamicHeights }`：Core 自己只渲染命中范围 + overscan 的项，`totalHeight` 仍由布局算 | Core +约 80 行；需单测覆盖「滚出视口的项被卸载」 | 中：Core 变大（836 → ~920 行） |
| D2-B | 独立组件 `VirtualWaterfall`（`presets/virtualized`），复用 Core 的布局函数，不共用渲染 | 新组件约 200 行；两套渲染路径要各自维护 | 低，但长期双份维护 |
| D2-C | **不迁**，标记为已知缺口 | 零 | 失去「1 万项」卖点；README 要删掉虚拟化宣传 |

> 推荐 D2-A。瀑布流的虚拟化本质是「布局 + 命中范围」，放在 Core 里最自然；插件形态接管渲染是所有方案里最难维护的（旧仓已经证明：demo 里 3 个虚拟化页面都写着「实验」）。

### D3 · 钩子面收口清单（保留 20 个）

```
保留（17 生效）：onMount onUnmount onPropsChange onBeforeLayout onLayout onLayoutComplete
                 onItemMount onItemUnmount onItemEnterViewport onItemLeaveViewport
                 onScroll onResize onReachBottom onItemClick
                 transformProps renderOverlay renderItemWrapper*
新增（3，D1-A 生效）：calculateColumns calculateColumnWidth calculateItemPosition
删除（28）：其余全部（含 calculateVisibleRange / onLoadMore / filterItem / sortItems /
           searchItem / onScrollStart / onScrollEnd / onItemVisibilityChange /
           renderContainer / renderEmpty / renderLoadingMore / renderError / transformItem …）
```

`renderItemWrapper` 在内核里不存在，由包内 `withPlugins` 实现（4.4），但对插件作者而言仍是领域钩子，故计入 20。

### D4 · demo 形态

| 方案 | 做法 | 产出 |
| --- | --- | --- |
| D4-A | 复刻旧 37 页 | 37 个孤立页面，无代码块、无分类、无复制，验证价值低 |
| **D4-B（推荐）** | 沿用 lazy-image 的形态：**插件工坊**（27 插件按 5 组勾选实时装配 + 生成代码）+ **场景库**（真实版式，一卡两栏，完整版 / 最小装配版两份源码） | 2 个主页面 + 约 12 个场景 |

推荐 D4-B：与 lazy-image 统一，且用户已在场景库上提过明确要求（版式复刻 + 两份源码可复制）。瀑布流可复刻的场景候选：小红书三列图文、Unsplash 摄影流、Pinterest 高度错落、京东/淘宝商品瀑布、站酷作品集、招聘房源卡片流、朋友圈九宫格（不等高）、PWA 离线信息流。

### 5.5 决策结论（2026-10-26 拍板，按推荐项执行）

| 决策 | 结论 | 落地位置 |
| --- | --- | --- |
| **D1** | **A：接线**。Core 在布局计算里补 `calculateColumns` → `calculateColumnWidth` → 逐项 `calculateItemPosition` 三个执行点，插件返回值优先于 props | `src/components/WaterfallPlugin/layout.ts`（纯函数，钩子以 `hooks` 参数注入）+ `WaterfallCore.tsx` |
| **D2** | **A：下沉 Core**。新增 `virtualize?: { overscan, estimateHeight, dynamicHeights }`，Core 只渲染命中范围 + overscan，`totalHeight` 仍由完整布局算出；`VirtualWaterfallPlugin` 目录删除 | `src/components/WaterfallPlugin/virtualize.ts` |
| **D3** | **收口到 20 个钩子**（17 生效 + 3 新增布局钩子），28 个死钩子不迁 | `plugins/types.ts`；ADR 写入 `docs/guide/decisions.md` |
| **D4** | **B：工坊 + 场景库**。`#/plugins` 27 插件按 5 组勾选实时装配 + 生成代码；`#/scenarios` 约 12 个瀑布流版式，一卡两栏两份源码 | `demo/` |

三条附带结论（由 D1/D2 派生，写进 ADR 避免反复讨论）：

1. **`calculateItemPosition` 的返回值不参与列高累加之外的任何推断**：插件返回 `{ x, y, column }`，Core 仍按「该列当前高度 + 项高 + rowGap」推进列高；置顶项若要跨列，插件自己给 `y` 并把 `column` 指到目标列。
2. **虚拟化只裁剪渲染，不裁剪测量**：未渲染的项拿不到 `offsetHeight`（旧版 `if (itemHeight === 0) continue` 会直接跳过，导致竖向总高算少）→ 未测量项按 `estimateHeight` 兜底计入布局，进视口后被真实高度替换并触发一次增量重排。这是旧 `VirtualWaterfallPlugin` 最致命的缺陷，下沉时必须一并修掉。
3. **`priority` 同向，不做 `1000 - x` 反转**（见 07 · 4.3）。

---

## 六、逐插件迁移分级

### A 级 · 近零改动（14 个）

机制是纯 `transformProps` 管道（或改 DOM style），不碰渲染插槽、不碰持久化。

| 插件 | 迁移动作 |
| --- | --- |
| ResponsiveColumns / AutoColumn / Alignment / Gap / FixedHeight | 换 import（`WaterfallPlugin` → 领域类型）+ 补 `doc.json`；若 D1-A 则改走布局钩子 |
| Throttle / DebounceLayout | 同上（`transformProps` 改 throttleDelay / debounceDelay） |
| ReducedMotion | 同上；`matchMedia` 无副作用 |
| Transition | `onItemMount` / `onLayout` 直接改 DOM style，迁过去即可 |
| Filter / Sort / Search / Pagination | **必须**固定 `priority`（4.5），否则组合行为会变 |
| InfiniteScroll | `transformProps` 包装 `onReachBottom`，零改动 |

### B 级 · 需改造（11 个）

| 插件 | 改造点 |
| --- | --- |
| A11y | `renderItemWrapper` → 包内 item 包装管道；`renderOverlay` 保留 |
| DragReorder | 同上（item 包装）；并把「只记录 from/to」补成真正的 `onReorder` 回调（现在注释写着「占位：仅记录，不直接修改 items」） |
| ClickAnalytics / HeatmapAnalytics | overlay 迁到内核插槽；**必须补 `showOverlay` 开关**（默认关闭），否则统计面板会盖在真实版式上——lazy-image 踩过这个坑 |
| Grouping | 同上；`onPropsChange` 迁到新签名 |
| StickyHeader | overlay 必须落在滚动容器内部（4.4），`position: sticky` 才生效；依赖 Grouping 的 `shared` key |
| Bookmark / StatePersistence / URLSync | 读写 `localStorage` / `location`；需 SSR 安全（`typeof window`）+ 首帧注入只做一次（旧版用 `initialInjected` 标志） |
| ScrollAnchor | `onMount` 订阅 bus；迁移后 `onMount` 返回值会被当清理函数执行 → 复核是否重复清理（已有 `onUnmount` 兜底） |
| Recycle | 直接改 `el.style.visibility`；与 D2-A 的虚拟化职责重叠 → 若采纳虚拟化，Recycle 降级为「不卸载、只隐藏」的补充插件，并在 doc 里写明二者不要同开 |

### C 级 · 需重写或降级（2 个）

| 插件 | 问题 | 处置 |
| --- | --- | --- |
| PinItem | `calculateItemPosition` 死钩子 + `renderOverlay: () => null` → **完全空转** | D1-A：随布局钩子接线一起修好，并补「置顶项是否参与列高计算」的处理；D1-B：删除 |
| VirtualWaterfall | 接管渲染、与 Core 脱钩（254 行） | D2-A：下沉 Core 选项后删除该插件；D2-B：拆成独立组件；D2-C：不迁 |

---

## 七、迁移后目标结构

```
packages/vane-waterfall/
├── src/
│   ├── index.ts                                # .            完整包（Core + withPlugins + 类型 + 插件桶）
│   ├── core.ts                                 # ./core      仅 Core + 领域类型（≈10KB gzip 预算）
│   ├── plugins.ts                              # ./plugins   领域钩子类型 + withPlugins
│   ├── components/WaterfallPlugin/
│   │   ├── WaterfallCore.tsx                   # 迁入，props / ref 契约不变（+虚拟化见 D2）
│   │   ├── plugins/
│   │   │   ├── types.ts                        # 20 个钩子（从 @vane/plugin-core 派生）
│   │   │   └── withPlugins.tsx                 # usePluginRuntime + extendContext + 钩子桥接 + item 包装
│   │   └── virtualize.ts                       # D2-A：命中范围计算（可选）
│   ├── custom-plugins/<Xxx>/{doc.json,create.ts,index.ts}   # 27 个，分组注释
│   └── presets/{photo-feed,product-feed,dashboard}/index.ts  # 3 个配方
├── demo/                                       # 工坊 + 场景库（D4-B）
├── test/                                       # ≥35 个单测
└── package.json                                # peer: @vane/plugin-core + react/react-dom
```

---

## 八、风险清单

| # | 风险 | 等级 | 影响 | 缓解 |
| --- | --- | --- | --- | --- |
| R1 | 旧仓不可运行，**没有可对照的行为基线** | 高 | 迁移后无法判断「行为是否等价」 | W0 先写 6 个「行为快照」单测（列分配 / gap / padding / 滚动 / 触底 / 清空），以代码断言代替人工对照 |
| R2 | `transformProps` 顺序从数组顺序变 priority 顺序 | 高 | Filter+Sort+Pagination 组合结果错 | A 级 4 个数据插件固定 priority，单测锁组合 |
| R3 | `onMount` 清理语义从「丢弃」变「执行」 | 中 | 5 个插件可能突然写库/解绑 | 逐个复核 + 单测断言清理被调用一次 |
| R4 | overlay 挂载位置变化 → `sticky` 失效 | 中 | StickyHeader 看起来「没吸顶」 | 单测断言 overlay 在滚动容器 `contains` 之内 |
| R5 | VirtualWaterfall 下沉 Core 导致 Core 膨胀 | 中 | Core 841 → 920 行，gzip 预算吃紧 | 单独 `virtualize.ts`，core 预算 12KB 兜底 |
| R6 | 统计类 overlay 默认开启污染真实版式 | 中 | 场景页满屏角标 | 统一 `showOverlay: false` 默认（沿用 lazy-image 的结论） |
| R7 | demo 重写幅度大（37 页 → 2 页 + 12 场景） | 中 | 工期集中在 W4 | 场景库复用 lazy-image 的 `ScenarioCard` / `CodeBlock` / 闸门脚本 |
| R8 | `react-router-dom` 7 → 6 的 API 差异 | 低 | demo 路由报错 | 新 demo 用 HashRouter，路由面很小 |

---

## 九、验收口径

1. `pnpm --filter vane-waterfall build` 通过，`exports` 全部指向真实产物（`sync-exports` 生成）；
2. `typecheck` **0 错**、`lint` 0 error、`test` **≥35 通过**（布局 / 装配 / 插件端到端）；
3. `node scripts/generate-plugin-docs.mjs` 输出 **27 行**目录表，5 个分组无遗漏；
4. **27 / 27 插件在 demo 上真实装配运行过**（沿用 lazy-image 的「插件覆盖」闸门思路），每个都有 `doc.json` + `.meta`；
5. 体积：`core` ≤ **12KB gzip**、完整入口 ≤ **25KB gzip**（`vane.sizeBudgetKb` / `coreSizeBudgetKb` 声明）；
6. README 首屏为 `npm install vane-waterfall` + 30 秒可跑示例，`check-packages` 全绿；
7. demo 逐页 CDP 取证：0 console error、无布局塌陷、每张卡有代码块与复制按钮；
8. 发布 `vane-waterfall@2.0.0`，`npm pack` 只含 `dist` + README + package.json。
