# Changelog

## 2.0.0

vane-card 2.0.0：插件系统内核换为 `vane-plugin-core`，钩子面 24 → 15，根入口不再桶导出。

### 破坏性变更

- **插件系统换成内核**：自建 `PluginBus` / `PluginManager` / `SlotsContext` / `withPlugins` 删除，改用 `vane-plugin-core`；内核类型在本包**重新声明**而非 re-export（内核未发布到 npm，公开 d.ts 不依赖 `vane-plugin-core`）。
- **领域钩子面 24 → 15**：只保留有真实执行点的钩子；状态变化改用 `onStateChange`（含 prev / next 快照），装饰性 DOM 用 `renderOverlay`。
- **包形态改多入口**：根入口只聚合 Core + 装配 + 总线键 + 契约类型（6.8KB gzip），不再桶导出 22 插件 / 38 复合组件 / 3 配方。子路径：`/core`（1.7KB）、`/plugins`、`/compound`、`/custom-plugins/XxxPlugin`、`/presets/X`；`exports` 共 32 条。
- **`onMount` 返回值统一当清理函数**；**`onStateChange` 移出 updater**（差分在 effect 里算，避免抖动）。
- **样式抽到 `style.css`**：核心只保留三处功能性内联；暗色走 `data-vc-theme="dark"`。`sideEffects` 改为 `["**/*.css"]`（否则生产构建会摇掉样式）。
- **`matchVariant` 语义修正**：改为「变体属性集与已选属性集一一对上」，未选全回退商品级字段（修复显示错价）。

### 新增 / 修复

- 22 个插件全部迁入并补 `doc.json`；3 个场景配方：`product-card` / `sku-flow` / `checkout`（均支持 `omit`）。
- 38 个复合组件迁入 `vane-card/compound`，`as any` 从 51 处降到 0；价格区改为包内领域槽。
- 修 `ActionsPlugin` 按钮排位、`CardCore` 可见性观测重建问题；新增 `verify-scenarios` 与 `audit-cards` 回归闸门。
