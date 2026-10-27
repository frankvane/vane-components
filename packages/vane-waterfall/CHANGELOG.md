# Changelog

## 2.0.0

vane-waterfall 2.0.0：插件系统内核更换为 `@vane/plugin-core`，钩子面从 48 收到 20。

### 破坏性变更

- **插件系统换成内核**：自建 `PluginBus` / `PluginManager` 与旧 `withPlugins` 全部删除，改用 `@vane/plugin-core` 的 `usePluginRuntime` / `composeSlots` / `PluginErrorBoundary`。
- **领域钩子面 48 → 20**：只保留有真实执行点的钩子；被删的 31 个在 1.x 从来没有执行者。
- **`renderItemWrapper` 签名统一为 `(context, node, index)`**。
- **虚拟化下沉 Core**：`VirtualWaterfallPlugin` 删除，改为 `virtualize` prop（只裁渲染不裁测量）。`RecyclePlugin` 保留但与 `virtualize` 互斥。
- **`onMount` 返回值统一当清理函数**。
- **`reachBottomOffset` 提为 props**（默认 100）。
- **包形态改多入口**：根入口只导出核心 + 装配 + 类型（10.5KB gzip），插件走 `vane-waterfall/custom-plugins/XxxPlugin`，配方走 `vane-waterfall/presets/X`；另提供 `/core`、`/plugins` 别名；`exports` 共 34 个子路径。
- **`priority` 语义同向**（大 = 先执行），未做 `1000 - x` 反转。

### 新增 / 修复

- 新增 `PinItemPlugin` 真实实现；`GroupingPlugin` 改为挂载即算并 `emit("grouping:change")`；`DragReorderPlugin` 补 `onReorder(from, to, item)` 真回调并支持触屏。
- `AutoColumnPlugin` / `ResponsiveColumnsPlugin` 改走布局钩子 `calculateColumns`，拿容器宽度而非 `window.innerWidth`。
- 布局 props 变化后重排修好；布局期间到达的请求不再被丢弃；`ReducedMotionPlugin` 真正能清/还原过渡。
- 虚拟化滚动后的同列重叠修好（实测 0 帧重叠）；新增自适应估值 `virtualize.adaptiveEstimate`。
- 3 个配方：`presets/photo-feed` / `presets/product-feed` / `presets/dashboard`。
