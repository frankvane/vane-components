---
"vane-card": major
---

vane-card 2.0.0：插件系统内核换为 `@vane/plugin-core`，钩子面 24 → 15，根入口不再桶导出

**破坏性变更**

- **插件系统换成内核**：自建 `PluginBus` / `PluginManager` / `SlotsContext` / `withPlugins`（1154 行）删除，改用 `@vane/plugin-core` 的 `usePluginRuntime` / `composeSlots` / `PluginErrorBoundary`。`PluginBus` 等类型在本包**重新声明**而不是 re-export —— 内核未发布到 npm，公开 d.ts 里若出现 `import type { PluginBus } from "@vane/plugin-core"`，消费方装包后会直接 `Cannot find module`。
- **领域钩子面 24 → 15**：只保留有真实执行点的钩子。被删的 9 个（`onSelectionChange` / `onCartChange` / `onWishlistChange` / `onBeforeDataChange` / `onDataChange` / `renderContainer` / `renderContentWrapper` / `renderBadge` / `renderActions`）在 1.x 从来没有执行者，写进去不生效。状态变化改用 `onStateChange`（带 prev / next 快照），装饰性 DOM 用 `renderOverlay`。
- **包形态改多入口**：根入口只聚合 Core + 装配 + 总线键 + 契约类型（6.8KB gzip），不再桶导出 22 个插件 / 38 个复合组件 / 3 个配方（此前全量并集 41.52KB）。子路径：`vane-card/core`（1.7KB）、`/plugins`（5.2KB）、`/compound`（17.6KB）、`/custom-plugins/XxxPlugin`（单个 1.6–1.8KB）、`/presets/X`；`exports` 由脚本扫描目录生成，共 32 条。
- **`onMount` 返回值统一当清理函数**：旧装配层用 `.catch(() => {})` 丢掉返回值，订阅会泄漏；现在卸载时逆序执行。
- **`onStateChange` 移出 updater**：`setState` 的 updater 保持纯函数，差分在 state 变化后的 effect 里算 —— 旧版在 updater 内同步触发，会抖。
- **样式抽到 `style.css`**：127 处内联样式归位到 `vc-` 前缀 class + CSS 变量（`dist/style.css` 24.8KB / gzip 5.1KB）。**核心只保留三处功能性内联**（`position` / `box-sizing` / 用户传入的 `padding`），不引样式文件也能渲染。暗色走 `data-vc-theme="dark"` 整套覆盖，不接管整站 `prefers-color-scheme`。
- **`sideEffects` 改为 `["**/*.css"]`**（原 `false`）：否则 webpack / Rspack 生产构建会把 `import "vane-card/style.css"` 整条摇掉。
- **`matchVariant` 语义修正**：旧逻辑「每个已选属性都对上」→ 只选了颜色就会命中「红 / M」拿到 M 的价格，**显示错价**；改为「变体属性集与已选属性集一一对上」，未选全回退商品级字段。
- **`ProductCard` 按插件名记忆 Core**：旧版按 `plugins` 数组引用记忆，内联字面量会让每次父组件重渲染都卸载重挂整棵树。
- **`priority` 语义同向**（大 = 先执行），未做反转。插槽渲染位置由 `config.order` 决定（升序），两轴正交。

**新增 / 修复**

- 22 个插件全部迁入并补 `doc.json`（文档真相），5 组：媒体 3 / 交易 8 / 展示 5 / 交互 2 / 基础设施 4。
- 3 个场景配方：`product-card`（展示卡）/ `sku-flow`（选规格到价格联动）/ `checkout`（结算区），均支持 `omit` 去掉不需要的成员。
- 38 个复合组件迁入 `vane-card/compound`，**51 处 `as any` → 0**：变体匹配逻辑原本在 6 个组件里各抄了一遍，统一收口到 `matchVariant`；`compound/index.ts` 的 38 处静态子组件赋值改为一次 `Object.assign`。
- 价格区改为**包内领域槽**（`usePluginSlot("priceArea")` / `renderDomainSlot`），三个价格类插件写片段、复合组件决定插在哪一段；单个片段独立错误边界。
- 新增 `headerPosition` → 内核 `config.slotPosition` 映射：不映射的话所有头部插件都会落到默认的 `after` 段。
- 修 `ActionsPlugin` 按钮排到价格上面：`config.order = 20`，让 footer 内「券 → 价格 → 按钮」变成结构性的，不再靠 `priority` 撞运气。
- 修 `CardCore` 可见性观测：`onVisibilityChange` 每次渲染换新函数会重建 IntersectionObserver，改为 ref 存最新回调、仅挂载建一次。
- 新增两个回归闸门：`verify-scenarios`（场景 / 目录 / 插件名双向一致，22 插件覆盖率）与 `audit-cards`（41 个页面逐页几何体检：无卡 / 零尺寸 / 溢出 / 破图 / 无内容 / 缺价格）。
