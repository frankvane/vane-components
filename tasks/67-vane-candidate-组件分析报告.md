# vane-candidate 组件分析报告（核心功能专项）

> **修复记录（2026-11-03）**：本报告全部问题已修复并验证——typecheck / lint（0 error）/ build / vitest 14/14（含 42 项 selftest 断言）全绿。
> - H1：withPlugins 新增 `ctx.rawData`（管道前全量内部数据），ArchivePool 改读之；selftest 断言同步修正为「人才库（2）」
> - H2：maskPhone 先提取数字再掩码（兼容 +86/横线/空格/短号，绝不原样透出）；maskEmail 域名取最后一个 @ 之后
> - M1/M2/M7：副作用移出 setState updater（dataRef 镜像 + commitDataRef 统一出口）；不存在 id / 无效 patch 不再触发回调；删除 hostControlledRef 死代码
> - M3/M4：新增 `updateCandidates` / `moveCandidateTo` / `moveCandidatesTo` 聚合接口；BatchOp 改用之（单次落态单次回调，目标阶段直给杜绝 delta 错位）
> - M5：DupCheck 改用 rawData 判重（消除掩码碰撞误报）；L2：WeakMap 倒排索引，O(N²)→O(N)
> - M6/L5：Search 输入改受控即时响应，过滤在 transformData 内按 debounceMs 防抖生效
> - L1/L3/L4/L6/L7/L8/L9/L10/L11/L12：排序 tiebreak 方向、csvCell 数值与 \t\r 前缀、Filter 选项取全量、Overlay 顶层弹层栈、卡片 memo + Map 分组 + EMPTY、order/priority 分工注释、失实注释修正、cloneData 删除、avatar 协议白名单、表格 role 补齐——全部落地
> - 新增回归测试：`test/strictmode.data.test.tsx`（StrictMode 单次回调 / 无效 id 忽略 / 批量聚合 / moveCandidateTo）+ domain 变体用例

- 日期：2026-11-03
- 范围：`packages/vane-candidate` 全部核心源码 + 19 插件中 10 个代表性插件抽查
- 方法：security-best-practices（React 前端安全规范）+ vercel-react-best-practices（性能规则）逐项核对 + 手工走查数据流
- 结论速览：**核心架构（HOC + bus + 双槽体系 + transformData 管线）健壮、方向正确**；未发现 XSS / 注入 / 危险 DOM sink。但存在 **2 个高优先级功能缺陷**（人才库数据源错位、脱敏静默失效）、**5 个中优先级问题**（副作用进 setState updater、批量操作 N 次回调等）与若干建议项。

---

## 一、架构总体评价（做得好的部分）

| 维度 | 评价 |
|---|---|
| 插件隔离 | 装饰槽单插件抛错只丢自己一段（`renderSlotGroup` try/catch + ErrorBoundary），内容覆盖槽逐个降级，符合沙箱化设计 ✓ |
| 数据不可变 | `domain.ts` 纯函数、不可变更新、history 上限 50 条 ✓ |
| 性能基线 | 内核 `usePluginRuntime` 对 props/data 浅比较稳定化 context、orderedPlugins 按引用身份 memo，避免内联数组导致全量重注册 ✓ |
| 安全基线 | 全 src 无 `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` / localStorage / postMessage（grep 验证 0 命中）；所有插值走 JSX 默认转义 ✓ |
| CSV 注入 | `csvCell` 引号包裹 + 内部引号翻倍 + `=+-@` 前缀加 `'` 防公式注入 ✓（缺口见 L3） |
| 可访问性 | Overlay 完整焦点陷阱 + Escape + 焦点归还；按钮均有 aria-label；对比度令牌合规 ✓ |

---

## 二、高优先级问题（严重）

### H1. ArchivePool 人才库读 `ctx.props.data`，非受控模式下归档后界面不更新
- 位置：`src/custom-plugins/ArchivePoolPlugin/create.tsx:39`、`:57`
- 证据：
  ```ts
  const raw = (ctx.props?.data as Candidate[] | undefined) ?? [];
  const archivedCount = raw.filter((c) => c.archived).length;
  ```
- 影响：插件更新走 `withPlugins` 的**内部态**（`internalData`），`props.data` 只有在宿主受控回写（`onDataChange` → 宿主 setState → 新 props.data）时才同步。**非受控使用**（宿主不回写）时：用户点「归档」→ 卡片从看板消失（transformData 生效），但人才库按钮计数永远停留在初始数据的 archived 数量，浮层里也看不到新归档的人。核心功能在合法用法下静默失效。
- 根因：`withPlugins` 没有把「内部全量数据」暴露给 ctx——`ctx.data` 是 transformData 管道后数据（archived 已被滤除），`ctx.props.data` 又不保证新鲜。
- 修复建议：`withPlugins` 在 `domainContext` 附加 `rawData: internalData`（全量、未过滤），ArchivePool 改读 `ctx.rawData`；或维护 `candidate:change` 的最新快照到 `ctx.shared`。

### H2. maskPhone 对非纯数字手机号静默失效（隐私泄露）
- 位置：`src/components/CandidatePlugin/domain.ts:59-62`
- 证据：
  ```ts
  return phone.replace(/^(\d{3})\d*(\d{4})$/, "$1****$2");
  ```
- 影响：`+8613812345678`、`138-1234-5678`、`138 1234 5678`、短号（<7 位）都不匹配正则 → `replace` 无命中 → **原样返回**。ContactMask 插件看起来工作（UI 无异常），但联系方式实际未脱敏，构成 PII 泄露（招聘场景输入来自简历解析，格式五花八门）。
- 修复建议：提取数字后判断长度再掩码，例如：
  ```ts
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone.slice(0, 3) + "****";
  return digits.slice(-4).padStart(digits.length - 4 > 3 ? digits.length : 7, "*");
  ```
  （保守版：至少保证「数字少于 7 位或含非数字字符」时不再原样透出全部号码。）

---

## 三、中优先级问题

### M1. 副作用放在 `setInternalData` 的 updater 函数内
- 位置：`src/components/CandidatePlugin/withPlugins.tsx:121-135`（update）、`:146-163`（move）
- 证据：`emitChangeRef.current(next)`（bus 广播 + `onDataChange` 回调）写在 `setInternalData((prev) => {...})` 内部。
- 影响：React 18/19 中 updater 必须是纯函数——StrictMode 开发态会**双调用**（每次更新触发两次 `onDataChange` / `candidate:change`），并发特性下被丢弃的渲染也会重复执行 updater → 宿主持久化可能重复写入。selftest 若未在 StrictMode 下断言回调次数则测不出。
- 修复建议：用「计算 next → 比较引用 → `setInternalData(next)` + 在 updater 外 emit」的模式，或把副作用挂到 `useEffect` 监听数据版本号。

### M2. `candidate:update` 对不存在的 id 也会触发 `onDataChange`
- 位置：`withPlugins.tsx:121-131`；对照 move 路径 `:146-153`（先 `find` 判存在）
- 证据：`applyCandidatePatch` 用 `list.map`，id 不存在时返回**新数组**（内容相同）→ `next !== base` → 状态更新 + `emitChange` 照发。
- 影响：多余渲染 + 宿主收到「无变化」的持久化回调；与 move 路径行为不一致。
- 修复建议：update 路径同样先 `findIndex` 判存在，未命中直接返回 `prev`。

### M3. BatchOp 批量操作逐条 emit → N 次 setState / N 次 onDataChange
- 位置：`src/custom-plugins/BatchOpPlugin/create.tsx:75-114`
- 影响：选 50 人批量归档 = 50 次独立 `setInternalData` + 50 次 `onDataChange`（每次都是全量列表）→ 宿主持久化风暴 + 连续 50 次重渲染。
- 修复建议：`withPlugins` 增加批量入口（如 `bus.emit("candidate:batch", { updates: [...] })` 或 `ctx.updateCandidates(patches)`），单次聚合更新、单次回调。

### M4. BatchOp 流转 delta 与执行侧阶段表可能不一致
- 位置：`BatchOpPlugin/create.tsx:81-85`（用 `config.targetStages` 算 delta）vs `withPlugins.tsx:54-58`（`candidate:move` 处理器用 `props.stages ?? DEFAULT_STAGES` 执行）
- 影响：宿主配置了 `targetStages` 且与组件 `stages` prop 不同时，`moveCandidate(id, to - from)` 的 delta 语义错位，候选人落入错误阶段。
- 修复建议：`candidate:move` 事件直接携带 `targetStage` key，由执行侧换算 delta；或 BatchOp 改用 `ctx.updateCandidate(id, { stage: target })` + 补 history 的统一入口。

### M5. ContactMask × DupCheck 组合：掩码碰撞导致误报重复
- 位置：ContactMask（`priority: 10` 管道末位执行）+ DupCheck 读 `ctx.data`（= mask 后数据）
- 影响：`13812345678` 与 `13899945678` 掩码后同为 `138****5678` → DupCheck 按掩码值判重，出现「疑似重复」误报。
- 修复建议：DupCheck 的判重数据应取管道前原始值（读 `ctx.shared` 快照或提高其 transform 优先级不在渲染期取数）。

### M6. `SearchConfig.debounceMs` 配置项未实现
- 位置：`src/custom-plugins/SearchPlugin/create.tsx:12`（声明）vs `:56`（onChange 直接 setState，无防抖）
- 影响：文档/类型承诺防抖，实际每 keystroke 全量重跑 transformData 管线。类型签名是 API 契约，属实现-文档不一致。

### M7. `hostControlledRef` 死代码，受控→非受控回落未定义
- 位置：`withPlugins.tsx:78`（声明）、`:96-100`（仅赋值，从未读取）
- 影响：宿主把 `data` 从有值改为 `undefined` 时，`internalData` 停留在最后一次受控值（effect 只在 `!== undefined` 时写）。行为可用但语义未声明；该 ref 暗示有未完成的设计意图。
- 修复建议：删除死代码，或在文档中明确「data 一旦受控不可回退为非受控」。

---

## 四、建议（Low）

| ID | 问题 | 位置 | 建议 |
|---|---|---|---|
| L1 | RecommendSort score 并列时 tiebreak 方向与注释相反（实为旧投递在前，注释称「新在前」） | `RecommendSortPlugin/create.tsx:47`（`* -dir` 应为 `* dir`） | 修正乘号或注释 |
| L2 | DupCheck 每卡全表扫描，整体 O(N²)（js-index-maps 违例） | `DupCheckPlugin/create.tsx:39-50` | 渲染前构建一次 signature → ids 的 Map（可在 transformData 或 useMemo 预计算） |
| L3 | `csvCell` 对 `-` 开头数字也加 `'`，会破坏负数列；未覆盖 `\t`/`\r` 前缀；ExportPlugin 用 `col === BUILTIN_COLUMNS[2]` 身份比较脆弱 | `domain.ts:52-56`、`ExportPlugin/create.tsx:76` | 数值类型跳过前缀处理；阶段列改为显式 `header` 匹配 |
| L4 | Filter 标签选项从**已筛选**数据收集，选项随筛选收窄 | `FilterPlugin/create.tsx:47-51` | 选项收集改读全量数据（与 H1 的 `rawData` 一起解决） |
| L5 | Search 输入 `defaultValue` 非受控：外部重置 `searchKeyword` 时输入框 UI 不跟随 | `SearchPlugin/create.tsx:55` | 改受控 `value={kw}`（配合 M6 防抖） |
| L6 | Overlay 多实例并存时，按一次 Escape 所有弹层同时关闭 | `plugins/overlay.tsx:57-61` | document keydown 命中最上层弹层后才关闭（比较 zIndex/挂载序） |
| L7 | CandidateCard / StageColumn 未 memo；`renderKanbanDefault` 每列 filter O(S×N)；`data ?? []` 每渲染新建使内容槽 memo 失效（rerender-memo-with-default-value 违例） | `CandidateCore.tsx:46,110-125` | 卡片 `React.memo`；列分组改单次遍历建 Map；空数组提为模块常量 |
| L8 | transformData 管线顺序由 `priority` 决定，`config.order` 只管渲染槽；官方插件两者恰好同值，第三方插件只调 order 时管线顺序不会变 | `plugin-core/DependencyResolver.ts` + 各插件 `config:{order}` | 文档显式说明两者分工，或提供 `transformOrder` 独立字段 |
| L9 | `withPlugins.tsx:113` 注释「runtime.bus 在插件集合变化时重建」与实现不符（bus 每实例仅创建一次，`plugin-core/usePluginRuntime.ts:98-100`） | `withPlugins.tsx:113` | 修正注释，避免误导后续维护 |
| L10 | `cloneData` 无任何调用者（死代码），且 JSON 回退会丢 Date/undefined | `plugins/tokens.tsx:49-52` | 删除或迁移到通用 utils |
| L11 | `<img src={candidate.avatar}>` 未校验协议（REACT-URL-001：`data:` URL 可用于像素追踪） | `CandidateCore.tsx:224-231` | 低风险；可加 `https?:` 校验 |
| L12 | ViewSwitch 列表视图 `role="table"/"row"` 但行内无 `role="cell"`，表格语义不完整 | `ViewSwitchPlugin/create.tsx:64-131` | 行内 span 补 `role="cell"` 或改用真表格元素 |

---

## 五、安全专项核对结论（security-best-practices）

- ✅ 无 XSS 逃生舱（`dangerouslySetInnerHTML` 0 处）、无 DOM 注入 sink、无动态代码执行
- ✅ 无 Web Storage 凭证存储、无 postMessage、无网络请求（纯 UI 组件包，CSP/headers/SRI 属宿主责任）
- ✅ CSV 公式注入有防护（缺口 L3 为低危）
- ✅ React 默认转义全程未被绕过
- ⚠️ **PII 脱敏存在静默失效路径（H2）**——本报告唯一实质性安全发现
- 提示：组件将渲染 `candidate.avatar`、`resumeUrl` 等外部 URL，最终安全取决于宿主数据可信度；若数据源不可信应在校验层处理（组件内做协议白名单属加分项）

## 六、React 性能核对结论（vercel-react-best-practices）

- ✅ 内核层做得好：浅比较稳定化 context/props/data、插件引用身份 memo、`useCallback` 稳定回调、无内联组件定义（`rerender-no-inline-components` 合规）
- ⚠️ 主要短板集中在渲染层：卡片未 memo + O(N²) 判重 + 每渲染新建空数组（L2/L7），百人级看板在 filter/search 输入时全量重渲
- ⚠️ 副作用进 updater（M1）是并发模式下的正确性隐患，优先级高于纯性能项

---

## 七、修复优先级建议

1. **立即**：H1（人才库数据源）、H2（脱敏失效）——均为「用户可见功能错误」且修复面小
2. **下一版**：M1（updater 纯度）、M2（空更新回调）、M3（批量聚合）、M6（防抖落地）
3. **择机**：M4/M5/M7 与全部 L 项；L9/L10 顺手清理
4. 回归防线：selftest 建议补 StrictMode 模式用例（覆盖 M1 双发）与非受控模式用例（覆盖 H1）
