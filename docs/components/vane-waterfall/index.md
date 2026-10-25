# 瀑布流布局

> 插件式 React 瀑布流：列分配策略、虚拟化、滚动锚点、拖拽排序全部可插拔。

## 状态

**迁移中** —— 源码仍在 `archive-plugins/vane-waterfall`，尚未按新结构迁入。

## 特性

- `WaterfallCore` + `withPlugins`
- 列分配策略：最矮列 / 平均列 / 固定列数 / 响应式列数
- `gap` 与 `padding` 参与布局计算，两侧留白可控
- 虚拟化（`VirtualWaterfall`）、复用回收、Web Worker 布局
- 书签定位、滚动锚点、粘性头部、状态持久化与 URL 同步
- 拖拽重排、分组、置顶

## 安装

```bash
npm install vane-waterfall
```

## 30 秒上手

```tsx
import { WaterfallCore, withPlugins } from "vane-waterfall";
import { createResponsiveColumnsPlugin } from "vane-waterfall/custom-plugins/ResponsiveColumnsPlugin";
import { createAlignmentPlugin } from "vane-waterfall/custom-plugins/AlignmentPlugin";

const Waterfall = withPlugins(WaterfallCore, [
  createResponsiveColumnsPlugin({
    breakpoints: { sm: { width: 640, columns: 2 }, lg: { width: 1024, columns: 4 } },
  }),
  createAlignmentPlugin({ mode: "shortest" }),
]);

<Waterfall items={items} columns={4} gap={12} padding={12} renderItem={(item) => <Card {...item} />} />;
```

## 迁移待办

- [ ] 插件系统切换为 `@vane/plugin-core`
- [ ] `react` / `react-dom` / demo 依赖从 `dependencies` 移出
- [ ] 虚拟化与 `vane-lazy-image` 的 `ObserverPool` 合并思路沉淀为通用插件
- [ ] 补 `doc.json` 与 `presets/`
