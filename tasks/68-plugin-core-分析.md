# 68 · vane-plugin-core 分析（核心功能审计 · 只读）

> 审计对象：`packages/plugin-core`（vane 插件运行时 / 插件总线）
> 审计方式：只读静态审计 + 仓库门禁实跑；未修改任何业务源码、package.json、体积预算
> 依赖面：14 个 vane 组件（activity / candidate / card / comment / coupon / danmaku / file-preview / lazy-image / modal-sheet / profile / resume / sign-in / sku / waterfall）均声明 `vane-plugin-core` 依赖
> 结论速览：**无 P0**；**5 项 P1**（生命周期顺序、重装配对齐、enabled 语义、错误隔离穿透、超时不取消）；**15 项 P2**。核心架构方向正确，但“对外承诺的错误隔离 / 生命周期 / 启停语义”在边界路径上存在结构性缺口。

---

## 一、对外能力清单（以源码 + README 为准）

| 能力 | 对外承诺 | 源码位置 | 审计结论 |
| --- | --- | --- | --- |
| 注册 / 批量注册 | 同名插件按 name 唯一 | `src/manager/PluginManager.ts:43-54` | 事实是“后者覆盖前者”，旧实例不销毁（见 P2-12） |
| 卸载 / 清空 | clear 时逆序执行清理函数并 destroy | `PluginManager.ts:56-65`、`111-129` | clear 本身可用；与 onUnmount 的先后顺序被破坏（P1-1） |
| 渲染包装 | `withPlugins` 装配三槽 + 生命周期转发 | `src/react/withPlugins.tsx:18-70` | 只转发 onMount/onUnmount/onError（P2-9） |
| 渲染隔离 | 单插件 render 抛错只丢自己一段 | `src/react/slots.tsx:48-65`、`sandbox/PluginErrorBoundary.tsx:17-35` | 同步抛错已隔离；边界实例不会自愈（P2-3） |
| 执行隔离 | 单插件 hook 抛错记入 getErrors 并继续 | `PluginManager.ts:67-109`、`PluginSandbox.ts:13-35` | 抛错路径可用；超时路径不取消底层任务（P1-5） |
| 依赖解析 | 拓扑 + 优先级，循环依赖检测 | `src/dependency/DependencyResolver.ts:19-61` | 循环依赖 throw 穿透到渲染（P1-4） |
| 数据流水线 | transformProps / transformData 链式改写 | `usePluginRuntime.ts:185-226` | 不校验 enabled、不保证不可变（P1-3 / P2-6） |
| 事件 + 数据总线 | emit/on/once/off + getData/setData | `src/bus/PluginBus.ts:7-88` | once 异常路径泄漏（P2-1）；getAll 原型键（P2-4） |
| SSR | 注释声明“SSR / 无 window 安全降级” | `src/utils/detectDevice.ts:9-34` | 不抛错，但会产生服务端/客户端设备判定不一致（P2-5） |
| 启停 | enable/disable 控制插件参与 | `PluginManager.ts:139-146` | 只影响 manager 执行，不影响渲染与数据管线（P1-3） |

入口导出：`src/index.ts`（bus / manager / dependency / sandbox / react / detectDevice）；子路径 `./bus`、`./manager`、`./react`、`./types`。

---

## 二、P0（0 项）

默认用法（静态插件数组、常规 onMount/onUnmount、同步渲染钩子）下未发现崩溃、越权、数据丢失或 XSS 类 P0。
安全面：`plugin-core` 全量 grep `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` **0 命中**（已证实），不存在直接 HTML 注入 sink；用户数据仅以 JSX/插件返回值透传，转义责任在领域插件。

---

## 三、P1（5 项）

### P1-1 卸载时序倒置：`clear()` 先于 `onUnmount` 钩子体执行
- 位置：`src/react/usePluginRuntime.ts:137-143`；`src/manager/PluginManager.ts:111-129`；`src/sandbox/PluginSandbox.ts:30-34`
- 证据（静态可证）：
  ```ts
  // usePluginRuntime.ts:137-143
  useLayoutEffect(() => () => {
    void manager.executeHook("onUnmount", contextRef.current!);
    manager.clear();          // 同步执行
  }, [manager]);

  // PluginSandbox.ts:31
  try { return await Promise.race([Promise.resolve().then(fn), timeoutGuard]); }
  ```
  `executeHook` 是 async，循环内首个 `await runHookInSandbox(...)` 会把 `fn` 排进 microtask；调用方 `void` 后立即同步 `clear()`。因此 **清理函数（cleanups.reverse()）与 destroy 一定先于任何 onUnmount 钩子体**执行。
- 触发路径：任意宿主组件 `root.unmount()` / 路由切页 / 弹层关闭，只要插件在 onMount 里返回过清理函数（取消订阅、clearInterval）或实现了 destroy。
- 影响面：全部 14 个组件。插件在 onUnmount 中读 bus 数据、写共享状态、上报统计时，**cleanup 已经先解除了插件自己注册在 bus 上的订阅**、插件表已删除（注意：`manager.clear()` 并不清空 bus store/handlers，bus 对象与 `context.shared` 仍然存活）；cleanup 与 onUnmount 的依赖顺序假设全部失效。现有用例 `test/usePluginRuntime.test.tsx:41-56` 只断言“onUnmount 被调用”，**未断言与 clear 的相对顺序**，所以门禁是绿的。
- 修复方向：让卸载流程串行——`await executeHook("onUnmount")` 完成后再 `clear()`（用 async effect 清理或在 `clear` 内部先执行 onUnmount 再跑 cleanups），并补“cleanup 必须晚于 onUnmount”的回归用例。

### P1-2 插件集合变更重装配没有生命周期对齐：新插件不 onMount、旧插件不 onUnmount、未变更插件订阅被清空后不再重建
- 位置：`src/react/usePluginRuntime.ts:114-131`（重装配 effect）、`137-143`（卸载 effect）、`PluginManager.ts:111-129`
- 证据：
  ```ts
  useLayoutEffect(() => {
    manager.clear();               // 执行所有插件的 onMount cleanups + destroy，并清空插件表
    manager.registerAll(stablePlugins);  // 重新注册，但不调用任何人 onMount
  }, [stablePlugins]);
  ```
  `clear()` 不区分“被移除 / 未变更 / 新增”，一律执行 cleanups；重新注册后也没有事件通知 runtime 去重跑 onMount。于是：
  - 新增插件：从未收到 onMount，键盘监听 / 定时器 / bus 订阅不会建立；
  - 被移除插件：没有 onUnmount，只有 destroy；
  - 未变更插件：旧订阅被清掉，若不重跑 onMount 则永久失效。
- 现实证据（各领域包被迫各自补偿，且策略不一致）：
  - `vane-coupon/src/components/CouponPlugin/withPlugins.tsx:103-110`：显式依赖 `runtime.orderedPlugins` 重跑 onMount，并注释“内核在插件引用变化时会 clear() + registerAll()”；
  - `vane-sku/src/components/SkuPlugin/withPlugins.tsx:268-281`：自行维护 `mountedPluginsRef` 补跑 onMount，注释“否则 KeyboardNav 的监听会丢失（P2-6）”；
  - `vane-activity/.../withPlugins.tsx:192-195`、`vane-candidate/.../withPlugins.tsx:273-276`：只依赖 `[execute]`，插件数组变化时**不会**重跑 → 动态增删场景直接丢订阅。
- 触发路径：`usePluginRuntime` 公开 API 传入运行时变化的 `plugins` 数组（插件工坊勾选、热替换、按配置启用/禁用）；或领域包按配置重建插件数组。
- 影响面：sku / coupon（已有手工补丁，但依赖注释与内核内部行为，脆弱）；activity / candidate / danmaku / card / comment / waterfall / profile / resume / sign-in / lazy-image / file-preview / modal-sheet（动态场景下无补偿或补偿方式不同）。
- 修复方向：把“注册 / 反注册”收敛到 manager 的增量 diff（同名同引用复用、新增跑 onMount、移除跑 onUnmount + 清理），并给清理函数绑定插件名与“代次”，避免 clear 误伤未变更插件。

### P1-3 `enabled:false` / `manager.disable()` 语义在三条链路不一致：禁用插件仍改写 props/data
- 位置：`src/react/usePluginRuntime.ts:145-148`、`185-226`；`PluginManager.ts:40-44`、`139-146`
- 证据：
  ```ts
  // orderedPlugins：不过滤 enabled
  const orderedPlugins = useMemo(() => resolveDependencyOrder(stablePlugins), [stablePlugins]);

  // transformProps / transformData：直接遍历 orderedPlugins，无 enabled 判断
  for (const plugin of orderedPlugins) { ... next = fn(next); }

  // manager.register 保存的是副本
  plugins.set(plugin.name, { ...plugin, enabled: plugin.enabled ?? true });
  // manager.disable 改副本；runtime.orderedPlugins 用的是 HOC 传入的原始对象
  ```
  结果：`enabled:false` 的插件不渲染（slots 有过滤），但**仍参与 transformProps / transformData**；`manager.disable(name)` 只影响 `manager.executeHook`，对 `runtime.orderedPlugins`、插槽与数据管线完全无效（副本与原件身份分裂）。
- 触发路径：配置层显式关闭插件（`vane-profile/src/custom-plugins/TabSyncPlugin/create.tsx:62` 就返回 `enabled:false` 空插件；`vane-lazy-image/test/gallery-slots.test.tsx:39-44` 断言“enabled:false 被跳过”只覆盖渲染）；或宿主在运行时调用 `disable()`。
- 影响面：全部 14 个组件。敏感词过滤、价格联动、数据脱敏这类 transform 插件一旦“被禁用”仍在改数据，属于静默的语义失效，排查成本高。
- 修复方向：以一份“规范化插件表”为唯一事实源（manager 内副本与 orderedPlugins 共用），所有链路统一按 `enabled !== false` 过滤；`enable/disable` 触发运行时版本号递增并重算 orderedPlugins。

### P1-4 依赖环 / 依赖缺失错误穿透“错误隔离”，可直接打崩宿主渲染
- 位置：`src/dependency/DependencyResolver.ts:30-52`（throw）、`54-58`（仅 warn）；`usePluginRuntime.ts:145-148`；`PluginManager.ts:40-41`、`72`
- 证据：
  ```ts
  // DependencyResolver.ts:39-43
  if (ready.length === 0) throw new Error("... 插件循环依赖 ...");
  // usePluginRuntime.ts:145-148 —— useMemo 在 render 期执行，无 try/catch
  const orderedPlugins = useMemo(() => resolveDependencyOrder(stablePlugins), [stablePlugins]);
  // PluginManager.ts:72 —— executeHook 内同样无 try/catch 包裹 ordered()
  for (const plugin of ordered()) { ... }
  ```
- 触发路径：
  1. 任一插件 `dependencies` 成环（含间接环）→ `withPlugins` 渲染期抛错 → 错误边界都来不及接管（异常发生在 HOC 自身 render 内），整棵宿主子树白屏；
  2. `withPlugins.tsx:42/46/50` 用 `void runtime.execute(...)` 调用；若 `ordered()` 抛错，得到的是 **未捕获的 Promise rejection**（示例：宿主卸载或 onMount 时报 unhandledrejection，测试环境可能直接判失败）。
  3. 依赖插件被 disable 时，manager 先过滤 enabled 再拓扑（`PluginManager.ts:40-41`），依赖被当成“缺失”只告警，依赖方仍执行——依赖约束名存实亡。
- 影响面：所有声明 `dependencies` 的组件插件族（waterfall 的 URLSync/StatePersistence，coupon 的 ClaimState/Validity，candidate 的 RecommendSort→ContactMask 等）。
- 修复方向：`resolveDependencyOrder` 增加安全的降级返回值（循环时按注册顺序截断 + 记入 errors），`usePluginRuntime` 对排序结果做 try/catch 回退到注册顺序；`executeHook` 内把拓扑错误纳入 `errors` 账本而不是抛出。

### P1-5 沙箱超时只放弃等待，不取消底层任务；超时钩子的清理函数永久丢失
- 位置：`src/sandbox/PluginSandbox.ts:23-34`；`PluginManager.ts:79-97`、`99-103`
- 证据：`Promise.race` 只让等待方先 settle，`fn()` 仍继续执行；`executeHook` 在超时后走 catch 分支，**不会**看到 fn 迟到返回的清理函数，也不会登记 cleanup。
- 触发路径：异步 onMount（网络请求 / 动态 import / 图片解码）超过 `timeout`（默认 3000ms）→ 插件被判超时；随后 fn 完成并返回 `() => cancelRequest()`，该函数永远不会进入 cleanups；若迟到的 Promise 最终 reject，浏览器/Node 产生 unhandledrejection（无人再持有该链）。
- 二次影响：超时钩子迟到完成时仍会执行副作用（注册全局监听、写 bus），此时组件可能已卸载（`clear()` 已执行：插件自己的订阅被 cleanup 解除、插件表清空；bus 对象本身仍在）→ 订阅写进已“废弃”的实例总线，形成静默泄漏。
- 影响面：所有使用异步 didMount/网络初始化的插件（lazy-image FetchLoader、candidate 数据加载类、activity 倒计时初始化等）。
- 修复方向：引入 AbortSignal/代次令牌，超时即标记该次执行失效（迟到结果丢弃、返回的 cleanup 立即执行或直接拒绝登记）；cleanup 记录带 `pluginName + generation`，clear/重装配按代次回收。

---

## 四、P2（15 项）

### P2-1 `once` 的 handler 抛错后不会注销，后续事件会重复触发
- 位置：`src/bus/PluginBus.ts:36-42`
- 证据：`const wrapper = (data) => { handler(data); off(event, wrapper); }`——`handler` 抛错时 `off` 不执行，而 `emit` 的 try/catch 只吞掉异常。
- 触发：一次性监听器内部报错（例如解析数据失败）→ 之后每次同事件都会再次进入这个“一次性”监听器。
- 修复方向：`try { handler(data) } finally { off(...) }`。
- 影响面：所有用 `bus.once` 的领域插件（card 的曝光一次性、activity 的领取一次性回调等）。

### P2-2 错误账本无上限、`clear()` 不清空，且只覆盖 executeHook
- 位置：`PluginManager.ts:33`、`88`、`111-129`；`usePluginRuntime.ts:192-199`、`217-221`；`slots.tsx:61-64`
- 证据：`errors.push(...)` 无裁剪；`clear()` 不清 `errors`；transformProps/transformData 与 render 槽位的异常只 `console.warn`，不进入 `getErrors()`。
- 影响：长生命周期应用反复重装配 → 数组无限增长；宿主拿 `getErrors()` 上报时缺数据管线与渲染错误，监控盲区。
- 修复方向：环形缓冲/上限（如 100 条）+ `clear` 可选重置 + 统一 `reportError(plugin, hook, error)` 入口。

### P2-3 `PluginErrorBoundary` 命中后状态永不复位，瞬时错误永久清空该插件槽位
- 位置：`src/sandbox/PluginErrorBoundary.tsx:17-35`
- 证据：`getDerivedStateFromError` 写入 error 后，无 `componentDidUpdate` 重置；`render` 只要 error 非空就返回 fallback/null。
- 触发：插件渲染钩子因数据竞态抛错一次（如读取未就绪的 variant），后续数据恢复后该插件仍永久空白，直到整棵子树重挂载。
- 修复方向：支持 `resetKeys`/children 变化时清空 error，或提供 retry 回调。
- 影响面：所有使用 `renderPluginSlot` / 领域槽的组件（activity 30 插件、candidate 19 插件、coupon 14 插件等）。

### P2-4 `bus.getAll()` 返回普通对象，`__proto__` / `constructor` 键会改写返回对象原型（局部原型污染）
- 位置：`src/bus/PluginBus.ts:75-81`
- 证据：`const result: Record<string, any> = {}; store.forEach((v, k) => { result[k] = v; })`；`store` 是 Map，键名不受限。`result["__proto__"] = value` 触发 setter 改写 `result` 的 prototype；`constructor` 会遮蔽原型属性。
- 触发：插件用外部可控字符串作为数据键（如 `bus.setData(userInput, ...)`），宿主遍历 `getAll()` 做展示/序列化。
- 安全面：这是**局部**原型改写，不等同于 `Object.prototype` 全局污染；但会让 `getAll()` 返回对象行为异常（键丢失、`instanceof`/`in` 判定错乱），并在与 `Object.assign`/深合并组合时放大。
- 修复方向：`Object.create(null)` 或过滤危险键；文档明确“数据键由插件定义，不允许使用外部输入”。
- 影响面：使用 `getAll()` 做调试面板/持久化的组件（lazy-image 记忆压力、waterfall 状态持久化等）。

### P2-5 `detectDevice` 契约不符 + 缓存永不刷新 + SSR/水合不一致
- 位置：`src/utils/detectDevice.ts:9-34`；类型契约 `src/types.ts:21-30`
- 证据：`os: ua`、`browser: ua` 直接把整段 UA 塞进字段（未解析）；模块级 `cached` 一旦写入不再随 `resize` / `orientationchange` 更新；SSR 分支固定 `1024 × 768`。
- 影响：`ctx.deviceInfo.type` 可用于移动判定（lazy-image MemoryPressureAbort），但 `os/browser/viewportWidth` 的语义与声明不符；响应式插件拿不到最新视口；SSR 首屏按桌面渲染、客户端按移动渲染时可能出现水合差异（**推断**，未在浏览器实测）。
- 修复方向：解析 os/browser；提供 `subscribeDevice` 或把 viewport 交给 `ResizeObserver`；SSR 首屏输出“未知/中性”值避免水合分歧。

### P2-6 数据流水线不保证不可变：`transformData` 可原地修改 data/props，浅比较会掩盖原地变化
- 位置：`src/react/usePluginRuntime.ts:39-51`、`154-160`、`206-226`
- 证据：`shallowEqual` 只比较顶层引用；`transformData` 直接把宿主对象交给插件，未冻结、未克隆、未检测原地写回。
- 影响：某个插件原地改 `ctx.data` 后，引用不变 → context 不重建、其他插件看到被改过的对象但无法感知变化；也违背“插件间数据传递不可变”的隐含契约。插件 A 原地写还会污染宿主传入的 props。
- 修复方向：文档明确“禁止原地修改”，开发态 `Object.freeze`/深克隆校验，或由内核在管线入口浅克隆一次。
- 安全面：用户数据（props/data）原样透传给插件渲染与变换，内核无脱敏/白名单责任边界声明。

### P2-7 `setData → emit → handler → setData` 重入无环检测，可能无限递归
- 位置：`src/bus/PluginBus.ts:62-66`、`11-22`
- 触发：两个插件互相响应对方的数据键（价格 ↔ 优惠），每次写入都触发对方再写，值持续变化 → 同步递归直到栈溢出。
- 修复方向：记录派发深度/事件链，超过阈值告警并中断；或把 notify 改为微任务批处理。
- 影响面：使用可写数据键联动的组件（coupon 价格/券、sku 选择态、activity 进度等）。

### P2-8 依赖被禁用时被当作“缺失依赖”，依赖方仍执行
- 位置：`PluginManager.ts:40-41`；`DependencyResolver.ts:34-35`、`54-58`
- 证据：manager 先 `filter(enabled !== false)` 再拓扑 → 被禁用依赖不在 `byName` → `isReady` 视为满足 → 仅 warn。
- 影响：例如 URLSync 依赖 StatePersistence 时，把后者 `enabled:false`，前者仍在“依赖未建立”的状态下运行，产生半初始化。
- 修复方向：拓扑阶段用完整插件表，执行阶段再跳过 disabled；或把“依赖被禁用”上升为明确错误策略（跳过依赖方）。

### P2-9 通用 `withPlugins` 只转发生命周期三件套：`onPropsChange` / `onError` 链与 `data` 管线默认不接线
- 位置：`src/react/withPlugins.tsx:24-54`、`types.ts:202-207`
- 证据：`enhancedProps` 里只有 `onMount` / `onUnmount` / `onError`；`WithPluginsConfig` 无 `data`，HOC 不调用 `transformData`。`onPropsChange` 在内核类型里存在，但通用 HOC 从不触发（各领域包自行实现）。
- 影响：按 README/模板文档直接使用 `withPlugins` 的消费者会发现 `onPropsChange` 完全不会执行、`transformData` 是死链；实际能用的只有各领域包自己的 withPlugins。
- 修复方向：明确文档（内核不自动跑 onPropsChange/transformData）或 HOC 内补上浅比较与 data 选项。

### P2-10 高频链路性能：每次 `executeHook` 重新拓扑排序，每个渲染槽重新 filter/sort
- 位置：`PluginManager.ts:40-41`、`72`；`slots.tsx:28-47`
- 证据：`ordered()` 每次调用都 `[...plugins.values()].filter().resolveDependencyOrder()`（O(n²) 候选扫描）；`renderPluginSlot` 每次渲染都对全量插件 filter→filter→sort。
- 影响：activity 30 插件、candidate 19 插件、coupon 14 插件下，领域钩子（onPhaseChange/onSkuChange）与每次重渲染的成本被放大；属于可优化项，非功能缺陷。
- 修复方向：manager 内缓存执行顺序，注册/启停/依赖变化时失效；槽位结果按 `orderedPlugins + hook + position` 记忆化。

### P2-11 `unregister` 不回收该插件的清理函数、不调用 onUnmount、不区分 destroy
- 位置：`PluginManager.ts:56-65`
- 证据：只调用 `destroy()` 再删除表项；`onMount` 返回的 cleanups 仍留在 `cleanups` 数组，直到下一次 `clear()` 才执行（此时可能已过很久，或组件已卸载）。
- 影响：运行时热移除插件（lazy-image 示例里的热插拔）→ 监听/定时器持续工作，形成泄漏与幽灵副作用。
- 修复方向：cleanup 记录绑定 `pluginName`，unregister 时按名回收。

### P2-12 同名插件覆盖注册不销毁旧实例；槽位层不去重导致双渲染 / 重复 React key
- 位置：`PluginManager.ts:43-45`；`slots.tsx:56-60`；`usePluginRuntime.ts:145-148`
- 证据：`plugins.set(name, {...})` 直接覆盖，旧对象已执行的 `init` 无对应 `destroy`；`orderedPlugins` 来自原始数组，若数组里存在两个同名对象，`resolveDependencyOrder` 不去重（`byName` Map 只用于依赖查询，`remaining` 仍含两条），槽位 key 固定为 `vane-slot-${name}` → 重复 key、React 警告、状态归属不确定。
- 修复方向：注册时检测同名并显式 destroy/告警；排序输出按 name 去重（保留最后注册者）。

### P2-13 `contextRef` 在 render 期赋值，`execute` 始终取“最后一次渲染”的上下文，并发渲染下可能拿到已丢弃的 context
- 位置：`usePluginRuntime.ts:150-183`、`228-232`
- 证据：`contextRef.current = context` 写在 render 函数体内；`execute` 读取 `contextRef.current!`。React 并发渲染下被丢弃的 render 也会写 ref，直到下一次提交才纠正。
- 影响：在 transition/suspense/并发特性开启时，异步钩子可能拿到旧 props/state 的 context；卸载后迟到钩子仍持有旧 context（与 P1-5 叠加）。
- 修复方向：只在 layout effect/提交阶段写 ref；或让 execute 显式接收本次 context 快照。

### P2-14 `clear()` / `register()` 不 await 异步 `destroy` / `init`，跨代次时序无保证
- 位置：`PluginManager.ts:43-50`、`56-65`、`111-129`
- 证据：`Promise.resolve(plugin.init()).catch(...)`、`destroy` 同样 fire-and-forget；`clear()` 同步清表后异步 destroy 才完成。
- 影响：重装配时“旧 destroy 未完成、新 init 已开始”，同一资源（全局监听、单例）可能被后注册者覆盖或重复创建；卸载后 destroy 迟到完成还会访问已清理的 bus。
- 修复方向：记录异步生命周期 Promise，clear 返回 Promise 供卸载链等待（与 P1-1 一并处理）。

### P2-15 `withPlugins` 静默覆盖宿主的 `containerRefExternal` / `children` / `debug`
- 位置：`src/react/withPlugins.tsx:35-54`
- 证据：`enhancedProps` 无条件写入这三个键，宿主显式传入的 `containerRefExternal` 会被替换为 runtime 内部 ref，`children` 被插槽组合替换。
- 影响：宿主若依赖自有容器 ref（测量/滚动）会拿到插件容器的 ref；属于契约未声明的行为。
- 修复方向：文档化“由 HOC 接管”，或在宿主显式传入时告警。

---

## 五、安全专项结论

| 检查项 | 结论 | 证据 |
| --- | --- | --- |
| XSS sink | 无 | 全包 grep `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function` 0 命中 |
| 原型污染 | 局部风险（P2-4） | `PluginBus.getAll()` 以任意键写入普通对象 |
| 用户数据透传 | 无脱敏/白名单，责任在领域插件 | `context.props/data` 原样交给渲染钩子与 transform 链 |
| 权限/凭据 | 无读取 | 不访问 localStorage / cookie / postMessage |
| SSR 守卫 | 不抛错但语义有偏差（P2-5） | `detectDevice` 的 window 判空 |

> 说明：本包是运行时骨架，不承担内容安全；但“插件可原地改写宿主数据”（P2-6）意味着恶意/低质量插件可以污染宿主状态，建议在文档层面写明信任边界（插件与宿主同信任域）。

---

## 六、门禁实跑记录（只跑一轮）

| 命令 | 结果 | 关键数据 |
| --- | --- | --- |
| `pnpm typecheck`（根 turbo） | **通过** | 16/16 tasks，25.8s；plugin-core `tsc --noEmit` 0 错 |
| `pnpm lint`（根 turbo） | **通过** | 15/15 tasks，16.4s；0 error，仅 warning（多为 `react-refresh/only-export-components`、`no-explicit-any`） |
| `pnpm test`（根 turbo） | **通过** | 16/16 tasks，42.5s；plugin-core 4 files / 37 tests 全绿 |
| `pnpm build`（根 turbo） | **通过** | 16/16 tasks，34.9s；plugin-core 主入口 gzip ≈ 0.32 + 1.50 + 2.82 = **4.64KB**（预算 5KB） |

门禁对 plugin-core 完全适用（有独立 `typecheck/lint/test/build` 脚本）；本轮未跑 `pnpm check` / `check:structure` / `check:config`（不在本次要求的四项门禁内）。

> 门禁全绿但 P1-1 仍然存在：现有测试没有断言“cleanup 与 onUnmount 的先后顺序”，属于**测试覆盖盲区**而非实现正确。
</content>
