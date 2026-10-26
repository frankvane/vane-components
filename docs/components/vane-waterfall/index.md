# 瀑布流布局

> 瀑布流本身很简单，难的是它旁边那一堆需求：可变高、响应式列数、置顶、分组吸顶、拖拽换位、无限加载、千项虚拟化。这些不该揉进一个 800 行的组件里。

`vane-waterfall` 把它们拆成 **26 个领域插件**，`WaterfallCore` 只负责「测量 + 布局 + 滚动」。

## 特性

- **布局是纯函数**：`computeLayout` 不碰 DOM，可以直接对数字快照做等价性单测（8 组断言锁住旧行为）
- **布局钩子有执行点**：`calculateColumns` / `calculateColumnWidth` / `calculateItemPosition` 三个钩子真的会被调用（旧版声明了但从不执行，插件因此空转）
- **虚拟化只裁渲染**：未渲染项按 `estimateHeight` 占位，总高不缩水、滚动条不跳
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
virtualize.ts       computeVisibleRange 纯函数 + 占位高度策略
custom-plugins/     26 个领域插件（5 组）
presets/            photo-feed / product-feed / dashboard
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

演示站包含两类页面，都能直接开：

- **插件工坊**：勾选 26 个插件，实时看装配效果并生成可复制代码
- **场景库**：13 个真实版式（图文 / 电商 / 视频 / 看板 / 长文…），每卡带「完整源码」+「最小装配」两份代码，并有页面内的几何体检（重叠 / 越界 / 总高不足）

本地跑：

```bash
pnpm --filter vane-waterfall dev          # 开发（端口 3300）
pnpm --filter vane-waterfall demo         # 构建 + 静态托管 demo-dist
pnpm --filter vane-waterfall verify:scenarios   # 场景目录 / 源码 / 插件名一致性闸门
```
