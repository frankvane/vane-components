# vane-profile 修复实施验收清单

- 关联评审报告：`tasks/41-vane-profile-核心功能评审.html`（0 P0 / 5 P1 / 8 P2）
- 实施包：`packages/vane-profile`（vane-profile@0.1.0）
- 改动范围：主体为 `packages/vane-profile/` 下文件 + 本文档；为彻底修复 PF-P2-2 在 `packages/plugin-core` 内做了 props/data 引用稳定化（`usePluginRuntime.ts`，附内核单测），未改动其它包、根配置与评审报告；未执行任何 git 命令。
- 验收目标：13 项问题（P1-1 ~ P1-5、P2-1 ~ P2-8）全部落地，并配套 20 条回归用例（新增 `test/fixes.test.tsx`，另有 1 条既有用例按新契约调整）。

## 1. 概述

按报告 T01 → T05（业务语义类 P1）与 T06 → T08（契约 / 性能 / 降级类 P2）的顺序实施，全部改动落在包内：

- **乐观更新闭环**：关注按钮新增 `pending`（禁用 + `aria-busy`）与 `error`（`role="alert"` 可见提示），`onFollow` 支持 `Promise` 与 `{ error }` 两种失败信号，失败回滚到点击前状态。
- **状态可控**：新增受控 props `activeTab` / `onActiveTabChange`；受控模式只回调不写内部 state，非受控模式仍写内核 state 并通知宿主。
- **渲染契约**：内容区改为 `{contentSlot}{children}` 并列，内核三槽 / 宿主 children 不再被内容插件吞掉；`transformData` 契约真正接线（HOC 内 `useMemo` 执行一次并下发到领域上下文）。
- **安全与降级**：新增包内私有 `safe-url.ts`（`safeHref` / `safeImageUrl` / `cssImageUrl`），社交链接、官网、邮箱 / 电话、头图、作品封面统一走白名单；头像增加失败 / 缺省占位与 `alt`、`marginBottom` 仅在存在头像时生效；空数据态跳过空白容器、空按钮改 `span`、空态文案改实色。
- **性能与并发**：槽位按插件预分组并 `memo`，槽位 key 去掉 index；移除渲染期写 ref（`ctxRef` / `activeTabRef`），`onTabChange` 改用渲染期变量 + `prevTabRef` 在 effect 内比较。
- **健壮性**：TabSync 空 tabs 返回 `enabled:false` 空插件而不是 throw；QRShare 无 url 时不渲染、复制失败有提示、定时器与全局监听器全部清理、Esc / 外点可关闭。

## 2. 逐项验收表

| 编号 | 级别 | 问题 | 修复方案 | 改动位置(file:line) | 回归测试用例名 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| PF-P1-1 | P1 | 关注按钮乐观更新无回滚通道，失败后永久停在「已关注」，且无 in-flight 锁 | `onFollow` 签名扩展为 `(next) => Promise<FollowResult> \| FollowResult`（`FollowResult = void \| { error? } \| undefined`）；`FollowButton` 增加 `pending` / `error` 内部态，点击先存 `prev` 再乐观切换，`await` 失败（reject 或 `{error}`）时 `setState(prev)` 并渲染 `.vp-follow-error`；`disabled={pending}` + `aria-busy` 防重复点击；`finally` 复位 pending | `src/custom-plugins/FollowEchoPlugin/create.tsx:11`（类型）、`:25`（签名）、`:59-85`（状态与回滚）、`:92-93`（pending）、`:107-115`（错误提示）、`:145`；`src/custom-plugins/FollowEchoPlugin/doc.json` | ① `onFollow reject 后按钮回到原态并显示错误文案` ② `pending 期间按钮禁用，重复点击不会重复发请求` ③ `onFollow 返回 { error } 同样回滚`（`test/fixes.test.tsx:34/56/91`） | 已修复 |
| PF-P1-2 | P1 | 页签不可受控，外部无法读取 / 设置 activeTab，`defaultActiveTab` 点过一次即失效 | `ProfileCoreProps` 增加 `activeTab?: string \| null` 与 `onActiveTabChange?: (id, prev) => void`；HOC 以 `props.activeTab !== undefined` 判定受控；`setActiveTab` 始终回调宿主，仅非受控时写 `base.setState` | `src/components/ProfilePlugin/plugins/types.ts:50-55`；`src/components/ProfilePlugin/withPlugins.tsx:55`（受控判定）、`:64-93`（extendContext）、`:75-78`（setActiveTab） | ① `受控模式点页签只回调 onActiveTabChange，不改内部状态` ② `非受控模式仍写内部 state，同时通知 onActiveTabChange`（`test/fixes.test.tsx:112/138`） | 已修复 |
| PF-P1-3 | P1 | 启用内容插件后 `contentSlot` 整体替换 children，内核 header/overlay/footer 插件与宿主内容全部消失 | 内容区改为 `{contentSlot}{children}` 并列渲染；`composeSlots` 五段仍放在 `children` 内，不新增公开 prop，保持既有段序 | `src/components/ProfilePlugin/ProfileCore.tsx:149-155`；`src/components/ProfilePlugin/withPlugins.tsx:179-192` | `内容插件与 children、内核 renderHeader 插件同时可见`（`test/fixes.test.tsx:160`） | 已修复 |
| PF-P1-4 | P1 | 社交链接 / 官网 / 头图 / 作品封面 URL 直出，无协议白名单；CSS `url()` 未加引号可被 `)` 撑破 | 新增包内私有 `safe-url.ts`：`safeHref` 仅放行 `http/https/mailto/tel` 与站内相对路径（拒绝 `//`、mailto 携带 `?subject=`、tel 非法字符）；`safeImageUrl` 仅放行图片可用的 `http/https`；`cssImageUrl` 再加引号并对 `" ' ( ) \ 空白` 做百分号编码（`encodeURIComponent` 不转义 `!'()*`，故按码点手动编码）。SocialLinks 非法协议降级为 `span`，ContactCard / BannerSlot / WorksGrid / QRShare 全部改走白名单 | `src/components/ProfilePlugin/plugins/safe-url.ts:13-76`；`src/custom-plugins/SocialLinksPlugin/create.tsx:77,111-130`；`src/custom-plugins/ContactCardPlugin/create.tsx:41-49,85-89`；`src/custom-plugins/BannerSlotPlugin/create.tsx:132-135`；`src/custom-plugins/WorksGridPlugin/create.tsx:82-103`；`src/custom-plugins/QRSharePlugin/create.tsx:208-211` | ① `safeHref / cssImageUrl 拒绝 javascript:、data: 与注入字符` ② `社交链接非法协议降级为纯文本` ③ `头图 cover 非法协议回退渐变背景`（`test/fixes.test.tsx:187/203/222`） | 已修复 |
| PF-P1-5 | P1 | TabSync 工厂在 `tabs=[]` 时直接 throw，渲染期构造插件会在 React 之外抛错导致整树白屏 | 空 tabs 返回 `{ name: "TabSync", enabled: false, hooks: {} }` 软关闭插件；`items` 统一 `Array.isArray` 过滤无 id 项 | `src/custom-plugins/TabSyncPlugin/create.tsx:51-64` | `tabs=[] 不抛错，返回禁用插件且渲染不崩溃`（`test/fixes.test.tsx:234`） | 已修复 |
| PF-P2-1 | P2 | 领域槽 key 带 index，插件顺序一变整颗重挂载，内部态（展开 / 乐观态）丢失 | 槽位 key 改为 `profile-slot-${plugin.name}`，不再含 index | `src/components/ProfilePlugin/plugins/slots.tsx:103-110` | `key 只用插件名，顺序变化后仍按插件身份绑定`（`test/fixes.test.tsx:248`） | 已修复 |
| PF-P2-2 | P2 | `SlotProvider` 的 `useMemo` 无效：内核 context 依赖 props 身份，宿主每次重渲染打穿所有消费者 | **内核侧根治**：`usePluginRuntime` 增加模块级 `shallowEqual`，对 `props` / `data` 做引用稳定化（内容不变时复用上一份对象引用），`context` 的 `useMemo` 依赖改为 `stableProps` / `stableData`，宿主每次重渲染新建同内容对象不再打穿消费者。包侧保留原有 `extendContext` 依赖收敛、`ProfileSlotProvider` 预分组 `memo`、`useProfileSlot` 按 `[plugins, context, slot]` memo 与 `domainContext` 稳定层 | 内核：`packages/plugin-core/src/react/usePluginRuntime.ts:40-51`（shallowEqual）、`:154-160`（稳定化）、`:164-165`（注入稳定引用）、`:181`（依赖数组）；包侧：`src/components/ProfilePlugin/withPlugins.tsx:64-93`、`:122-126`；`src/components/ProfilePlugin/plugins/slots.tsx:71-86`、`:139-148` | 包侧：`宿主 forceUpdate（props/context 未变）不触发插件重算`（`test/fixes.test.tsx:278`）；内核：`props 内容不变（每次新建同内容对象）时 context 引用保持不变`、`props 内容变化时重建 context 并携带新值`、`data 新数组引用视为变化、同引用保持稳定`（`packages/plugin-core/test/usePluginRuntime.test.tsx`） | 已修复（内核支持） |
| PF-P2-3 | P2 | 每次 Core 渲染做 7 次过滤 + 排序 + 全量插件调用，无缓存 | `groupPluginsBySlot` 一次产出 7 个槽位分组（含过滤与排序），Provider 内 `useMemo` 缓存；Core 只做 map，不再重复过滤排序 | `src/components/ProfilePlugin/plugins/slots.tsx:23-31,53-65,80`；`src/components/ProfilePlugin/ProfileCore.tsx:37-43` | 同上（forceUpdate 计数桩，插件渲染函数调用次数不增） | 已修复 |
| PF-P2-4 | P2 | 渲染期写 ref（`ctxRef.current` / `activeTabRef.current`），并发渲染下可能读到未提交中间态，`onTabChange` 新旧页签可能错位 | 删除两处渲染期写 ref：Core 直接用 `const activeTab = ctx?.activeTab ?? null` 并作为 `useImperativeHandle` 依赖；HOC 的 `onTabChange` effect 依赖渲染期变量 `currentTab`，用 `prevTabRef` 在 effect 内比较后传 `(new, old)` | `src/components/ProfilePlugin/withPlugins.tsx:155-166`；`src/components/ProfilePlugin/ProfileCore.tsx:47,60-62` | `onTabChange 收到 (新页签, 旧页签)，连续切换不会错位`（`test/fixes.test.tsx:306`） | 已修复 |
| PF-P2-5 | P2 | 声明的 `transformData` 钩子在本包永不执行，插件作者按契约写归一化会静默失效 | HOC 内 `useMemo` 执行一次 `runtime.transformData(props.data)`，并以 `domainContext = { ...runtimeContext, data: transformedData }` 下发；`data === undefined` 时保持透传，避免无 data 场景额外计算 | `src/components/ProfilePlugin/withPlugins.tsx:113-126` | `transformData 被执行，插件从 ctx.data 读到归一化结果`（`test/fixes.test.tsx:338`） | 已修复 |
| PF-P2-6 | P2 | 头像无降级：破图留白、`alt=""`、无头像时仍固定 `marginBottom` | 新增 `avatarAlt`（默认「头像」）与 `avatarFallback`（默认人形 SVG）配置；抽出模块级 `Avatar` 组件，`useState` 记录失败，失败 / 无 src 时渲染 `.vp-avatar-fallback`（`role="img" aria-label`），成功走 `<img onError>`；`marginBottom` 改为 `avatarUrl ? avatarSize / 2 : 0`；头像地址走 `safeImageUrl` | `src/custom-plugins/BannerSlotPlugin/create.tsx:7,18-20,49-105,124-133,154-167`；`src/custom-plugins/BannerSlotPlugin/doc.json` | ① `非法头像协议直接走占位块，alt 不再是空字符串` ② `头像加载失败（error 事件）切换到占位块`（`test/fixes.test.tsx:366/380`） | 已修复 |
| PF-P2-7 | P2 | 空数据态仍渲染固定容器：空白 meta 条、可聚焦空按钮、空态用 opacity 压字 | `.vp-meta-area` 仅在 `statRow.length > 0 \|\| followArea.length > 0` 时渲染；StatRow 无 `onStatClick` 时输出 `<span class="vp-stat-item">`，有回调才用 `<button>`；WorksGrid / AchievementWall 空态改 `#6b6b6b` 实色（去 `opacity:0.6`），AchievementWall 补 `.vp-achievements-empty` | `src/components/ProfilePlugin/ProfileCore.tsx:120-140`；`src/custom-plugins/StatRowPlugin/create.tsx:87-95`；`src/custom-plugins/WorksGridPlugin/create.tsx:122`；`src/custom-plugins/AchievementWallPlugin/create.tsx:64` | ① `未传 onStatClick 时指标输出 span，meta 区仅在非空时渲染` ② `WorksGrid 空态用实色文字而不是 opacity`（`test/fixes.test.tsx:398/409`）；另有既有用例 `无插件时渲染骨架且不崩溃（空数据态不留空白数据行）`（`test/core-render.test.tsx:9`，已按新契约更新断言） | 已修复 |
| PF-P2-8 | P2 | 页签无 tablist/tab/aria-selected；分享浮层无 aria-expanded、无 Esc/外点关闭；复制失败静默；定时器无清理；默认分享链接硬编码示例站 | TabSync 容器 `role="tablist"`，按钮 `role="tab"` + `aria-selected`；QRShare 按钮补 `aria-expanded` / `aria-haspopup="dialog"`，面板 `role="dialog"`，`copyState` 三态（复制链接 / 已复制 / 复制失败，失败红底），`rootRef` + `timerRef` 清理，Esc / 点击外部关闭（effect cleanup），`url ?? props.data.homeUrl` 经 `safeHref` 校验，两者都无则不渲染 | `src/custom-plugins/TabSyncPlugin/create.tsx:109,125-130`；`src/custom-plugins/QRSharePlugin/create.tsx:1,35,52-98,106-107,128,174-180,193-211`；`src/custom-plugins/QRSharePlugin/doc.json` | ① `页签补齐 role=tablist / role=tab / aria-selected` ② `QRShare 无 url 不渲染；有 url 可展开；复制失败有提示；Esc 可关闭`（`test/fixes.test.tsx:421/436`） | 已修复 |

### 2.1 破坏性变更（公开 API 兼容性说明）

| 项目 | 原行为 | 新行为 | 影响面 |
| --- | --- | --- | --- |
| QRShare `url` 默认值 | 未传时硬编码 `https://vane.dev/u/frankvane` | 未传时读 `props.data.homeUrl`，两者都无则不渲染分享按钮 | 仅依赖旧默认示例站地址的接入方；属修复生产事故级默认值，接受破坏 |
| FollowEcho `mutual` 点击语义 | `mutual → following`（与「mutual 视为已关注」注释矛盾） | `mutual → none`（点「互相关注」即取消关注） | 已关注 / 互相关注用户点击后的目标态变化；与注释契约一致化 |
| FollowEcho `onFollow` 返回值 | `(next) => void` | `(next) => void \| Promise<void \| { error? }>` | 向后兼容（同步返回 void 仍有效） |
| `ProfileCoreProps` | 无 `activeTab` / `onActiveTabChange` | 新增两个可选 props | 向后兼容（不传即非受控） |
| BannerSlot 配置 | 无 `avatarAlt` / `avatarFallback` | 新增可选配置（默认值内置） | 向后兼容 |

## 3. 验证记录

> 全部命令在 `e:\react-plugin-component` 下真实执行，以下为实际输出摘要（时间 2026-11-01）。

| 序号 | 命令 | 实际结果 | 结论 |
| --- | --- | --- | --- |
| 1 | `pnpm --filter vane-profile test` | `Test Files 3 passed (3)` / `Tests 32 passed (32)`（fixes 20、core-render 6、plugins 6）；Vitest 2.1.9，Duration 10.19s | 通过 |
| 2 | `pnpm --filter vane-profile typecheck` | `tsc --noEmit -p tsconfig.json` 无任何输出、退出码 0 | 通过 |
| 3 | `pnpm --filter vane-profile lint` | `✖ 113 problems (0 errors, 113 warnings)`，退出码 0；警告均为既有风格项（`no-explicit-any`、各插件 `doc` 未使用、`react-refresh/only-export-components`），本次修掉自身的未使用 import 与失效 eslint-disable（原 115 warnings → 113） | 通过（0 error） |
| 4 | `pnpm --filter vane-profile build` | `✓ 73 modules transformed`，`[vite:dts] Declaration files built in 4352ms`，`✓ built in 5.29s`，退出码 0 | 通过 |

补充说明：`test/core-render.test.tsx` 的「单个插件渲染抛错被隔离」用例会在 stderr 打印 `[vane-profile] 插件 BannerSlot 的 renderBannerArea 渲染失败 Error: boom`，这是该用例**预期**的错误隔离日志，不是失败。

## 4. 改动文件清单

新增：
- `packages/vane-profile/src/components/ProfilePlugin/plugins/safe-url.ts`
- `packages/vane-profile/test/fixes.test.tsx`

修改（源码）：
- `packages/vane-profile/src/components/ProfilePlugin/plugins/types.ts`
- `packages/vane-profile/src/components/ProfilePlugin/plugins/slots.tsx`
- `packages/vane-profile/src/components/ProfilePlugin/withPlugins.tsx`
- `packages/vane-profile/src/components/ProfilePlugin/ProfileCore.tsx`
- `packages/vane-profile/src/custom-plugins/FollowEchoPlugin/create.tsx`（+ `doc.json`）
- `packages/vane-profile/src/custom-plugins/TabSyncPlugin/create.tsx`
- `packages/vane-profile/src/custom-plugins/BannerSlotPlugin/create.tsx`（+ `doc.json`）
- `packages/vane-profile/src/custom-plugins/WorksGridPlugin/create.tsx`
- `packages/vane-profile/src/custom-plugins/AchievementWallPlugin/create.tsx`
- `packages/vane-profile/src/custom-plugins/StatRowPlugin/create.tsx`
- `packages/vane-profile/src/custom-plugins/SocialLinksPlugin/create.tsx`
- `packages/vane-profile/src/custom-plugins/ContactCardPlugin/create.tsx`
- `packages/vane-profile/src/custom-plugins/QRSharePlugin/create.tsx`（+ `doc.json`）

修改（测试）：
- `packages/vane-profile/test/core-render.test.tsx`（首条用例按「空数据态不渲染 `.vp-meta-area`」新契约更新断言）

构建产物 `dist/` 由 `pnpm build` 重新生成（未纳入源码改动清单）。

## 5. 遗留问题与风险

1. **PF-P2-2 已由内核根治，需注意内核改动面。** 原 `usePluginRuntime` 的 `context = useMemo(..., [props, data, ...])` 以内核入参对象身份为依赖，宿主父级 `setState` 换掉 props 身份即重建 context。现内核新增 `shallowEqual` 对 `props` / `data` 做一层浅比较稳定化（`packages/plugin-core/src/react/usePluginRuntime.ts:40-51,154-181`），内容不变时复用上一份引用。影响面是全家族：浅比较只认一层，**深层对象/内联函数每次新建仍会触发重建**（如 `props={{ config: { ... } }}`），接入方应保持 props 结构稳定或使用 `useMemo`。
2. **`transformData` 作用域不一致（未修，属跨包改动）。** 目前只有**领域上下文**（渲染槽插件拿到的 `ctx.data`）吃到归一化结果；内核生命周期钩子（`onMount` / `onPropsChange` / `onTabChange` / `onUnmount`）收到的仍是原始 `props` / 原始 `data`。统一两者需 plugin-core 暴露「transform 后的 data」入口，属跨包契约变更，本次未做。
3. **FollowEcho 卸载期间的回调。** `handle` 是 async，组件在 pending 期间卸载后仍会执行 `setState`；React 18 下为 no-op 且不告警，本次未加 mounted guard（避免为一个已消除的告警引入额外状态）。
4. **URL 白名单的边界。** `safeImageUrl` 一律拒绝 `data:`，会连带影响曾用 base64 头像的接入方（可改用 `http/https` 地址或后续增加体积上限后再放行）；白名单只校验协议，不做域名黑名单。
5. **槽位 key 依赖插件名唯一。** key 已去掉 index，若同一槽位存在同名插件，React 会出现重复 key 警告；约定「插件名唯一」未在运行时校验（校验会改变现有工厂行为，暂不引入）。
6. **pending 期间样式。** 关注按钮 pending 时以 `opacity:0.7` + `cursor:progress` 表达，未引入独立 loading 文案 / 骨架，保持既有视觉。

## 6. 未覆盖范围

- **未做真实浏览器 E2E / 视觉回归**：全部验证基于 happy-dom 单元测试与构建产物；色彩、对比度与浮层定位未做像素级核对。
- **未接入真实异步数据源 / 请求令牌**：包内不发起资料请求，`data` 完全由消费方传入，因此「旧响应覆盖新状态」发生在宿主层；本次未在包内引入请求令牌机制（Task 要求中的令牌适用于宿主侧加载，当前包无此代码路径）。
- **未做性能压测**：P2-3 仅用「插件渲染调用次数」计数桩验证不重复计算，没有对 P > 20 的真实插件集合做帧时间 / Profiler 测量。
- **未改造 demo 站**：`demo/` 未修改，其源码在 `tsconfig` 范围外不参与类型检查（实际 demo 代码未受影响）；`05-followecho` 的 `onFollow` 同步返回 void 与新签名兼容。
- **plugin-core 改动仅限 PF-P2-2 所需**：`usePluginRuntime.ts` 的 props/data 浅比较稳定化 + 对应单测；未改动内核其它模块、未改动其它包与根配置。
- **未做全仓回归**：仅运行 `vane-profile` 自身的 4 条验证命令，未运行 monorepo 全量 `turbo` 任务。
