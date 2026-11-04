# 71 · vane-plugin-core 修复影响面 / 向后兼容性分析

> 关联：`tasks/68-plugin-core-分析.md`（问题清单）、`tasks/69-plugin-core-实施清单.md`（整改项）、`tasks/70-plugin-core-组件分析报告.md`
> 性质：**只读分析**，未修改任何源码；本文件只回答一个问题——**修这些问题会不会影响后续组件的调用**。
> 证据标注：**[已证实]** = 代码路径/调用点可直接验证；**[推断]** = 取决于调用方用法或运行环境，本轮未实测。

---

## 零、一句话结论（分层）

| 层面 | 回答 | 说明 |
| --- | --- | --- |
| **API 层面** | **不会** | 现有 14 个组件的调用签名、props、导出、插件契约都不需要改；`withPlugins` / `usePluginRuntime` 保持原签名（P2-14 只是新增返回值，不破坏赋值）。 |
| **行为层面** | **不会（对现有 13 个组件）／有条件会（vane-lazy-image GalleryCore）** | P1 修复改变的是「边界时序」，而 13 个组件的插件数组在 HOC 创建时固定，运行期从不变化，因此 P1-1 / P1-2 / P1-3 在它们身上没有可触发的路径；唯一例外是 GalleryCore 允许内联 `plugins`，每次渲染重建插件对象，会命中重装配路径（见第三节）。 |
| **需要下游配合** | **有条件会（可选清理，不是阻塞）** | vane-sku / vane-coupon / vane-resume / vane-candidate 里针对内核缺陷写的补偿代码（`mountedPluginsRef`、`[orderedPlugins]` 重跑）在修复后变成冗余；**保留不会出错，删除是可选维护项（D）**。若采用「自动挂载新插件」的激进实现，则必须同批删除，否则会重复 onMount。 |

**给用户的原话答案**：这次修复**不会改变 14 个组件现有的调用方式**；会变的是少数**边界行为**，且这些行为目前只有 vane-lazy-image 的图集（GalleryCore）和外部直接使用 `usePluginRuntime` 的消费者可能观测到。只要按本文建议的实现口径（见第五节）落地，就是「API 不变、组件代码不动、仅内部修 bug」。

---

## 一、先校正三条既有线索（避免基于错误前提做兼容性判断）

| 原线索 | 核实结果 | 证据 |
| --- | --- | --- |
| 「sku 用 mountedPluginsRef」 | **属实** | [withPlugins.tsx](file:///e:/react-plugin-component/packages/vane-sku/src/components/SkuPlugin/withPlugins.tsx#L270-L281)：`mountedPluginsRef` 逐名比对，只对新增插件补跑 `onMount`。 |
| 「coupon 重装配时无脑重跑」 | **属实** | [withPlugins.tsx](file:///e:/react-plugin-component/packages/vane-coupon/src/components/CouponPlugin/withPlugins.tsx#L108-L110)：`useEffect(..., [execute, runtime.orderedPlugins])`，只要排序结果变就整体重跑。 |
| 「activity 与 candidate 完全不补」 | **一半属实**：activity 完全不补；**candidate 其实补了** | activity：[withPlugins.tsx](file:///e:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L193-L195) 依赖只有 `[execute]`；candidate：[withPlugins.tsx](file:///e:/react-plugin-component/packages/vane-candidate/src/components/CandidatePlugin/withPlugins.tsx#L274-L276) 依赖是 `[execute, runtime.orderedPlugins]`，与 coupon 相同。 |
| **补充事实 A**：内核 `clear()` 并不会清空 bus | `manager.clear()` 只执行 cleanups、异步 destroy、清空插件表；bus store/handlers 对象仍存活 | [PluginManager.ts](file:///e:/react-plugin-component/packages/plugin-core/src/manager/PluginManager.ts#L111-L129)。因此 68 中「onUnmount 时 bus 已被清空」的表述需修正为「插件自己注册在 bus 上的订阅已被 cleanup 解除、插件表已删除；context.shared 与 bus 对象仍在」。 |
| **补充事实 B**：14 个组件中只有 GalleryCore 的插件数组是运行期可变的 | 其余组件的 `plugins` 都在 HOC 创建时/模块级固定 | 各 `withXxxPlugins` 的 `plugins` 来自外层 `config` 闭包；`usePluginRuntime` 的 `[stablePlugins]` 只在 GalleryCore（`props.plugins`）与外部直接调用时才会变化。 |
| **补充事实 C**：没有任何组件调用 `manager.enable/disable/unregister`（lazy-image 热替换 demo 除外） | 组件只读 `runtime`；`manager` 的写入型 API 仅 demo 使用 | 全局检索 `manager.disable`/`unregister` 命中仅在 `vane-lazy-image/demo/src/advanced/PluginHotReloadDemo.tsx`。 |
| **补充事实 D**：泛型 `withPlugins` HOC 在 14 个组件里**无人使用** | 所有组件都自写 `withXxxPlugins`，只复用 `usePluginRuntime`/`composeSlots`/`renderPluginSlot`/`PluginErrorBoundary` | 仅 `vane-danmaku/src/index.ts:32` 与 `entries/plugins.ts:2` 把内核 `withPlugins` 作为公共 API 再导出。 |

---

## 二、P1 逐项兼容性判定

| 编号 | 修复内容 | 档位 | 下游需要做什么 |
| --- | --- | --- | --- |
| P1-1 | 卸载时先 onUnmount、后 clear | **A（纯内部）** | 不动；可选补一条时序回归测试 |
| P1-2 | 重装配改增量对齐（diff） | **A（现状）＋ D（可选清理）** | 组件不动；sku/coupon/resume/candidate 的补偿代码可保留（幂等后无害），删除属维护项 |
| P1-3 | `enabled:false` 真正停用数据管线 | **B（行为修正，契约不变）** | 不动；无已证实的旧行为依赖，需按组件复核一遍（见第四节表） |
| P1-4 | 循环依赖降级、排序错误不穿透 | **A（只修循环）/ B（若同时改缺失依赖策略）** | 不动；但必须保持「缺失依赖=照跑+告警」 |
| P1-5 | 超时执行失效化 | **B（有条件）** | 组件不动，但**必须限定作用域**（见 2.5） |

### 2.1 P1-1（A）：纯时序修复，14 个组件零改动

- 修复点：[usePluginRuntime.ts:137-143](file:///e:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L137-L143)。
- 兼容性依据：
  1. 所有组件的 `onUnmount` 插件钩子只能拿到 `context`（props/data/bus/refs/state/shared/deviceInfo/logger），**拿不到 manager**；因此「manager 表是否已清空」对插件不可观测。[已证实]
  2. `manager.clear()` 不清 bus、不清 context.shared（补充事实 A）；修复前后插件都能读到总线与共享状态，顺序修正只会让它们**更早**可用。[已证实]
  3. 组件侧的 `props.onUnmount` 只转发宿主回调，不桥接插件生命周期；插件 onUnmount 只由 runtime 的卸载 effect 触发一次。[已证实]
- 唯一需要确认的点：个别插件在 onUnmount 里访问 `ctx.containerRef.current` / `ctx.state`（如 waterfall StatePersistence、lazy-image UserBehavior）。修复前后 DOM 移除时机不变（都在 React 卸载 effect 内），因此无差异。[已证实代码位置，DOM 时序为推断]
- 结论：**A**；不需要任何组件改调用。

### 2.2 P1-2（A + D 可选）：现状下不可触发，修复后补偿变冗余

- 触发条件：`stablePlugins` 元素引用变化（[usePluginRuntime.ts:114-131](file:///e:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L114-L131)）。
- 现状核实：
  - 13 个组件的插件数组在 HOC 创建时固定（`withXxxPlugins(Core, config)` 的闭包），运行期不变 → **重装配 effect 一生只跑一次**，P1-2 缺陷对它们不可触发。[已证实]
  - `vane-lazy-image` 的 `GalleryCore` 把 `props.plugins` 直接交给 `useGalleryRuntime`（[GalleryCore.tsx:40-53](file:///e:/react-plugin-component/packages/vane-lazy-image/src/gallery/GalleryCore.tsx#L40-L53)、[useGalleryRuntime.ts:71-72](file:///e:/react-plugin-component/packages/vane-lazy-image/src/gallery/useGalleryRuntime.ts#L71-L72)）；文档示例使用内联 `plugins={[createXxxPlugin()]}`，每次父组件渲染都会产生新对象 → **每次渲染 clear + registerAll**。[已证实路径；真实触发频率取决于调用方是否内联，推断]
  - 同时 GalleryCore **从不调用** `execute("onMount")`，现有 gallery 域插件（Carousel/ThumbSync/ZoomControl…）也没有 `onMount` 钩子，所以在 gallery 上「清空订阅」目前没有可观测后果。[已证实]
- 修复后：
  - 采用「增量 diff + onMount 按插件对象幂等」后，未变更插件不再被 cleanup 误伤；sku/coupon/resume/candidate 的重跑调用变成幂等空操作，**不会重复挂载**。[设计前提]
  - 若采用激进方案「注册新插件时自动 onMount」，GalleryCore 的内联插件会在每次渲染重新挂载（此前从不挂载）→ 对外部自定义 gallery 插件是**新行为**，可能叠加副作用。故本报告建议：**不在 register 阶段自动 onMount**，由装配器显式调用（见第五节批次建议）。
- 补偿代码归属：
  - `vane-sku`：`mountedPluginsRef`（[270-281](file:///e:/react-plugin-component/packages/vane-sku/src/components/SkuPlugin/withPlugins.tsx#L270-L281)）→ 修复后是死逻辑，**保留无害，删除可选（D）**。
  - `vane-coupon`（[108-110](file:///e:/react-plugin-component/packages/vane-coupon/src/components/CouponPlugin/withPlugins.tsx#L108-L110)）、`vane-resume`（[133-135](file:///e:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx#L133-L135)）、`vane-candidate`（[274-276](file:///e:/react-plugin-component/packages/vane-candidate/src/components/CandidatePlugin/withPlugins.tsx#L274-L276)）：全量重跑 → 幂等后无害，**保留不动**；若要简化，改为依赖 `[execute]` 是一行改动（D 可选）。
  - `vane-activity`：不补 → 修复后由 diff 保证未变更插件不受影响；因其插件数组静态，**无需新增补跑逻辑**（A）。
- 结论：**A（现状）**；**D（补偿清理，可选、不阻塞发布）**。

### 2.3 P1-3（B）：行为修正，无已证实的旧行为依赖

- 现状不一致点：[usePluginRuntime.ts:145-148, 185-226](file:///e:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L145-L226) 不过滤 `enabled`；`manager.disable` 改副本（[PluginManager.ts:43-45, 143-145](file:///e:/react-plugin-component/packages/plugin-core/src/manager/PluginManager.ts#L43-L145)）。
- 全仓核实「谁在依赖 disabled 但 transform 照跑」：
  - 显式 `enabled:false` 的插件只有 3 类：`vane-profile` 的 TabSync 空插件（`hooks: {}`，无 transform）、`vane-file-preview` 的 resolve 路由测试插件（在进入内核前已被自身 `enabled` 过滤，见 [resolve.ts](file:///e:/react-plugin-component/packages/vane-file-preview/src/components/FilePreviewPlugin/plugins/resolve.ts)）、`vane-lazy-image` 的 gallery 槽位测试插件（只测渲染跳过）。[已证实]
  - lazy-image 的 Responsive/ExifOrientation/EventLogger/UserBehavior 的 `enabled:false` 是**工厂内部 config**，插件对象本身 `enabled:true`；其 hook 内部已自行判断并返回原值/空操作。修复后内核跳过 transform，结果与现在一致。[已证实代码路径]
  - 没有任何组件调用 `manager.disable()`（补充事实 C）。
- 因此修复会带来的可观测差异只有一种：**外部消费者显式设置 `plugin.enabled=false` 却期待 transformProps/transformData 继续生效**——这与 README/类型注释的启停语义相反，属于旧行为 bug，仓库内无此用法。
- 结论：**B**；调用方无需改代码，但发布说明应写明「disabled 插件不再参与数据管线」。

### 2.4 P1-4（A，附条件）：只降级循环依赖，不改变缺失依赖策略

- 现状：循环依赖 throw（[DependencyResolver.ts:37-43](file:///e:/react-plugin-component/packages/plugin-core/src/dependency/DependencyResolver.ts#L37-L43)），在 render 期 `useMemo` 无保护（[usePluginRuntime.ts:145-148](file:///e:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts#L145-L148)）。
- 下游依赖链核实：`vane-resume` 存在 `privacy-mask → contact-desensitize → ai-polish → multi-lang` 的链（[ContactDesensitizePlugin:78](file:///e:/react-plugin-component/packages/vane-resume/src/custom-plugins/ContactDesensitizePlugin/create.tsx#L77-L78)、[AiPolishPlugin:44](file:///e:/react-plugin-component/packages/vane-resume/src/custom-plugins/AiPolishPlugin/create.tsx#L43-L44)），**无环**；`multi-lang` 是真实注册的插件（[MultiLangPlugin:37](file:///e:/react-plugin-component/packages/vane-resume/src/custom-plugins/MultiLangPlugin/create.tsx#L37)）。[已证实]
- 兼容性红线：修复必须保留「**缺失依赖 = 记录告警后照常执行**」。如果顺手把「依赖缺失/被禁用」升级为「跳过依赖方」，resume 在宿主不注册 multi-lang 的自定义组合下会从「润色照跑」变成「润色不执行」——这是 **B/C 级行为变化**，不应包含在本次修复。
- 结论：**A**（仅把 throw 改降级 + 错误入账）；**B**（若同时调整缺失/禁用依赖策略，需单独立项并逐组件确认）。

### 2.5 P1-5（B，有条件）：必须限定在生命周期钩子，不能波及数据面异步钩子

- 现状：`executeHook` 的 3s 超时作用于**所有**钩子，包括 lazy-image 的 `onLoad` / `onBeforeLoad` / `onActiveChange` 等数据面异步钩子（[PluginSandbox.ts:23-34](file:///e:/react-plugin-component/packages/plugin-core/src/sandbox/PluginSandbox.ts#L23-L34)）。
- 兼容风险：若把「超时即失效、迟到结果丢弃」应用到数据面钩子，慢网/大图场景下 `CacheIDBPlugin` 的写入、`NetworkAnalyticsPlugin` 的上报、`ViewportDebouncePlugin` 的延迟计算会被**静默丢弃**——这是用户可感知的行为变化（缓存命中率/统计丢失）。[推断，基于插件实现路径]
- 建议口径：代次失效只作用于 **onMount / onUnmount / onPropsChange / onError**（生命周期：迟到 cleanup 不登记、迟到 setState 不生效）；数据面钩子维持「超时只影响本次 await 结果，后续副作用保留」或在文档中显式定义。另建议超时可配置为 0=不超时（lazy-image 数据插件可按需关闭）。
- 结论：**B**；在当前 14 个组件中，若按上述口径实现，无代码改动；若扩大作用域则为 **C**（lazy-image 需要调参或改插件）。

---

## 三、特别评估的三件事（明确结论）

### 3.1 onUnmount 时序修正后，是否有组件依赖「总线/共享状态仍可读」？

**结论：没有组件依赖旧顺序；修复后它们读取的内容仍然可读（事实 A）。**

- 现状插件 `onUnmount` 的实际读取对象：[已证实]
  - coupon `CopyCodePlugin` 写 `context.shared`（MOUNTED/MOUNTED_AT）；
  - coupon `ClaimStatePlugin` / `ValidityPlugin` 清理定时器与 shared 计数；
  - waterfall `StatePersistencePlugin` 读 `containerRef` / `props`；`InfiniteScrollPlugin` 读 container；
  - lazy-image `UserBehaviorPlugin` / `ViewportDwell` / `CacheIDB` 读 `shared`、`props`、`state`；
  - modal-sheet `KeyboardAvoidPlugin` 调 `setViewportInset(0)`（context.setState）。
- 没有任何 `onUnmount` 访问 manager 或 bus 的 handler 表（`context` 不暴露 manager）。`manager.clear()` 本身不清 bus/shared。因此「先执行 onUnmount」不会让任何现有插件变得读不到东西，反而消除了「插件表已空」的潜在坑。
- **需要同步修正 68 的措辞**：不是「bus 已被清空」，而是「cleanup 已解除插件自己的订阅、插件表已删除」。
- 唯一需要回归测试覆盖的组件：coupon（shared 写入）、waterfall（containerRef 读取）、modal-sheet（setState）——**只加测试，不动代码**。

### 3.2 `enabled:false` 真正停用 transformProps/transformData 后，是否有组件或 demo 依赖「关渲染但数据照跑」？

**结论：没有。仓库内没有任何已证实的「disabled 但仍需 transform」用法。**

- 显式 `enabled:false` 的三处均为「停用后不应该再做任何事」：profile TabSync 空插件、file-preview 路由测试、lazy-image 槽位测试。[已证实]
- lazy-image 的 `enabled:false` 是工厂 config，作用于 hook 内部；插件对象 `enabled` 仍为 true，因此修复不改变其行为。[已证实]
- demo 中也没有通过 `enabled:false` 做「只隐藏 UI」的用法：danmaku 的过滤开关是**重建插件数组**（[00-basic.tsx:113 起](file:///e:/react-plugin-component/packages/vane-danmaku/demo/src/demos/00-basic.tsx#L113)），profile 的空 tabs 用空插件。[已证实]
- 结论：**B**，无需下游改动；唯一「会变」的是外部消费者如果曾把 `enabled:false` 当「隐藏 UI 开关」使用——文档需明确「disabled = 完全停用」。

### 3.3 重装配改为增量对齐后，现有「重建补偿」会重复执行或叠加副作用吗？

**结论：只要按「diff + 按插件对象幂等」实现，不会重复；现有补偿变成冗余但无害。**

- sku：`mountedPluginsRef` 只对新增插件补跑，且修复后 manager 会跳过已挂载对象 → 不重复（若幂等实现到位）。[设计前提；sku 现状逻辑已证实]
- coupon / resume / candidate：`[orderedPlugins]` 驱动全量 `execute("onMount")`；修复后对未变更插件是幂等空操作，对新增插件恰好完成挂载 → **不会叠加**。[设计前提]
- **风险点（必须写进实现约束）**：如果 P1-2 采用「register 时自动执行 onMount」而不做幂等，上述三处补偿会在动态场景下**双重 onMount**（重复监听/重复定时器），sku 则因 guard 幸免 → 组件间行为分裂。这就是本报告建议「不自动挂载 + 显式幂等 API」的原因。
- 结论：**D（可选清理）**，不是阻塞项；但**实现口径决定了它是 A 还是 D**。

---

## 四、逐组件影响面（14 个）

> 「需要做什么」列：不动 / 改调用 / 删补偿 / 加测试。

| 组件 | 受影响项 | 具体位置 | 修完后需要做什么 |
| --- | --- | --- | --- |
| **vane-activity** | P1-1（A）、P1-2（A，静态插件） | [withPlugins.tsx:88](file:///e:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L88)、[193-195](file:///e:/react-plugin-component/packages/vane-activity/src/components/ActivityPlugin/withPlugins.tsx#L193-L195) | **不动**；加一条卸载时序测试（沿用 activity 的 core-fixes 测试风格） |
| **vane-candidate** | P1-1（A）、P1-2（A＋D 可选） | [withPlugins.tsx:117](file:///e:/react-plugin-component/packages/vane-candidate/src/components/CandidatePlugin/withPlugins.tsx#L117)、[274-276](file:///e:/react-plugin-component/packages/vane-candidate/src/components/CandidatePlugin/withPlugins.tsx#L274-L276) | **不动**；补偿代码保留（幂等后无害）。注意：原线索「candidate 完全不补」不成立，它和 coupon 一样是重跑 |
| **vane-card** | P1-1（A）、P1-3（B，无依赖） | [withPlugins.tsx:147](file:///e:/react-plugin-component/packages/vane-card/src/components/CardPlugin/plugins/withPlugins.tsx#L147)、[191](file:///e:/react-plugin-component/packages/vane-card/src/components/CardPlugin/plugins/withPlugins.tsx#L191) | **不动**；补一条「enabled:false 后 transformData 不执行」的组件级回归即可 |
| **vane-comment** | P1-1（A） | [withPlugins.tsx:65](file:///e:/react-plugin-component/packages/vane-comment/src/components/CommentPlugin/withPlugins.tsx#L65)、[89-91](file:///e:/react-plugin-component/packages/vane-comment/src/components/CommentPlugin/withPlugins.tsx#L89-L91) | **不动** |
| **vane-coupon** | P1-1（A，shared 读写）、P1-2（D 可选） | [withPlugins.tsx:108-110](file:///e:/react-plugin-component/packages/vane-coupon/src/components/CouponPlugin/withPlugins.tsx#L108-L110)；`CopyCodePlugin` / `ClaimStatePlugin` / `ValidityPlugin` 的 onUnmount | **不动**；建议**保留**重跑逻辑（幂等后无害）；若要清理，改依赖为 `[execute]` 属后续维护 |
| **vane-danmaku** | P1-1（A）；P2-9/P2-15 → **对外 API 的 C 风险** | [withPlugins.tsx:72](file:///e:/react-plugin-component/packages/vane-danmaku/src/components/DanmakuPlugin/withPlugins.tsx#L72)；[src/index.ts:32](file:///e:/react-plugin-component/packages/vane-danmaku/src/index.ts#L32) 再导出内核 `withPlugins` | 组件**不动**；若修 P2-9（给泛型 HOC 加 onPropsChange 自动触发）需单独评审，否则只改文档（A） |
| **vane-file-preview** | P1-1（A）、P1-3（A，自身 resolve 已过滤） | [withPlugins.tsx:183](file:///e:/react-plugin-component/packages/vane-file-preview/src/components/FilePreviewPlugin/plugins/withPlugins.tsx#L183)、[resolve.ts](file:///e:/react-plugin-component/packages/vane-file-preview/src/components/FilePreviewPlugin/plugins/resolve.ts) | **不动**；现有 `enabled:false` 路由测试继续通过 |
| **vane-lazy-image** | P1-1（A）、P1-2（**B，GalleryCore 内联插件**）、P1-3（B）、P1-5（B） | 单图：[withPlugins.tsx:144-146](file:///e:/react-plugin-component/packages/vane-lazy-image/src/components/LazyLoadImagePlugin/withPlugins.tsx#L144-L146)；图集：[GalleryCore.tsx:40-53](file:///e:/react-plugin-component/packages/vane-lazy-image/src/gallery/GalleryCore.tsx#L40-L53)、[useGalleryRuntime.ts:71-72](file:///e:/react-plugin-component/packages/vane-lazy-image/src/gallery/useGalleryRuntime.ts#L71-L72) | 单图**不动**；**图集需要同批处理**：① 文档/示例要求 `plugins` 记忆化（useMemo/模块级）；② 若启用「自动挂载新插件」方案，GalleryCore 需显式调用一次 `execute("onMount")`（当前从未调用）；③ 热替换 demo 在 P2-11 修复后需复核 `unregister` 语义 |
| **vane-modal-sheet** | P1-1（A，onUnmount 调 setState）、P1-5（B） | [withPlugins.tsx:146-153](file:///e:/react-plugin-component/packages/vane-modal-sheet/src/components/ModalSheetPlugin/plugins/withPlugins.tsx#L146-L153)；`KeyboardAvoidPlugin` onUnmount | **不动**；加一条「卸载时 setViewportInset 不报错」的回归 |
| **vane-profile** | P1-1（A）、P1-3（B，TabSync 空插件无 hook） | [withPlugins.tsx:138](file:///e:/react-plugin-component/packages/vane-profile/src/components/ProfilePlugin/withPlugins.tsx#L138)；[TabSyncPlugin:55-62](file:///e:/react-plugin-component/packages/vane-profile/src/custom-plugins/TabSyncPlugin/create.tsx#L55-L62) | **不动**；TabSync 的「重建插件数组」需宿主新建 HOC（现状即如此，本次不改变） |
| **vane-resume** | P1-1（A）、P1-2（D 可选）、P1-4（A 附条件） | [withPlugins.tsx:133-135](file:///e:/react-plugin-component/packages/vane-resume/src/components/ResumePlugin/withPlugins.tsx#L133-L135)；依赖链 `ai-polish → multi-lang` | **不动**；**红线**：P1-4 不得把「缺失/禁用依赖」改为跳过依赖方，否则润色链会变 |
| **vane-sign-in** | P1-1（A） | [withPlugins.tsx:70](file:///e:/react-plugin-component/packages/vane-sign-in/src/components/SignInPlugin/withPlugins.tsx#L70)、[112-114](file:///e:/react-plugin-component/packages/vane-sign-in/src/components/SignInPlugin/withPlugins.tsx#L112-L114) | **不动** |
| **vane-sku** | P1-1（A）、P1-2（D，guard 变死逻辑）、P1-3（B） | [withPlugins.tsx:230](file:///e:/react-plugin-component/packages/vane-sku/src/components/SkuPlugin/withPlugins.tsx#L230)、[270-281](file:///e:/react-plugin-component/packages/vane-sku/src/components/SkuPlugin/withPlugins.tsx#L270-L281) | **保留 guard**（无害）；键盘监听依赖 onMount，建议在 P1-2 后补一条「新增插件只挂载一次」测试 |
| **vane-waterfall** | P1-1（A，onUnmount 读 container）、P1-5（B） | [withPlugins.tsx:309](file:///e:/react-plugin-component/packages/vane-waterfall/src/components/WaterfallPlugin/withPlugins.tsx#L309)、[484](file:///e:/react-plugin-component/packages/vane-waterfall/src/components/WaterfallPlugin/withPlugins.tsx#L484)；`StatePersistence` / `InfiniteScroll` onUnmount | **不动**；加一条卸载时读取 container 的回归 |

> 未直接列出的 vane 组件：不存在——14 个已全部覆盖。

---

## 五、安全修复顺序与批次（哪些可零风险合入）

### 批次 1（可单独合入，零风险，A 档）
1. **P1-1**（卸载时序）——纯内部，组件零改动；补 1 条时序测试。
2. **P1-4**（循环依赖降级 + 排序错误入账）——仅把 throw 变降级；补 1 条循环依赖测试。**明确不改缺失依赖策略**。
3. **P2-1 / P2-2 / P2-4 / P2-10 / P2-14**——单点内部修复，A 档，可与批次 1 同 PR。

### 批次 2（行为修正，B 档，建议与回归测试同批）
4. **P1-3**（enabled 真正停用数据管线）——先加「disabled 插件 transform 不执行」测试，再改行为；发布说明标注语义变更。组件代码不动。
5. **P2-3**（ErrorBoundary 可复位）、**P2-12**（同名去重/旧实例销毁）、**P2-5**（deviceInfo 契约）——B 档；其中 P2-5 会改变 telemetry 字段内容（lazy-image 的 ErrorTracking / PerformanceMonitor 把整个 `deviceInfo` 透传给上报），需与埋点方确认。

### 批次 3（涉及下游配合，必须同批复核）
6. **P1-2**（增量对齐）——建议实现为「diff + 按插件对象幂等 + 由装配器显式 `execute("onMount")`」，**不做 register 阶段自动挂载**；此时 13 个组件零改动，GalleryCore 保持现状（不挂载）。
7. **P1-5**（超时失效）——**必须限定生命周期钩子**；若限定，批次 3 可合入；若扩大，必须与 vane-lazy-image 数据插件同批。
8. **P2-11**（unregister 回收）——**必须与 `vane-lazy-image` 热替换 demo 同批复核**（该 demo 依赖「unregister 只影响 manager」的旧语义）。

### 必须一次性同步发布的组合（风险叠加）
| 组合 | 原因 |
| --- | --- |
| **P1-2 + P2-11** | 都在改「注册/反注册」语义；分开发布会出现「新插件已自动挂载、旧插件却被 unregister 静默保留」的中间态 |
| **P1-2 + P1-5** | onMount 幂等/代次机制共用一套生命周期账本，拆开会重复实现且时序不一致 |
| **P1-3 + enabled 相关测试（lazy-image/file-preview/profile）** | 行为变更若不同批补测试，三处 `enabled:false` 语义容易被误判为回归 |
| **P1-1 与 P1-3** | 两者本身独立，**不需要**强制同批；但同一 PR 内改动会把「卸载时序」与「停用过滤」两个可观测变化叠在一起，不利于问题定位，建议分批提交 |

---

## 六、发布与验证建议（不做代码变更）

1. **发布前**：在 plugin-core 新增 5 类回归（时序 / 重装配 diff / enabled / 循环依赖 / 超时作用域），测试先行，确保在旧实现上先红。
2. **发布说明**：明确三条可观测语义变化——(a) 卸载时 onUnmount 先于 cleanup；(b) `enabled:false` 不再参与 transform；(c) 循环依赖从「抛错」变为「降级 + 告警」。
3. **组件侧**：本批修复不需要任何组件改调用；仅建议在 vane-lazy-image（gallery）、vane-sku、vane-coupon、vane-waterfall、vane-modal-sheet 补/保留对应回归。
4. **不做**：不改 `package.json` 版本、不提交不推送。体积预算原计划不动；**2026-11-04 经用户拍板由 5KB 调整为 5.5KB**（第一轮七项修复实测入口 gzip 5.2803KB），见 `tasks/69` §5.6；**第二轮 P2 后再次上调至 6KB**（实测 5.7236KB），见 `tasks/69` §6.6 与 `tasks/72` §9。两次调整只放宽预算，不改变任何兼容性档位与调用方契约。
5. **第二轮 P2 复核（2026-11-04）**：P2-5 最终取方案 A —— `os`/`browser` 保持 UA 原值，仅在 README 说明「改短名属破坏性变更，暂不提供」，因此本文 §五批次 2 中「P2-5 会改变 telemetry 字段、需与埋点方确认」的风险**未发生**，档位实际为 **A（仅文档）**。P2-14 补齐类型声明（`clear(): Promise<void>`），属于声明与运行时对齐，不改调用方式：根 typecheck 16/16，**14 个组件零改动**。

---

## 七、已证实 vs 推断汇总

| 结论 | 等级 |
| --- | --- |
| 13 个组件插件数组运行期固定、重装配不可触发 | 已证实（HOC 闭包 + `stablePlugins` 比较逻辑） |
| GalleryCore 内联插件会导致每次渲染重注册 | 已证实路径；触发频率取决于调用方（推断） |
| GalleryCore 从未调用 `execute("onMount")` | 已证实（无调用点） |
| `manager.clear()` 不清 bus/shared | 已证实 |
| 无组件在 onUnmount 访问 manager | 已证实（context 不暴露） |
| 无组件调用 `manager.disable/unregister`（demo 除外） | 已证实 |
| 无组件依赖「disabled 仍 transform」 | 已证实（全仓检索 + 插件内部自判断） |
| P1-4 若改缺失依赖策略会改变 resume 行为 | 已证实依赖链；行为变化为推断 |
| P1-5 扩大超时作用域会丢 lazy-image 缓存/统计 | 推断（基于插件实现路径，未做慢网实测） |
| 组件卸载时 containerRef 读取时序不变 | 推断（React 提交阶段语义，未在本轮实测） |
