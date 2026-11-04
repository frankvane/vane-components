# plugin-core 性能与代码量评估

> 范围：`packages/plugin-core`（只读评估，不改代码）。依据 `tasks/68` 的 P1/P2 条目、`tasks/69` 的实施口径、`tasks/71` 的兼容性结论，以及本次对 `src` 的逐文件重读与构建物体积实测。
> 结论区分「已证实（代码/实测）」与「估算/需基准」。所有行数为**去空行后的有效代码行**（与 `tasks/68` 的 997 行基线同口径）；物理行数 1116，差值全部是空行。

---

## 0. 结论摘要（先回答三问）

1. **性能会不会提升？**
   会，但**主要收益不在 P1**，而在 P2-10（执行顺序缓存 + 槽位分组）和两处 per-render 微优化。
   - P1 里只有 **P1-3（enabled 统一）** 是稳定的小正收益：disabled 插件不再进入 transform 循环。
   - **P1-2（重装配差集）只在「插件集合频繁部分变化」时有意义**；13 个组件的插件数组在 HOC 创建时固定，GalleryCore 的 `plugins` 已用 `useMemo` 记忆化，静态场景收益≈0。它是生命周期正确性修复，不是性能修复。
   - P1-1/P1-4/P1-5 基本中性；P1-5 用 AbortController 反而会增加少量对象与类型成本，性能上不划算。
   - 真正的性能杠杆是 P2-10：当前每次 `executeHook` 都重新拓扑排序（约 O(n²)），每个渲染 4 个槽各做 3 次 filter + 1 次 sort。缓存后能把这部分从「每次调用/每次渲染」降到「插件集合变化时一次」。
   - 但即使全做，收益是**插件层微秒级**，通常不会改变用户感知；高频滚动/大量实例（如虚拟列表里上千个 lazy-image 实例）才可能可测。

2. **代码量会增加还是减少？**
   **会增加，不能净减少。** 分三档（估算，区间见 §3）：
   - 只修 P1：净 **+42~64 行**；做完收敛后可压到 **+22~44 行**。
   - P1 + P2-2/P2-10/P2-11（推荐批次）：净 **+22~54 行**。
   - P1 + 全部 P2：净 **+49~108 行**。
   现有 `src` 997 行，任何「行为修复 + 生命周期账本 + 缓存」都会引入新状态；能压缩的是重复分支和重复遍历，不足以抵消新增状态机。

3. **能否「提升且瘦身」？**
   **能「提升且基本不膨胀」，不能严格瘦身。** 条件取舍：
   - P1-5 只做代次令牌（generation token），不做 AbortController/signal 全链路，省 8~15 行且性能不降；
   - P2-9（通用 HOC 补 `onPropsChange`）先不做行为，只补文档，否则每次 props 变化会多跑一条 O(n²) 钩子链，性能可能负收益；
   - P2-6/P2-13 的不可变校验、上下文只读化放开发态并由构建 DCE，否则生产体积和性能都吃亏；
   - P2-10 的排序缓存与槽位分组、transform 循环合并、生命周期账本必须同批做；分开做会重复写 20~35 行。
   - 若一定要「净减少」，只能砍 P2 或删公共导出，不建议，也不在本次目标内。

---

## 1. 基线与计量口径

### 1.1 源码行数基线（有效代码行，共 997）

| 文件 | 有效行 |
|---|---:|
| `src/react/usePluginRuntime.ts` | 223 |
| `src/types.ts` | 184 |
| `src/manager/PluginManager.ts` | 137 |
| `src/react/slots.tsx` | 81 |
| `src/bus/PluginBus.ts` | 79 |
| `src/react/withPlugins.tsx` | 62 |
| `src/dependency/DependencyResolver.ts` | 53 |
| `src/index.ts` | 44 |
| `src/utils/detectDevice.ts` | 32 |
| `src/react/PluginRuntimeProvider.tsx` | 30 |
| `src/sandbox/PluginSandbox.ts` | 30 |
| `src/sandbox/PluginErrorBoundary.tsx` | 30 |
| `src/react/index.ts` | 9 |
| `src/bus/index.ts` | 2 |
| `src/manager/index.ts` | 1 |
| **合计** | **997** |

物理行 1116；`tasks/68` 记录的 997 是有效行口径，本次复核一致。

### 1.2 gzip 基线（实测）

门禁 `scripts/check-packages.mjs` 的口径是「入口 `index.js` + 其直接引用的 `chunks/*.js`」，逐文件 gzip 后求和：

| 文件 | 原始 | gzip |
|---|---:|---:|
| `dist/index.js` | 615 B | 0.31 KB |
| `dist/chunks/index-BFtMS56e.js` | 3760 B | 1.47 KB |
| `dist/chunks/withPlugins-BDsOcPLn.js` | 7172 B | 2.75 KB |
| **门禁口径合计** | 12547 B | **4.53 KB / 预算 5 KB** |

补充：若把 `dist/bus/index.js`（gzip 0.46 KB）也计入入口静态闭包，按文件求和约 4.99 KB；`tasks/68` 记录的 4.64 KB 与本次 4.53 KB 属构建产物差异，量级一致。**本报告以 4.53 KB 为实测基线、4.64 KB 为保守上限**，余量约 0.36~0.47 KB。

### 1.3 符号定义

- `n`：单个宿主实例注册的插件数（本仓典型 5~12）。
- `d`：其中 `enabled === false` 的插件数。
- `Δ`：一次重装配中新增 + 移除的插件数（对象引用变化也计入）。
- `m`：单个插件一次副作用成本（`init` / `destroy` / cleanup / bus 订阅重建）。
- `f`：重装配频率（次/秒）。
- `r`：宿主渲染频率（次/秒）。
- `h`：每次渲染/事件实际执行的钩子数量。
- `s`：单实例同时存在的宿主组件数量（如列表中的图片实例数）。

---

## 2. 性能收益：P1/P2 逐条判定

### 2.1 总表

| 条目 | 判定 | 机制与证据 | 已证实 / 需基准 |
|---|---|---|---|
| P1-1 卸载时序 | **中性**（轻微负：销毁延后到 onUnmount 完成） | 当前 `void executeHook(); manager.clear()` 同步清空；改成 `finally(clear)` 后 manager 多存活一个钩子时长，默认超时 3000ms。只影响时序与释放时机，不增加遍历。 | 已证实（时序）；释放延迟量级需基准 |
| P1-2 增量对齐 | **条件正收益** | 全量 `clear + registerAll` 每插件 `init` + cleanup/destroy；差集只处理 Δ。复杂度见 §2.2。静态 14 组件 `f=0`，收益 0；GalleryCore `plugins ?? galleryPreset()` 已被 `useMemo` 包裹，也极少触发。 | 机制已证实；生命周期侧效应成本需基准 |
| P1-3 enabled 统一 | **正收益（小）** | `orderedPlugins` 当前不过滤 enabled；修复后 transform 循环长度从 n 降到 n-d，disabled 插件的 `transformProps/transformData` 调用次数从 d 次降为 0。不会增加调用。 | 已证实（调用次数公式） |
| P1-4 依赖异常降级 | **中性**（异常路径轻微正：避免白屏/异常穿透） | 正常路径仍走同一次 `resolveDependencyOrder`；只有出现环时才走 catch + 注册序回退。不改变正常路径复杂度。 | 已证实；异常频率需实测 |
| P1-5 超时取消 | **中性**（AbortController 方案轻微负） | `Promise.race` 已有 1 个 timer + 1 个 Promise；AbortController 再加对象与监听，且仍需要 timer 才能「到点判超时」。真正的收益是底层请求可被协作取消，但按 `69` 红线只作用于生命周期钩子，收益很小。 | 已证实（实现成本）；取消收益需基准 |
| P2-1 `once` 异常注销 | 中性 | `try/finally` 只多一次分支，O(1)。 | 已证实 |
| P2-2 错误账本封顶 | **中性偏正（内存）** | 当前 `errors` 无上限、`clear()` 不清空；封顶后避免长生命周期实例无限增长。CPU 仍是 O(1)/次。 | 已证实 |
| P2-3 错误边界复位 | 中性 | 只增加一次状态比较；错误态本来就不渲染子树。 | 已证实 |
| P2-4 `getAll` 原型键 | 中性 | `Object.create(null)` 与普通对象分配同一量级；`getAll` 仍是 O(k)。 | 已证实 |
| P2-5 detectDevice | 中性 | `useMemo(..., [])` + 模块级缓存，当前无 per-render 成本；若修契约时新增 `resize` 监听，必须节流，否则变成负收益。 | 已证实；新增监听需基准 |
| P2-6 不可变校验 | **开发态负 / 生产中性** | 若每次 transform 做深校验/冻结，开发态明显变慢；必须用 `process.env.NODE_ENV !== "production"` 包裹并确认 DCE。 | 估算；需构建产物验证 |
| P2-7 重入保护 | **轻微负** | 每次 `setData` 增加深度计数/检查，O(1)；防止无限递归的收益只在异常用法下出现。 | 已证实 |
| P2-8 禁用依赖策略 | 中性 | 在 `isReady` 里多一次 `enabled` 判断，仍是 O(n·deps)。 | 已证实 |
| P2-9 HOC 补 onPropsChange | **可能负收益** | 若在渲染期比较 props 并执行钩子链，每次变化会多一次 `ordered()`（O(n²)）+ 全插件遍历。必须 effect + shallowEqual 门控，并先做 P2-10 缓存；否则建议只补文档。 | 机制已证实；真实开销需基准 |
| P2-10 顺序/槽位缓存 | **明确正收益（最高 ROI）** | 当前 `ordered()` 每次 executeHook 重排（`PluginManager.ts:40-41,72`）；`composeSlots` 每次渲染 4×`renderPluginSlot`，每个 3 次 filter + sort（`slots.tsx:29-47,72-84`）。缓存后 executeHook 近似 O(1) 取顺序，渲染每插件只扫 1 次。 | 已证实（操作次数）；帧级收益需基准 |
| P2-11 unregister 回收 | 中性 | 复用生命周期账本，多一次按名查找 O(1)；修复的是订阅泄漏。 | 已证实 |
| P2-12 同名去重 | 中性 | 去重应在 register 时做（Map 已按 name 唯一）；若改到槽位层，会新增 per-render Set 分配，反而负收益。 | 已证实 |
| P2-13 上下文只读化 | 中性 / 可能负 | 正常路径若只换引用不变；若每次 `Object.freeze` 或 Proxy 包裹，会增加渲染成本。建议开发态。 | 估算 |
| P2-14 异步 init/destroy 可等待 | 中性 | 只改 Promise 编排，不改变实际工作量；顺序更可靠。 | 已证实 |
| P2-15 HOC 字段契约 | 中性 | 纯文档/类型，无运行时成本。 | 已证实 |

**结论：** P1 中真正带性能收益的只有 P1-3（小）；P1-2 是条件收益；P1-1/P1-4/P1-5 中性。P2 中只有 P2-10 是明确且可观的性能项，其余以正确性/内存/可观测性为主。

---

### 2.2 P1-2 差集增量对齐：复杂度与「有意义规模」

当前每次重装配（`usePluginRuntime.ts:114-131`）：

```text
manager.clear()            // 逆序执行 c 个 cleanup + 遍历 n 个插件调 destroy + Map.clear
manager.registerAll(n)     // n 次对象 spread + n 次 init（fire-and-forget）
下一次 executeHook         // 再次 resolveDependencyOrder，O(n²)
```

按副作用成本 `m` 计，可写成：

```text
T_full = O(n + n·m_init + c·m_cleanup + n²)
```

这里的 `n²` 不是重装配本身，而是重装配后第一次钩子执行时的排序；如果同时做 P2-10 缓存，`n²` 只付一次。

差集方案：

```text
扫描旧/新集合按 name + 对象引用比对   O(n)
仅对 removed 执行 onUnmount/cleanup/destroy   Δ_removed·m
仅对 added 执行 register/onMount               Δ_added·m
未变更插件完全不触碰（订阅保留）               0
T_diff = O(n + Δ·m)
```

**它不是把 O(n) 降成 O(1)，也不是把 O(n·m) 降成 O(n)**：

- 每次重装配仍要 O(n) 扫描（找出谁变、谁没变）；
- `Δ = n`（整个数组被重新创建、所有对象引用都变）时，差集退化为全量，**性能收益为 0**；
- `Δ` 很小时（增删 1 个插件、替换 1 个插件对象）才有收益，收益来自「未变更插件不重复 init / cleanup / 重建订阅」。

**有意义的规模：**

| 场景 | n | f | 当前每次重装配副作用 | 差集后 | 收益判断 |
|---|---:|---:|---|---|---|
| 13 个固定插件组件（HOC 创建时固定） | 5~12 | 0 | n init + n cleanup | 0 | **无收益**（不触发） |
| GalleryCore 默认 preset（`useMemo`） | ~8 | ≈0 | 同上 | 0 | **无收益** |
| 运行时切换 1 个插件（如 FilterToggle） | 10 | 1~10/s | 10 init + 10 cleanup + 10 destroy = 300 次/s（按 10Hz） | 1+1+1 = 30 次/s | **收益明显**（约 90% 副作用消失） |
| 每次渲染重建整组插件对象（错误用法） | 10 | 60/s | 600 init/s | Δ=10，仍是 600/s | **无收益**，需先文档要求 `useMemo` |

补充：如果 `init` 里做 IndexedDB/网络/订阅，`m` 大，收益放大；本仓多数插件 `init` 为空或很轻，绝对收益有限。

**已证实：** 当前实现确实每次重装配全量 `clear + registerAll`；`register` 每次 `{...plugin}` 并调用 `init`；`clear` 遍历 destroy 与 cleanup。
**需基准：** `init/destroy/订阅` 的实际毫秒成本，以及 GalleryCore 在真实交互中是否触发重装配。

---

### 2.3 渲染路径：per-render 分配、重复排序、重复 resolve

| 热点 | 位置 | 当前行为 | 缓存/useMemo | 判定 |
|---|---|---|---|---|
| 插件快照比对 | `usePluginRuntime.ts:114-121` | 每渲染 `plugins.some((p,i)=>p!==prev[i])`，即使数组引用完全相同也扫 n 次 | 无短路 | 可 O(1) 优化：先 `if (plugins === prevPlugins) skip` |
| `namesKey` | `usePluginRuntime.ts:123` | 每渲染 `map(name).join("|")`，**即使 `enableDebug=false` 也执行** | 无 | 明确的 per-render 分配浪费；应移入 debug 分支或 memo |
| `transformProps` | `withPlugins.tsx:36`、`usePluginRuntime.ts:185-204` | 每渲染调用一次，内部遍历 n 个插件并做 `typeof fn` 检查 + try/catch | 结果无缓存；回调依赖 `orderedPlugins` | 无法安全跳过（props 变则结果变），但可合并循环、过滤 disabled |
| `transformData` | `usePluginRuntime.ts:206-225` | 每次数据管线调用遍历 n | 同上 | 同上 |
| `orderedPlugins` | `usePluginRuntime.ts:145-148` | `useMemo(resolveDependencyOrder, [stablePlugins])`，**覆盖到位**：插件集合不变时不重算 | 有 | 已优化；但 manager 内部另有一份 `ordered()`，未复用 |
| `manager.ordered()` | `PluginManager.ts:40-41` | 每次 `executeHook` 都 `[...plugins.values()]` + filter + 拓扑排序 | **无缓存** | 最大重复点；每次事件 O(n²) |
| `resolveDependencyOrder` | `DependencyResolver.ts:29-52` | `remaining.filter(isReady)` + `splice(indexOf)` + 候选扫描，约 O(n² + Σdeps) | 无 | 数据规模小；n=10 时约百次操作，n≥50 才明显 |
| `composeSlots` | `slots.tsx:72-84` | 每次渲染调用 4 次 `renderPluginSlot` | **无 memo** | 4×3 次 filter + 最多 4 次 sort |
| `renderPluginSlot` | `slots.tsx:29-47` | 每槽 `filter(enabled)` → `filter(hook)` → `filter(slotPosition)` → `sort` → `map` | 无 | n=10 时 12n=120 次谓词调用/渲染 |
| 每插件错误边界 | `slots.tsx:48-66` | 每次渲染为每个有输出的插件新建 `<PluginErrorBoundary>` 元素 | 无 | React 元素分配不可避免，但可减少外层数组/排序分配 |
| `context` | `usePluginRuntime.ts:160-182` | `useMemo` 依赖 `stableProps/stableData/state/deviceInfo/bus/extendContext` | 有 | 覆盖到位；但 `extendContext` 不稳定时会每渲染重建（需下游保证 useCallback） |
| `contextRef.current = context` | `usePluginRuntime.ts:183` | 每渲染写 ref | 无 | 廉价；P2-13 若改为快照需额外对象 |
| bus 查找 | `PluginBus.ts:10-21` | `handlers`/`store` 都是 `Map`，`get/set` O(1)；`emit` 每次 `[...set]` 复制数组 | 无（也不需要） | **不是线性扫描**；只有 emit 的 O(h) 快照分配 |
| `bus.getAll` | `PluginBus.ts:65-70` | 每次新建对象并遍历 store，O(k) | 无 | 调用频率低，非热点 |
| 沙箱 | `PluginSandbox.ts:23-34` | 每个异步 hook 新建 Promise + timer + `Promise.resolve().then` + clearTimeout | 无 | 每钩子固定成本，见 §2.5 |

**已证实：** 上述代码路径与调用次数；`orderedPlugins` 与 `context` 的 useMemo 覆盖是到位的；`namesKey` 无条件执行、`plugins.some` 无短路、槽位 4 次重复过滤/排序均是确定的 per-render 浪费。
**需基准：** 这些操作在完整 React 渲染中占多少毫秒；插件输出节点本身可能远大于谓词成本。

**一个典型规模的算术（n=10，s 个实例，r 次/秒）：**

- 槽位过滤：`4 × 3 × n = 120` 次谓词/实例/渲染；`s=1000, r=60` 时约 720 万次/秒。
- transform 检查：`n=10` 次/实例/渲染。
- 排序：每实例每次渲染最多 4 次小数组 sort；插件数很少时排序本身不贵，但 4 次数组分配 + 比较器调用会累积。
- 因此：**单实例、低频更新时收益不可感；大量实例 + 高频渲染时值得做 P2-10。**

---

### 2.4 P1-3 enabled 修复后 transform 调用次数：只减不增

当前：

```text
transformProps: 1 次外层调用 + n 次插件检查；其中 d 个 disabled 插件若定义了 hook，会真实执行 d 次
transformData : 1 次外层调用 + n 次插件检查；同样可能执行 d 次
```

修复后 `orderedPlugins` 过滤 `enabled !== false`：

```text
transformProps: 1 次外层调用 + (n-d) 次检查；disabled 插件执行 0 次
transformData : 同上
```

- **调用次数变化 = −d（每个 transform 通道）**，不会新增任何调用；
- `manager.enable/disable` 只需递增一个版本号，下一次取顺序时重算一次，**不是每渲染重算**；
- 代价是 `orderedPlugins` 需要在 `stablePlugins` 或版本变化时重算，当前本来就在 `useMemo` 里，增量可忽略。

**已证实：** HOC 每渲染调用一次 `transformProps`（`withPlugins.tsx:36`）；`transformData` 由宿主数据管线调用；当前 `orderedPlugins` 不过滤 enabled（`usePluginRuntime.ts:145-148`），而 manager 的 `ordered()` 过滤（`PluginManager.ts:41`），两条链路语义不一致。
**风险提示：** 这是行为修正（兼容性 B），不是纯性能优化；全仓没有「disabled 仍依赖 transform」的用法，但发布说明要写清「disabled = 完全停用」。

---

### 2.5 P1-5：AbortController/取消令牌 vs `Promise.race`

| 方案 | 每钩子成本 | 能否真正取消 | API/类型改动 | 性能结论 |
|---|---|---|---|---|
| 现状 `Promise.race` | 1 个 timer + 1 个 Promise + 1 个 microtask；`finally` 清 timer | **不能**，底层任务继续跑 | 无 | 基线 |
| AbortController + signal | 1 个 controller + 1 个监听；**仍需 timer 判超时** | 仅当插件主动检查 `signal.aborted` / 传给 fetch 时才能 | `PluginContext` 增 `signal` 或钩子参数扩展；生命周期钩子才允许 | **CPU 略负**；资源收益取决于插件是否配合 |
| generation 令牌 | 每次执行 1 个递增整数 + await 后比较 | 不取消，只丢弃迟到结果/cleanup | manager 内部字段，几乎无 API 改动 | **成本最低**；解决「超时 cleanup 永久丢失」与「卸载后写入」 |

**建议：** P1-5 先做 generation 令牌 + cleanup 记账，不引入 AbortController。理由：

1. `Promise.race` 的超时判定的确需要 timer；AbortController 不能替代 timer，只能补充「协作取消」。
2. 按 `69` 红线，取消只作用于生命周期钩子，而生命周期钩子通常不是重计算热点。
3. 数据面异步钩子（lazy-image 的 IDB/上报/视口延迟）明确不能代次失效；给它们加 signal 需要下游逐个适配，API 面扩大。
4. 若后续确有 fetch/IDB 需要取消，再对生命周期钩子局部加 `signal`，届时单独评估。

**已证实：** `runHookInSandbox` 只 `Promise.race`，不取消底层任务；`fn` 被排入 microtask，导致 `executeHook` 立即让出、`clear()` 抢先执行。
**需基准：** 高频生命周期钩子下 timer 数量与 GC；如果 timer 不是瓶颈，AbortController 更无必要。

---

## 3. 代码量收支

### 3.1 逐项估算

> 估算依据：新增状态机、Map 记账、类型/分支、必要的错误处理；删除依据：替换现有全量分支、合并重复的 transform 循环、合并槽位过滤/排序、复用同一排序缓存。区间为有效代码行。

| 修复项 | 新增行 | 可删/合并行 | 净值 | 依据 |
|---|---:|---:|---:|---|
| P1-1 卸载时序 | +1~3 | 0 | **+1~3** | 把 `void executeHook(); clear()` 改为 `executeHook().finally(clear)`，复用现有 effect |
| P1-2 差集对齐 | +25~38 | −3~6 | **+22~32** | 新增 old/new Map、按 name+引用 diff、按插件名回收 cleanup/destroy、per-plugin onMount；替换 4 行 `clear + registerAll` |
| P1-3 enabled 统一 | +4~8 | −2~4 | **+2~4** | `orderedPlugins` 过滤 enabled + 版本失效；transform 循环可复用同一列表 |
| P1-4 依赖降级 | +8~12 | 0~2 | **+6~12** | `safeOrder` helper + manager/runtime 两处 try/catch；环时回退注册序 |
| P1-5 代次/cleanup | +10~18 | −1~3 | **+9~15** | generation 字段、cleanup 记录 `{name,generation}`、await 后失效判断；**不含 AbortController** |
| **P1 小计** | **+48~79** | **−6~15** | **+42~64** | |
| P2-10 顺序/槽位缓存 | +10~18 | −15~22 | **−5~+3** | manager 版本化 order 缓存 + 一次分组替代 4 槽的 12 次 filter/4 次 sort；删重复 `resolve`/filter 分支 |
| P2-11 unregister 回收 | +3~6 | −1~3 | **+2~3** | 复用 P1-2/P1-5 的按插件账本，只多一次查找 |
| P2-2 错误账本封顶 | +5~8 | −2~4 | **+3~4** | 统一 `recordError` + 上限裁剪；替换散落的 push/warn |
| P2-3/P2-13 边界复位/只读上下文 | +9~16 | 0~2 | **+7~14** | `resetKeys`/dev 快照；生产路径不冻结 |
| P2-1/P2-4/P2-7/P2-8/P2-12 小修 | +13~23 | −2~5 | **+8~21** | `try/finally`、`Object.create(null)`、重入计数、enabled 依赖判断、register 时同名销毁 |
| P2-5/P2-6/P2-9/P2-15 设备/不可变/HOC/文档 | +18~36 | −2~6 | **+12~34** | 设备契约、开发态校验、onPropsChange 接线或文档；生产 DCE 后留存较少 |
| **P2 小计** | **+58~101** | **−22~42** | **+27~79** | |
| **合计（P1+全 P2）** | **+106~180** | **−28~57** | **+69~143** | 未计跨项收敛 |
| 跨项收敛回冲 | — | −20~35 | **−20~35** | 生命周期账本、排序缓存、transform 合并、槽位分组同批实现，避免重复分支 |
| **合计（收敛后）** | **+106~180** | **−48~92** | **+49~108** | |

**三档净结果：**

| 批次 | 净增行 | 改后有效行 | 占现有 997 |
|---|---:|---:|---:|
| A：只修 P1（含收敛） | **+22~44** | 1019~1041 | +2.2%~4.4% |
| B：P1 + P2-2/P2-10/P2-11（推荐） | **+22~54** | 1019~1051 | +2.2%~5.4% |
| C：P1 + 全部 P2（收敛后） | **+49~108** | 1046~1105 | +4.9%~10.8% |

> 说明：净值区间按行端点相加，不保证每一项都同时取到上下限；用于预算判断，不作为精确统计。

### 3.2 纯增加项 vs 可回冲项

**纯增加（无法通过删旧代码抵消）：**

- 生命周期账本：每插件的 `{plugin, cleanups, generation, mounted}` 状态；
- P1-2 的 old/new diff Map 与「新增列表」返回；
- P1-5 的 generation 字段与 cleanup 归属；
- P2-2 的错误记录统一与上限；
- P2-3 的 `resetKeys`、P2-13 的开发态快照。

**可回冲（能顺带删掉重复/防御分支）：**

- `clear()` 与 `unregister()` 里重复的 destroy 分支 → 收进账本（约 −6~10）；
- `transformProps` / `transformData` 两段几乎相同的 try/catch 循环 → 一个 `runTransform`（约 −8~12）；
- `renderPluginSlot` 的 3 次 filter + sort × 4 槽 → 一次分组（约 −10~18）；
- manager `ordered()` 与 runtime `orderedPlugins` 的重复 resolve/filter → 单一缓存（约 −5~8）；
- P2-6/P2-13 若严格 dev-only，生产构建可被 DCE 掉，但**源码行仍在**，不能按 gzip 回冲源码预算。

**仓库级备注：** 若 P1-2/P1-5 落地，`vane-sku` / `vane-coupon` / `vane-candidate` / `vane-resume` 中手工补跑 onMount/清理的 workaround 可选择性删除，约 −20~40 行；但那是组件包代码，**不抵扣 plugin-core 的 997 行基线，也不抵扣本包 gzip**。

### 3.3 对入口 gzip 的影响

以实测 4.53 KB（保守按 4.64）为基线：

| 批次 | 预计 gzip 增量 | 预计 gzip | 预算判断 |
|---|---:|---:|---|
| A：P1 + 收敛 | +0.12~0.25 KB | 4.65~4.78 KB（保守 4.76~4.89） | **安全** |
| B：P1 + P2-2/10/11 | +0.12~0.30 KB | 4.65~4.83 KB（保守 4.76~4.94） | **安全，余量变小** |
| C：P1 + 全 P2 | +0.25~0.55 KB | 4.78~5.08 KB（保守 4.89~5.19） | **高风险，可能超 5KB** |

估算方法：当前入口闭包压缩后 raw 约 12.5 KB、gzip 约 4.43 KB（拼接口径）；新增 50~100 行压缩后约 +1~3 KB raw，gzip 通常按 3~5:1 收敛，故 +0.25~0.55 KB。**实际值必须在改完后跑 `node scripts/check-packages.mjs` 重新量，不能用源码行数线性外推。**

**若 C 批次超预算，可行瘦身点（按优先级）：**

1. 不引入 AbortController/signal：省类型与沙箱分支，约 −8~15 行、−0.05~0.12 KB gzip。
2. 共享排序缓存，删掉 runtime 侧重复 resolve 与 manager 内重复 filter：约 −8~15 行、−0.05~0.10 KB。
3. 槽位一次分组，删 3 次 filter 链与 4 次 sort：约 −10~18 行、−0.08~0.15 KB。
4. transform 两段合并：约 −8~12 行、−0.05~0.10 KB。
5. P2-6/P2-13 严格 dev-only 并确认 `process.env.NODE_ENV` 被替换，生产 gzip 不承担校验代码；若不能 DCE，则这两项应降级或不做。

> 不建议通过删公共导出（`getAllPlugins` / `getEnabledPlugins` / `getExecutionOrder` / `getErrors`）来瘦身：会破坏 14 个组件的调用面，属于兼容性红线。

---

## 4. 可行的瘦身方案（3~5 个）

### S1. 生命周期账本统一 register / unregister / clear / executeHook

- **做法：** `Map<name, { plugin, cleanups, generation, mounted }>`；`clear` 只遍历账本，`unregister` 按名回收，`executeHook` 只对「未 mounted」或显式目标执行生命周期钩子。
- **节省：** 同批实现 P1-1/P1-2/P1-5/P2-11/P2-14 可避免 3~4 套重复分支，约 **−15~25 行**（相对逐项实现）。
- **风险：** 中。生命周期语义最敏感；必须用 `lifecycle-order.test.tsx` / `reconfigure.test.tsx` 覆盖「未变更零重跑」「新增一次 onMount」「移除一次 onUnmount + cleanup」「卸载后 manager 为空」。

### S2. manager 单一顺序缓存，runtime/槽位复用

- **做法：** manager 内 `version` + `cachedOrder`；`register/unregister/enable/disable/clear` 递增版本；`executeHook`、`getExecutionOrder`、`usePluginRuntime.orderedPlugins` 都读同一缓存。
- **节省：** 删除 runtime 里重复的 `resolveDependencyOrder` useMemo 与 manager 每次调用的重建，约 **−8~15 行**；同时把每次 executeHook 的 O(n²) 降为「版本变化时一次」。
- **风险：** 中低。缓存失效漏点会导致顺序错误；测试需覆盖 enable/disable/register/unregister/reconfigure 五条变更路径。

### S3. 槽位一次分组，替代 4×3 次 filter + 4 次 sort

- **做法：** 以 `stablePlugins` 为 key 预编译 `{ beforeHeader, overlay, afterHeader, footer }` 四组，组内已过滤 + 排序；渲染阶段只 map。
- **节省：** 删除 `renderPluginSlot` 的 3 条 filter 链与 `composeSlots` 的 4 次重复入口，约 **−10~18 行**；per-render 谓词调用从 12n 降到约 n。
- **风险：** 中。`slotPosition` 的 before/footer/after 兼容分支很容易改错（历史上出过 header 重影）；必须保留现有 37 个测试并补 footer 边界。

### S4. transformProps / transformData 合并为一个执行器

- **做法：** `runTransform(stage, input)`：统一遍历、`typeof fn` 检查、try/catch、错误入账；两处只传不同的调用签名。
- **节省：** 删除重复循环与告警模板，约 **−8~12 行**。
- **风险：** 低。注意 `transformProps` 无 context 参数、`transformData` 有 context，需在 helper 内分支或统一传参。

### S5. manager 查询面收敛为「一次快照 + 派生」

- **做法：** `getAllPlugins` / `getEnabledPlugins` / `getExecutionOrder` 从同一个账本快照派生；`getErrors` 返回只读副本；`getPlugin`/`has` 保留。
- **节省：** 约 **−4~8 行**，并避免每次查询重复 `[...values()]` / filter。
- **风险：** 低。公共形状不变，但返回数组应为新数组，避免调用方误改内部状态。

**不建议的「瘦身」：** 删除 `react/index.ts`、`bus/index.ts`、`manager/index.ts` 薄中间层（每个 1~9 行，节省有限，但 `package.json` 的 `exports` 子路径依赖它们）；删除 `types.ts` 的文档注释（不减 gzip，源码行数好看但没有工程收益）。

---

## 5. 最小基准方案（建议，不在本次执行）

目标：只测「插件层」相对成本，不引入新依赖，使用现有 `vitest + happy-dom`。

1. **排序微基准**
   - `resolveDependencyOrder` 在 n=5/10/20/50，重复 10,000 次取中位数；
   - 对比「每次调用」 vs「版本缓存」；
   - 预期：n≤10 差异很小，n≥20 才明显；若 n=10 已无差异，P2-10 的收益主要来自槽位过滤而非排序。

2. **静态渲染基准**
   - 挂载一个 `withPlugins` 宿主，n=10，通过外部 tick 强制重渲染 1,000 次；
   - 在插件 hook 外层计数 `renderPluginSlot` 谓词调用次数；
   - 对比「现实现」 vs「S3 分组」；
   - 记录 React Profiler 的 commit 时间，不看单次绝对值，看相对下降是否 ≥30%（插件层）/ ≥5%（总 commit）。

3. **动态重装配基准**
   - 每次渲染把插件数组从 `[A..J]` 改为 `[A..J,K]` 再改回，循环 100 次；
   - 统计 `register/clear/init/cleanup/destroy` 调用次数与耗时；
   - 对比「全量 clear+registerAll」 vs「P1-2 diff」；
   - 同时测「全部对象重建」的退化场景，确认不会误报收益。

4. **沙箱基准**
   - 10,000 次异步 hook，timeout=1ms 与 3000ms 两档；
   - 统计 `setTimeout/clearTimeout` 次数、堆增长、unhandled rejection；
   - 对比 Promise.race vs generation token（如后续加 signal 再测 AbortController）。

5. **P2-9 专项**
   - 父组件每帧传入新 props 对象（内容不变 / 内容变化两组）；
   - 统计 `onPropsChange` 执行次数与耗时；
   - 若「内容不变」也触发，说明门控写错，直接否决该实现。

**判定门槛：** 只有「插件层耗时下降 ≥30% 且总 commit 下降 ≥5%」才值得为缓存/分组增加代码；否则保留正确性修复、放弃性能改造。

**已实际执行的低成本测量：** 源码行数统计、`dist` 各 JS 的 gzip 体积。未运行任何渲染/排序压测。

---

## 6. 证据边界

### 已通过代码/实测证实

- `src` 有效行 997、物理行 1116；入口门禁 gzip 4.53 KB（保守上限 4.64 KB）。
- `manager.executeHook` 每次调用都执行 `ordered()`（`PluginManager.ts:40-41,72`）。
- `orderedPlugins` 有 `useMemo`（`usePluginRuntime.ts:145-148`），但 manager 内排序未复用。
- `namesKey` 每渲染无条件 `map+join`（`usePluginRuntime.ts:123`）；`plugins.some` 每渲染 O(n)（`:114-121`）。
- `composeSlots` 每渲染 4 次 `renderPluginSlot`，每次 3 次 filter + sort（`slots.tsx:29-47,72-84`）。
- `transformProps` 每渲染调用一次并遍历全部 ordered 插件（`withPlugins.tsx:36`，`usePluginRuntime.ts:185-204`）。
- `PluginBus` 使用 `Map`，查找 O(1)，不是线性扫描；`emit` 每次复制 Set（`PluginBus.ts:10-21`）。
- P1-3 修复后 disabled 插件的 transform 调用次数从 d 降为 0，不会增加。
- P1-5 现状只放弃等待，不取消底层任务。

### 估算 / 需基准测试才能确认

- 上述操作在完整 React commit 中的毫秒占比。
- `init/destroy/订阅重建` 的实际成本，以及是否有组件真的高频重装配。
- P2-9 接线后的额外钩子链开销。
- P2-6/P2-13 的开发态校验/冻结成本，以及生产构建是否 DCE。
- gzip 增量与源码行数的映射（必须改完后重新跑门禁）。
- 代码量各区间的中值（依赖最终实现风格）。

---

## 7. 最终回答（三问）

### 性能：会提升，但别指望 P1

- **提升点：** ① 执行顺序缓存（消除每次 executeHook 的重复拓扑排序）；② 槽位一次分组（消除每渲染 12n 次 filter 与 4 次 sort）；③ 两处 per-render 小修（`namesKey` 移入 debug、数组引用短路）；④ P1-3 让 disabled 插件退出 transform。
- **不提升的点：** P1-1（时序）、P1-2（仅动态重装配且 Δ 小）、P1-4（异常路径）、P1-5（取消令牌不省 CPU）、绝大多数 P2。
- **可观测性：** P1-2/P1-5/P2-2 的收益主要是「不丢 cleanup、不写已卸载实例、错误可追踪」，不是帧率。

### 代码量：增加，不能净减少

- 只修 P1：**+42~64 行**；收敛后 **+22~44 行**。
- 推荐批次（P1 + P2-2/10/11）：**+22~54 行**。
- 全 P2：**+49~108 行**。
- 现有 997 行，目标「持平」可以做到（低端 +22 行，约 +2%）；「下降」做不到，除非砍功能或删公共 API。

### 能否「提升且瘦身」：能「提升且基本不膨胀」

必须做的取舍：

1. P1-5 只做 generation token，不做 AbortController/signal；
2. P2-9 先只补文档，不接线行为；
3. P2-6/P2-13 严格开发态，生产 DCE；
4. P1-2/P1-5/P2-11 共用一套生命周期账本，P2-10 与槽位分组同批做；
5. P1-3 的缓存与 P2-10 的顺序缓存合并为一份，不重复实现。

做到以上 5 点，可把净增压到 **+22~54 行（+2.2%~5.4%）**，gzip 预计 **4.65~4.83 KB**，仍在 5 KB 预算内；若一次做全 P2，预计 **4.78~5.08 KB**，有超预算风险，必须靠 S1~S5 再回冲。

---

## 8. 实施后实测回填（2026-11-04）

第一轮实际落地：P1-1、P1-2（含 P2-11）、P1-3、P1-4、P1-5、P2-2、P2-10，以及三个收敛点（生命周期账本统一 / manager 单一顺序缓存 / 槽位一次分组）。

### 8.1 预估 vs 实际

| 指标 | 本报告预估（推荐批次 B） | 实际 | 偏差 |
|---|---:|---:|---|
| 有效代码行净增 | +22~54 | **+153** | 约为上限的 2.8 倍 |
| 入口 gzip | 4.65~4.83 KB（保守 ≤4.94） | **5.2803 KB** | 超预估上限约 0.34~0.63 KB |
| 预算 | 5 KB（预计安全） | **5.5 KB** | 经用户拍板调整 |

> 行数口径说明：本报告 §1.1 的 997 行基线是**全量 `src`（16 个文件）**；实施统计的 494 → 647 是**本轮改动的 4 个文件**（`DependencyResolver` / `PluginManager` / `slots` / `usePluginRuntime`）。两者不能直接相加比较，但「净增 +153」是同一 4 文件口径的差值，可直接对照预估的 +22~54。

### 8.2 偏差原因（不粉饰）

1. **预估只算了「新增状态字段」，没算「状态迁移的一致性」**。生命周期账本要同时服务 register / unregister / clear / align / executeHook 五条路径；每条都要处理「已挂载/未挂载」「代次已变/未变」「cleanup 归属」组合，实际分支数远多于 §3.1 的「+25~38 行」。
2. **P1-2 差集不是纯新增，还要重写卸载路径**。为避免 register 阶段自动 onMount，`align` 必须内联「bump → onUnmount → runCleanups → destroy → forget」；这段与 `unregister` 逻辑重复又不便抽 helper（抽出来反而更多行），实际比预估多约 20~30 行。
3. **代次校验必须落在每个 await 之后**。P1-5 的 token 检查不是一处 `if`，而是 `invoke` / `runChain` / cleanup 登记三处；预估的 +9~15 行低估了一倍。
4. **收敛收益被高估**。§3.2 预计合并/回冲 −48~92 行；实际可回冲约 −30 行（transform 合并 −17、槽位分组只净减少量、账本无法靠「删旧分支」抵消，因为旧实现没有对应结构）。
5. **体积与行数不是线性关系**。新增的多为短分支与 Set/Map 操作，gzip 压缩率高，所以 +153 行只带来 +0.75 KB gzip；反过来说，想靠「删几十行」回到 5KB 也不现实，只会破坏语义。
6. **P2-2 的 dev-only 分支未被 DCE**。实测 Vite lib 构建不替换 `process.env.NODE_ENV`，该分支留在 `dist`（约 40 字节），需下游应用 bundler 折叠。

### 8.3 结论修正

- 「推荐批次 B 可压到 +22~54 行 / ≤5KB」的预估**不成立**，已按实测修正为 **+153 行 / 5.2803 KB**。
- 预算经用户确认由 5KB 调整为 **5.5KB**（原因写在 `packages/plugin-core/package.json` 的 `vane.sizeBudgetNote`，见 `tasks/69` §5.6）。
- 未为凑预算删除公共导出、账本或代次机制；后续若要回到 5KB，只能削减行为（例如放弃「未变更插件零重跑」保证），不属于本轮范围。
