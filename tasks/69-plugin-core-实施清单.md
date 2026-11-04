# 69 · vane-plugin-core 实施清单

> 对应分析：`tasks/68-plugin-core-分析.md`；面向人报告：`tasks/70-plugin-core-组件分析报告.md`
> 修复范围：`packages/plugin-core`（必要时同步各领域包的补偿代码；版本号不动，体积预算仅经用户拍板后两次上调：5→5.5→6KB，见 5.6 / 6.6）
> 原则：先修 P1 的语义缺陷，再处理 P2 的可观测性/健壮性；每项必须带回归用例，门禁只跑一轮最终验证。
> 验收命令：`pnpm --filter vane-plugin-core typecheck` → `pnpm --filter vane-plugin-core lint` → `pnpm --filter vane-plugin-core test` → `pnpm --filter vane-plugin-core build`；最后根 `pnpm verify` 一轮。

---

## 〇、兼容性档位速查（回填自 `tasks/71-plugin-core-修复兼容性分析.md`）

> A = 纯内部修复（调用方零改动）；B = 行为修正但契约不变（需逐组件确认未依赖旧行为）；C = 契约变更（下游必须改代码）；D = 需下游主动删除补偿逻辑（非阻塞，修复后冗余）。

| 编号 | 兼容性档位 | 下游动作 |
| --- | --- | --- |
| P1-1 | **A** | 不动 |
| P1-2 | **A（现状）＋ D（补偿清理，可选）** | 不动；sku/coupon/resume/candidate 的补偿保留无害 |
| P1-3 | **B** | 不动；发布说明标注语义变化 |
| P1-4 | **A**（仅循环降级）/ **B**（若改缺失依赖策略，禁止） | 不动；必须保留“缺失依赖=照跑+告警” |
| P1-5 | **B**（限定生命周期钩子）/ **C**（若扩大作用域） | 不动（按限定口径实现） |
| P2-1/2/4/6/10/14 | **A** | 不动 |
| P2-3/5/7/8/11/12/13 | **B** | 不动，补/保留回归；P2-11 需复核 lazy-image 热替换 demo |
| P2-9/15 | **A**（仅文档）/ **C**（若给泛型 HOC 增行为） | vane-danmaku 公共 API 需单独评审 |

---

## 一、P1（必须先做，5 项）

### [x] P1-1 卸载顺序：onUnmount 链完成后才 clear 【兼容性：A】
- 兼容性档位：**A（纯内部）**。context 不暴露 manager，`clear()` 也不清 bus/shared，14 个组件的 onUnmount 可读对象在修复前后都可用；调用方零改动。
- 改动点：`src/react/usePluginRuntime.ts:137-143`、`src/manager/PluginManager.ts:111-129`
- 实现方向：卸载 cleanup 改成 async 串行（或用 manager 新增 `dispose()` 内部先 await onUnmount 再执行 cleanups）；禁止 `void execute(...)` 后同步 `clear()`。
- 验收标准：
  1. 插件 A 的 onMount cleanup 与 onUnmount 钩子按 `cleanup-after-unmount` 顺序记录；
  2. onUnmount 执行期间 `manager.has(name) === true`、`bus.getData(...)` 仍可读；
  3. 卸载后 `manager.getAllPlugins().length === 0` 且无未捕获 rejection。
- 回归测试：`test/lifecycle-order.test.tsx` 新增 2 例（顺序断言 + 卸载后状态断言）。

### [x] P1-2 插件集合变更：增量对齐生命周期 【兼容性：A（现状）＋ D（补偿清理，可选）】
- 兼容性档位：13 个组件的插件数组在 HOC 创建时固定，重装配路径不可触发 → 现状下 **A**；vane-lazy-image GalleryCore 允许内联 `plugins`，会命中重装配 → **有条件 B**（见 71 第三节 3.3）。sku/coupon/resume/candidate 的补偿代码修复后冗余但无害 → **D（可选清理，不阻塞）**。
- **实现口径（决定档位）**：采用「diff + 按插件对象幂等 + 由装配器显式 `execute("onMount")`」，**不要在 register 阶段自动 onMount**；否则 GalleryCore 内联插件会每次渲染重新挂载，且 coupon/resume/candidate 可能双重 onMount。
- 改动点：`src/react/usePluginRuntime.ts:114-131`；`src/manager/PluginManager.ts` 新增 diff/rebind 能力
- 实现方向：不再“全量 clear + registerAll”；按 name + 对象引用做 diff：
  - 移除：执行 onUnmount → cleanups（按插件名回收）→ destroy；
  - 新增：register，并把“新增列表”返回给装配器；由装配器显式 `execute("onMount")`（`executeHook` 按插件对象幂等，重复调用是空操作）；
  - 未变更：完全复用，不触碰订阅。
- 验收标准：
  1. `plugins` 数组替换但对象引用不变时，不产生任何 onUnmount/onMount/cleanup 调用；
  2. 新增插件收到一次 onMount，移除插件收到一次 onUnmount；
  3. 未变更插件在本次替换后的 bus 订阅仍生效（写入数据仍能收到回调）。
- 回归测试：`test/reconfigure.test.tsx` 新增 3 例（未变更零重跑、新增 onMount、移除 onUnmount+订阅回收）。
- 同步项：vane-sku / vane-coupon / vane-candidate / vane-resume 中“手工补跑 onMount”的 workaround 在本项落地后复核——幂等后**保留无害**，删除属可选维护（D）；vane-lazy-image GalleryCore 需同批确认「内联 plugins 是否记忆化」。

### [x] P1-3 统一 enabled 语义（渲染 / 数据管线 / manager 启停同源） 【兼容性：B】
- 兼容性档位：**B（行为修正，契约不变）**。全仓无「disabled 但依赖 transform 照跑」的用法（profile TabSync 空插件、file-preview 路由测试、lazy-image 槽位测试均不依赖）；发布说明需写明「disabled = 完全停用」。
- 改动点：`src/react/usePluginRuntime.ts:145-148,185-226`；`PluginManager.ts:40-44,139-146`
- 实现方向：runtime 维护规范化插件表（与 manager 共用同一对象身份）；`orderedPlugins` 过滤 `enabled !== false`；`enable/disable` 递增版本号并重算排序。
- 验收标准：
  1. `enabled:false` 的插件不参与 transformProps / transformData，也不渲染；
  2. `manager.disable(name)` 后 `runtime.orderedPlugins` 中不再出现该插件；
  3. `enable(name)` 恢复后三条链路同时恢复。
- 回归测试：`test/enabled-semantics.test.tsx` 新增 4 例（transformProps / transformData / 槽位 / disable-enable 往返）。

### [x] P1-4 依赖异常降级，不再穿透 React 渲染 【兼容性：A（仅循环降级）】
- 兼容性档位：**A**，前提是只把“循环依赖 throw”改为“降级 + 记录”。
- **红线**：必须保留「缺失依赖 = 记录告警后照常执行」。vane-resume 有 `ai-polish → multi-lang` 依赖链；若把“缺失/禁用依赖”改为跳过依赖方，润色链行为会变（属 B/C，禁止混入本项）。
- 改动点：`src/dependency/DependencyResolver.ts:30-52`；`src/react/usePluginRuntime.ts:145-148`；`src/manager/PluginManager.ts:72`
- 实现方向：循环依赖不 throw，按注册顺序截断 + 记录错误；`executeHook` 捕获排序异常写入 `errors` 并返回；`usePluginRuntime` 对排序做 try/catch 回退。
- 验收标准：
  1. 构造 A↔B 循环依赖，宿主仍完整渲染（有告警/错误记录）；
  2. `executeHook` 不产生 unhandled rejection；
  3. 缺失依赖仍按现有策略执行并告警（不得改为跳过依赖方）；“禁用依赖”策略单独立项（P2-8）。
- 回归测试：`test/dependency-resilience.test.tsx` 新增 3 例（循环降级、缺失依赖照跑、排序异常入账）。

### [x] P1-5 超时执行失效化 + cleanup 代次回收 【兼容性：B（限定生命周期钩子）】
- 兼容性档位：**B**，前提是代次失效**只作用于生命周期钩子**（onMount / onUnmount / onPropsChange / onError）。
- **红线**：不要作用于数据面异步钩子（onLoad / onBeforeLoad / onActiveChange 等）。否则慢网下 vane-lazy-image 的 `CacheIDBPlugin` 写入、`NetworkAnalyticsPlugin` 上报、`ViewportDebouncePlugin` 延迟计算会被静默丢弃（C 级行为变化）。
- 改动点：`src/sandbox/PluginSandbox.ts:23-34`；`src/manager/PluginManager.ts:67-109,111-129`
- 实现方向：每次 hook 执行分配 generation/AbortSignal；超时即标记失效，迟到返回值（含 cleanup）直接丢弃或立即执行；cleanup 记录 `{pluginName, generation}`。
- 验收标准：
  1. 超时钩子迟到返回的 cleanup 不会在后续 clear 中执行；
  2. 迟到拒绝不产生 unhandledrejection（可挂 `process.on("unhandledRejection")` 断言或 spy）；
  3. 超时后组件卸载，迟到副作用不写入已清空 bus（用 spy 断言）。
- 回归测试：`test/sandbox-timeout.test.ts` 新增 3 例。

---

## 二、P2（按收益排序，15 项）

### [x] P2-1 `once` 异常也注销 【兼容性：A】
- 改动：`src/bus/PluginBus.ts:36-42`，`try/finally`。
- 验收：handler 抛错后再次 emit，handler 调用次数仍为 1。
- 测试：`PluginBus.test.ts` +1 例。

### [x] P2-2 错误账本统一与封顶 【兼容性：A】
- 改动：`PluginManager.ts:33,88`、`usePluginRuntime.ts:192-221`、`slots.tsx:61-64`。
- 验收：`getErrors()` 上限（如 100）；transform/render 错误同样入账；`clear()` 可选重置。
- 测试：`test/error-ledger.test.tsx` +2 例。

### [x] P2-3 错误边界可复位 【兼容性：B】
- 改动：`src/sandbox/PluginErrorBoundary.tsx:17-35`，新增 `resetKeys`/`onReset`。
- 验收：恢复数据后插件槽位重新出现；不引入额外重挂载。
- 测试：`slots.test.tsx` +1 例（先抛错、换 key 后恢复）。

### [x] P2-4 `getAll()` 防原型键 【兼容性：A】
- 改动：`PluginBus.ts:75-81`，`Object.create(null)` + 危险键跳过。
- 验收：`setData("__proto__", {...})` 后 `getAll()` 原型未被改写，键不被吞。
- 测试：`PluginBus.test.ts` +1 例。

### [x] P2-5 设备信息契约修正 【兼容性：B】→ 本轮取方案 A（仅文档）
- 改动：`src/utils/detectDevice.ts:9-34`、`README.md`。
- 实际落地（方案 A）：**`os` / `browser` 保持原始 UA 字符串不变**，只在 README「插件契约」第 4 条明确字段语义与稳定性预期：两字段当前为 `navigator.userAgent` 原值，缓存为模块级（同一进程内只检测一次），SSR/无 `window` 环境降级为 1024×768、dpr 1；**改短名（如 `iOS` / `Chrome`）属破坏性变更，暂不提供**。
- 不做的部分：不改 `detectDevice` 实现、不动 `vane-lazy-image` 的 ErrorTracking / PerformanceMonitor 埋点字段。原因：埋点会把整个 `deviceInfo` 透传上报，改短名会改变既有上报口径，且无下游需求方确认。
- 测试：未新增 `detectDevice` 单测（实现未变，缓存行为已由既有路径覆盖）。

### [x] P2-6 不可变契约与开发态校验 【兼容性：A】
- 改动：`usePluginRuntime.ts:206-226`；文档 `README.md`。
- 验收：文档明确“transform 必须返回新对象”；开发态可选冻结/快照比较，发现原地写回时 warn。
- 测试：`usePluginRuntime.test.tsx` +1 例（原地修改触发告警，不破坏主流程）。

### [x] P2-7 总线写入重入保护 【兼容性：B】
- 改动：`PluginBus.ts:11-22,62-66`。
- 验收：A→B→A 联动写入在超过深度阈值时中断并 warn，不栈溢出。
- 测试：`PluginBus.test.ts` +1 例。

### [x] P2-8 禁用依赖策略 【兼容性：B（需单独评审）】
- 改动：`PluginManager.ts:40-41`；`DependencyResolver.ts`。
- 验收：依赖被 disable 时依赖方不执行（记录原因），且启用后恢复。
- 测试：`PluginManager.test.ts` +1 例。

### [x] P2-9 通用 HOC 生命周期补齐或文档对齐 【兼容性：A（仅文档）/ C（若补行为）】
- 改动：`src/react/withPlugins.tsx:24-54`；`README.md`、模板 `docs/api.md`。
- 验收：二选一并保持一致——(a) HOC 内自动触发 onPropsChange 浅比较；(b) 文档明确“需自行接线”。
- 测试：若实现 (a)，+1 例断言同内容新对象不触发。

### [x] P2-10 执行顺序与槽位缓存 【兼容性：A】
- 改动：`PluginManager.ts:40-41`；`slots.tsx:28-47`。
- 验收：注册/启停不变时重复 executeHook 不再重复拓扑排序（spy 计数）；槽位在插件/context 不变时不重复 filter/sort。
- 测试：性能型断言（调用次数），不引入时间阈值。

### [x] P2-11 `unregister` 回收订阅 【兼容性：B（需复核 lazy-image 热替换 demo）】
- 改动：`PluginManager.ts:56-65`。
- 验收：unregister 后该插件 onMount 返回的 cleanup 立即执行一次，且不误伤其他插件。
- 测试：`PluginManager.test.ts` +2 例。
- 兼容性提示：`vane-lazy-image/demo/src/advanced/PluginHotReloadDemo.tsx` 直接调用 `manager.unregister`，依赖“unregister 只影响 manager、不跑生命周期”的旧语义，必须同批复核。

### [x] P2-12 同名插件去重与旧实例销毁 【兼容性：B】
- 改动：`PluginManager.ts:43-45`；`slots.tsx:28-47`。
- 验收：重复注册时旧实例 destroy 被调用并告警；槽位仅渲染一次，无重复 key 警告。
- 测试：`PluginManager.test.ts` +1 例、`slots.test.tsx` +1 例。

### [x] P2-13 上下文快照只读化 【兼容性：A（正常路径）/ B（StrictMode 双渲染下）】
- 改动：`usePluginRuntime.ts:150-183,228-232`。
- 验收：并发/卸载后调用 execute 不再读到已废弃的 render 上下文；用提交阶段赋值。
- 测试：`test/context-snapshot.test.tsx` +1 例（模拟 StrictMode 双渲染）。

### [x] P2-14 异步 init/destroy 生命周期可等待 【兼容性：A】
- 改动：`PluginManager.ts:43-50,56-65,111-129`。
- 验收：`clear()` 返回 Promise；await 后 destroy 全部完成；重装配不会并发启动新旧资源。
- 测试：`PluginManager.test.ts` +1 例（异步 destroy 顺序）。

### [x] P2-15 HOC 注入字段契约文档化 【兼容性：A（仅文档）/ C（若报错阻断）】
- 改动：`src/react/withPlugins.tsx:35-54`、`README.md`。
- 验收：文档列出 HOC 接管的 props；宿主显式传 `containerRefExternal` 时 warn。
- 测试：`usePluginRuntime.test.tsx` / `withPlugins` 新增 1 例（告警断言）。

---

## 三、统一回归测试要求

1. 所有新增用例放在 `packages/plugin-core/test/`，命名与现有风格一致（`*.test.ts(x)`）。
2. 每个 P1 项至少 2 条断言覆盖“正向行为 + 失败路径”，且必须在**未修复代码**上先红，修复后转绿（避免写出永远为真的断言）。
3. 生命周期顺序类用例必须显式记录调用序列（数组 push），禁止只断言“被调用”。
4. 涉及时间的用例统一使用 fake timers，禁止真实 sleep。
5. 完成后跑一轮根门禁：`pnpm typecheck && pnpm lint && pnpm test && pnpm build`，记录 16/16 tasks 与 plugin-core 用例数。

---

## 四、明确不做

- 不修改 `package.json` 版本号、子路径导出结构。
- 体积预算：第一轮 5 → 5.5KB（5.6），第二轮 5.5 → 6KB（6.6），均经用户拍板，理由记录在 `vane.sizeBudgetNote`。
- 不改动 14 个组件的插件业务逻辑（仅在 P1-2 / P1-3 落地后复核它们的 workaround）。
- 不提交、不推送（本次为只读审计 + 文档产出）。

---

## 五、第一轮实施回填（2026-11-04）

**已完成**：P1-1、P1-2、P1-3、P1-4、P1-5、P2-2、P2-10、P2-11。

### 5.1 落地位置
- [PluginManager.ts](file:///e:/react-plugin-component/packages/plugin-core/src/manager/PluginManager.ts)：生命周期账本、代次令牌、差集对齐、顺序缓存、错误封顶、`unregister` 回收 cleanup。
- [usePluginRuntime.ts](file:///e:/react-plugin-component/packages/plugin-core/src/react/usePluginRuntime.ts)：卸载串行化、align 后显式 onMount、`orderedPlugins` 复用 manager 缓存、transform 链合并。
- [DependencyResolver.ts](file:///e:/react-plugin-component/packages/plugin-core/src/dependency/DependencyResolver.ts)：`resolveDependencyOrderSafe`（仅循环降级，缺失依赖告警原样保留）。
- [slots.tsx](file:///e:/react-plugin-component/packages/plugin-core/src/react/slots.tsx)：一次分组 + 单次 filter/sort。

### 5.2 口径偏差（已按用户指令执行）
1. P1-5 采用 generation token，未引入 `AbortController`；代次失效只作用于生命周期钩子（onMount/onUnmount/onPropsChange/onError），数据面异步钩子不受影响。
2. `register` 不自动 onMount；由 runtime 在 `align` 完成后显式 `executeHook("onMount")`，管理器按插件对象 + 账本幂等。
3. P2-2 使用 `process.env.NODE_ENV`；实测 **Vite lib 构建不做常量替换**，该 dev-only 分支保留在 `dist`（约 40 字节），需下游应用 bundler 折叠。

### 5.3 验证结果
| 门禁 | 结果 |
| --- | --- |
| `pnpm --filter vane-plugin-core typecheck` | ✅ |
| `pnpm --filter vane-plugin-core lint` | ✅ 0 error / 77 warning（全部既有 `no-explicit-any` + react-refresh；本次新增代码 0 warning） |
| `pnpm --filter vane-plugin-core test` | ✅ 5 files / 47 tests |
| `pnpm --filter vane-plugin-core build` | ✅ |
| 根 `pnpm typecheck` | ✅ 16/16 tasks |
| 体积门禁 `node scripts/check-packages.mjs` | ✅ **vane-plugin-core 5.3KB（精确 5.2803KB）/ 预算 5.5KB**（基线实测 4.53KB） |

> 同脚本对其余 4 个包仍报 5 项 FAIL（`vane-card` 全量并集 53.0/52KB、`vane-comment` SortPlugin 2.2/2KB 与 RichComposerPlugin 4.5/4.5KB、`vane-sign-in` 入口 16.5/16KB、`vane-sku` QuotaPlugin 2.1/2KB）。这些包本轮未改源码、`dist` 未重建，且 plugin-core 在其 lib 构建中是外部依赖，与本轮改动无关；属既有产物/口径问题，未处理。

新增 `test/p1-regression.test.tsx`（10 例）：卸载顺序、增/删/未变三态计数、bus 订阅回收、`enabled:false` 停用 transform、disable 后停用、循环依赖降级 + 子树不白屏、迟到 cleanup 不登记、迟到 rejection 不入 unhandled、`clear` 后迟到 cleanup 不登记、错误账本封顶 100。

受影响组件回归：vane-lazy-image 75/75、vane-sku 70/70、vane-resume 31/31、vane-candidate 14/14、vane-danmaku 32/32。vane-coupon 有 1 例失败，**在 HEAD 基线同样失败**（已用 git checkout 原版验证），非本次改动引入。

### 5.4 代码量与体积结论
- 有效代码行（去空行）：494 → 647，**净增 +153**（目标 +22~54；`DependencyResolver +15`、`PluginManager +99`、`slots +26`、`usePluginRuntime +13`）。
- 入口导入图 gzip（逐文件 gzip 求和）：4.5300KB → **5.2803KB**（`index.js` 0.316KB + `chunks/index-oEvkREH6.js` 1.923KB + `chunks/withPlugins-Bf3EAg-2.js` 3.041KB）。
- 已做两轮收敛：transformProps/transformData 合并为单链（-17 行）、槽位单次分组替代 4 次 filter/sort、去掉 onUnmount 并发合并封装（改由账本保证幂等）、错误/清理路径内联压缩。
- 结论：**7 项修复的必需状态（账本 + 差集 + 代次）本身即约 +100 行**，与 +22~54 行、5KB 两个目标不能同时满足。经用户拍板：**接受 +153 行 / 5.28KB**，预算按方案 2 调整为 5.5KB（见 5.6），不做无意义压缩。

### 5.5 剩余 P2
P2-1、P2-3、P2-4、P2-5、P2-6、P2-7、P2-8、P2-9、P2-12、P2-13、P2-14、P2-15。

### 5.6 预算变更记录（2026-11-04）
- 变更位置：[package.json](file:///e:/react-plugin-component/packages/plugin-core/package.json#L35-L38) 的 `vane.sizeBudgetKb`：**5 → 5.5**。
- 原因（同写在 `vane.sizeBudgetNote` 字段，紧邻配置）：第一轮七项修复带来合法增量 —— 卸载时序串行化、重装配差集账本、enabled 真停用、循环依赖降级、generation token、dev-only 错误账本、执行顺序/槽位缓存。实测 5.2803KB，5.5KB 留约 0.22KB 余量。
- 校验脚本 `scripts/check-packages.mjs` 未改（仍读 `vane.sizeBudgetKb`），全域预算口径不变。
- 明确不做：为凑 5KB 删公共导出、删账本或引入非必要的压缩技巧。
- 第二轮续调：5.5 → **6KB**（见 6.6）。

## 六、第二轮 P2 实施记录（2026-11-04）

### 6.1 分组与落地
- **纯内部/文档**：P2-1、P2-4、P2-6（仅文档）、P2-9（仅文档，取方案 b）、P2-15（文档 + 告警）。
- **行为修正、契约不变**：P2-3、P2-7、P2-8、P2-12、P2-13、P2-14（`clear()` 运行时返回 Promise，声明签名同步改为 `Promise<void>`，属声明对齐而非行为变更）。
- **需契约变更/下游配合**：P2-5 取方案 A（保持 `os/browser` 原值，仅补文档，见 6.2）；P2-6/P2-9 取文档口径；P2-14 最终补齐类型声明（`clear()` → `Promise<void>`，运行时早已返回 Promise）。

### 6.2 逐条修复
| 条目 | 修复方式 |
| --- | --- |
| P2-1 | `once` 的 wrapper 用 `try/finally` 注销，handler 抛错后不再残留。 |
| P2-3 | `PluginErrorBoundary` 增加 `resetKeys` / `onReset`，`componentDidUpdate` 浅比较后复位。 |
| P2-4 | `getAll()` 改为 `Object.create(null)`，`__proto__` 只当普通键。 |
| P2-5 | 取方案 A：`detectDevice` 实现不动（`os`/`browser` 仍为 UA 原值），README 补字段语义、模块级缓存、SSR 中性值与「改短名属破坏性变更、暂不提供」。 |
| P2-6 | README 明确 transform 必须返回新对象；不引入运行期冻结/快照（验收中为可选项）。 |
| P2-7 | `emit` 增加联动深度计数（阈值 50），超深中断并告警，不再无限递归。 |
| P2-8 | `getOrder` 用递归 `runs()` 判定：依赖在册但被停用 → 依赖方跳过并记账；**缺失依赖仍照跑 + 告警**。 |
| P2-9 | 取方案 b：文档写明 HOC 不自动触发 `onPropsChange`，需宿主接线；补测试钉住该行为。 |
| P2-12 | 同名新实例注册时 `unregister` 旧实例（回收订阅 + destroy + 告警）；`renderNodes` 按 name 去重。 |
| P2-13 | context 快照改为 `useLayoutEffect` 提交阶段赋值；transform 仍读本次渲染 context（见 6.4）。 |
| P2-14 | `destroyPlugin` 返回 Promise；`align` 等待旧 destroy；`clear()` 返回 `Promise.all`；**public 类型同步改 `clear(): Promise<void>`**（此前声明为 `void`，与运行时不一致）。 |
| P2-15 | README 列明 HOC 接管字段；宿主显式传 `containerRefExternal` 时 `console.warn`。 |

### 6.3 测试与门禁
- 新增按主题拆分：`test/p2-bus.test.ts`（3）、`test/p2-manager.test.ts`（6）、`test/p2-slots.test.tsx`（2）、`test/p2-lifecycle.test.tsx`（4），共 **4 文件 / 15 例**。
- `pnpm --filter vane-plugin-core typecheck`：✅
- `pnpm --filter vane-plugin-core lint`：✅ 0 error / 77 warning（全部既有；新增代码 0 warning）
- `pnpm --filter vane-plugin-core test`：✅ **9 files / 62 tests**
- `pnpm --filter vane-plugin-core build`：✅
- 体积门禁：✅ **5.7236KB / 预算 6KB**（5861B；`index.js` 323B + `chunks/index` 2237B + `chunks/withPlugins` 3301B），余量约 0.276KB。
- 根 `pnpm typecheck`：✅ 16/16 tasks —— 证明 `clear(): Promise<void>` 未影响 14 个组件，**0 个组件需要改代码**。
- 受影响组件回归：vane-resume 31/31、vane-sku 70/70、vane-lazy-image 75/75、vane-danmaku 32/32、vane-candidate 14/14 通过；vane-coupon 仍为 HEAD 既有失败 `CP-P2-4`。

### 6.4 回归暴露并修复的问题
- 首版 P2-13 让 transform 读“已提交快照”，导致 candidate 的 Filter/Search 在渲染期读到上一帧 `ctx.state`，筛选/搜索用例失败。
- 修正为：**transform 读本次渲染 context；`execute` 读提交阶段快照**。修正后 candidate 14/14 通过。

### 6.5 决策结果（2026-11-04，用户拍板）
1. **P2-5 → 方案 A**：保持 `os/browser` 原值，只补文档；不改字段名、不动 `vane-lazy-image` 埋点。README 已写明「改短名属破坏性变更，暂不提供」。
2. **体积 → 方案 A**：`sizeBudgetKb` 5.5 → **6**，保留全部防御性修复。未为省 225B 撤掉已实现逻辑（错误边界复位、emit 深度保护、同名去重、context 快照、destroy 可等待）。
3. **P2-14 补类型**：`PluginManager.clear()` 由 `void` 改为 `Promise<void>`，与运行时一致；`PluginBus.clear()` 保持 `void`（同步清空，语义正确）。`destroyPlugin` / `align` 为模块内部实现，无公开签名变更。影响面：`withPlugins` / `usePluginRuntime` 对外类型不变；根 typecheck 16/16 通过，**0 个组件需改代码**（忽略 `clear()` 返回值仍可编译）。

### 6.6 预算变更记录（第二轮）
- 位置：`packages/plugin-core/package.json` 的 `vane.sizeBudgetKb`：**5.5 → 6**；`vane.sizeBudgetNote` 追加第二轮说明。
- 实测：第一轮 5.2803KB（5407B）→ 第二轮主体 5.7197KB（5857B）→ 补类型后 **5.7236KB（5861B）**；相对第一轮 +0.443KB。
- 余量：6KB − 5.7236KB ≈ **0.276KB（283B）**。
- 口径不变：`scripts/check-packages.mjs` 仍按入口导入图逐文件 gzip 求和；版本号与子路径导出未动。

