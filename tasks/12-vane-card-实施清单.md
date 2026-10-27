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

### C3.1 A 级 9 个（近零改动）· ✅ 已完成

- [x] ~~写 `scripts/migrate-card-plugins.mjs`~~ —— **不需要**：C1 已整目录复制源码且 typecheck 通过，
  路径/类型早已对齐，再写一次迁移脚本属空转（记录此偏差，避免后来人重复劳动）
- [x] display 3：Badge、UserTag、Hover
- [x] media 3：Video、Gallery（timer 已有 `clearInterval`，复核通过）、Responsive
- [x] buy 2：Coupon、Review；interaction 1：Actions
- [x] 每个插件 `doc.json` 的 `config` 从源码类型 + 工厂默认值抽取，一句话描述人工校对（9/9 通过 schema 校验）
- [x] ~~`index.ts` 挂 `.meta`~~ —— **不做**：`scripts/generate-plugin-docs.mjs` 只读 `doc.json`，
  没有 `.meta` 读取方；`doc.json` 即唯一真相，避免同一份信息两处维护
- [x] 桶文件 `custom-plugins/index.ts` 按 media / buy / display / interaction / infra 五组重排（22 个，无遗漏）
- [x] `test/plugins-a.test.tsx`：10 个用例逐个确认「真的渲染出来」（这批插件在新内核下从未跑过）


### C3.2 B 级 10 个（逐个，需改造）· ✅ 已完成

- [x] **总线 6 个**：`SKU`（源，只写不订阅）+ 5 个消费者（Quantity、PriceCalculator、ComparePrice、CouponRecommend、OrderSummary）
  - [x] `setupForceUpdateOnBusKeys` 的返回值已在 `onMount` 中 `return`，C2 的内核 cleanup 让它真正生效（快照实测 on=12/off=12）
  - [x] Quantity 的 `renderIn`：**已实现**（`renderFooter` + `renderOverlay` 两条分支都在）——原「今天 0 处读取」的判断是错的，实测两处读取，故不改代码、只更正文档
- [x] Countdown：定时器归零后自停（`tick()` 返回 false 时 `clearInterval`），已过期时连定时器都不创建；卸载时清理
- [x] State：死钩子 → `onStateChange` 差分（C2 已做）；**`localStorage` 判定不适用**——本插件从不读写 localStorage，清单该条原本就无对象
- [x] Analytics：删掉自建 `IntersectionObserver`，改消费 Core 下发的 `onVisibilityChange`；曝光时长存**每卡自己的 `sharedData`**（不能用工厂作用域变量，否则 A 卡的进入时间会和 B 卡的离开时间相减）；顺带把 4 份重复的 `send` 提到工厂层
- [x] A11y：`focus` 改为具名 handler 并在 `onMount` 返回值里摘掉；`#a11y-live-region` 改引用计数（多卡共享、最后一张卸载才移除）；卸载时清掉 `role/tabindex/aria-label` 脏属性

**顺序约定（实测得出，R6 相关）**：钩子按 `priority` 降序执行，`onMount` 里**订阅必须先于发布**才能收到首个事件。
Analytics(50) 能收到 PriceCalculator(20) 的首个 `price:change`，靠的就是 50 > 20；写第三方插件时同理。

**C3.2 测试**：`test/plugins-b.test.tsx` 11 用例 —— 价格链路（含券抵扣 100→90）、Analytics 只建 1 个 IO、
`minExposureMs` 未达标不上报、播报区引用计数 2→1→0、focus 卸载后不再触发、ARIA 属性清理、Countdown 已过期不起定时器/卸载清定时器。

### C3.3 C 级 3 个（重写）

- [ ] Image（D1-A → 降级为占位实现）：修 `errorFallback` 分支（fallback 恒 `display:none` 的真 bug）；doc 写明「要懒加载请用 vane-lazy-image」
- [ ] Inventory：`renderBadge` → `renderOverlay`（低库存角标终于会显示）
- [ ] Animation：`onMount` 返回 `clearTimeout`；`prefers-reduced-motion: reduce` 时直接跳过动画

### C3.4 桶文件、配方、总线协议

- [x] `custom-plugins/index.ts`（22 个导出，按 media / buy / display / interaction / infra 分组注释）—— C3.1 完成
- [x] `presets/product-card`（Image + Badge + Hover + Actions + State，支持 `omit` 单独关）
- [x] `presets/sku-flow`（SKU + Quantity + PriceCalculator + Inventory，attributes/variants 必填）
- [x] `presets/checkout`（CouponRecommend + OrderSummary + ComparePrice + Analytics）
- [ ] **总线协议文档化**（R6）：写进 `docs/api.md` —— **推迟到 C6**，vane-card 的 docs 目录还没建，此刻写会与 C6 的文档结构打架
- [x] **协议单测**：`test/bus-protocol.test.tsx` 5 用例 —— 键值表冻结 + SKU 选规格→价格变（299→319）+ 数量+1→合计 598 + 汇总与价格区口径一致

**C3.4 途中修掉的真 bug（首屏价格错）**：`SKUPlugin.onMount` 只写 `sku.selection` / `sku.variant`，
不写 `sku.price` / `sku.image`（只有切规格的分支才写）。于是首屏价格只能回落到 `data.price`，
用户切一次规格才变成变体价——首屏显示错价、且切换时价格突然跳变。现已补齐，并用协议单测锁住。

**发现的打包缺口（留给 C6）**：`discoverEntries` 只扫 `src/custom-plugins/`，而本包的插件实际在
`src/components/CardPlugin/custom-plugins/`，于是 22 个插件**没有子路径入口**（`vane-card/custom-plugins/SKUPlugin` 不可用），
只能从根入口整体引入。与 ADR-6「插件按子路径按需引入」不符。两条路：
① 把 `custom-plugins` 提到 `src/` 顶层（与 waterfall 对齐，需改约 45 处 import）；
② 给 `discover-entries.mjs` 加一层路径映射（公开子路径不变）。C6 定夺。


### C3.5 单测（第三批）· ✅ 已完成

- [x] 每个插件：工厂返回 `{ name, hooks }`、`doc.json` 可解析、`config` 字段完整（22 × 3 + 2 条 = 68 断言，表驱动）
      —— `test/plugin-meta.test.tsx`，同时锁住「新增插件忘写 doc.json」与「文档里写了不存在的配置项」
- [x] 3 个端到端：
      - SKU 联动 → `test/bus-protocol.test.tsx`（299 → 319，数量 +1 → 598）
      - 优惠叠加 → `test/plugins-b.test.tsx`（券 10 元：100 → 90）
      - 曝光上报 → `test/plugins-b.test.tsx`（复用 Core 可见性、minExposureMs 门槛）

**C3 收尾状态**：22 个插件全部迁入 + 22 份 `doc.json` + 3 个配方 + 11 个测试文件 129 用例。

**验收门 C3**：`doc.json` **22/22**；桶文件 22 导出、5 组无遗漏；`docs:plugins` 生成 22 行；`typecheck` 0 错；`test` ≥30 通过；3 个配方可跑；**22/22 插件在 demo 中至少被装配一次**（脚本化覆盖闸门）。

---

## C4 · 复合组件迁入 + 样式抽取

### C4.1 原样迁入（不动样式）

- [x] `src/compound/`：38 个组件 + `ProductCard.tsx` + `index.ts`（2772 行）
- [x] 修 `import ... from "./components/QuantityStepper.tsx"` 的显式扩展名（lib 构建会挂）
- [x] `compound/index.ts` 的 **38 处 `as any`** → 一次 `Object.assign`（不是 38 行逐个赋值）
- [x] `ProductCard` 的 `data?: any` → `ProductCardProps<T extends ProductData>`

**实测差异（文档口径外的补充）**：
- `as any` 实际是 **51 处**（38 在 `index.ts` 的静态子组件赋值，13 散布在 10 个组件里）
- 变体匹配逻辑在 6 个组件里各抄了一遍（`Price` / `QuantityStepper` / `Inventory` / `StockBadge` /
  `SKUCode` / `VariantMediaSwitcher`），全部带 `(attrs as any)[k]` → 统一收口到 `matchVariant`
- `createContext` 无法泛型化，泛型只能在 props 侧生效（上下文统一 `ProductData`）；
  `ProductData` 保索引签名，否则调用方只能 `data={x as any}`
- **`matchVariant` 语义修正**：旧逻辑「每个已选属性都对上」→ 只选了颜色就会拿「红/M」的价格，
  显示错价；改为「变体属性集与已选属性集一一对上」，未选全时回退商品级字段
- **`ProductCard` 按插件名签名记忆 Core**：旧版按 `plugins` 数组引用记忆，内联字面量会让
  每次父组件重渲染都卸载重挂整棵树（`onMount` 重跑、状态全丢）

### C4.2 与插件系统的接缝

- [x] `Price` / `CouponBar` / `OrderSummaryPanel` 的 `usePluginSlot("priceArea")` 改读 D3-A 的领域槽（C2 已完成，签名不变）
- [x] 单测：装 3 个价格插件 → 渲染 `<ProductCard>` → 断言 3 段内容都在且按 `config.order` 升序（R5）

### C4.3 样式抽取（D4-B，独立提交 `b415bf3`）

> 单独一步做，与 C4.1 分开提交，出问题能归因（R4）。

- [x] `src/styles/tokens.css`：CSS 变量（`--vc-fg` / `--vc-fg-dim` / `--vc-bg` / `--vc-accent` / `--vc-border` / `--vc-radius` / `--vc-gap` …）
- [x] `src/styles/components.css`：`vc-` 前缀 class（38 个组件 + CardCore 容器 + 各插槽区）
- [x] 内联 `style` 逐条归位（实际 **127 处 → 剩 5 处**，清单里的 230 是三处来源的合计估数）
- [x] 硬编码色值清点 → 变量；暗色由 `data-vc-theme="dark"` 整套覆盖（不改整站 `prefers-color-scheme`）
- [x] 构建产出 `dist/style.css`（24.47KB / gzip 5.22KB），`exports` 暴露 `./style.css`
- [x] `docs/styling.md` 写明「不引 `style.css` 会怎样」；demo 拆出 `no-style.html` 对照页
- [x] **额外加的回归锁**：`test/styles.test.ts` 静态对账「源码 class ↔ CSS 定义」（拼错即红、孤儿类即红）

**验收门 C4**：✅ `compound` 0 处 `as any`；`tsc` 0 错；复合组件冒烟 46 用例（≥33）；
产物体积**反而更小**（根入口 gzip 23.61 → 22.10KB，内联样式搬走后代码变少）；
`style.css` 可单独引入，不引也能渲染（`demo/no-style.html`）。

---

## C5 · demo 重建（D5-B 三视角）· ✅ 已完成

### C5.1 骨架

- [x] `demo/index.html`（内联 SVG favicon + 首屏底色内联防闪白）+ `demo/vite.config.ts`（root 为包根、base `./`，端口 **3301**）
- [x] **包名 alias**：`vane-card` / `/core` / `/plugins` / `/compound` / `/custom-plugins/*` / `/presets/*` → `src`，与新 `exports` 一一对应
- [x] HashRouter + 三入口（`/` 总览、`/plugins` 工坊、`/scenarios` 场景库、`/demos/:slug` 逐项）+ 页面级 `PageBoundary`
- [x] 视觉沿用 waterfall 的「深色编辑部 / 规格板」版式（外壳沿用，见下方「舞台另立」）

### C5.2 插件工坊（`#/plugins`）

- [x] `import.meta.glob("/src/custom-plugins/*/doc.json")` 驱动 5 组勾选（工坊数据源在 `demo/src/data/plugins.ts`，三来源合并：doc.json + 源码正则取 `priority` + 手写 `make`）
- [x] 勾选即实时装配（`useCard` 按**插件名集合**记忆组件类型 —— 只 `useMemo` 不够，`withPlugins` 每次调用都产出新组件类型）
- [x] **冲突提示** 4 条：Image↔Gallery、Countdown↔Animation、A11y↔Actions、Quantity↔SKU
- [x] 点插件名展开 `doc.json`：配置表 + 能做/适合/注意

### C5.3 场景库（`#/scenarios`，10 个）

- [x] 商品列表卡 / SKU 联动商详 / 秒杀倒计时 / 优惠券叠加到手价 / 订单摘要 / 比价 / 低库存告警 / 视频商详 / 评论墙 / 移动端横滑卡（10/10）
- [x] 一卡两栏 + 下方通栏代码：**完整版**用 `?raw` 读同一个 `.tsx`；**最小装配版**由 `meta.plugs` 现场生成（`scenarios/minimal.ts`）
- [x] `scripts/verify-scenarios.mjs` 适配卡片：slug↔文件名、plugs↔源码双向、编号连续、**22 插件覆盖率**

### C5.4 逐项示例（`#/demos/:slug`，38 页）

- [x] 数据驱动：每页只写 `meta`（plugs / props / controls / note）+ 装配函数，骨架由 `DemoPage` 提供
- [x] 22 个插件页 + 13 个复合组件页 + 3 个 Core 页 = 38（清单原估 12 个复合页，实际复合组 13 页）
- [x] `meta.props` 与 `plugs[].cfg` 支持 `{{key}}` 占位（拖控件 = 改代码）

### C5.5 体检闸门（替代 CDP 截图）

- [x] 新增 `scripts/audit-cards.mjs`（参照 `audit-demos.mjs`），判据与渲染层 `demo/src/lib/audit.ts` 同源：
  - [x] 断言 6 类：`no-card` / `zero-size` / `overflow` / `broken-image`（`naturalWidth === 0`）/ `no-content` / `no-price`；另捕 `pageerror` 并过滤媒体/网络噪音 `console.error`
  - [x] 结果落表：**41 条路由 × 0 命中**
- [ ] ~~复用 `audit-controls.mjs` 思路逐页推滑杆比对指纹~~ —— **未做，改为控件即代码**：`{{key}}` 占位的插值直接反映在生成代码上，人眼一眼能看出控件是否接上，再做一套指纹比对是重复投入

**执行记录（2026-10-27）**

| 项 | 实测 |
| --- | --- |
| `pnpm typecheck` | 0 错 |
| `pnpm exec eslint demo src --quiet` | 0 错 |
| `pnpm test` | **180 passed / 13 files** |
| `pnpm build`（lib） | 通过 |
| `pnpm build:demo` | 通过，`main-*.js` 113.74KB / gzip 46.55KB |
| `scripts/audit-cards.mjs` | 41 页几何全干净（总览 + 工坊 + 场景 + 38 逐项） |
| `scripts/verify-scenarios.mjs` | 场景 10 / 插件 22 / 逐项 38 页 / **插件覆盖 22/22** |

**与清单的偏离（都是想清楚后改的）**

1. **路由名 `/scenes` → `/scenarios`**：场景文件目录就叫 `scenarios`，词典里 "scene" 是舞台布景、"scenario" 是业务情境，这里指的是后者。
2. **舞台另立「样纸」主题**：外壳仍深色，但卡片舞台改成带格子底纹的浅色纸面 + 白卡投影。原因是深色 UI 配浅色卡片本来就打架，而改插件默认色会污染迁移的归因边界 —— 让容器去适配组件，而不是反过来。
3. **复合组件左右内边距在 demo 侧补**：复合子组件刻意不带左右 padding（由容器决定），demo 统一补 14px + `gap: 8px`，媒体块保持通栏。CSS 里写明了这是「组合方式」不是组件默认值。
4. **`ActionsPlugin` 的真实缺陷**：footer 内按钮与价格区撞 priority，按钮排到了价格之上。改为 `config.order = 20` 让顺序变成结构性的（券 → 价格 → 按钮），不再是运气。

**验收门 C5**：✅ build 通过；体检 41 页 **0 命中**；每卡有代码块 + 复制按钮；**22/22** 插件装配过；**38 页**逐项示例全部可打开（≥37）。

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
| C5 | demo build 通过 / 场景体检 0 命中 / 22 插件装配过 / ≥37 页可打开 | ✅ build 通过（`main` gzip 46.55KB）；`audit-cards.mjs` **41 页 0 命中**；插件覆盖 **22/22**；逐项示例 **38 页**；vitest 180 passed；typecheck / eslint 0 错 |
| C4 | compound 0 处 `as any` / style.css 可单独引入 / 体积不劣化 | ✅ `as any` **51 → 0**（类型层 `types/product.ts` + `Object.assign` 装配）；vitest 180 passed（13 文件，含复合组件 46 用例）；`dist/style.css` 24.47KB(gzip 5.22)；根入口 gzip **22.10KB**（比 C3 末 23.61 更小）；`test/styles.test.ts` 锁住 class↔CSS 对账 |
