# vane-plugin-core 组件分析报告（核心功能专项）

- 日期：2026-11-04
- 范围：`packages/plugin-core` 全部源码（`src/**` 11 个文件）、类型定义、对外导出、README/CHANGELOG、4 个测试文件
- 方法：security-best-practices（前端安全基线）+ vercel-react-best-practices（并发/性能规则）逐项核对；手工走查 14 个依赖组件的接线方式；仓库门禁实跑一轮
- 性质：**只读审计**，未修改任何业务源码、版本号、体积预算，未提交/推送
- 结论速览：**核心架构方向正确，未发现 P0；存在 5 项 P1 结构性缺陷与 15 项 P2**。P1 集中在“生命周期时序、重装配对齐、启停语义、错误隔离承诺、超时执行”五条边界路径——它们不在默认 happy path 上，但会在动态插件、卸载、超时、循环依赖等合法用法下静默失效。

---

## 一、结论摘要

| 维度 | 结论 |
| --- | --- |
| 是否存在结构性缺陷 | **是**（5 项 P1，均为语义/时序层面，不是代码风格问题） |
| P0 | **0 项**（无崩溃/越权/数据丢失的默认路径缺陷） |
| P1 | **5 项**（P1-1 ~ P1-5，见第三节） |
| P2 | **15 项**（P2-1 ~ P2-15） |
| XSS | 无直接 sink（全包 0 命中 `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function`） |
| 原型污染 | 1 处局部风险（`PluginBus.getAll()`，P2-4），非全局污染 |
| 门禁 | typecheck / lint / test / build **全部通过**（16/16 tasks；plugin-core 37 tests） |
| 测试有效性 | 门禁绿但 P1-1 未被覆盖——现有用例只断言“onUnmount 被调用”，未断言与 clear 的先后顺序 |

一句话：**它不是“不能用”，而是“对外承诺比实际实现更强”**。README 承诺的错误隔离、生命周期、启停语义，在边界路径上需要调用方自己兜底；目前 14 个组件正是靠各自的 workaround 在维持正确行为。

---

## 二、架构理解（它到底承诺了什么）

### 2.1 分层

```
宿主组件 (Core, forwardRef)
   └─ withPlugins HOC （或领域包自写的 withXxxPlugins）
        ├─ usePluginRuntime：实例级 runtime（manager + bus + context + state）
        │    ├─ createPluginManager：注册/排序/executeHook/clear
        │    ├─ createPluginBus：emit/on/once + 数据键
        │    └─ resolveDependencyOrder：拓扑 + priority
        ├─ context：props / data / bus / refs / state / shared / deviceInfo / logger
        └─ composeSlots：before-header → children → overlay → after-header → footer
             └─ renderPluginSlot：每插件一个 PluginErrorBoundary
```

### 2.2 关键约定（来自 README + 类型注释 + 领域包注释）

1. **一个宿主实例一套 runtime**：bus、state、shared 均实例级，卸载时 `clear()`。
2. **执行顺序唯一来源**：依赖拓扑优先，其次 priority 降序，平级保持注册顺序。
3. **钩子返回语义**：`false` 中断链；其他非 `undefined/true` 短路；生命周期钩子返回函数 = 清理函数（clear 时逆序执行）。
4. **错误隔离**：单插件抛错不打断其他插件，错误进入 `getErrors()`；渲染钩子单插件抛错只丢自己一段。
5. **启停**：`enabled:false` 或 `manager.disable()` 控制插件是否参与。
6. **SSR**：`detectDevice` 对无 window 环境安全降级。

### 2.3 14 个组件的实际接线方式（决定了影响面）

- **使用内核 HOC `withPlugins`**：resume、waterfall、file-preview、lazy-image、card 等（部分包另有自己的 HOC 包装）。
- **直接使用 `usePluginRuntime` 自写 HOC**：activity、candidate、coupon、sku、danmaku、comment、profile、sign-in、modal-sheet 等。
- 这些 HOC 都必须自己处理 `onMount`（内核通用 HOC 只在 Core 回调触发，`usePluginRuntime` 本身不自动跑）。因此**内核重装配行为会直接改变它们的订阅生命周期**——这也是为什么 sku/coupon 已经被迫写 workaround。

---

## 三、问题分级表

> 证据分级：**已证实** = 静态代码路径可直接推导，或门禁/测试可复现；**推断** = 依赖运行环境/并发时序，未在本轮实测。

| 编号 | 级别 | 标题 | 位置 | 证据等级 | 影响面 |
| --- | --- | --- | --- | --- | --- |
| P1-1 | P1 | 卸载时 `clear()` 先于 `onUnmount` 钩子体执行 | `react/usePluginRuntime.ts:137-143`、`manager/PluginManager.ts:111-129`、`sandbox/PluginSandbox.ts:31` | 已证实 | 全部 14 个组件 |
| P1-2 | P1 | 插件集合变更重装配未对齐生命周期（新增不 onMount、移除不 onUnmount、未变更订阅丢失） | `usePluginRuntime.ts:114-131` | 已证实（sku/coupon 的补偿代码为旁证） | 动态插件场景：activity/candidate/sku/coupon/danmaku 等 |
| P1-3 | P1 | `enabled:false` / `manager.disable()` 与数据管线、渲染链路语义不一致 | `usePluginRuntime.ts:145-148,185-226`、`PluginManager.ts:43-45,139-146` | 已证实 | 全部 14 个组件 |
| P1-4 | P1 | 循环依赖 / 排序异常穿透渲染与异步链，违背“错误隔离” | `DependencyResolver.ts:37-43`、`usePluginRuntime.ts:145-148`、`PluginManager.ts:72` | 已证实（静态） | 声明 `dependencies` 的插件族 |
| P1-5 | P1 | 沙箱超时不取消底层任务，迟到 cleanup 永久丢失 / 潜在 unhandled rejection | `PluginSandbox.ts:23-34`、`PluginManager.ts:79-103` | 已证实（静态） | 异步初始化插件 |
| P2-1 | P2 | `once` handler 抛错后不注销 | `PluginBus.ts:36-42` | 已证实 | 使用 once 的插件 |
| P2-2 | P2 | 错误账本无上限、clear 不清空、transform/render 错误不入账 | `PluginManager.ts:33,88,111-129`、`usePluginRuntime.ts:192-221`、`slots.tsx:61-64` | 已证实 | 监控/长生命周期应用 |
| P2-3 | P2 | ErrorBoundary 命中后不复位，瞬时错误导致插件槽位永久空白 | `sandbox/PluginErrorBoundary.tsx:17-35` | 已证实（静态） | 全部使用槽位的组件 |
| P2-4 | P2 | `getAll()` 对 `__proto__`/`constructor` 键的局部原型改写 | `PluginBus.ts:75-81` | 已证实（推理可复现） | 使用 getAll 的调试/持久化 |
| P2-5 | P2 | deviceInfo 契约不符（os/browser=UA）、缓存不刷新、SSR 水合偏差 | `utils/detectDevice.ts:9-34`、`types.ts:21-30` | 契约/缓存已证实；水合为推断 | lazy-image 等响应式/设备判定插件 |
| P2-6 | P2 | 数据管线不保证不可变，浅比较掩盖原地修改 | `usePluginRuntime.ts:39-51,206-226` | 已证实（静态） | 全部 transform 插件 |
| P2-7 | P2 | `setData → emit → handler → setData` 重入无环检测 | `PluginBus.ts:11-22,62-66` | 推断（可由联动插件触发） | coupon/sku/activity 联动 |
| P2-8 | P2 | 依赖被禁用被当作缺失，依赖方仍执行 | `PluginManager.ts:40-41`、`DependencyResolver.ts:34-35` | 已证实 | 声明依赖的插件 |
| P2-9 | P2 | 通用 HOC 不接线 onPropsChange / transformData / data | `withPlugins.tsx:24-54`、`types.ts:202-207` | 已证实 | 直接使用 `withPlugins` 的消费者 |
| P2-10 | P2 | executeHook 每次重排拓扑、槽位每次渲染 filter/sort | `PluginManager.ts:40-41,72`、`slots.tsx:28-47` | 已证实 | 30 插件规模的 activity 等 |
| P2-11 | P2 | unregister 不回收 cleanup、不调用 onUnmount | `PluginManager.ts:56-65` | 已证实 | 热插拔场景（lazy-image demo） |
| P2-12 | P2 | 同名插件覆盖不销毁旧实例；槽位不去重导致重复 key | `PluginManager.ts:43-45`、`slots.tsx:56-60` | 已证实 | 动态注册场景 |
| P2-13 | P2 | contextRef 渲染期赋值，并发渲染/卸载后可能读到过期 context | `usePluginRuntime.ts:150-183,228-232` | 推断（并发特性） | 开启 transition/Suspense 的宿主 |
| P2-14 | P2 | clear/register 不 await 异步 destroy/init | `PluginManager.ts:43-50,56-65,111-129` | 已证实 | 异步资源插件 |
| P2-15 | P2 | HOC 静默覆盖 containerRefExternal/children/debug | `withPlugins.tsx:35-54` | 已证实 | 直接使用 `withPlugins` 的宿主 |

---

## 四、最关键的 5 条问题（要点 + 证据 + 修复方向）

### 1. P1-1 卸载时序倒置（最需要优先修）

```ts
// usePluginRuntime.ts:137-143
useLayoutEffect(() => () => {
  void manager.executeHook("onUnmount", contextRef.current!); // async，首个 await 前不执行钩子体
  manager.clear();                                            // 同步执行 cleanups + destroy + 清表
}, [manager]);
```

`executeHook` 内部第一次 `await` 发生在 `runHookInSandbox`（默认开启），钩子体被排进 microtask；`clear()` 立即同步执行。**结果是清理函数和 destroy 先跑、onUnmount 后跑**，与文档/注释声明的顺序相反。插件在 onUnmount 里读 bus、写共享状态、flush 日志时会发现总线已清空、插件表已删除。

修复方向：卸载链串行化（await onUnmount 完成再 clear），并补“顺序”断言。

### 2. P1-2 重装配没有生命周期对齐

`stablePlugins` 变化 → `clear()`（执行所有插件 cleanups）→ `registerAll()`（只 register，不 onMount）。新增插件收不到 onMount，移除插件收不到 onUnmount，未变更插件的旧订阅被清掉且不重建。

现状是各领域包自行打补丁：sku 用 `mountedPluginsRef` 判断是否补跑；coupon 直接依赖 `runtime.orderedPlugins` 无脑重跑；activity/candidate 只依赖 `[execute]`，动态场景不补跑。**同一内核行为，三种补偿策略**，这是结构性风险的直接证据。

修复方向：manager 提供按 name + 引用身份的 diff/rebind，cleanup 绑定插件名与代次。

### 3. P1-3 启停语义割裂

- `enabled:false`：渲染被过滤，但 `transformProps/transformData` 不过滤 → 被“关闭”的插件仍在改数据。
- `manager.disable()`：改的是 `register()` 时 spread 出来的**副本**，而 `runtime.orderedPlugins` 用的是 HOC 传入的**原始对象** → disable 对渲染/数据完全无效。

对敏感词过滤、价格联动、联系方式脱敏这类插件，这是“看起来关了其实没关”的静默失效。

修复方向：runtime 与 manager 共用同一份规范化插件表；所有链路统一按 `enabled` 过滤；enable/disable 触发排序失效。

### 4. P1-4 错误隔离在“排序阶段”失效

`resolveDependencyOrder` 在循环依赖时 `throw`，而它在 `useMemo` 的渲染期被调用（`usePluginRuntime.ts:145-148`），异常发生在 HOC 自身 render 内，错误边界接不住 → 整棵宿主子树白屏。`manager.executeHook` 里的 `ordered()` 抛错则变成未捕获的 Promise rejection（`withPlugins` 用 `void runtime.execute(...)`）。

修复方向：排序失败降级为注册顺序 + 记入 errors；executeHook 捕获排序异常；文档说明依赖环的降级策略。

### 5. P1-5 超时只“放弃等待”，不“终止执行”

`Promise.race` 不会取消 `fn()`。超时后：底层任务继续跑、迟到返回的 cleanup 永远不会登记、迟到 reject 可能变成 unhandledrejection、迟到副作用可能写进已卸载实例的 bus。默认 3000ms 超时意味着“慢网/大图解码”这类合法场景会触发。

修复方向：代次令牌/AbortSignal 失效化 + cleanup 按代次回收。

---

## 五、做得好的部分（避免只呈现问题）

| 维度 | 评价 |
| --- | --- |
| 结构分层 | bus / manager / dependency / sandbox / react 五层职责清晰，无循环依赖，入口图 gzip 4.64KB 符合 5KB 预算 |
| 渲染隔离 | 每个插件槽位独立 `PluginErrorBoundary`，单插件渲染抛错不牵连整条插槽（有测试覆盖） |
| 数据键通知 | `setData` 先落库再 emit、值不变不重复通知、`deleteData` 载荷 undefined——消费侧语义清楚（有测试覆盖） |
| 排序语义 | 依赖约束绝对优先、优先级只在就绪候选中生效、平级保序（有 5 条单测） |
| 浅比较稳定化 | props/data 内容不变时复用引用，避免父组件内联对象打穿 context（有测试覆盖） |
| 槽位 key | 按插件名生成，调整顺序不重挂载子树（有测试覆盖） |
| 安全基线 | 无 HTML 注入 sink、无 eval、无凭据读取 |
| 文档 | README/CHANGELOG 对 0.1.1 的修复点记录准确，槽位兼容策略有注释说明 |

---

## 六、建议修复顺序（按风险/收益）

| 顺序 | 项 | 理由 |
| --- | --- | --- |
| 1 | P1-1 | 影响面 100%，改动小（卸载链串行化），且能立刻消除“卸载期读到空状态”的隐性 bug |
| 2 | P1-3 | 影响面 100%，是语义正确性问题；实现可收敛为“单一插件事实源”，收益高 |
| 3 | P1-4 | 失败模式是整页白屏/未捕获 rejection，属于稳定性底线 |
| 4 | P1-2 | 改动最大（diff/rebind + 代次），但会同时让 sku/coupon 的 workaround 可以移除 |
| 5 | P1-5 | 与 P1-2 的代次机制共用基础，建议在同一轮实现 |
| 6 | P2-1 / P2-3 / P2-4 | 单点小修，风险低，可顺带在 P1 同一 PR 内完成 |
| 7 | P2-2 / P2-11 / P2-12 / P2-14 | 可观测性与资源回收，配合 P1-2 的 manager 改造一起做 |
| 8 | P2-5 / P2-6 / P2-9 / P2-15 | 契约/文档类，需要同步 README 与模板文档 |
| 9 | P2-7 / P2-8 / P2-10 / P2-13 | 防御性与性能优化，放最后 |

---

## 七、门禁实跑记录

| 命令 | 结果 | 关键数据 |
| --- | --- | --- |
| `pnpm typecheck` | 通过 | 16/16 tasks successful，25.8s；plugin-core `tsc --noEmit` 0 错 |
| `pnpm lint` | 通过 | 15/15 tasks successful，16.4s；0 error，warning 均为既有风格类（react-refresh / no-explicit-any） |
| `pnpm test` | 通过 | 16/16 tasks successful，42.5s；plugin-core 4 个测试文件 / 37 条用例全绿 |
| `pnpm build` | 通过 | 16/16 tasks successful，34.9s；plugin-core 主入口 gzip ≈ 4.64KB（预算 5KB） |

说明：
- 四项门禁对 plugin-core 均适用，本包有独立脚本（`tsc --noEmit` / `eslint .` / `vitest run` / `vite build --mode lib`）。
- 本轮按要求只跑一轮，未重复构建；未跑 `pnpm check` / `check:structure` / `check:config`（不在这四项范围内）。
- **门禁全绿 ≠ P1-1 不存在**：现有 `test/usePluginRuntime.test.tsx:41-56` 只断言 onUnmount 被调用，没有断言它与 cleanup 的先后关系；这是测试盲区，建议在 P1-1 修复时同步补上。

---

## 八、附：问题清单与实施清单

- 逐条证据与复现路径：`tasks/68-plugin-core-分析.md`
- 可执行整改项 + 验收标准 + 回归测试要求：`tasks/69-plugin-core-实施清单.md`
</content>
