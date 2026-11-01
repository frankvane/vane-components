# vane-card 评审修复实施验收清单

> 对应报告：`tasks/36-vane-card-核心功能评审.html`（1 P0 + 5 P1 + 8 P2，共 14 项）
> 实施范围：仅 `packages/vane-card/`（未修改 `packages/plugin-core`、其它包、根配置、tasks/36）
> 未执行任何 git 命令

## 一、概述

### 1. 范围

按报告第 08 节「建议修复顺序」表 T01–T08 逐项实施，覆盖：

- **T01 / CARD-P0-1**：库存缺失被当作 0 判售罄 + 蒙层吞点击
- **T02 / CARD-P1-1**：`pluginKey` 只看插件名，同名插件换配置不生效
- **T03 / CARD-P1-2 + P1-3**：规格半匹配命中错误变体价；切到无价变体价格不回落
- **T04 / CARD-P1-4**：插件与复合组件各写各的状态（选中规格/数量价格不动）
- **T05 / CARD-P1-5**：`discount` 一律按金额计算，`discountType` 不参与运算
- **T06 / CARD-P2-1 + P2-2**：`transformData` 从未被调用；渲染期写 ref / 每次渲染重建上下文
- **T07 / CARD-P2-3 + P2-4 + P2-5**：槽位 key 带 index、生命周期闭包过期、Actions 非函数式更新
- **T08 / CARD-P2-6 + P2-7 + P2-8**：画廊越界/外链/硬编码兜底图、图片失败不可恢复、数量防抖未清理

### 2. 结论

**14 / 14 全部修复，0 项跳过（无需要 plugin-core 支持的阻塞项）**。
`typecheck`、`lint`、`build`、`test` 四条验证命令全部通过；新增 16 条回归用例，测试总数 187 → **203**。

### 3. 改动文件清单（均在 `packages/vane-card/` 内）

**新增源码**

| 文件 | 作用 |
| --- | --- |
| `src/components/CardPlugin/plugins/utils/sku.ts` | SKU 派生键统一写入口径（先清后写） |
| `src/components/CardPlugin/plugins/utils/coupon.ts` | 优惠券折扣唯一计算口径（金额券/折数券） |
| `src/components/CardPlugin/plugins/utils/url.ts` | 外链协议校验 `isSafeUrl` / `openExternal` |
| `test/fixes.test.tsx` | 本次 14 项修复的回归测试（16 例） |

**修改源码**

`src/custom-plugins/` 下：`InventoryPlugin/create.tsx`、`SKUPlugin/create.tsx`、`CouponPlugin/create.tsx`、
`PriceCalculatorPlugin/create.tsx`、`OrderSummaryPlugin/create.tsx`、`CouponRecommendPlugin/create.tsx`、
`ActionsPlugin/create.tsx`、`GalleryPlugin/create.tsx`、`ImagePlugin/create.tsx`、`QuantityPlugin/create.tsx`

`src/components/CardPlugin/` 下：`core/CardCore.tsx`、`plugins/withPlugins.tsx`、`plugins/slots.tsx`、
`types/product.ts`、`compound/ProductCard.tsx`、
`compound/components/`：`Inventory.tsx`、`StockBadge.tsx`、`Price.tsx`、`VariantSelector.tsx`、
`QuantityStepper.tsx`、`SKUCode.tsx`、`VariantMediaSwitcher.tsx`、`CouponBar.tsx`、`ReturnPolicy.tsx`

**测试资产**

- `test/plugins-c.test.tsx`：ImagePlugin 失败断言更新为「保留 `<img>`（P2-7 行为）」
- `test/fixtures/card-snapshots.json`：用 `UPDATE_SNAPSHOT=1` 重生成基线——SKUPlugin 现在确实会写
  `sku.price / sku.image / sku.variant`（P1-3 的有意变更），基线必须同步

## 二、逐项验收表

| 编号 | 级别 | 问题 | 修复方案 | 改动位置(file:line) | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| CARD-P0-1 | P0 | `resolveInventory` 把「库存缺失(undefined)」回落为 0，首帧就判售罄；`inset:0 / zIndex:9` 蒙层无 `pointer-events`，吞掉整卡点击 | 缺失时返回 `undefined`；只有 `known && inventory <= 0` 才售罄；蒙层加 `pointerEvents:"none"`、`role="status"`、`aria-live="polite"`、`data-card-sold-out`；低库存角标同样不拦截点击 | `src/custom-plugins/InventoryPlugin/create.tsx:29-38,55-109`；同名语义的复合组件：`compound/components/Inventory.tsx:15,29`、`StockBadge.tsx:34,45` | 「data 没有 inventory 时不盖售罄蒙层」「inventory=0 才判售罄，蒙层 pointer-events:none 且保留无障碍语义」 | ✅ 已修复 |
| CARD-P1-1 | P1 | Core 记忆键只取插件 `name`，同名插件换配置（如 variants 后到）不重建，配置永不生效 | 引入稳定配置指纹（函数→"fn"、Date→ISO、递归对象/数组、`WeakMap` 缓存），`pluginKey = name#configFingerprint` join | `compound/ProductCard.tsx:52-87,115-120` | 「ProductCard 重渲染后使用新插件实例的配置」 | ✅ 已修复 |
| CARD-P1-2 | P1 | 变体匹配只要求「已选属性都命中」，只选颜色就套用「颜色+尺码」的变体价；插件与复合组件口径不一致 | 抽出 `attributesMatchExactly`（属性集大小相等 + 逐项相等），`matchVariant` 与 SKUPlugin 本地匹配统一调用 | `types/product.ts:101-112,121-129`；`custom-plugins/SKUPlugin/create.tsx:37-43` | 「只选了颜色、没选尺码时不套用『颜色+尺码』的变体价；选全后才生效」 | ✅ 已修复 |
| CARD-P1-3 | P1 | 命中不到变体时什么都不写，切到无价规格后价格/图片停在上一规格 | 新增 `writeSkuDerivedKeys`：`sku.variant/sku.price/sku.image` 先清后写，未命中三键全删；SKUPlugin 的 footer/overlay/首屏共用 `applySelection`；onMount 返回总线订阅 | `plugins/utils/sku.ts:28-40`；`custom-plugins/SKUPlugin/create.tsx:88-104,112-125,129-132,150-152` | 「红（有价）→ 蓝（无价）后价格回到 data.price」 | ✅ 已修复 |
| CARD-P1-4 | P1 | 插件写总线、复合组件写本地 state，两边不同步（选了规格价格不动、数量不联动） | `slots.tsx` 暴露 `useCardBus / useBusValue / useSelectedAttributes`；VariantSelector / QuantityStepper 双写（state + bus），Price / Inventory / StockBadge / SKUCode / VariantMediaSwitcher 读总线优先 | `plugins/slots.tsx:100-134`；`VariantSelector.tsx:42,46-57`；`QuantityStepper.tsx:29-30,44-57`；`Price.tsx:19-24` | 「VariantSelector 选规格后，插件价格与复合 Price 同步」「QuantityStepper 写入总线后，价格合计翻倍」 | ✅ 已修复 |
| CARD-P1-5 | P1 | `discount` 一律当金额减（8 折券只减 8 元），`discountType` 只用于展示 | 新增唯一口径 `computeCouponCut`（amount 封顶小计；percentage 按折数，兼容 0<v≤1 比例，>10 钳制）；`isCouponApplicable` 用变体价×数量判门槛；`couponValueLabel` 统一文案；四处（PriceCalculator / OrderSummary 两分支 / CouponRecommend / CouponBar）全部接入 | `plugins/utils/coupon.ts:27-67`；`PriceCalculatorPlugin/create.tsx:69-78,112-114`；`OrderSummaryPlugin/create.tsx:67-69,115-117`；`CouponRecommendPlugin/create.tsx:33-46,90-98,120-125,143-151`；`CouponBar.tsx:1-5,48-68,123,194-202` | 「8 折券按小计打折（300 → 240），而不是只减 8 元」「CouponBar 用变体价×数量判断门槛，不满足门槛的券仍然展示」 | ✅ 已修复 |
| CARD-P2-1 | P2 | 内核已实现 `transformData`，但 withPlugins 从未调用，插件拿到的永远是原始 data | 渲染链里调用 `runtime.transformData`，结果同时传给 `CardCore.data`（renderContent 可见）与 `context.data` getter（插件可见） | `plugins/withPlugins.tsx:167-183,231-234` | 「插件与 CardCore 都拿到变换后的数据」 | ✅ 已修复 |
| CARD-P2-2 | P2 | `transformProps` 每次渲染都跑；`transformedPropsRef` / `ctxRef` / `onVisibilityChangeRef` 渲染期赋值；`extendContext` 依赖 `[props]` 每次渲染新建上下文 | `transformProps / transformData` 改 `useMemo`；`extendContext` 依赖收敛为 `[containerRef]`，内部从 `propsRef / transformedPropsRef` 读最新值；`ctxRef` 与 CardCore 回调 ref 移到 `useLayoutEffect`。注：`transformedPropsRef / transformedDataRef` 仍在渲染期同步写入，因为 `composeSlots` 会在同一次渲染里读取它们，滞后一帧会渲染到旧数据 | `plugins/withPlugins.tsx:74-79,103-145,157-187`；`core/CardCore.tsx:186-196` | 结构化修复，由既有 `core-visibility`（重渲染不重建 IO）、`compound`（onMount 只跑一次）用例覆盖 | ✅ 已修复 |
| CARD-P2-3 | P2 | 槽位 key 使用 `plugin.name + index`，片段增删时错位重挂；CouponBar 的 priceArea 用 index 做 key | 槽位 key 只用插件名；priceArea 节点直接渲染不再包 Fragment | `plugins/slots.tsx:67-89`；`CouponBar.tsx:194-202` | 纯结构修复，无独立用例（由现有价格区顺序用例与构建覆盖） | ✅ 已修复 |
| CARD-P2-4 | P2 | `useEffect(..., [])` 里调用首帧闭包的 `onMount / onUnmount`，重渲染后卸载仍调旧回调 | `onMountRef / onUnmountRef` 保存最新回调，挂载 effect 通过 ref 调用 | `core/CardCore.tsx:186-196,219-229` | 「重渲染后卸载调用的是最新的 onUnmount」 | ✅ 已修复 |
| CARD-P2-5 | P2 | Actions 用闭包 `state.cart` 取反；同一批次连点两次会又回到「已加入」 | 以 `context.sharedData`（每个 runtime 一个 Map）为同步真源，state 只负责触发重渲染 | `custom-plugins/ActionsPlugin/create.tsx:39-64` | 「同一批次连点两次购物车，最终回到未加入」 | ✅ 已修复 |
| CARD-P2-6 | P2 | 画廊 `index` 越界（图片 2→1 时 `current` 为 undefined）；渲染期写 `media.*` 总线；`window.open` 未校验协议；硬编码 `/404.jpg` | `safeIndex` 钳制 + 数量减少时 `setIndex(0)`；`media.videoInGallery / media.handledByGallery` 改在 `GalleryHeaderComp` 的 effect 写并 `forceUpdate` 让 VideoPlugin 重渲染；引入 `openExternal`（仅 http/https/blob + 相对路径）；`/404.jpg` 改为可选 `errorFallbackSrc`，未配置时隐藏破图 | `custom-plugins/GalleryPlugin/create.tsx:42-86,101-109,119-123,196-199,243-245`；`plugins/utils/url.ts:1-38`；`compound/components/ReturnPolicy.tsx:84-85` | 「图片从 2 张变 1 张后不越界，仍渲染首图」「javascript: 协议的缩放链接不外跳」 | ✅ 已修复 |
| CARD-P2-7 | P2 | `status` 不随 `src` 重置；`failed` 分支整块替换掉 `<img>`，换新图无法恢复 | 加 `useEffect(() => setStatus("loading"), [src])`；`<img>` 始终保留（失败时 `opacity:0`），失败兜底改为覆盖层 | `custom-plugins/ImagePlugin/create.tsx:50-53,80-109` | 「失败时保留 img 元素，换新 src 后可重新加载」 | ✅ 已修复 |
| CARD-P2-8 | P2 | Stepper 的输入防抖定时器没有卸载清理，组件已卸载仍会写总线 | 挂载时注册清理函数：`if (timerRef.current) window.clearTimeout(timerRef.current)` | `custom-plugins/QuantityPlugin/create.tsx:49-56` | 「卸载时清掉未触发的定时器」 | ✅ 已修复 |

## 三、验证记录（实际执行）

| 命令 | 结果 | 输出摘要 |
| --- | --- | --- |
| `pnpm --filter vane-card test` | ✅ 通过 | 14 个测试文件全部通过；**203 / 203 用例通过**（原 187 + 新增 16）；耗时约 32.8s |
| `pnpm --filter vane-card typecheck` | ✅ 通过 | `tsc --noEmit -p tsconfig.json`，exit 0，无输出 |
| `pnpm --filter vane-card lint` | ✅ 通过（exit 0） | 仅 warning，无 error；warning 均为既有代码风格的 `no-explicit-any` / `react-refresh` 类提示 |
| `pnpm --filter vane-card build` | ✅ 通过 | `vite build --mode lib`：154 modules transformed；`dist/index.js` 等产物生成，built in 7.54s；d.ts 生成成功 |

## 四、破坏性变更 / 行为变更（需在发版说明中标注）

1. **`percentage` 券语义**：`discount` 现在是**折数**（`8` = 8 折），并兼容 `0 < discount <= 1` 的比例写法（`0.8` = 8 折）；
   `> 10` 钳制为不打折。历史数据若把 percentage 的 `discount` 当作「百分比数值」使用，需要迁移。
2. **复合组件未知库存不再显示售罄**：`<Inventory>` / `<StockBadge>` 在库存缺失时返回 `null`（原先把缺失当 0 显示「已售罄」）。
3. **ProductCard 同名插件换配置会重建 Core**：`pluginKey` 含配置指纹，配置变化的插件会重新挂载（`onMount` 重跑、内部状态重置）。这是为修复 P1-1 的有意行为。
4. **画廊破图兜底**：不再硬编码 `/404.jpg`；未配置 `errorFallbackSrc` 时隐藏破图（新增可选配置项，默认行为改变）。
5. **价格/库存类插件写总线**：SKUPlugin 现在会写 `sku.price / sku.image / sku.variant`，只读这些键的外部消费者会开始收到事件；
   `test/fixtures/card-snapshots.json` 已同步更新。

## 五、遗留问题与风险

1. **无插件场景的复合组件仍走本地 state**：`ProductCard` 外层无法访问内层 `CardCore` 的总线，未做 state → bus 反向桥接；
   不装插件时复合组件依靠本地 state + 完全匹配兜底（行为与修复前一致）。
2. **`transformData` 的 memo 依赖 `props` 引用**：父组件每次传内联 `data` 字面量时 `transformData` 每次渲染都会重跑
   （纯函数、无累积；内核 `context` 本身也依赖 props 引用，无法仅在 vane-card 侧彻底消除）。
3. **槽位 key 只用插件名**：同一张卡重复注册同名插件时可能出现 key 碰撞（插件名本应唯一，已在注释说明）。
4. **`pointer-events` 透传**只断言了内联样式，未在真实浏览器做点击命中测试（happy-dom 无命中测试能力）；未跑 e2e。
5. **画廊/视频联动依赖 effect 顺序**：SSR 首帧没有 effect，标记会在水合后才写入（本包定位为客户端组件）。
6. **P2-3 为纯结构修复**（key 去 index），没有独立回归用例，由既有价格区顺序用例与构建覆盖。

## 六、未覆盖范围

- demo 页面与真实浏览器的手动回归（本次只跑单测/类型/构建）。
- `packages/plugin-core` 的行为（按要求未修改；P2-1 因内核已实现 `transformData`，在 vane-card 侧即可修复）。
- 视觉/样式层面的评审（本次只修功能与状态一致性问题，未调整 CSS）。
