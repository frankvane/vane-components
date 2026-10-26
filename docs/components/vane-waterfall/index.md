# 瀑布流布局

> 瀑布流本身很简单，难的是它旁边那一堆需求：可变高、响应式列数、置顶、分组吸顶、拖拽换位、无限加载、千项虚拟化。这些不该揉进一个 800 行的组件里。

`vane-waterfall` 把它们拆成 **26 个领域插件**，`WaterfallCore` 只负责「测量 + 布局 + 滚动」。

## 特性

- **布局是纯函数**：`computeLayout` 不碰 DOM，可以直接对数字快照做等价性单测（8 组断言锁住旧行为）
- **布局钩子有执行点**：`calculateColumns` / `calculateColumnWidth` / `calculateItemPosition` 三个钩子真的会被调用（旧版声明了但从不执行，插件因此空转）
- **虚拟化只裁渲染**：未渲染项按估值占位（默认跟实测样本的中位数走），总高不缩水、滚动条不跳
- **量到就重排**：项挂载量到真高与位置不一致时，下一帧立刻修正，不等布局防抖 —— 这是「快速滚动时卡片重叠」的真正解法（抬高估值只是把误差换成滚动条虚长）
- **钩子有生命周期**：`onMount` 返回的函数会在卸载时执行，监听不会泄漏
- **priority 越大越先执行**：与旧版语义同向，不做 `1000 - x` 反转
- **零运行时依赖**（`@vane/plugin-core` / react / react-dom 均为 peer），不引 CSS 文件

## 安装

```bash
npm install vane-waterfall
```

## 30 秒上手

```tsx
import { WaterfallCore, withPlugins } from "vane-waterfall";
import { createAutoColumnPlugin } from "vane-waterfall/custom-plugins/AutoColumnPlugin";
import { createGapPlugin } from "vane-waterfall/custom-plugins/GapPlugin";

// 装配：一个组件类型，模块顶层调一次
const Waterfall = withPlugins(WaterfallCore, [
  createAutoColumnPlugin({ minColumnWidth: 220, maxColumns: 4 }),
  createGapPlugin({ columnGap: 16, rowGap: 16 }),
]);

// 使用：和普通列表组件一样
export function Feed({ items }: { items: Item[] }) {
  return (
    <Waterfall
      items={items}
      containerStyle={{ height: "100vh" }}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <Card data={item} />}
    />
  );
}
```

容器必须有确定高度（或由父级撑开），否则没有滚动上下文，虚拟化与 `onReachBottom` 都不会触发。

## 导入方式与体积

| 导入 | 内容 | 实测 Gzip |
| --- | --- | --- |
| `vane-waterfall` | 核心 + 装配 + 类型（不含任何插件） | **10.5 KB** |
| `vane-waterfall/core` | 同上，语义化别名 | 10.5 KB |
| `vane-waterfall/plugins` | 装配层 + 领域类型 + 26 个插件（逃生口，常规不推荐） | 大，仅在「全都要」时用 |
| `vane-waterfall/custom-plugins/XxxPlugin` | 单个插件 | 0.3–1.2 KB |
| `vane-waterfall/presets/X` | 场景配方（3 选 1） | 0.3 KB + 插件本体 |

单文件实测：`WaterfallCore` 4.68 KB gzip、`withPlugins` 5.62 KB gzip。

> 根入口**不桶导出插件**——插件请走子路径，未引入的不进产物。插件目录见 [插件](plugins.md)，现成组合见 [组合配方](recipes.md)。

## 包内有什么

```
WaterfallCore      测量 / 布局 / 滚动 / ref 契约，不含业务行为
withPlugins        装配层：内核 runtime + 领域上下文 + Core 回调桥接
layout.ts           computeLayout 纯函数（含 3 个布局钩子执行点）
virtualize.ts       computeVisibleRange + 占位高度策略（resolveEstimateHeight）
custom-plugins/     26 个领域插件（5 组）
presets/            photo-feed / product-feed / dashboard
demo/               演示站：34 页逐项示例 + 工坊 + 13 场景（不随包发布）
```

## 插件目录速览

| 组 | 插件 | 说明 |
| --- | --- | --- |
| 布局 | AutoColumn / ResponsiveColumns / Alignment / Gap / FixedHeight / PinItem | 列数与列宽、间距、等高、置顶 |
| 性能与动效 | Throttle / DebounceLayout / Transition / ReducedMotion | 滚动节流、布局防抖、位移过渡 |
| 数据管线 | Filter / Sort / Search / Pagination / InfiniteScroll | 固定顺序 `40 → 30 → 20 → 10` |
| 交互与埋点 | ClickAnalytics / HeatmapAnalytics / DragReorder / ScrollAnchor / Recycle | 点击与曝光统计、拖拽、锚点、离屏回收 |
| 语义与状态 | A11y / Grouping / StickyHeader / Bookmark / StatePersistence / URLSync | 可访问性、分组、吸顶、位置书签、状态与 URL 同步 |

完整配置项见 [插件](plugins.md)。

## 虚拟化的估值策略

虚拟化只渲染视口附近的项，**没渲染的项测不到高度**，只能用估值占位。这是它唯一算不准的地方，也是最容易翻车的地方：

| 估值偏低 | 估值偏高 |
| --- | --- |
| 同一列后面按估值排的项会压上来 —— 卡片重叠 | 总高虚长，滚动条比实际长 |

默认策略（`adaptiveEstimate: true`）：

- **`estimateHeight` 只是冷启动兜底**：还没有实测样本时用它，样本够 8 个就不再看了；
- **改用实测样本的中位数**：中位数让「总高 = 所有项高度之和」的误差最小。实测 1000 项、项高 190–350 的数据集，中位数估值下总高 95337px，实际 94700px（+0.7%）；换成 P90 会虚长到 117225px（+24%），滚动条一眼就不对；
- **重叠不靠抬高估值解决**：真正管用的是「量到真高就立刻重排」（一帧内合并，不等布局防抖）。实测快速滚动 20 屏，可见重叠 0 帧；拖动滚动条瞬移时最多十来帧（≤0.2s）、峰值 60px，停手即收敛，停手即收敛；
- **`estimateQuantile` 可调**：项高分布极离散时往上调（0.9 / 1），代价是总高偏大。

```ts
// 默认：自适应中位数
virtualize={{ overscan: 1 }}

// 项等高（商品卡）→ 估值就是精确值，关掉自适应更省一次采样
virtualize={{ estimateHeight: 320, adaptiveEstimate: false }}

// 项高分布极离散，宁可留空也不要重叠
virtualize={{ estimateQuantile: 0.95 }}
```

演示站的两个能力页把这几个参数做成了控件：`#/demo/virtual`（虚拟瀑布流）与 `#/demo/virtual-dynamic`（动态高度）—— 拖分位、关自适应，都能当场看到总高与重叠的变化。

## 从 1.x 迁移

2.0.0 是破坏性大版本，插件系统内核已换成 `@vane/plugin-core`（与 `vane-lazy-image` 同一套）：

| 变化 | 影响 | 怎么改 |
| --- | --- | --- |
| 插件系统换成内核 | 自建 `PluginBus` / `PluginManager` 删除 | 不要再 import 它们；`withPlugins` / `Plugin` 从包里取 |
| 钩子面 48 → 20 | 31 个从未被执行过的钩子删除 | 按 [API](api.md) 的钩子表逐个核对，被删的钩子本来也没生效 |
| 插件状态与清理 | `onMount` 返回值统一当清理函数 | 把 `unsubscribe` 逻辑放进返回的函数 |
| 虚拟化下沉 Core | `VirtualWaterfallPlugin` 删除 | 去掉插件，改传 `virtualize` |
| 多入口 | 插件不再桶导出进根入口 | `import { createXxxPlugin } from "vane-waterfall/custom-plugins/XxxPlugin"` |
| 事件语义 | `priority` **同向**（大 = 先执行） | 与 1.x 一致，不要按 `vane-lazy-image` 的 `1000 - x` 去改 |
| `renderItemWrapper` 签名 | 统一为 `(context, node, index)` | 旧版 A11y 与 DragReorder 顺序相反，需按新签名改 |
| `reachBottomOffset` | 由 props 控制（默认 100） | 无限滚动用 `InfiniteScrollPlugin({ threshold })`，不再写死 |

## 在线示例

演示站是三种视角，各管一件事：

| 页面 | 数量 | 解决什么 |
| --- | --- | --- |
| **逐项示例** | 34 页 | 一插件一页：拖参数看行为变化，装配代码跟着参数实时变 |
| **插件工坊** | 26 插件 | 组合实验台：勾选任意组合，现场看冲突提示并生成装配代码 |
| **场景库** | 13 版式 | 组合视角：真实版式（图文 / 电商 / 视频 / 看板 / 长文…），每卡两份源码 |

逐项示例分三组，与 [API](api.md) 的钩子表一一对得上：

- **基础功能**（3）：基础示例、自定义列数、自定义间距 —— 只用 Core props
- **高级功能**（3）：Ref 方法调用（13 个方法逐个点）、生命周期和事件（13 个回调接满）、高级配置（padding / useTransform / alignmentMode / 节流防抖）
- **插件功能**（28）：26 个插件各一页，另有 2 页是内核能力（虚拟瀑布流 / 动态高度虚拟化）

每页固定四块：一句话 + 什么时候用 → 参数控件 → 可交互舞台（含事件日志 / 读数条）→ 通栏代码（最小装配 / 完整源码）。

本地跑：

```bash
pnpm --filter vane-waterfall dev               # 开发（端口 3300）
pnpm --filter vane-waterfall demo              # 构建 + 静态托管 demo-dist
pnpm --filter vane-waterfall verify:scenarios  # 目录 / 源码 / 插件名一致性闸门（场景 + 示例）
PLAYWRIGHT_PATH=<playwright> node scripts/audit-demos.mjs      # 37 个页面逐页几何体检
PLAYWRIGHT_PATH=<playwright> node scripts/audit-controls.mjs   # 每个滑杆推开看版式是否真变
```

三道闸门各管一段，缺一段就有盲区：

| 闸门 | 抓什么 | 抓不到什么 |
| --- | --- | --- |
| `verify:scenarios` | 元信息 ↔ 源码 ↔ 插件名双向对不上（写了没实现、实现了没登记） | 运行时行为 |
| `audit-demos` | 真浏览器里的几何坏味道：重叠 / 越界 / 零尺寸 / `scrollHeight` 盖不住底边 | 「控件没接上」——3 列排得整整齐齐也是合法几何 |
| `audit:controls` | 逐个滑杆推到两端，比较逐项指纹（列号 + 位置 + 列宽 + 总高 + 渲染项数）；标了 `nonLayout` 的（耗时 / 池大小 / 阈值）跳过 | 耗时类参数的效果（得看读数或日志） |

两个判定细节，都是被误报逼出来的：`audit-demos` 读不到 `transform` 时会退回 `offsetLeft/offsetTop`（`-prefers-reduced-motion` 下 ReducedMotion 会把定位切成 `left/top`，只读 transform 会误报「容器里没有已布局项」）；`audit:controls` 的「拖回原值」检查对开了 `virtualize` 的页面忽略 `scrollHeight`（估值高度被实测高度替换后总高合法变大）。

