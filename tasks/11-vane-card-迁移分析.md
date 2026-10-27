# 11 · vane-card 迁移分析（资产盘点 / 架构差距 / 逐插件分级）

> 状态：**决策已锁定（D1–D5 见第六章标注）· 迁移进行中（C1 起）**（本文不改任何代码）
> 基线：`旧仓库/vane-card`（`package.json` 1.0.8，npm 已发布 1.0.8，解包 381KB），本机实测于 2026-10-27
> 参照范式：`packages/vane-lazy-image`（P1 样板包）+ `packages/vane-waterfall`（P2 已完成的同类迁移）+ `tasks/07` / `tasks/08`
> 实施步骤见 `tasks/12-vane-card-实施清单.md`

---

## 一、结论先行

1. **和 vane-waterfall 不是同一种病。**
   瀑布流旧仓「不可运行、不可重建」（`tsc -b` exit=2、无 `dist`）；vane-card **能构建、类型检查全绿**：
   `npx tsc -b` → **exit 0**；`npx vite build --mode lib` → **6.03s 成功**，`index.es.js` 151.83KB / **35.66KB gzip**。
   所以本次迁移的性质是「**换骨架 + 收口**」，不是「从废墟重建」——可对照的行为基线存在，能一边迁一边比。

2. **但 demo 跑的不是这份源码。**
   51 个页面文件里 **47 个** `import { ... } from "vane-card"`，而 `node_modules/vane-card@1.0.8`（npm 产物）是装好的 → `npm run dev` 起来后演示的是**已发布的旧包**，本地 `src/` 只服务库构建。
   迁移第一件事必须是把 demo 指回 `src`（包名 alias，做法同 waterfall），否则后面所有「验证」都在验旧包。

3. **迁移主体 13174 行里，真正要动的只有 5474 行。**
   Core 258 + 22 插件 2444 + 复合组件 2772 = **5474 行迁入**；自建插件系统 1154 行 **整体删除**；demo 6126 行 **重写**；壳与入口 420 行丢弃。

4. **插件系统 1154 行删掉是零成本替换，不是重写。**
   内核 `composeSlots` 的输出顺序是 `before-header → children → overlay → after-header → footer`，
   与旧 `withPlugins` 里手写的那五段**逐字相同**（旧文件 L221–L275）。等于旧代码把内核逻辑手抄了一遍，还抄丢了两处（见 4.2 / 4.5）。

5. **钩子面 24 个声明 / 11 个真生效 / 3 个有实现但没人调 / 10 个纯声明。**
   真生效：`onMount`(12 插件) `onUnmount`(1) `onClick`(1) `onHover`(2) `onVisibilityChange`(1) `onResize`(1)
   `renderHeader`(3) `renderOverlay`(8) `renderFooter`(9) `renderPriceArea`(3) `transformProps`(2)。
   有实现无调用：`onCartChange`(Analytics / State)、`onWishlistChange`(State)、`renderBadge`(Inventory) —— **这 4 处是空转代码**。
   纯声明：`onSelectionChange` `onBeforeDataChange` `onDataChange` `onError` `renderContainer` `renderContentWrapper` `renderActions` `transformData` `onPropsChange` `onStateChange`（后两个有调用点但 0 实现）。

6. **两个真 bug，迁移必须一并修掉（不是「顺手优化」）。**
   - **`onMount` 返回值被丢弃 → 总线订阅泄漏。** 5 个插件（消费者）用 `setupForceUpdateOnBusKeys(context, keys)` 订阅总线，它返回的退订函数正是要挂在 `onMount` 返回值上的；而 `withPlugins` 写的是 `executeHook("onMount", ctx).catch(() => {})`，**返回值直接扔掉**。结果：每卸载一张卡，就漏 N 个 bus 监听 + 一个 `forceUpdate` 闭包。瀑布流同类问题只是「清理没生效」，这里是真的泄漏。
   - **`setState` 的 updater 里执行钩子链。** `pluginContext.setState` 在 `setCardState(prev => {...})` 的 updater 内部调 `executeHook("onStateChange", ...)`。React 18 StrictMode 会把 updater 跑两遍 → 插件收到两次相同事件；且 updater 必须是纯函数，这里带副作用。

7. **排序有两套轴，插件作者无法预测。**
   `priority` 只在 `PluginManager` 内部生效（注册 / `executeHook` 时降序）；插槽渲染却只认 `config.order`（`withPlugins` L226/L253、`SlotsContext` L24）。
   同一个插件在「钩子执行顺序」和「渲染位置」上由两个不同字段决定。内核统一成 `config.order` 升序 → `priority` 降序兜底，迁移后语义收敛。

8. **零 CSS：库内 0 个 `.css`，230 处内联 `style`（复合组件 127 / 插件 102 / Core 1）+ 硬编码色值（`#f5f5f5` / `#fff` / `#000`）。**
   卡片不像瀑布流能靠一个容器 class 解决——38 个复合组件各自上色。主题化目前只能靠调用方传 `style` 覆盖，这正是要拍板的一件事（D4）。

---

## 二、资产盘点

### 2.1 体量

| 模块 | 文件 | 行数 | 处置 |
| --- | --- | --- | --- |
| `components/CardPlugin/core/CardCore.tsx` | 1 | 258 | **迁入**，props / ref 契约不变（实际逻辑约 100 行，其余是注释） |
| `components/CardPlugin/plugins/`（自建插件系统） | 9 | 1154 | **整体删除**，能力由 `@vane/plugin-core` 提供 |
| `components/CardPlugin/custom-plugins/` | 23（22 插件 + 桶） | 2444 | **迁入** + 补 `doc.json` + 分组 |
| `components/CardPlugin/compound/` | 40 | 2772 | **迁入**（本仓最大资产：38 个复合子组件 + `ProductCard` + 桶） |
| `pages/`（demo） | 51 | 6126 | **重写**（三视角：工坊 + 场景 + 逐项，见 D5） |
| 壳与入口（`App.tsx` / `main.tsx` / `index.ts` / `CardPlugin/index.ts` / `vite-env.d.ts` / `App.css`） | 6 | 420 | 丢弃，走新 demo 骨架与多入口 |
| **合计** | **129** | **13174**（`.ts` / `.tsx`，`cat \| wc -l`） | 迁入 5474，删除 1154，重写 6546 |

### 2.2 源码地图

```
旧仓库/vane-card/src/
├── index.ts                                # 单入口：CardPlugin 全量导出 + 别名（withCardPlugins 等）
├── main.tsx / App.tsx / App.css            # demo 壳（App.tsx 343 行手写 52 条 <Route>）
├── components/CardPlugin/
│   ├── index.ts                            # 桶：CardCore / 类型 / 插件系统 / custom-plugins / compound
│   ├── core/CardCore.tsx                   # 258 行：容器 + padding/命中 + IntersectionObserver + 生命周期
│   ├── plugins/
│   │   ├── types.ts                        # 420 行：24 个钩子 + context + manager 接口
│   │   ├── withPlugins.tsx                 # 319 行：HOC 装配（渲染期注册 + 逐钩子桥接 + 插槽手写）
│   │   ├── PluginManager.ts                # 180 行
│   │   ├── PluginBus.ts                    # 109 行
│   │   ├── SlotsContext.tsx                # 53 行：单槽位 priceArea
│   │   ├── BusKeys.ts / index.ts / utils/   # 19 + 25 + 29 行
│   └── custom-plugins/                     # 22 个插件，一目录一文件，无 doc.json
└── pages/CardPlugin/                       # 51 页 demo（slots 5 / layouts 9 / advanced 4 / compound 30 / 元信息 2 + _layout）
```

### 2.3 22 个插件清单（按目标分组）

「真生效钩子」= 有调用点；「总线键」= 经 `BusKeys` 读写；「副作用」= 需要清理的 listener / timer / 全局 DOM。分级见第六章。

| 分组 | 插件 | 行数 | 真生效钩子 | 总线键 | 副作用 | 作用 | 分级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **media** 媒体 | Gallery | 227 | renderHeader, onClick | — | timer | 多图切换/缩略图条 | A |
| | Image | 84 | renderHeader | — | — | 单图 + `loading` 属性 | **C** |
| | Video | 76 | renderHeader, onHover | — | — | 视频悬浮播放 | A |
| | Responsive | 70 | transformProps, onMount, onResize | — | — | 按容器宽度切布局 | A |
| **buy** 交易 | SKU | 160 | renderFooter, onClick, onMount | skuSelection, skuVariant, skuPrice, skuImage | — | 规格选择器 | B |
| | Quantity | 198 | renderOverlay, renderFooter, onMount, onClick | quantity, skuVariant | timer | 数量步进（上限跟库存） | B |
| | PriceCalculator | 180 | renderFooter, renderPriceArea, onMount | skuPrice, quantity, couponApplied | forceUpdate | 到手价/满减试算 | B |
| | ComparePrice | 127 | renderFooter, renderPriceArea, onMount | skuPrice | forceUpdate | 跨平台比价 | B |
| | OrderSummary | 134 | renderFooter, renderOverlay, onMount | skuPrice, quantity, couponApplied | forceUpdate | 订单摘要面板 | B |
| | Coupon | 80 | renderFooter, onMount, onClick | couponApplied | — | 优惠券领取/应用 | A |
| | CouponRecommend | 157 | renderFooter, renderOverlay, renderPriceArea, onMount, onClick | skuPrice, quantity, couponApplied | forceUpdate | 优惠券推荐组合 | B |
| **display** 展示 | Badge | 82 | renderOverlay | — | — | 角标（新品/热卖） | A |
| | UserTag | 57 | renderOverlay | — | — | 用户标签贴纸 | A |
| | Inventory | 72 | ~~renderBadge~~（死） | — | — | 低库存提示 | **C** |
| | Countdown | 120 | renderOverlay | — | timer | 倒计时秒杀条 | B |
| | Review | 94 | renderFooter, onClick | — | — | 评分 + 评论表单 | A |
| **interaction** 交互 | Actions | 117 | renderFooter, onClick | — | — | 加购/收藏按钮组 | A |
| | Hover | 79 | transformProps, onHover | — | — | hover 阴影/缩放 | A |
| | State | 55 | onMount | — | — | 加购/收藏状态回写 | B |
| **infra** 基础 | Analytics | 127 | onMount, onClick, onVisibilityChange | — | IO | 曝光/点击上报（transport 可配） | B |
| | A11y | 75 | onMount, onUnmount | — | listener, global | ARIA 语义 + 键盘导航 | B |
| | Animation | 21 | onMount | — | timer | 进场淡入上移 | **C** |

> 统计：A 级 **9**、B 级 **10**、C 级 **3**，合计 22。
> 另有 4 个字段在 22 个插件里 **0 处使用**：`init` / `destroy` / `dependencies` / `enabled`（纯声明噪音，内核已有 `enabled` 与依赖解析）。

### 2.4 51 个 demo 文件（50 页 + 1 个 `_layout` 骨架）

| 类别 | 数量 | 说明 |
| --- | --- | --- |
| 元信息 | 2 | `Home`、`ReadmeDemo`（`react-markdown` + `remark-gfm`） |
| `_layout/` | 1 | `DemoPage`：51 页共用的外壳（不是路由页） |
| `slots/` 插槽 | 5 | Basic / HeaderOverlay / FooterActions / GalleryVideo / Responsive |
| `layouts/` 版式 | 9 | Vertical / Horizontal / Banner / Grid / Minimal / RightImage / BottomImage / Background / TwoColumn |
| `advanced/` 组合 | 4 | AllInOne / AnimationAnalytics / CountdownPromo / CustomActions |
| `compound/` 复合卡片 | 28 | 4 个版式 + 9 个控件 + 6 个 ui-display + 3 个物流 + 3 个 commerce-combo + sku-compound + state |
| `combine/` 跨包集成 | 2 | `WatermarkDemo`（用 `vane-lazy-image` 的水印插件）、瀑布流集成 |
| **合计** | **51** | 50 个路由页 + 1 个 layout |

现状问题：
- **47 / 51 页 import 的是 npm 包**，本地源码只有库构建在用；
- 页面平均 120 行，产品数据（含 11 条 SKU 变体）**手写在页面里**，同一份 mock 复制多份；
- 无分类导航之外的元信息（没有 `meta`、没有源码块、没有控件），页面之间无法互相引证；
- `App.tsx` 手写 52 条 `<Route>`，路由与页面清单是两份要人工同步的事实。

### 2.5 依赖声明问题

| 包 | 声明位置 | 实际用途 | 处置 |
| --- | --- | --- | --- |
| `react` / `react-dom` ^18.3.1 | **dependencies** | peer | → `peerDependencies: >=16.8`（`check-packages` 会直接 FAIL） |
| `vane-card` ^1.0.7 | **dependencies** | **自引用**，且只服务 demo 的 47 个页面 | 删除；demo 改为 alias 指回 `src` |
| `localforage` ^1.10.0 | dependencies | **全库 0 处引用** | 删除 |
| `vane-lazy-image` ^1.0.14 | dependencies | 仅 `WatermarkDemo` | → devDependencies，升 **2.0.2** |
| `vane-waterfall` ^1.0.5 | dependencies | 仅瀑布流集成页 | → devDependencies，升 **2.0.0** |
| `react-router-dom` ^7.9.3 | dependencies | 仅 demo（仓库其他包用 `^6`） | → devDependencies，统一 `^6` |
| `react-markdown` / `remark-gfm` / `react-syntax-highlighter` | dependencies | 仅 `ReadmeDemo` | → devDependencies（与 lazy-image 一致） |
| `@vane/plugin-core` | 缺失 | 新架构必需 | → `peerDependencies` + dev |

### 2.6 发布产物问题（npm 1.0.8，解包 381KB）

| 现象 | 证据 | 影响 |
| --- | --- | --- |
| 演示资产被打进包 | `dist/404.jpg`（37KB）、`dist/vite.svg`（1.5KB） | `publicDir` 在 lib 模式下没关；包的 381KB 里有 40KB 是演示图 |
| 双格式全量 | `index.es.js` 152KB + `index.umd.js` 100KB | 单入口无按需；UMD 在 ESM 时代收益接近 0 |
| 类型文件占大头 | `dist/components/` 188KB | 逐文件 d.ts，可接受，但说明入口面很宽 |
| `exports` 指向不存在的文件 | `./plugins` → `dist/plugins/index.js`（实际产物无此路径） | 消费者 `import "vane-card/plugins"` 直接 404 |
| 单入口 gzip | 35.66KB | 只用 `CardCore` 的消费者也要付全部 22 插件 + 38 复合组件的钱 |

---

## 三、现状体检基线（可复现）

```bash
cd 旧仓库/vane-card
npx tsc -b                                   # exit=0
npx vite build --mode lib                    # 6.03s，index.es.js 151.83KB / 35.66KB gzip
ls dist                                      # 存在（但含 404.jpg / vite.svg）
ls node_modules/vane-card                     # 已装 1.0.8 → demo 实际跑的是它
npm view vane-card version dist.unpackedSize # 1.0.8 / 380990
```

| 指标 | 实测值 | 说明 |
| --- | --- | --- |
| `tsc -b` 退出码 | **0** | 与 waterfall（exit=2 / 66 错）完全相反 |
| `vite build --mode lib` | **成功**，6.03s，82 modules | 产物可复现 |
| ES 产物 | 151.83KB / **35.66KB gzip** | 单入口全量 |
| UMD 产物 | 97.57KB / 29.91KB gzip | 冗余格式 |
| 单测 | **0** | 无 vitest、无 `test/` |
| `doc.json` | **0 / 22** | 文档生成脚本无法驱动 |
| `as any` / `@ts-ignore` | **84 处**（`compound/index.ts` 38 处，`GalleryPlugin` 6，`PriceCalculator` 5） | 集中在 forwardRef 类型体操与 `context.data` |
| demo 可运行性 | **能跑，但跑的是 npm 1.0.8** | 47/51 个页面文件 import 包名，本地 `src` 未被加载 |
| 包形态 | 单入口（es + umd） | `exports` 有 `./plugins`、`./custom-plugins/*` 但产物路径缺失 |

> 结论：vane-card 有**可复现的产物与类型基线**，迁移可以用「新旧同输入、比输出」的方式对齐；难点不在「能不能跑」，而在**把 129 文件按新规范重新归位，并决定 22 个插件 / 38 个复合组件各自的边界**。

---

## 四、新旧架构差距映射

### 4.1 钩子面：24 声明 / 11 生效 / 13 死

| 通道 | 钩子 |
| --- | --- |
| `executeHook`（8） | onMount、onUnmount、onPropsChange、onStateChange、onClick、onHover、onVisibilityChange、onResize |
| 直调 `plugin.hooks.x`（4） | transformProps、renderHeader、renderOverlay、renderFooter |
| `SlotsContext`（1） | renderPriceArea |
| **死钩子（13）** | 有实现无调用：onCartChange、onWishlistChange、renderBadge<br>纯声明：onSelectionChange、onBeforeDataChange、onDataChange、onError、renderContainer、renderContentWrapper、renderActions、transformData（+ 有调用无实现的 onPropsChange、onStateChange） |

影响面：`AnalyticsPlugin` 的「加购上报」与 `StatePlugin` 的「状态写回」都押在 `onCartChange` / `onWishlistChange` 上 —— **这两条链路今天完全不工作**（埋点里永远收不到 `add_to_cart`）；`InventoryPlugin` 的低库存角标押在 `renderBadge` 上，同样不显示。

> 迁移策略：钩子面从 24 收口到 **15**（内核 9 + 领域 6），其余**不迁**。详见 D3 与第六章。

### 4.2 排序：两套轴 → 一套

| | 旧版 | 新内核 |
| --- | --- | --- |
| 钩子执行顺序 | `PluginManager` 按 `priority` 降序 | 按 `priority` 降序（同向 ✅） |
| 插槽渲染顺序 | **只看 `config.order` 升序**，`priority` 完全不参与 | `config.order` 升序 → `priority` 降序兜底 |
| 后果 | 同一插件在两条链上位置可能不一致（例：`A11yPlugin` priority=100 但 order=0） | 一条规则可预测 |

存量影响：22 个插件里 **22 处**写了 `priority`、**22 处**写了 `config.order`，两者从未对齐过。迁移后插槽顺序会变 —— 必须在 C0 用快照锁住「当前顺序」，再逐个确认「变的是不是想要的」（风险 R3）。

### 4.3 context 结构：靠 `extendContext` 补齐

| 旧 `CardPluginContext` | 新内核 `PluginContext` | 迁移做法 |
| --- | --- | --- |
| `cardId` / `data` | — | 领域字段，`extendContext` 注入（`data` 走 getter 取最新 props） |
| `state` / `setState` | `state` / `setState` | 内核同构；**`setState` 里的钩子副作用要移到 `useEffect`** |
| `size` | — | 由 `onResize` 维护，注入 `size`（getter 读最新） |
| `props` | `props` | 内核提供；必须取 `transformProps` 之后的那份（同 waterfall 的 `transformedPropsRef`） |
| `getContainer` / `containerRef` | `refs.container` | 别名直通 |
| `forceUpdate` / `getSize` | `forceUpdate` | `getSize` 经 coreRef 注入 |
| `bus` | `bus` | 同签名（`on/off/emit/getData/setData`），直接用内核实现 |
| `sharedData: Map` | `shared: Map` | 别名 `sharedData: base.shared`（22 插件零改动） |
| `deviceInfo` | `deviceInfo` | 内核 `detectDevice()` 已缓存，同构 |
| — | `logger` | 新增能力（插件可打结构化日志，替代 `console.log`） |

### 4.4 插槽：6 → 3 + 1 个领域槽

| 旧钩子 | 使用者 | 新方案 |
| --- | --- | --- |
| `renderHeader` | 3（Gallery / Image / Video） | 内核 `composeSlots`（支持 `config.slotPosition: "before" \| "after"`） |
| `renderOverlay` | 8（Badge / UserTag / Countdown / Quantity / OrderSummary / CouponRecommend / Inventory → 改入此槽） | 内核 `composeSlots`（`children` 之后） |
| `renderFooter` | 9（Actions / SKU / PriceCalculator / ComparePrice / Coupon / CouponRecommend / OrderSummary / Review / Quantity） | 内核 `composeSlots` |
| `renderPriceArea` | 3（PriceCalculator / ComparePrice / CouponRecommend） | **领域槽位**：包内实现 `renderDomainSlot("renderPriceArea")`，复用内核排序规则 + 单插件错误边界（D3） |
| `renderContainer` / `renderContentWrapper` / `renderBadge` / `renderActions` | 0 / 0 / 1（死） / 0 | 不迁 |

⚠️ **`renderPriceArea` 的消费方在复合组件里**：`Price` / `CouponBar` / `OrderSummaryPanel` 都调 `usePluginSlot("priceArea")`。也就是说这个槽位是**插件系统 ↔ 复合组件**的接缝，迁移时两边必须同时改，否则价格区会静默变空（风险 R5）。

### 4.5 生命周期与清理语义：从「丢弃」到「执行」

```ts
// 旧 withPlugins（L185-192）：返回值被丢掉
onMount: () => { transformedProps.onMount?.(); pluginManager.executeHook("onMount", pluginContext).catch(() => {}); }
```

新内核语义：**返回函数 = 注册清理，`clear()` 时逆序执行**。迁移后 5 个用 `setupForceUpdateOnBusKeys` 的插件会**真的开始退订**。

需要逐个复核的「清理副作用」：
- `A11yPlugin`：`announceOnFocus` 里的 `focus` 监听是**匿名函数**，今天就没法移除 → 迁移时改成具名并回收；全局 `#a11y-live-region` 也需要引用计数（多卡共用）。
- `AnimationPlugin`：`setTimeout(100ms)` 无清理 → 迁移时改成 `onMount` 返回 `clearTimeout`，并尊重 `prefers-reduced-motion`。
- `AnalyticsPlugin`：`IntersectionObserver` 在 `onMount` 内部自建（**没复用 Core 的 `onVisibilityChange`**），也没 disconnect → 迁移时二选一（D1 决策项）。

### 4.6 注册时机：渲染期 → effect

旧版在**渲染函数体里**判断插件名变化并 `pluginManager.clear() + registerAll()`（L141-151）。React 并发模式下渲染可能被丢弃/重放，注册是副作用，放渲染期会重复注册或注册到「没提交的那次渲染」上。
新内核在 `usePluginRuntime` 的 layout effect 里注册，且按 `name` 做增量 diff。**迁移后 `plugins` 数组身份变化不再触发重注册**（当前 `useMemo(..., [plugins])` 每次父组件重渲染都换新数组 → 每次都 clear + 重注册）。

### 4.7 领域总线协议：必须显式保留

`BusKeys` 7 个键（`sku.selection` / `sku.variant` / `sku.price` / `sku.image` / `quantity` / `coupon.applied` + 消费侧）是 **SKU → Quantity → PriceCalculator → Coupon → OrderSummary** 之间的隐式契约：插件之间不 import，靠总线串起来。

内核 bus 同签名，所以**代码零改动**，但这条协议今天**没有任何文档、没有类型约束、没有测试**：
- 键名写错（`sku.price` → `skuPrice`）不会报错，只会「价格区不更新」；
- 谁也说不清哪个键是「源」哪个是「派生」；
- 迁移后必须写进 `docs/api.md`，并加一条「协议单测」（C3.4）。

### 4.8 其余维度

| 维度 | 旧版 | 新内核 | 结论 |
| --- | --- | --- | --- |
| Bus | 自建 109 行 | `createPluginBus` 同签名 | 删旧实现 |
| Manager | 180 行；`dependencies` 只 `console.warn` 不排序；`init`/`destroy` 0 使用 | 依赖拓扑排序 + 沙箱 + 超时 + `getErrors()` | 升级，无行为回退 |
| 错误隔离 | 每钩子 `try/catch + warn`（只覆盖 `executeHook`，渲染钩子裸奔） | `PluginErrorBoundary` + 沙箱 | 升级：**渲染钩子终于有边界了** |
| 短路语义 | 任意 truthy 返回值都可能影响（`executeHook` 内部判断） | `false` 中断；其他值短路返回 | 更可预期 |
| 注册 | 渲染期副作用 | layout effect + 增量 diff | 升级 |
| 包形态 | 单入口 es + umd，`exports` 有死路径 | 多入口（core / plugins / custom-plugins/* / compound / presets） | 按需引入 |
| 类型来源 | 自带 `PluginManager` / `CardPlugin` | 从 `@vane/plugin-core` 派生 | 与 lazy-image / waterfall 一致 |
| 样式 | 库内 0 CSS，230 处内联 | 需决策（D4） | 迁移才有机会主题化 |

---

## 五、五个待拍板决策

### D1 · 22 个插件是全留，还是合并/删减？

| 方案 | 做法 | 影响 |
| --- | --- | --- |
| **D1-A（推荐）** | **22 个全留**，但 `ImagePlugin` 降级为「`<img>` + `loading` 属性」的**占位实现**，真正的懒加载交给 `vane-lazy-image`（demo 里已有先例） | 插件面完整，职责不重叠；文档需写明「要懒加载请配 vane-lazy-image」 |
| D1-B | 删 `ImagePlugin`（84 行），21 个 | 少一个「没它就没图」的插件，但 `GalleryPlugin` 内部也有 `<img>`，删不干净 |
| D1-C | 删 `AnimationPlugin`（21 行，最弱）+ `ImagePlugin`，20 个 | 少维护两处，但进场动画是卡片刚需 |

> 推荐 D1-A。附带条件：`AnimationPlugin` 必须重写（尊重 `prefers-reduced-motion`、`onMount` 返回 `clearTimeout`），否则它就只是个「无清理的 setTimeout」。

### D2 · 38 个复合组件放哪？

| 方案 | 做法 | 代价 |
| --- | --- | --- |
| **D2-A（推荐）** | 同包 `src/compound/`，入口 `./compound` 独立子路径；默认入口不导出它（避免 Core 用户被迫付费） | 单包多入口，`sync-exports` 多生成一条 |
| D2-B | 拆成独立包 `vane-product-card`（依赖 `vane-card`） | 多一个包要发版、要配 docs，收益是边界清晰 |
| D2-C | 不迁，只保留 Core + 插件 | 丢掉 2772 行里最有展示价值的部分 |

> 推荐 D2-A。理由：38 个组件全靠 `ProductCard` 的 context 串起来，跨包会遇到「context 在 A 包、消费方在 B 包」的版本地狱；而子路径导出已经能解决「不想要就别引」。**注意**：`Price` / `CouponBar` / `OrderSummaryPanel` 依赖 `usePluginSlot("priceArea")`，所以 `./compound` 必须同时导出槽位实现（见 D3）。

### D3 · `renderPriceArea` 领域槽位怎么落地？

| 方案 | 做法 | 代价 | 风险 |
| --- | --- | --- | --- |
| **D3-A（推荐）** | 包内实现 `renderDomainSlot(plugins, ctx, hookName)`：复用内核的排序规则（order 升序 → priority 降序）+ 逐插件 `PluginErrorBoundary`，但**内核的 `SlotHookName` 不动** | 新增约 30 行领域工具 | 低；内核保持通用 |
| D3-B | 把 `renderPriceArea` 加进内核 `SlotHookName` 联合类型 | 内核改 2 行 | 通用内核被电商概念污染；后续每个包都想加自己的槽 |
| D3-C | 保留旧 `SlotsContext`，只把数据源换成 `orderedPlugins` | 少改 | 保留了一个「和内核平行的第二套插槽机制」，正是 4.2 排序混乱的根源 |

> 推荐 D3-A。

### D4 · 样式策略：内联还是 class？

| 方案 | 做法 | 代价 | 收益 |
| --- | --- | --- | --- |
| D4-A | 全内联（维持现状） | 0 | 零配置，但**无法主题化**、无法 `:hover`/`:focus-visible`、SSR 内联样式体积大 |
| **D4-B（推荐）** | 结构性样式出 class（`vc-` 前缀）+ CSS 变量做主题（`--vc-fg` / `--vc-accent` / `--vc-radius` …），动态值（颜色值、宽度）仍走内联 `style`；产物额外提供 `style.css`（可选导入，与 `react-upload-indexeddb` 的做法一致） | 一次性改写 230 处内联 + 新增约 300 行 CSS | 可主题化、可覆盖、体积更小（class 复用） |
| D4-C | 混合但不出 CSS 文件（class + 内联，靠用户自己写样式） | 中 | 半成品，用户要自己补样式表 |

> 推荐 D4-B，但**分两步**：C4.1 先原样迁入（内联不动），C4.3 再做样式抽取并单独提交 —— 否则「迁移」和「重设计」混在一起，出问题无法归因。

### D5 · demo 形态

| 方案 | 做法 | 产出 |
| --- | --- | --- |
| D5-A | 复刻 51 页 | 51 个孤立页，无代码块、无控件、mock 重复，验证价值低 |
| **D5-B（推荐）** | 三视角，与 waterfall 对齐：**插件工坊**（22 插件按 4 组勾选实时装配 + 生成代码）+ **场景库**（8–10 个真实电商场景，一卡两栏两份源码）+ **逐项示例**（22 插件页 + 12 复合组件页 + 3 Core 页 ≈ 37 页） | 3 个主区域，一套 `DemoPage` 骨架驱动 |

推荐 D5-B。可复刻的电商场景候选：商品列表卡（图/价/角标）、SKU 选择联动、秒杀倒计时、优惠券叠加到手价、订单摘要、比价、低库存告警、视频商详卡、评论墙、移动端横滑卡。

---

## 六、逐插件迁移分级

### A 级 · 近零改动（9 个）

纯渲染 / 纯 `transformProps`，不碰总线、不碰清理。

| 插件 | 迁移动作 |
| --- | --- |
| Hover / Responsive | 换 import；`transformProps` 原样（Responsive 的 `onMount` 只读一次容器宽，保留） |
| Badge / UserTag | `renderOverlay` 迁内核插槽；把硬编码色值改 CSS 变量（D4-B 时） |
| Actions / Review / Coupon | `renderFooter` + `onClick` 原样；`Coupon` 的 `onMount` 无返回值，安全 |
| Video / Gallery | `renderHeader` 原样；`Gallery` 的 timer 补清理 |

### B 级 · 需改造（10 个）

| 插件 | 改造点 |
| --- | --- |
| SKU / Quantity | 总线读写原样，但 `onMount` 里的 `setupForceUpdateOnBusKeys` **必须靠返回值退订**（今天泄漏）；Quantity 的 `renderIn` 配置项 0 处读取 → 删或实现 |
| PriceCalculator / ComparePrice / OrderSummary / CouponRecommend | 同上（`forceUpdate` 泄漏 4 处）+ `renderPriceArea` 走 D3-A 的领域槽 |
| Countdown | `timer` 必须挂清理；倒计时结束要停止重排（今天 `setInterval` 一直在跑） |
| State | `onMount`/`onCartChange`/`onWishlistChange`：后两个死钩子要么接线（由 `setState` 触发）要么删；状态写回 localStorage 需 SSR 安全 |
| Analytics | 自己建 IO 与 Core 的 `onVisibilityChange` 重复 → 改为消费 `onVisibilityChange`；`onCartChange` 死钩子同上 |
| A11y | `focus` 监听匿名无法移除 → 具名 + 清理；全局 `#a11y-live-region` 加引用计数 |

### C 级 · 需重写（3 个）

| 插件 | 问题 | 处置 |
| --- | --- | --- |
| Image | 与 `vane-lazy-image` 职责重叠；`errorFallback` 分支写错（fallback `div` 恒为 `display:none`，`onError` 里只把 img 藏了，fallback 永远不显示） | D1-A：降级为占位实现 + 修 fallback；或 D1-B 删除 |
| Inventory | 全部逻辑押在死钩子 `renderBadge` 上 → **角标从不显示** | 改走 `renderOverlay`（定位能力本来就属于 overlay） |
| Animation | `setTimeout` 无清理、无 `prefers-reduced-motion`、直接改 `style` 与 D4-B 的 class 冲突 | 重写：`onMount` 返回 `clearTimeout`；`matchMedia` 判定降级为「不做动画」 |

---

## 七、迁移后目标结构

```
packages/vane-card/
├── src/
│   ├── index.ts                                # .            完整包（Core + withPlugins + 类型 + 插件桶）
│   ├── entries/core.ts                         # ./core      仅 CardCore + 领域类型（预算 ≤5KB gzip）
│   ├── entries/plugins.ts                      # ./plugins   领域钩子类型 + withPlugins + 领域槽位
│   ├── components/CardPlugin/
│   │   ├── CardCore.tsx                        # 迁入，props / ref 契约不变
│   │   ├── plugins/
│   │   │   ├── types.ts                        # 15 个钩子（从 @vane/plugin-core 派生）
│   │   │   ├── withPlugins.tsx                 # usePluginRuntime + extendContext + 钩子桥接
│   │   │   └── slots.ts                        # renderDomainSlot("renderPriceArea")
│   │   └── BusKeys.ts                          # 总线协议（7 键 + 类型）
│   ├── compound/                               # 38 个复合组件 + ProductCard（D2-A）
│   ├── custom-plugins/<Xxx>/{doc.json,create.ts,index.ts}   # 22 个，4 组
│   ├── styles/                                 # D4-B：CSS 变量 + vc- class（构建出 style.css）
│   └── presets/{product-card,sku-flow,checkout}/index.ts     # 3 个配方
├── demo/                                       # 工坊 + 场景 + 逐项（D5-B）
├── test/                                       # ≥30 单测
└── package.json                                # peer: @vane/plugin-core + react/react-dom
```

---

## 八、风险清单

| # | 风险 | 等级 | 影响 | 缓解 |
| --- | --- | --- | --- | --- |
| R1 | demo 一直跑 npm 包，**本地源码的行为从未被验证** | 高 | 指回 `src` 后可能冒出未知类型/运行错误 | C1 第一件事就是 alias 回 `src` 并跑 `tsc` + 逐页冒烟，问题尽早暴露 |
| R2 | 清理语义从「丢弃」变「执行」 | 高 | 5 个插件的 bus 退订、A11y 的监听回收突然生效，可能暴露「初始化依赖从不清理」的假设 | 逐个复核 + 单测断言「卸载后 bus 监听数归零」 |
| R3 | 排序统一（order → priority 兜底） | 中 | 价格区/页脚顺序变化 | C0 拍下当前顺序快照，C2 逐项对比差异并确认 |
| R4 | 样式从内联改 class（D4-B） | 中 | 调用方现有的内联覆盖会失效 | 分两步：先原样迁入，再单独提样式；CSS 变量保留覆盖能力 |
| R5 | `renderPriceArea` 跨「插件 ↔ 复合组件」接缝 | 中 | 价格区静默变空，且没有报错 | 单测：装 3 个价格插件 → 渲染 `Price` → 断言 3 段内容都在 |
| R6 | 总线协议（7 键）无文档、无类型 | 中 | 插件间联动静默失效 | 协议写进 `docs/api.md` + 协议单测 + `BusKeys` 类型约束 |
| R7 | 复合组件 84 处 `as any` 严格化 | 中 | 类型错误批量爆发 | 分文件推进，先修 `compound/index.ts` 的 38 处（forwardRef 体操可换成泛型组件） |
| R8 | 单入口 35.66KB gzip | 低 | 按需引入没落地 | 多入口 + `check-packages` 预算（core ≤5KB / 完整 ≤36KB） |

---

## 九、验收口径

1. `pnpm --filter vane-card build` 通过，`exports` 全部指向真实产物（`sync-exports` 生成，**不允许再出现 `./plugins` 这种死路径**）；
2. `typecheck` **0 错**、`lint` 0 error、`test` **≥30 通过**（22 插件表驱动 + 装配层 + 总线协议 + 复合组件冒烟）；
3. `node scripts/generate-plugin-docs.mjs` 输出 **22 行**目录表，4 个分组无遗漏；
4. **22 / 22 插件在 demo 中真实装配运行过**（覆盖闸门脚本化），每个都有 `doc.json`；
5. 体积：`core` ≤ **5KB gzip**、完整入口 ≤ **36KB gzip**（不得劣于当前 35.66KB）；
6. `npm pack` 只含 `dist` + `README.md` + `package.json`，**不含 `404.jpg` / `vite.svg`**；
7. demo 逐页几何体检 0 命中：卡片未溢出容器、关键区块（图/标题/价格/操作）可见且尺寸 > 0、无 console error；
8. 发布 `vane-card@2.0.0`，README 首屏为 `npm install vane-card` + 30 秒可跑示例。
