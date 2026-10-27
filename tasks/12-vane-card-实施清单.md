# 12 · vane-card 实施清单（阶段 / 任务 / 验收门）

> 用法：每完成一项打勾；**每个阶段末尾有验收门，不过门不进下一阶段**。
> 关联：事实基线与决策项见 `tasks/11-vane-card-迁移分析.md`；同类迁移的实操记录见 `tasks/08-vane-waterfall-实施清单.md`
> 前置状态：`archive-plugins/vane-card` 只读快照（未跟踪进主仓，自带 `.git`），**可构建、类型全绿**（`tsc -b` exit=0、lib build 6.03s），但 demo 跑的是 npm 上的 1.0.8

---

## 阶段总览

| 阶段 | 目标 | 主要产出 | 依赖 | 相对量 |
| --- | --- | --- | --- | --- |
| **C0** | 决策拍板 + 基线固化 | D1–D5 结论、4 份行为快照 | — | S |
| **C1** | 包骨架 + Core 迁入 + demo 指回源码 | `packages/vane-card/` 可构建、demo 跑本地源码 | C0 | M |
| **C2** | 插件系统替换 | 自建系统（1154 行）删除，接 `@vane/plugin-core` | C1 | M |
| **C3** | 22 插件分批迁入 | A 9 / B 10 / C 3 + 22 份 `doc.json` + 3 配方 | C2 | L |
| **C4** | 复合组件迁入 + 样式抽取 | 38 个 `compound/` + `vc-` class + `style.css` | C2 | L |
| **C5** | demo 重建（三视角） | 工坊 + 场景 + 逐项示例 | C3, C4 | L |
| **C6** | 文档 / README / 体积 / 发布 | docs 四件套、changeset、`2.0.0` | C5 | S |

> 量级口径：S ≈ 半天内、M ≈ 1–2 个专注时段、L ≈ 需要分批推进（不做日历承诺，只看文件数与风险）。

---

## 基线（C0 固化，后续阶段以此为准）

| 指标 | 旧仓实测 | 复现命令 |
| --- | --- | --- |
| 可构建性 | **可构建**：`tsc -b` **exit=0**；`vite build --mode lib` 6.03s / 82 modules | `cd archive-plugins/vane-card && npx tsc -b && npx vite build --mode lib` |
| 产物体积 | ES 151.83KB / **35.66KB gzip**；UMD 97.57KB / 29.91KB gzip | 见上（building 输出） |
| 源码规模 | **13174 行 / 129 文件**：core 258、自建插件系统 1154、22 插件 2444、compound 2772、demo 6126、壳与入口 420 | `find src -name "*.ts*" \| xargs cat \| wc -l` |
| 插件数 | **22**（A 9 / B 10 / C 3） | `ls src/components/CardPlugin/custom-plugins` |
| 钩子面 | 声明 **24**，真生效 **11**，有实现无调用 **3**，纯声明 **10** | 见 11 · 4.1 |
| 测试 | **0 个** | — |
| 插件文档 | **0 个** `doc.json` | — |
| 类型逃逸 | `as any` / `@ts-ignore` **84 处**（`compound/index.ts` 38） | `grep -rn "as any\|@ts-ignore" src \| wc -l` |
| demo 可运行性 | **能跑，但跑的是 npm 1.0.8**：47/51 个页面文件 `import from "vane-card"`，`node_modules/vane-card` 已装 | `grep -rl 'from "vane-card"' src/pages \| wc -l` |
| 发布包 | `vane-card@1.0.8`，解包 **381KB**（含 `404.jpg` 37KB + `vite.svg`） | `npm view vane-card dist.unpackedSize` |

> 与 waterfall 的关键差异：**没有「不可运行」这一层障碍**，所以不需要「把旧代码转写成纯函数来取证」，
> 直接对现有 `src` 做黑盒行为快照（渲染 DOM 片段 + 插槽顺序 + 总线事件序列）即可。

---

## C0 · 决策拍板与基线固化

- [x] **C0.1 拍板 D1**：**D1-A 全留**（Image 降级为占位实现，文档注明「要懒加载请用 vane-lazy-image」）
- [x] **C0.2 拍板 D2**：**D2-A 同包 `src/compound` + `./compound` 子路径**（入口不默认导出，避免 Core 用户被迫付费）
- [x] **C0.3 拍板 D3**：**D3-A 包内 `renderDomainSlot`**（内核 `SlotHookName` 不动）
- [x] **C0.4 拍板 D4**：**D4-B class + CSS 变量 + 可选 style.css**（分两步：C4.1 原样迁、C4.3 单独抽）
- [x] **C0.5 拍板 D5**：**D5-B 三视角**（工坊22 + 场景8–10 + 逐项≈37）
- [x] **C0.6 固化 4 份行为快照**（产物落 `test/fixtures/card-snapshots.json`，由 `test/snapshots.base.test.tsx` 生成且断言通过）
  - [x] **插槽顺序快照**：5 段合成顺序（header-before → children → overlay → header-after → footer），排序仅认 `config.order` 升序（`priority` 不参与渲染）
  - [x] **价格区合成快照**：`renderPriceArea` 由 `SlotsContext` 单槽实现，参与者 PriceCalculator/ComparePrice/CouponRecommend，按 `config.order` 升序
  - [x] **总线协议**：扫描源码得到 6 键的「源/消费方」表（SKU 写 selection/variant/price/image；Quantity 写 quantity 读 skuVariant+quantity；PriceCalculator/ComparePrice/CouponRecommend/OrderSummary 读 sku.price；Coupon/CouponRecommend 写 coupon.applied）—— 落盘供 C3.4 文档化
  - [x] **清理计数**：5 个消费者 `onMount` 注册 `bus.on` 共 **12** 次、返回 **5** 个清理函数；`offIfManuallyCleaned=12`（证明泄漏可修）；旧 `withPlugins` 丢弃返回值 → 卸载时 `off=0`（R2 缺陷基线）
- [x] **C0.7 记录当前 gzip 基线**：新构建 `dist/index.js` **28.13KB gzip**（旧仓 1.0.8 测 35.66KB；新构建更低，以 28.13KB 为不得劣化基线；C2 接入 plugin-core 后可能略升，仍须 ≤36KB）

**验收门 C0**：D1–D5 结论落纸；4 份快照可复现；gzip 基线入表。

---

## C1 · 包骨架 + Core 迁入 + demo 指回源码

### C1.1 骨架与依赖

- [ ] `packages/vane-card/` 目录（复制 `packages/templates/plugin-component` 骨架，与 lazy-image / waterfall 同构）
- [ ] `package.json`：
  - [ ] `peerDependencies`: `@vane/plugin-core: workspace:*`、`react >=16.8`、`react-dom >=16.8`
  - [ ] `dependencies`: 空（**删 `localforage` 0 引用、删自引用 `vane-card`**）
  - [ ] `devDependencies`: `@vane/{build-config,eslint-config,tsconfig,vitest-config}`、react 18、vite 5、vitest 2、`vane-lazy-image@workspace:*`、`vane-waterfall@workspace:*`（后两个仅 demo 用）
  - [ ] `vane.sizeBudgetKb: 36`、`vane.coreSizeBudgetKb: 5`
  - [ ] `files: ["dist"]`、`sideEffects: false`、`scripts` 对齐（`dev/build/build:demo/typecheck/test/lint/sync:exports`）
- [ ] `tsconfig.json` / `tsconfig.lib.json` / `vite.config.ts`（lib 模式 + dts）/ `vitest.config.ts` / `eslint.config.js`
- [ ] **关掉 lib 模式的 `publicDir`**（`publicDir: false`），并在 C6 用 `npm pack` 复核不再含 `404.jpg` / `vite.svg`

### C1.2 Core 迁入

- [ ] `src/components/CardPlugin/CardCore.tsx` 从旧仓迁入（258 行），改动仅限：
  - [ ] import 路径（`../plugins/types` → 本地 `./plugins/types`）
  - [ ] 去掉 `ref={containerRef as React.LegacyRef<HTMLDivElement>}` 的类型逃逸（改成 `MutableRefObject` 收窄）
  - [ ] `IntersectionObserver` 的 effect 依赖里 **不能再放 `onVisibilityChange`**（旧版每次渲染换新函数 → 每次 hover 都重建 IO）：改为 ref 存最新回调 + `[]` 依赖
  - [ ] `containerRefExternal` 双通道保留（`withPlugins` 靠它拿容器）
  - [ ] 清理路径核对：IO 在 effect 清理里 `disconnect()`；`onMount`/`onUnmount` 的 effect 保持 `[]`

### C1.3 demo 指回源码（**本阶段最重要的一步**）

- [ ] `demo/vite.config.ts`：`createDemoConfig` + 包名 alias（`vane-card` / `/core` / `/plugins` / `/custom-plugins/*` / `/compound` → `src`），让场景源码按消费者视角写 import
- [ ] `tsconfig.json` 的 `paths` 同步（仅服务 demo）
- [ ] 把旧 51 个页面文件原样搬进 `demo/src/legacy/`（**只作为冒烟素材**，C5 会重写），跑一次 `tsc` + 逐页冒烟，把暴露的问题记进 C1 验收记录
- [ ] 冒烟脚本：51 个路由逐个打开，断言「卡片容器存在 + 至少 1 张卡 + 无 console error」，输出问题页清单

### C1.4 单测（第一批）

- [ ] `test/core-render.test.ts`：`cardId` / `data` / `renderContent` / `padding`（数字 + 四边对象）/ `layout` class
- [ ] `test/core-ref.test.ts`：`getContainer` / `getSize` / `forceUpdate` 契约
- [ ] `test/core-visibility.test.ts`：IO 触发 `onVisibilityChange`（mock IO）；**重渲染不重建 IO**（断言 `new IntersectionObserver` 只调一次）

**验收门 C1**：`build` 产出 `dist` 且 `exports` 有效；`typecheck` 0 错；`test` ≥10 通过；51 个页面文件冒烟清单产出（问题逐条登记，不要求本阶段清零）；`publicDir` 关闭后 `dist` 里没有演示资产。

---

## C2 · 插件系统替换（删 1154 行，接内核）· ✅ 已完成（commit `838f267`）

- [x] **C2.1 删除** `plugins/{PluginBus.ts,PluginManager.ts,SlotsContext.tsx}`（保留并重写 `types.ts` / `withPlugins.tsx`；`BusKeys.ts` / `utils/` 保留）
- [x] **C2.2 重写 `plugins/types.ts`**：钩子面 **24 → 15**
  - [x] 内核 9 个（直接派生，不重复声明）：`onMount` `onUnmount` `onPropsChange` `onError` `transformProps` `transformData` `renderOverlay` `renderHeader` `renderFooter`
  - [x] 领域 6 个：`onClick` `onHover` `onVisibilityChange` `onResize` `onStateChange` `renderPriceArea`
  - [x] 删除 9 个：`onSelectionChange` `onCartChange` `onWishlistChange` `onBeforeDataChange` `onDataChange` `renderContainer` `renderContentWrapper` `renderBadge` `renderActions`
  - [x] `CardPluginContext` = 内核 `PluginContext` & 领域字段（`cardId` / `data` / `size` / `getContainer` / `getSize` / `sharedData` / `bus`）
- [x] **C2.3 重写 `plugins/withPlugins.tsx`**（参照 waterfall 同名文件）：
  - [x] `usePluginRuntime({ plugins, props, containerRef, extendContext })`
  - [x] `extendContext` 注入：`cardId` / `data`（**getter 取 `transformProps` 之后的那份**）/ `size`（getter）/ `getContainer` / `getSize` / `sharedData: base.shared`
  - [x] Core 回调 → 钩子链：`onMount` / `onUnmount` / `onClick` / `onHover` / `onVisibilityChange` / `onResize`
  - [x] 渲染插槽：`composeSlots`（before-header → children → overlay → after-header → footer），替换旧的手写五段
  - [x] **`onMount` 返回值必须交给内核**（不再 `.catch(() => {})` 丢弃）—— 这是 R2 的核心修复
  - [x] **`setState` 里的 `onStateChange` 移到 `useEffect`**（state 变化后触发），updater 保持纯函数
- [x] **C2.4 领域槽位（D3-A）**：新增 `plugins/slots.tsx`
  - [x] `renderDomainSlot(plugins, context, hookName)`：`config.order` 升序 → `priority` 降序 + 逐插件 `PluginErrorBoundary`
  - [x] `usePluginSlot("priceArea")` 改为读 `orderedPlugins`（签名不变，复合组件零改动）
- [x] **C2.5 排序统一**：旧版「`order` 管位置、`priority` 管钩子顺序」两套轴，新内核统一为
  `order` 升序定位 → `priority` 降序 tiebreak；C0.6 快照的五段顺序未变
- [x] **C2.6 单测（第二批）**：26 用例 / 6 文件
  - [x] 钩子返回 `false` 中断链；返回其他值短路
  - [x] `onMount` 返回的清理函数在卸载时**被执行一次**
  - [x] **卸载后 `bus.off` 计数 == `bus.on` 计数**（R2 的回归锁，实测 on=12 / off=12）
  - [x] `renderOverlay` 输出在 `container.contains()` 之内
  - [x] 单个插件渲染抛错只丢自己那一段（`PluginErrorBoundary`）
  - [x] `renderPriceArea` 装 3 个插件 → 输出 3 段且顺序符合 order/priority 规则（R5）

**验收门 C2**：自建插件系统 3 个文件已删；`typecheck` 0 错；`test` ≥18 通过（实到 26）；11 · 4.1–4.8 每一条差异都有对应断言或说明；C0.6 的「清理计数」快照从 `on=N/off=0` 变为 `on=N/off=N`（12/12）。

**C2 过程中额外发现并修掉的真实缺陷**（不在原计划里，都是旧代码遗留）：
1. `CountdownPlugin.renderOverlay` 内 `React.useMemo`、`ReviewPlugin.renderFooter` 内 `React.useState` —— hooks 写在「渲染期被调用的普通函数」里，启停插件会改变父组件 hook 数量。已抽成模块级组件，并加 `test/hooks-safety.test.tsx` 行为回归。
2. `SavingsBadge` 用 `data?.oldPrice!`（对可选链做非空断言），字段缺失时文案出 `NaN`；改为先兜底再相乘。
3. **打包陷阱**：`@vane/plugin-core` 未发布 npm（registry 404）却挂在 `peerDependencies`，且构建时已内联；消费方安装会 `Cannot find module`。已降为 `devDependencies`，并把 `PluginBus` 改为包内声明，公开 `d.ts` 不再 import 内核包名（waterfall 仍是旧写法，属同类隐患，留待其会话处理）。
4. 测试基础设施：内核 `executeHook` 是 async，同步断言会读到「钩子还没跑」的假象 —— `test/helpers.tsx` 增 `flush()`；快照测试改为默认**比对**、`UPDATE_SNAPSHOT=1` 才写盘，避免基线被静默覆盖。

---

## C3 · 22 个插件分批迁入

> 统一动作（每批都要做）：换 import → 补 `doc.json`（name / description / since / tags / config / example / features / useCases / notes）→ `index.ts` 挂 `.meta` → 桶文件按 4 组注释。

### C3.1 A 级 9 个（近零改动）

- [ ] 写 `scripts/migrate-card-plugins.mjs`（参照 `scripts/migrate-plugins.mjs`）：路径改写 / `CardPlugin` → 领域类型 / CRLF→LF
- [ ] display 3：Badge、UserTag、Hover
- [ ] media 3：Video、Gallery（timer 补清理）、Responsive
- [ ] buy 2：Coupon、Review；interaction 1：Actions
- [ ] 每个插件 `doc.json` 的 `config` 从源码类型 + 工厂默认值抽取，一句话描述人工校对

### C3.2 B 级 10 个（逐个，需改造）

- [ ] **总线 6 个**：`SKU`（源，只写不订阅）+ 5 个消费者（Quantity、PriceCalculator、ComparePrice、CouponRecommend、OrderSummary）
  - [ ] `setupForceUpdateOnBusKeys` 的返回值改为 `onMount` 返回值（退订真正发生）
  - [ ] Quantity 的 `renderIn` 配置项：**要么实现（决定渲染在 footer 还是 overlay），要么从 config 类型删除**（今天 0 处读取）
- [ ] Countdown：`setInterval` 挂清理；倒计时归零后停止计时
- [ ] State：`onCartChange` / `onWishlistChange` 死钩子 → 由 `setState` 差分触发；localStorage 写回加 `typeof window` 判定
- [ ] Analytics：删掉自建 IO，改消费 `onVisibilityChange`；`onCartChange` 同上
- [ ] A11y：`focus` 监听具名化 + 回收；全局 `#a11y-live-region` 引用计数

### C3.3 C 级 3 个（重写）

- [ ] Image（D1-A → 降级为占位实现）：修 `errorFallback` 分支（fallback 恒 `display:none` 的真 bug）；doc 写明「要懒加载请用 vane-lazy-image」
- [ ] Inventory：`renderBadge` → `renderOverlay`（低库存角标终于会显示）
- [ ] Animation：`onMount` 返回 `clearTimeout`；`prefers-reduced-motion: reduce` 时直接跳过动画

### C3.4 桶文件、配方、总线协议

- [ ] `custom-plugins/index.ts`（22 个导出，按 media / buy / display / interaction / infra 分组注释）
- [ ] `presets/product-card`（Image + Badge + Hover + Actions + State）
- [ ] `presets/sku-flow`（SKU + Quantity + PriceCalculator + Inventory）
- [ ] `presets/checkout`（CouponRecommend + OrderSummary + ComparePrice + Analytics）
- [ ] **总线协议文档化**（R6）：`BusKeys` 7 键的「源 / 派生 / 消费方」表格写进 `docs/api.md`
- [ ] **协议单测**：SKU 选规格 → `sku.price` / `sku.image` 变化 → PriceCalculator 输出变化（断言键名拼错会失败）

### C3.5 单测（第三批）

- [ ] 每个插件：工厂返回 `{ name, hooks, meta }`、`doc.json` 可解析、`config` 默认值正确（22 × 1 断言，表驱动）
- [ ] 3 个端到端：SKU 联动（SKU + Quantity + PriceCalculator）、优惠叠加（Coupon + CouponRecommend + OrderSummary）、曝光上报（Analytics）

**验收门 C3**：`doc.json` **22/22**；桶文件 22 导出、5 组无遗漏；`docs:plugins` 生成 22 行；`typecheck` 0 错；`test` ≥30 通过；3 个配方可跑；**22/22 插件在 demo 中至少被装配一次**（脚本化覆盖闸门）。

---

## C4 · 复合组件迁入 + 样式抽取

### C4.1 原样迁入（不动样式）

- [ ] `src/compound/`：38 个组件 + `ProductCard.tsx` + `index.ts`（2772 行）
- [ ] 修 `import ... from "./components/QuantityStepper.tsx"` 的显式扩展名（lib 构建会挂）
- [ ] `compound/index.ts` 的 **38 处 `as any`**：逐个换成泛型组件签名（forwardRef + 泛型用 `as unknown as` 一次性收窄，不留 `any`）
- [ ] `ProductCard` 的 `data?: any` → 泛型 `ProductCardProps<T>`

### C4.2 与插件系统的接缝

- [ ] `Price` / `CouponBar` / `OrderSummaryPanel` 的 `usePluginSlot("priceArea")` 改读 D3-A 的领域槽（签名不变）
- [ ] 单测：装 3 个价格插件 → 渲染 `<ProductCard>` → 断言 3 段内容都在（R5）

### C4.3 样式抽取（D4-B，独立提交）

> 单独一步做，与 C4.1 分开提交，出问题能归因（R4）。

- [ ] `src/styles/tokens.css`：CSS 变量（`--vc-fg` / `--vc-fg-dim` / `--vc-bg` / `--vc-accent` / `--vc-border` / `--vc-radius` / `--vc-gap` …）
- [ ] `src/styles/components.css`：`vc-` 前缀 class（38 个组件 + CardCore 容器 + 各插槽区）
- [ ] 230 处内联 `style` 逐条归位：**结构性**（padding/flex/字号/边框/圆角）→ class；**动态值**（颜色值、计算宽度、用户传入）→ 保留内联
- [ ] 硬编码色值清点：`#f5f5f5` / `#fff` / `#000` / `rgba(0,0,0,.x)` → 变量，并核对暗色可读性
- [ ] 构建产出 `dist/style.css`，`exports` 暴露 `./style.css`
- [ ] 文档写明「不引 `style.css` 会怎样」（无样式但可用），并在 demo 里做一次「不引样式」的对照页

**验收门 C4**：`compound` 全部迁入且 0 处 `as any`；`tsc` 0 错；`test` 增加复合组件冒烟（≥33）；产物体积不劣化（C0.7 基线）；`style.css` 可单独引入且不引也能渲染。

---

## C5 · demo 重建（D5-B 三视角）

### C5.1 骨架

- [ ] `demo/index.html`（内联 SVG favicon + 首屏底色内联防闪白）+ `demo/vite.config.ts`（`createDemoConfig`，root 为包根、base `./`）
- [ ] **包名 alias**：`vane-card` / `/core` / `/plugins` / `/custom-plugins/*` / `/compound` → `src`（C1.3 已做，这里复核）
- [ ] HashRouter + 三入口（`/` 总览、`/plugins` 工坊、`/scenes` 场景库、`/demos` 逐项）+ 页面级 `PageBoundary`
- [ ] 视觉沿用 waterfall 的「深色编辑部 / 规格板」版式（已成熟，不重做）

### C5.2 插件工坊（`#/plugins`）

- [ ] `import.meta.glob("/src/custom-plugins/*/doc.json")` 驱动 4 组勾选
- [ ] 勾选即实时装配（`useMemo` 按勾选集合缓存组件类型，避免每勾一下整块重挂载）
- [ ] **冲突提示**：Image↔vane-lazy-image / Transition… → 卡片的冲突清单为：Image↔懒加载包、Countdown↔Animation（都在改容器过渡）、A11y↔自定义 aria、Quantity↔SKU（数量上限依赖规格库存）
- [ ] 点插件名展开 `doc.json`：配置表 + 能做/适合/注意

### C5.3 场景库（`#/scenes`，8–10 个）

- [ ] 商品列表卡（图/价/角标/hover）/ SKU 联动商详 / 秒杀倒计时 / 优惠券叠加到手价 / 订单摘要 / 比价 / 低库存告警 / 视频商详 / 评论墙 / 移动端横滑卡
- [ ] 一卡两栏 + 下方通栏代码：**完整版**用 `?raw` 读同一个 `.tsx`；**最小装配版**由 `meta.plugs` 现场生成（复用 `scenarios/minimal.ts` 思路）
- [ ] `scripts/verify-scenarios.mjs` 适配卡片：slug↔文件名、plugs↔源码双向、编号连续、侧栏计数、**22 插件覆盖率**

### C5.4 逐项示例（`#/demos`，≈37 页）

- [ ] 数据驱动：每页只写 `meta`（plugs / props / controls / note）+ 装配函数，骨架由 `DemoPage` 提供
- [ ] 22 个插件页 + 12 个复合组件页 + 3 个 Core 页（基础 / Ref 方法 / 生命周期）
- [ ] `meta.props` 与 `plugs[].cfg` 支持 `{{key}}` 占位（拖控件 = 改代码）

### C5.5 体检闸门（替代 CDP 截图）

- [ ] 新增 `scripts/audit-cards.mjs`（参照 `audit-demos.mjs`）：
  - [ ] 断言：卡片容器存在 / 关键区块（图、标题、价格、操作）尺寸 > 0 / 图片 `naturalWidth > 0`（防破图）/ 卡片未溢出容器 / 无 console error
  - [ ] 结果落表：页数 × 命中数，目标 **0 命中**
- [ ] 复用 `audit-controls.mjs` 思路：逐页推滑杆比对「关键区块文本/位置指纹」，抓「控件没接上」

**验收门 C5**：`vite build --config demo/vite.config.ts` 通过；场景体检 0 命中；每卡有代码块 + 复制按钮；22/22 插件被装配过；37 页逐项示例全部可打开。

---

## C6 · 文档 / README / 体积 / 发布

- [ ] **C6.1** `docs/components/vane-card/` 四件套（替换「迁移中」占位）
  - [ ] `index.md`：卖点 + 安装 + 30 秒示例 + 导入体积表 + 插件速览 + 1.x 迁移差异表 + 演示站入口
  - [ ] `api.md`：`CardCoreProps` / `CardCoreRef` / 插件 context 全字段 / **15 个钩子分四类** / **总线协议 7 键表格**
  - [ ] `plugins.md`：5 组 × 22 插件，逐个给 priority、配置表、坑位说明 + 「谁和谁不能一起装」
  - [ ] `recipes.md`：3 个配方 + 组合经验（价格区只有一个决策者 / 总线改键必同步）
- [ ] **C6.2** README：`node scripts/sync-readme.mjs` 生成，首屏为安装 + 30 秒上手
- [ ] **C6.3** `docs/guide/decisions.md` 补 ADR（钩子面 24→15、priceArea 走包内领域槽、样式走 CSS 变量）
- [ ] **C6.4** `.changeset/vane-card-200.md`（major）：破坏性变更 + 新增/修复
- [ ] **C6.5** `npm pack --dry-run`：只含 `dist` + `README.md` + `package.json`；**不含 `404.jpg` / `vite.svg`**
- [ ] **C6.6** 回归：`eslint` 0 error、`tsc --noEmit` 0 错、`vitest` 全绿、`check-packages` core ≤5KB / 完整 ≤36KB、`vitepress build` 通过
- [ ] **C6.7** 发布 `vane-card@2.0.0`（发布动作单独确认）

**验收门 C6**：`check-packages` 全绿；`docs:build` 通过；README 由 docs 同步生成；pack 干净；changeset 就位。

---

## 验收门汇总

| 阶段 | 硬指标 |
| --- | --- |
| C0 | D1–D5 结论落纸 + 4 份快照可复现 + gzip 基线入表 |
| C1 | build 通过 / typecheck 0 / test ≥10 / 51 个页面文件冒烟清单 / dist 无演示资产 |
| C2 | 自建插件系统已删 / test ≥18 / 钩子面 15 / 清理计数 on=N off=N |
| C3 | doc.json 22/22 / test ≥30 / 22 插件覆盖 / 总线协议有文档 + 单测 |
| C4 | compound 0 处 `as any` / style.css 可单独引入 / 体积不劣化 |
| C5 | demo build 通过 / 场景体检 0 命中 / 22 插件装配过 / ≥37 页可打开 |
| C6 | check-packages + docs:build 全绿 / pack 干净 / changeset 就位 |

---

## 不做清单（明确排除，避免范围蔓延）

- ❌ 不迁旧 `plugins/{PluginBus,PluginManager,SlotsContext}` —— 1154 行全部由内核 + 包内领域槽替代
- ❌ 不迁 9 个死钩子（`onCartChange` / `onWishlistChange` / `renderBadge` / `onSelectionChange` / `onBeforeDataChange` / `onDataChange` / `renderContainer` / `renderContentWrapper` / `renderActions`）——底层能力要么由 `setState` 差分替代，要么由 `renderOverlay` 替代
- ❌ 不迁 `init` / `destroy` / `dependencies` / `enabled` 四个插件字段（22 个插件 0 使用；内核已有 `enabled` 与依赖解析）
- ❌ 不保留 `localforage`（0 引用）、不保留自引用 `vane-card` 依赖
- ❌ 不做 `priority` 反转适配（与内核同向，照抄 lazy-image 的 `1000 - x` 会引入 bug）
- ❌ 不在本阶段动 `vane-file-preview`（属 `tasks/02` P2 的另一条）
- ❌ 不在 C1–C3 阶段顺手重设计视觉 —— 样式抽取（C4.3）单独提交，避免「迁移」与「改版」混在一起无法归因

---

## 依赖与并行

```
C0（决策 + 快照）
  └─ C1（骨架 + Core + demo 指回源码）──┬─ C1.4 冒烟闸门
                                        └─ C2（插件系统替换）──┬─ C3（22 插件）──┐
                                                                └─ C4（compound）─┤
                                                                                  └─ C5（demo）
                                                                                        └─ C6（文档/发布）
```

- **C3.1（A 级 9 个）可脚本批量**，与 C4.1（compound 原样迁入）**可并行**：两者互不依赖。
- **C4.3（样式抽取）必须在 C4.1 之后单独提交**，且不与 C3.2 的插件改造混在一个 commit。
- C5.3 场景库可与 C3.2 交叉进行（场景只依赖已迁好的插件）。
- 每个阶段结束都跑一次 `pnpm verify`（根目录），把回归锁在阶段内。

---

## 执行记录（C1 起逐阶段追加）

| 阶段 | 计划指标 | 实测 |
| --- | --- | --- |
| C0 | 决策落纸 + 4 份快照 | ✅ D1–D5 落地（tasks/11/12 标注）；`test/fixtures/card-snapshots.json` 已生成且 `test/snapshots.base.test.tsx` 通过；gzip 基线 28.13KB |
| C1 | 包骨架 + Core 迁入 + demo 指回源码 | ✅ 包骨架/配置/依赖/typecheck 0 错/lib build 通过/demo 构建通过（R1 已证）；C1.4 的 Core 单测在 C2 一并补齐（3 个文件 14 用例），C1.3 的 51 页旧 demo 不搬运（留 C5 重写） |
| C2 | 删 1154 行旧系统 / 钩子面 15 / test ≥18 / 清理计数 on=N off=N | ✅ 三文件已删；typecheck 0 / eslint --quiet 0 / vitest 26 passed（6 文件）/ gzip 30.37KB（预算 36KB）；清理计数 **on=12 / off=12**（旧系统 off=0）；额外修掉 2 处 rules-of-hooks 违规 + 1 个 npm 打包陷阱（见 C2 节末） |
