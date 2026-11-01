# vane-comment 修复实施验收清单

> 对应评审报告：`tasks/37-vane-comment-核心功能评审.html`
> 实施范围：`packages/vane-comment`（源码 / 测试），未触碰 `packages/plugin-core`、其它包、根配置与评审报告。

## 一、概述

本轮把评审报告中的 **3 项 P1 + 7 项 P2** 全部落地修复，按报告 T01..T05 顺序推进：

- T01/T02：楼中楼深度与审核递归（P1-1、P1-2）
- T03：发布流程（P1-3）
- T04：渲染性能与数据口径（P2-1、P2-2）
- T05：交互细节（P2-3 ~ P2-7）

合计 **10/10 全部修复，0 项跳过**。每项 P1 均配有「旧实现会失败」的回归用例；P2 中纯行为类也补了回归用例，仅类型/文档类说明不加测试的理由。

### 关键设计决策

1. **depth 不再写死**：`renderNested(context, comment)` 的 payload 仍是 `Comment`（保持公开契约），层级通过新增 `NestContext`（`{ level, path }`）沿 React 树向下传递；`level` 逐层 +1，`path` 为祖先 id 集合，同时实现**限深**（`level >= maxDepth` 停止）与**环检测**（祖先命中同一 id 停止）。
2. **审核递归**：`transformData` 从只处理顶层改为递归处理 `replies`，覆盖 `content` 与 `text` 两条文本路径，并过滤 `pending` / `deleted` 回复；用 `seen` 集合对循环 replies 断链。
3. **渲染流水线缓存**：`transformData + sortComments` 用 `useMemo` 缓存，且 `context.data` 与 `context.comments` 统一写为同一份「已过滤 + 已脱敏 + 已排序」的可见列表。
4. **API 兼容**：无破坏性签名变更。`RichComposer` 新增的 `acceptImageTypes` / `maxImageSizeMb` / `maxImages` 均为可选扩参并带默认值；`onSubmit` 类型由 `void` 加宽为 `void | Promise<void>`（加宽非破坏）。

## 二、逐项验收表

| 编号 | 级别 | 问题 | 修复方案 | 改动位置（file:line） | 回归测试用例名 | 状态 |
|---|---|---|---|---|---|---|
| CM-P1-1 | P1 | 嵌套回复深度写死 `depth={1}`，多级楼中楼永远只显示一层；且 `maxDepth` 未真正约束，循环 replies 会无限递归 | 新增 `NestContext{level,path}` + `NestedSection`：读环境层级 → 祖先环检测 → `level >= maxDepth` 限深 → `level+1` 下传；`ReplyNode` 用上下文判断是否继续展开，并保持 `useCommentSlot` 无条件调用以遵守 hooks 规则；`renderNested` 返回 `<NestedSection/>` 不再写死 depth | `src/custom-plugins/ThreadPlugin/create.tsx:65`（`NestInfo`）、`:71`（`NestContext`）、`:78-106`（`NestedSection`）、`:118-123`（`ReplyNode` 环检测 / 限深）、`:221-226`（`Provider` 下传）、`:374-383`（`renderNested`） | ①「6 层嵌套在 maxDepth=3 下只渲染 3 层回复（顶层 + 3 = 4 项）」<br>②「maxDepth=1 时只渲染 1 层回复」<br>③「自引用 replies 不会无限递归（旧实现会 RangeError 栈溢出）」<br>④「A→B→A 的循环 replies 在祖先命中时停止（级别继续递增）」 | ✅ 已修复 |
| CM-P1-2 | P1 | 审核（敏感词脱敏 / 待审过滤）只作用于顶层评论，嵌套回复完全绕过；循环数据会让 `transformData` 自身栈溢出 | 抽 `maskComment` 递归处理 `content` / `text` / `replies`；`seen` 祖先集合命中时置 `replies = undefined` 断环；`hidePending` 同时过滤 pending/deleted 回复；`EMPTY_SEEN` 作为顶层入口 | `src/custom-plugins/ModerationPlugin/create.tsx:20`（`maskText`）、`:29`（`maskNodes`）、`:38`（`EMPTY_SEEN`）、`:46-74`（`maskComment`）、`:61-63`（环断链）、`:92-101`（`transformData` 入口） | ①「嵌套回复里的敏感词同样被脱敏」<br>②「content 为空时 text 回退路径也被脱敏」<br>③「hidePending 也过滤待审 / 已删的嵌套回复」<br>④「循环 replies 在 transformData 内也被截断（不递归溢出）」 | ✅ 已修复 |
| CM-P1-3 | P1 | 发布时先清草稿再调 `onSubmit`：回调抛错 / Promise reject 会丢内容；双击可重复提交 | `submit` 改 async：`await Promise.resolve(onSubmit?.(payload))` 成功后才清草稿；catch 保留草稿并提示「发布失败，内容已保留，请重试」；`submitting` 期间按钮 `disabled` 且文案切「发布中…」 | `src/custom-plugins/RichComposerPlugin/create.tsx:89-90`（`submitting`/`error`）、`:106-125`（`submit`）、`:292-312`（提交按钮 disabled + 文案）、`:315-322`（错误提示） | ①「onSubmit 抛错时保留草稿并给出失败提示」<br>②「Promise 提交期间按钮置灰、文案切「发布中…」，且不重复提交」 | ✅ 已修复 |
| CM-P2-1 | P2 | 每次渲染都重跑 `transformData` 链与排序；槽位插件列表每次重新 filter + sort | 流水线整体 `useMemo`（依赖原始 data / 插件 state / `transformData` / 排序与 comments 入参）；槽位用 `WeakMap<plugins[], Map<slot, plugins[]>>` 缓存 filter+sort 结果，`enabled` 仍在每次调用判断 | `src/components/CommentPlugin/withPlugins.tsx:115-135`（`useMemo` 流水线）、`src/components/CommentPlugin/plugins/slots.tsx:56-84`（`slotCache`/`resolveSlotPlugins`）、`:97`（调用点） | 「CM-P2-1 · 同一评论数组连续渲染不再重复跑 transformData」 | ✅ 已修复 |
| CM-P2-2 | P2 | `context.data` 是原始入参、`context.comments` 是处理后列表，两个口径不一致，第三方插件读 data 会拿到未脱敏/未排序数据 | `domainContext.data` 与 `comments` 统一写为同一份 `sortedComments`（可见列表），并加 JSDoc 说明口径 | `src/components/CommentPlugin/withPlugins.tsx:137-142`（`enhancedProps`）、`:156-162`（`domainContext`，`data` 在 `:160`）、`src/components/CommentPlugin/plugins/types.ts:165-166`（口径注释） | 「CM-P2-2 · context.data 与 comments 一致（已过滤 + 已脱敏的可见列表）」 | ✅ 已修复 |
| CM-P2-3 | P2 | 置顶 / 收藏按钮用本地 `useState`，与 `comment.pinned` / `comment.favorited` 分叉，服务端拒绝或列表刷新后不回正 | 改为完全受控：状态直接读 `comment.pinned` / `comment.favorited`，点击只回调 `onPin(id, !pinned)` / `onFavorite(id, !fav)` | `src/custom-plugins/PinPlugin/create.tsx:31-34`、`src/custom-plugins/FavoritePlugin/create.tsx:30-33` | 「置顶 / 收藏按钮以 props 为唯一事实来源（刷新后回正）」 | ✅ 已修复 |
| CM-P2-4 | P2 | 复制 / 分享在 `navigator.clipboard` 不可用或写入失败时仍提示「已复制」，且复位定时器未随卸载清理 | 显式判断 `clipboard?.writeText` 并 `await`，成功才提示「已复制」/「已复制链接」，失败提示「复制失败」；定时器存 `useRef`，`useEffect` 卸载清理，重复点击重置定时器 | `src/custom-plugins/CopyPlugin/create.tsx:31-83`（状态机 `:31`、定时器 `:41-57`、写入判断 `:59-69`）、`src/custom-plugins/SharePlugin/create.tsx:19-73` | 「剪贴板写入失败时提示「复制失败」而不是「已复制」」 | ✅ 已修复 |
| CM-P2-5 | P2 | 点赞爆裂动画定时器未清理，卸载后可能 `setState`；受控契约未写明 | 定时器存 `useRef` + 卸载 `clearTimeout`；补充 JSDoc：`liked`/`likeCount` 全部来自 props，消费方必须实现 `onLike` 回写 | `src/custom-plugins/LikePlugin/create.tsx:14-18`（契约注释）、`:28-38`（`burstTimer` + 清理）、`:40-51`（`handle`） | 「点赞后产生的定时器随卸载清理（旧实现泄漏）」 | ✅ 已修复 |
| CM-P2-6 | P2 | 相对时间只在其它状态变化时刷新，长驻页面「刚刚」会永久停留 | `CommentCore` 增加 60s interval：页面 `hidden` 时跳过，否则 `forceUpdate()` 驱动相对时间重算；卸载清理 | `src/components/CommentPlugin/CommentCore.tsx:38-39`（`forceUpdate`）、`:41-56`（interval 注释与实现） | 「常驻页面里「刚刚」会在下一分钟变为「1 分钟前」」 | ✅ 已修复 |
| CM-P2-7 | P2 | 选图只做 DataURL 读取，无类型 / 体积 / 张数校验，任意大文件可塞进内存；`accept` 未收窄 | 三层校验（MIME 白名单 → 体积上限 → 张数上限），不通过则不读文件；`<input accept>` 收窄为白名单；新增可选配置 `acceptImageTypes` / `maxImageSizeMb`（默认 5）/ `maxImages`（默认 9） | `src/custom-plugins/RichComposerPlugin/create.tsx:10-27`（配置与注释）、`:29`（`DEFAULT_IMAGE_TYPES`）、`:133-155`（`onFile` 三层校验）、`:277`（`accept`）、`:358-360`（默认值） | 「类型白名单 / 体积上限拦截，且 accept 收窄为白名单」 | ✅ 已修复 |

> 说明：本表 10 项均有对应回归用例；不存在「纯类型/样式类未加测试」的漏项。

## 三、新增 / 修改测试

- 新增 `test/helpers.tsx`：`tick`、`mount` / `mountSync`、`typeInto`、`fileOf` 等统一挂载与事件工具（未改变既有测试行为）。
- 新增 `test/p1-regression.dom.test.tsx`：10 个用例，覆盖 CM-P1-1 ~ CM-P1-3。
- 新增 `test/p2-regression.dom.test.tsx`：7 个用例，覆盖 CM-P2-1、CM-P2-2、CM-P2-3、CM-P2-4、CM-P2-5、CM-P2-6、CM-P2-7。
- 既有 `test/selftest.dom.test.tsx` 未改动，仍通过。

## 四、验证记录

以下 4 条命令均已在本轮真实执行，执行目录为仓库根 `e:\react-plugin-component`。

| 命令 | 实际结果 |
|---|---|
| `pnpm --filter vane-comment test` | **exit 0**：`Test Files 3 passed (3)` / `Tests 18 passed (18)`，时长 11.42s。输出含 React `act(...)` 警告（既有自测同样有，属测试手法噪声，不影响结果）。 |
| `pnpm --filter vane-comment typecheck` | **exit 0**：`tsc --noEmit -p tsconfig.json` 无任何输出。 |
| `pnpm --filter vane-comment lint` | **exit 0**：`✖ 122 problems (0 errors, 122 warnings)`。基线与修复前为 115 warnings，新增 7 条主要来自新测试的 `no-explicit-any` 与 `react-refresh/only-export-components`，**无新增 error**。 |
| `pnpm --filter vane-comment build` | **exit 0**：`✓ built in 5.36s`，`[vite:dts] Declaration files built in 4379ms`；产物含 `chunks/CommentCore-*.js 8.04 kB (gzip 2.96 kB)`、`chunks/withPlugins-*.js 2.40 kB (gzip 0.94 kB)`。 |

## 五、遗留问题与风险

1. **长列表未虚拟化**：`CommentCore` 仍是全量渲染，万级评论会有首屏压力；本轮只解决了重复计算，未引入虚拟滚动（超出报告范围）。
2. **`P2-6` 的 60s 全局 tick**：一次 interval 会驱动整个评论区重渲染；对超长列表建议后续与虚拟化一起做按条粒度或可视区粒度刷新。
3. **`LikePlugin` 不做乐观更新**：本身受控是正确的，但消费方若未实现 `onLike`，按钮将无任何视觉变化；已在 JSDoc 明确契约，属于设计选择而非缺陷。
4. **流水线 memo 依赖引用相等**：若消费方**原地修改**评论数组（如 `push` 后原引用传回），memo 不会失效。约定消费方保持不可变更新；如需兜底可后续加版本号或浅比较。
5. **图片仅前端校验**：`DataURL` 的体积/MIME 校验可被绕过（改扩展名、构造文件），服务端必须二次校验；`maxImageSizeMb` 是内存保护而非安全边界。
6. **lint 警告数 115 → 122**：全部为 warning，主要为测试文件 `any`；未为压警告而改测试类型，避免过度工程。
7. **API 兼容**：无破坏性变更需标注；新增配置项均为可选扩参。

## 六、未覆盖范围

- 未修改 `packages/plugin-core`（如 `PluginManager` 的钩子执行、`usePluginRuntime` 的 state 语义）；本轮所有修复均可在 `vane-comment` 内闭环。
- 未修改其它组件包、根目录 `turbo` / `pnpm` / `eslint` 等配置。
- 未修改评审报告 `tasks/37-vane-comment-核心功能评审.html`。
- 未执行任何 git 操作（未 add / commit / push）。
- 未做真实浏览器（非 happy-dom）的视觉与剪贴板权限矩阵验证；剪贴板成功/失败语义由 mock 覆盖。
- 未新增 E2E / 性能基准；渲染性能仅以「不重复执行」的单元断言佐证。
