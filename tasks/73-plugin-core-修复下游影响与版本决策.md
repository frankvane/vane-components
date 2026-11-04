# 73 · plugin-core 两轮修复的下游影响与版本决策（只读评估）

> 评估对象：`packages/plugin-core` 已合入 main 的两个提交 `dcfae58`（第一轮 P1/P2）、`1c21a47`（第二轮 P2 + 类型补齐）
> 下游范围：14 个 vane 组件（activity / candidate / card / comment / coupon / danmaku / file-preview / lazy-image / modal-sheet / profile / resume / sign-in / sku / waterfall）
> 方式：只读静态审计 + **实跑 14 个包的全部测试套件**；未改代码、未升版本、未发包
> 结论速览：**组件侧 0 个需要改代码**（历史补偿代码变为冗余但无害）；但**实跑发现 5 个测试套件各 1 例失败**（comment / sign-in / coupon / waterfall / file-preview），其中 4 例疑似内核第二轮回归，属于**发布阻塞项**。plugin-core 需要新版本（npm 上的 `0.1.1` 早于本次修复），建议 `0.1.2` patch，但须先修回归再发。

---

## 一、结论标记约定

- **[已核实]**：直接读到的源码/行号，或本次实跑得到的测试结果。
- **[推断]**：基于代码结构与调用路径的推理，未做运行时验证（尤其“旧版本是否本就失败”，因不做破坏性 checkout 无法确证）。

---

## 二、内核变更 → 下游命中判定（逐条）

| # | 内核变更 | 是否命中下游 | 命中位置与触发条件 |
|---|---|---|---|
| 1 | onUnmount 链跑完才 clear | **命中全部 14 个** | 所有包的 `with*Plugins` 都靠内核卸载；但这些包**没有**任何 `onUnmount` 依赖“cleanup 已先执行”的假设（[已核实] 逐个 `onUnmount` 均只清自己的 timer/监听或写统计），故**无需改代码**，行为按文档语义变得正确 |
| 2 | 重装配改差集 align（register 不自动 onMount） | **命中 4 个**：sku、lazy-image（gallery）、profile（TabSync 重建）、coupon（自带补偿） | sku [SkuPlugin/withPlugins.tsx:95-100](file:///e:/react-plugin-component/packages/vane-sku/src/components/SkuPlugin/withPlugins.tsx#L95-L100) `props.plugins ?? defaultPlugins`；sku 补偿 [:268-281](file:///e:/react-plugin-component/packages/vane-sku/src/components/SkuPlugin/withPlugins.tsx#L268-L281)；coupon 补偿 [CouponPlugin/withPlugins.tsx:103-110](file:///e:/react-plugin-component/packages/vane-coupon/src/components/CouponPlugin/withPlugins.tsx#L103-L110)；lazy-image GalleryCore 接受 `plugins` prop（运行时切域插件）。触发条件：宿主在同一次挂载期内**替换插件数组元素身份**（不是重建组件类型）。其余 10 个包插件数组在 `withPlugins()` 创建期固定，不会触发 align |
| 3 | `enabled:false` 真正停用 transformProps/transformData | **命中 1 个**：profile | [TabSyncPlugin/create.tsx:62](file:///e:/react-plugin-component/packages/vane-profile/src/custom-plugins/TabSyncPlugin/create.tsx#L62) 在拿到 tabs 之前返回 `enabled:false` 的空插件（无任何钩子）→ 过滤与不过滤等价，**行为不变**。lazy-image 的 `enabled` 是**插件 config 里的业务开关**，不是插件对象级 `enabled`，不命中 |
| 4 | 循环依赖降级为注册序+记错；缺失依赖仍照跑+告警 | **不命中** | [已核实] 14 个包内无 `dependencies` 形成环；resume 的 `ai-polish → multi-lang` 只声明单向依赖，且两插件都内置，不存在缺失依赖。红线（缺失依赖照跑）未被任何包依赖到临界路径 |
| 5 | generation token 丢弃迟到结果与 cleanup | **命中 lazy-image、candidate**（数据面异步钩子） | lazy-image 有网络/IndexedDB/视口异步钩子（onLoad 链路）；candidate 有异步数据加载。触发条件：钩子尚未 resolve 时**发生 align**（仅 lazy-image gallery / sku 可能）。lifecycle 钩子（onMount/onUnmount/onPropsChange/onError）在静态装配下 generation 从不变化，不命中 |
| 6 | `PluginManager.clear()` 返回 Promise | **命中 0 个** | [已核实] 14 个包的 `src`、`test`、`demo` 均**没有**直接调用 `manager.clear()`；只有内核 `usePluginRuntime` 内部 `void task.finally(() => manager.clear())`。忽略返回值也不产生类型错误（根 typecheck 16/16 已证） |
| 7 | context 快照改提交阶段赋值 | **命中全部 14 个**（潜在） | 所有包都经 `runtime.execute` 读 `contextRef`。首帧/提交期读写同一渲染值的路径与旧实现一致；**但**若包自建的 context 对象每次渲染换身份，内核 `transformData` 缓存键（`[orderedPlugins, context]`）失效 → 见第四节失败项 |
| 8 | emit 深度保护（上限 50） | **不命中 [推断]** | 全仓未发现“handler 内再次 emit 同一事件”的递归联动；各包 emit 多为单向通知（claim/validity/load-progress） |
| 9 | 同名插件去重 + 槽位只渲染第一个 | **不命中 [推断]** | 预置插件命名唯一；activity 的互斥组合由 `resolveExclusivePlugins` 在装配前剔除，不产生同名注册。lazy-image 热替换 demo 用 `manager.unregister` 先删后加，不产生同名并存 |
| 10 | 错误边界 resetKeys / `getAll()` 原型键 | **不命中** | [已核实] 14 个包无 `resetKeys`/`onReset` 消费；无 `bus.getAll()` 调用；无 `__proto__` 键写入 |

**小结**：没有任何组件需要为“新语义”改代码；所有历史补偿（sku/coupon 的手工补跑 onMount）在内核 align 后**幂等冗余**，属可选清理（D 档，非阻塞）。

---

## 三、总表（14 个组件）

| 组件 | 本地 version | npm 已发布 | 插件集合形态 | 命中项 | 需改代码 | 版本建议 | 依据 |
|---|---:|---:|---|---|---|---|---|
| vane-activity | 0.1.0 | 0.1.0 | `withPlugins()` 创建期固定 | 1、7 | 不需要 | 被动 patch → **0.1.1** | [已核实] 测试 34/34 通过 |
| vane-candidate | 0.1.0 | 0.1.0 | 创建期固定 | 1、5、7 | 不需要 | 被动 patch → **0.1.1** | [已核实] 14/14 通过 |
| vane-card | 2.0.2 | 2.0.2 | 创建期固定（demo 换组件类型） | 1、7 | 不需要 | **2.0.3**（内置内核，需重发） | [已核实] 203/203 通过 |
| vane-comment | 0.2.1 | 0.2.1 | 创建期固定 | 1、7 | **不改包代码**；需内核侧修复 | patch → **0.2.2**（待回归修复后） | [已核实] 1 失败：`CM-P2-1` transformData 跑 2 次 |
| vane-coupon | 0.2.0 | 0.2.0 | 创建期固定 + 自带 onMount 补偿 | 1、2、7 | **不改包代码**；需内核侧修复 | patch → **0.2.1**（待修复后） | [已核实] 1 失败：`CP-P2-4` renderHeader 跑 2 次 |
| vane-danmaku | 0.1.0 | 0.1.0 | 创建期固定 | 1、7 | 不需要 | 被动 patch → **0.1.1** | [已核实] 32/32 通过 |
| vane-file-preview | 2.0.2 | 2.0.2 | 创建期固定（组合工厂） | 1、7 | 不需要 | **2.0.3**（内置内核；先解决 dist 预算失败） | [已核实] 282/283 通过，失败为 dist 体积预算 |
| vane-lazy-image | 2.1.1 | 2.1.1 | **运行时可替换**（GalleryCore `plugins` prop） | 1、2、5、7 | 不需要（补偿/文档可选） | **2.1.2**（内置内核，需重发） | [已核实] 75/75 通过（仅静态装配测试，gallery 动态路径靠 demo） |
| vane-modal-sheet | 0.1.0 | 0.1.0 | 创建期固定 | 1、7 | 不需要 | 被动 patch → **0.1.1** | [已核实] 65 通过 / 1 skipped |
| vane-profile | 0.2.0 | 0.2.0 | 创建期固定（TabSync 由宿主重建数组） | 1、3、7 | 不需要 | 被动 patch → **0.2.1** | [已核实] 32/32 通过 |
| vane-resume | 0.1.0 | 0.1.0 | 创建期固定 | 1、4、7 | 不需要 | 被动 patch → **0.1.1** | [已核实] 31/31 通过；4 不命中 |
| vane-sign-in | 0.1.1 | 0.1.1 | 创建期固定 | 1、7 | **不改包代码**；需内核侧修复 | patch → **0.1.2**（待修复后） | [已核实] 1 失败：`P2-2 父级无关 setState 不重跑 renderHeader` |
| vane-sku | 0.1.1 | 0.1.1 | **运行时可替换**（`props.plugins`） | 1、2、7 | 不需要（补偿可留） | **0.1.2**（内置内核，需重发） | [已核实] 70/70 通过 |
| vane-waterfall | 2.0.2 | 2.0.2 | 创建期固定 | 1、7 | **不改包代码**；需内核侧修复 | **2.0.3**（内置内核；待修复后） | [已核实] 1 失败：onMount cleanup 卸载时执行 0 次 |

> 版本建议统一为 **patch**：本轮无导出删除/改名/参数收缩，只有 bug fix 与声明对齐；`PluginManager.clear()` 返回值加宽对“调用方忽略返回值”是源码兼容，仅对“外部自行实现该接口”的假想消费者不兼容（仓库内不存在）。
> 若团队对 0.x 采取“行为变化即 minor”的更严格口径，可把 `plugin-core` 定为 `0.2.0`；但其下游 peer 均为精确版本，结论不影响发布顺序。

---

## 四、发布阻塞项（本次实跑发现，需先定位）

| 失败用例 | 组件 | 现象 | 归属判断 | 建议动作 |
|---|---|---|---|---|
| `CM-P2-1 · 同一评论数组连续渲染不再重复跑 transformData` | comment | 父级 setState（props 换对象、`comments` 引用不变）后，`transformData` 由 1 次变 2 次 | **[推断] 内核第二轮回归**：`applyTransform` 以 `context` 对象身份做缓存键，包侧 context 每次渲染换身份时失效 | 内核侧把 transform 缓存键收窄到 `(orderedPlugins, props, data)` 等稳定切片，或在包侧稳定 context；**不应**改断言 |
| `CP-P2-4 · 父组件重渲染（券数据不变）不重复调用 renderHeader` | coupon | `renderHeader` 由 1 次变 2 次 | **[推断] 同源**（context 身份/槽位缓存） | 同上；此例此前被当作“HEAD 既有失败”，本轮无法排除是内核引入 |
| `P2-2 · 父级无关 setState 不重跑 renderHeader` | sign-in | 同型：1 → 2 次 | **[推断] 同源** | 同上 |
| `onMount 返回的清理函数在卸载时执行一次` | waterfall | 卸载时 cleanup 执行 **0 次** | **[推断] 内核回归**：包侧显式 `execute("onMount")` 与内核 align 的 onMount 存在竞态，generation 变化使迟到的 cleanup 被丢弃 | 内核侧让“同名幂等 onMount”在 generation 变化时仍登记 cleanup，或统一去掉包侧补跑（需 kernel 提供确定性时序） |
| dist 体积预算（总 247,289B > 245,760B） | file-preview | dist 超预算约 1.5KB | **[推断] 与内核无关**（内置内核体积 + 组件自身增长；本轮未重建该包 dist） | 重建 dist 复测后决定：调预算或减体积 |

> 说明：4 个疑似内核回归用例的测试文件提交历史（`5cc689e`、`c98ebe0`、`7361d2b`）均早于本轮修复，故“修复前应为绿”属 [推断]；未做 checkout 回退验证（避免破坏性操作）。

---

## 五、版本与依赖范围决策

### 5.1 plugin-core

- 本地 `0.1.1`；npm `0.1.1` 的发布时间为 **2026-11-02**，两个修复提交为 **2026-11-04** → **npm 上的 0.1.1 不含本轮修复**（[已核实] 时间戳对比；tarball 内容未下载核对，属 [推断]）。
- 建议 **`0.1.2`（patch）**，前置条件：第四节 4 个疑似内核回归修完、14 包测试回绿。
- 不建议 major/minor：无导出删除、无参数收缩，`clear(): Promise<void>` 为返回值加宽。

### 5.2 两类下游包

| 类型 | 包 | 内核如何到达 | 必须重发？ | 版本 |
|---|---|---|---|---|
| 外置内核（peer） | activity、candidate、comment、coupon、danmaku、modal-sheet、profile、resume、sign-in | 由 App 安装 `vane-plugin-core`，peer 声明目前是 `workspace:*`，发布时被改写成**精确版本**（当前 0.1.1） | **是**（否则 peer 仍钉在 0.1.1，App 装 0.1.2 会出现 peer 不匹配/双实例） | 各自 patch |
| 内置内核（无 peer） | card、file-preview、lazy-image、sku、waterfall | 内核被打进各自 `dist`（未 external） | **是**（否则修复不会到达消费者） | 各自 patch |

### 5.3 peer/依赖范围建议

- 9 个 peer 包：把 `vane-plugin-core` 从 `workspace:*`（发布后精确 `0.1.1`）改为 **`^0.1.2`**（或 `>=0.1.2 <0.2.0`）。这是**放宽**，目的是让内核补丁可被 App 单点升级，避免同一 App 出现两份内核实例（两份 `PluginBus` 互不可见）。
- 5 个内置包：保持无 peer，但需在 README 标注“内核已内置，跨包插件不共享同一 bus”；不建议为本轮新增 peer（那会把“内置”改成“外置”，破坏体积与安装假设）。
- 发布顺序：`plugin-core 0.1.2` → 9 个 peer 包（改 peer 范围）→ 5 个内置包（重建 dist）。不要在回归未修复时发任何一档。

---

## 六、demo 跟进表

| 组件 | demo 是否演示受影响路径 | 需要改 demo？ | 理由 |
|---|---|---|---|
| activity | `demo/src/pages/PluginsPage.tsx` 用 `useMemo` 重建 `withPlugins` → 插件开关=换组件类型，整树重挂 | 不需要 | [已核实] 未走运行时 align，卸载时序在重挂中自然生效 |
| candidate | 静态 `withPlugins` 配置 | 不需要 | 只走静态装配 |
| card | demo stage 每次切换重建组件类型 | 不需要 | 同上；203 例测试已覆盖 |
| comment | 静态装配 | 不需要 | demo 无动态插件；但需在内核修复后实跑 demo 回归 [推断] |
| coupon | 静态金标配置 | 不需要 | demo 无禁用/热替换；补偿代码在 src，可选清理 |
| danmaku | `PluginsPage` 选择变化重建组件类型 | 不需要 | 不走 align |
| file-preview | `demo/src/lib/previews.tsx` 组合工厂按插件列表创建组件 | 不需要 | 创建期固定 |
| **lazy-image** | **是**：`GalleryPage` 运行时切换域插件（同一 GalleryCore 实例 → align）、`PluginHotReloadDemo` 直接 `manager.unregister`、`DependencyResolverDemo` 自建解析器 | **暂不需要改代码，但必须人工回归** | 唯一覆盖 align + unregister 的 demo；若 align/generation 修复后再复验 |
| modal-sheet | 静态 | 不需要 | 无运行时插件变更 |
| profile | 静态；TabSync 的 `enabled:false` 在主渲染前由宿主重建数组 | 不需要 | 空插件无钩子，禁用语义等价 |
| resume | 静态 | 不需要 | 依赖链单向且完整 |
| sign-in | 静态 | 不需要 | 但需内核修复后复验 demo [推断] |
| sku | demo 用创建期固定配置；`props.plugins` 能力未被 demo 演示 | 不需要 | 若新增“运行时换插件”演示，才需扩展 demo [推断] |
| waterfall | 静态 | 不需要 | demo 无动态装配 |

---

## 七、最需要注意的风险点

1. **当前 5 个套件 5 例失败，4 例疑似内核第二轮回归**（重复执行 transform/render 钩子 ×3、cleanup 丢失 ×1）。在此状态发布 `0.1.2` 会把回归带上 npm，因此**发布阻塞**。
2. **generation 丢弃是静默的**：lazy-image gallery / sku 在 align 窗口内的迟到钩子结果（含数据面）会被直接丢弃且只留 debug 日志，现象是“偶发不更新/不加载”，难排查。
3. **版本矩阵耦合**：9 个 peer 精确钉死 + 5 个包内置内核，只升 plugin-core 不会自动传播；必须一次性协同发布，否则同一 App 可能同时存在两份内核（bus/manager 各自独立，跨包插件互通失效）。

---

## 八、核实清单

- [已核实] 14 个包 `package.json` 本地 version 与 npm 已发布 version 完全一致（0.1.0×4、0.1.1×3、0.2.0×2、0.2.1×1、2.0.2×3、2.1.1×1）。
- [已核实] 14 个包全量测试实跑：9 个全绿（activity 34、candidate 14、card 203、danmaku 32、lazy-image 75、modal-sheet 65+1skip、profile 32、resume 31、sku 70），5 个各 1 例失败（comment、coupon、file-preview、sign-in、waterfall）。
- [已核实] 14 个包源码中无 `manager.clear()` / `manager.disable()` / `manager.enable()` 的直接调用。
- [已核实] 9 个包 `peerDependencies` 为 `workspace:*`；card / file-preview / lazy-image / sku / waterfall 无 peer 声明。
- [推断] 4 例内核回归可归因于 `1c21a47` 的 context 快照/缓存键与 align 竞态（未做提交级 bisect）。
- [推断] `vane-plugin-core@0.1.1` tarball 不含本次修复（依据发布时间 2026-11-02 vs 提交时间 2026-11-04）。
