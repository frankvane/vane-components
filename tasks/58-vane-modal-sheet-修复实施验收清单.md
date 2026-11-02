# 58 · vane-modal-sheet 修复实施验收清单

> 对应评审报告 `tasks/57-vane-modal-sheet-核心功能评审.html`。
> 状态：**已实施并验收（2026-11-02）**：BATCH 1–3 全部落地，`pnpm verify` 全绿，浏览器 `?selftest=1` 为 `SELFTEST PASS 22/22`。
> 既有范围文档 `55-vane-modal-sheet-分析.md` / `56-vane-modal-sheet-实施清单.md` 与本清单冲突处以本清单为准，并已在 BATCH 1 同步修订。

## 0. 范围与不变量

- 只改 `packages/vane-modal-sheet` 与 `tasks/55`、`tasks/56`、新增示例文件；不动 `demo-dist`、`dist` 生成物（由构建产出）。
- 内核铁律不变：`ModalSheetCore` 仍是 snap/拖拽几何唯一决策者；插件不直接写 transform；context 时基值继续用 getter。
- 零第三方运行时依赖不变。
- 公开导出符号只增不改：新增 `maxHeight` / `ariaLabel` 属性，不改既有 props/ref 签名。
- 不在本轮顺手实现 55 文档里的 D 组领域插件与 E 组跨包组合（建议把 55/56 范围收敛为 21 个，见 B1-3）。

***

## BATCH 1 · 阻断项（示例 / 工坊 / 事实校正）

### \[x] B1-1 修复 4 个 demo 的组件类型重建（P1-1）

- 文件：
  - `demo/src/demos/02-detent-content.tsx`（L31–L35）
  - `demo/src/demos/03-unstyled.tsx`（L25–L28）
  - `demo/src/demos/04-keyboard-form.tsx`（L31–L45）
  - `demo/src/demos/05-imperative.tsx`（L31–L35）
- 改法（二选一，统一风格）：
  1. 模块顶层常量：`const Enhanced = withModalSheetPlugins(ModalSheetCore, [...])`（插件配置无运行期依赖时，与 README L35–L39 一致）；
  2. 需要闭包回调（如 `onSearch` 改 state）时，用 `useMemo`，依赖只放真正会变的配置键；参考 `00-basic.tsx` L38–L50。
- 05 额外处理：`progress` 轮询 interval 不得导致 `Enhanced` 重建；`ref` 只挂一次。
- 04 额外处理：输入 `onChange` 不得改变 `Enhanced` 身份；输入框保持焦点。
- 验收：
  - 05 打开后 progress 数字连续变化，弹层不闪闭、不重开；连点 3 次 `snapTo` 正常。
  - 04 连续输入 20 个字符不失焦，键盘避让只触发一次补间。
  - 02 切换「长内容」时弹层不重挂，scrollTop 不重置。
  - 03 打开后点「试试点我」仍可交互，弹层不重挂。
- 实施记录：02/03/05 改模块顶层常量；04 改 `useMemo` 依赖 `[setOpen]`。浏览器复验：05 连续 `snapTo(0→1→2→0)` 面板节点身份不变（`sameNode=true`）、根节点始终 1 个、progress 随档位 1.00/0.68/0.37 同步；04 连续输入 20 字符 `blurred=0`、`activeIsInput=true`、节点不重建。顺带修正 05 档位标签：引擎 snapPoints 升序后 **索引 0 = 最高档**，按钮由「0·35%」改为「0·95% / 2·35%」。

### \[x] B1-2 插件工坊改为 vane-profile 四段式（P1-7）

- 文件：
  - `demo/src/pages/PluginsPage.tsx`（整页重写）
  - `demo/src/data/plugins.ts`（扩展 `PluginCard`）
  - `demo/src/demo.config.tsx`（不变，仍指向 `/plugins`）
- 数据扩展：`PluginCard` 增加 `group: "visual" | "behavior" | "feedback"`、`factory: string`、`summary: string`、`doc: PluginDoc`、`make(): ModalSheetPlugin`。
- 页面结构（照 `packages/vane-profile/demo/src/pages/PluginsPage.tsx` L62–L266）：
  1. 左侧按组分带，checkbox 勾选；
  2. `const key = selected.map(p => p.name).join("|")`；`const Sheet = useMemo(() => withModalSheetPlugins(ModalSheetCore, selected.map(p => p.make())), [key])`；
  3. 右侧「已启用 n 个」+ 真跑预览（默认 `isOpen` 常开，`snapPoints={[0.6]}`，宽度 520 受限）；
  4. 焦点插件的 doc 表（`doc.config` / `features` / `useCases` / `notes`）；
  5. 生成当前装配代码（import + 工厂数组）。
- 注意：预览必须用 `useMemo` 按勾选集合缓存组件类型，禁止每次 render 调用 HOC。
- 验收：
  - 勾选/取消任一插件，预览即时变化且不整页重挂；
  - 勾掉全部插件后预览是裸 Core（无遮罩/把手/头）；
  - 代码块随勾选实时更新；
  - 21 个插件全部可勾选，doc 表能显示 config。
- 实施记录：浏览器复验 `/plugins`：21 个 checkbox、默认勾选 20（排除 Backdrop，避免遮罩盖住整页预览）、预览面板 `width=520px`、装配代码含全部已选工厂；取消任一插件后代码块即时刷新。

### \[x] B1-3 校正 55/56 范围与验收记录（P1-8）

- 文件：
  - `tasks/55-vane-modal-sheet-分析.md`
  - `tasks/56-vane-modal-sheet-实施清单.md`
- 改法：
  - 55 §5 插件清单由 26 收敛为 21（A 7 + B 9 + C 5）；D 组 5 个与 E 组 6 个移到「未交付 / 待排期」，删除「已交付」暗示。
  - 56 L42–L47 取消勾选 D 组与 E 组；L19 删除 `dist/style.css` / `exports["./style.css"]` 的已完成描述，改为「内联样式 + CSS 变量，无独立样式产物」；如确需 style.css，另开任务而不是勾完成。
  - 56 增加一行指向本清单与 57 报告。
- 验收：`grep` 55/56 不再出现「26 个 / D 组已完成 / style.css 已完成」；评审报告结论与清单一致。
- 实施记录：55 的插件总数改为 21（A7+B9+C5），D/E 组标注「未交付 / 待排期」；56 顶部加「历史实施记录，以 57/58 为准」，`style.css` 与 D/E 行改为未完成并注明原因。

***

## BATCH 2 · 核心几何与生命周期

### \[x] B2-1 新增 maxHeight（P1-2，用户显式需求）

- 文件：
  - `src/components/ModalSheetPlugin/plugins/types.ts`：`ModalSheetCoreProps` 增加 `maxHeight?: number | string`（默认无上限）；注释写清支持 `px` 数字、`"480px"`、`"72vh"`、`"80%"`。
  - `src/components/ModalSheetPlugin/engine.ts`：
    - 新增纯函数 `resolveMaxHeight(value: number | string | undefined, viewportH: number): number`（`undefined` → `Infinity`；`"80%"` → `0.8 * viewportH`；`"72vh"` → `0.72 * viewportH`；非法值 → `Infinity`）。
    - `resolveSnapPixels` 的 opts 增加 `maxHeight: number`；每档高度 `h = Math.min(h, maxHeight)`，最高档 y 随之 = `viewportH - h`。
    - `SheetEngineOps` 增加 `getMaxHeight(): number`；`measure()` 计算 panel 高度时 `height = Math.min(hiddenY - snapYs[0], maxHeight)`，并同步 `panel.style.maxHeight = maxHeight === Infinity ? "" : ` \${maxHeight}px\`\`。
  - `src/components/ModalSheetPlugin/ModalSheetCore.tsx`：把 `propsRef.current.maxHeight` 交给 `resolveMaxHeight`，作为 `getMaxHeight` 返回值。
  - `src/custom-plugins/ResponsivePlugin/create.tsx`：桌面态可继续只设 `maxWidth`；新增可选 `desktopMaxHeight?: number` 透传到 props（默认不设）。
- 测试：`test/engine.test.ts` 增加 `resolveMaxHeight` 与 `resolveSnapPixels({ maxHeight })` 用例；`test/plugins.test.tsx` 断言 `maxHeight={500}` 时 panel height === 500。
- 验收：
  - `snapPoints=[1] maxHeight={560}` 时面板高 560，顶部贴顶、底部留白；
  - `maxHeight="72vh"` 随窗口 resize 重算；
  - 既有 snapPoints 无 maxHeight 时行为完全不变（回归）。
- 实施记录：`resolveMaxHeight` 支持数字 / 纯数字 px / `px` / `vh` / `%`，非法值回退 `Infinity`。单测覆盖 6 例解析 + 3 例 `resolveSnapPixels` 夹紧 + `maxHeight={500}` 与 `72vh` 的 DOM 高度断言。浏览器复验 demo 07：`maxWidth` 由 width 控制（560/720/全宽即时生效），`style.maxHeight=640px`。

### \[x] B2-2 snapPoints / detent / maxHeight 变更时重算（P1-3）

- 文件：`src/components/ModalSheetPlugin/ModalSheetCore.tsx`
- 改法：
  - 新增 `useEffect`，依赖 `signature = JSON.stringify([snapPoints, detent, maxHeight, initialSnap])`；
  - 变更时 `engine.measure()`；若 `s.phase === "open"` 则 `engine.snapTo(Math.min(s.snapIndex, s.snapYs.length - 1))`，保持档位并夹紧索引；
  - `snapPoints` 变化时不得触发关闭/重开。
- 测试：`test/plugins.test.tsx` 中用 `rerender` 改 snapPoints，断言 panel 高度与 snapYs 更新。
- 验收：demo 01 打开中切预设，SnapDots 数量、当前档、面板高度立即一致。
- 实施记录：几何签名 effect 落地在 `useSheetController.ts`，`open` 态重算后保持档位并夹紧索引；单测「snapPoints 200→400px」重算通过。

### \[x] B2-3 detent:content 按「面板自然高度」测量（P1-4）

- 文件：`src/components/ModalSheetPlugin/engine.ts` 的 `measure()`
- 改法：
  - 记录 `prevHeight = panel.style.height`；
  - `panel.style.height = "auto"`，读 `panel.scrollHeight` 作为自然高度（含把手/header/footer）；
  - 恢复 `prevHeight`；
  - 若自然高度 <= 0，回退 `content.scrollHeight + chromeH`（chromeH = panel.offsetHeight - content.clientHeight 在无约束时）；
  - `contentH` 使用该自然高度；随后仍按 `hiddenY - snapYs[0]` 写回 panel 高度。
- 测试：`test/engine.test.ts` 布局探测可用时断言「内容 3 条 + Header」面板高度 = chrome + 内容高；不可用时 `layout-skip`。
- 验收：demo 02 三条内容无内部滚动条；十二条内容贴视口上限且可滚。
- 实施记录：`measure()` 先临时 `height:auto; maxHeight:none` 读 `panel.scrollHeight` 再恢复，自然高 <=0 时回退「内容高 + chrome 差」。happy-dom 无布局，真实高度断言在 `test/plugins.test.tsx` 中显式 `it.skip` 并注明原因。

### \[x] B2-4 卸载清理与首帧初始化（P1-5 / P1-6）

- 文件：
  - `src/components/ModalSheetPlugin/plugins/withPlugins.tsx`
  - `src/custom-plugins/ScrollLockPlugin/create.tsx`
  - `src/custom-plugins/FocusTrapPlugin/create.tsx`
  - `src/custom-plugins/KeyboardAvoidPlugin/create.tsx`
  - `src/custom-plugins/KeepMountedPlugin/create.tsx`
  - `src/custom-plugins/HistoryPlugin/create.tsx`
- 改法：
  1. **先确认** **`vane-plugin-core`** **的** **`usePluginRuntime`** **是否会自动执行** **`onMount`** **返回的 cleanup**。若不会：HOC 的 mount effect（L126–L128）捕获 `execute("onMount")` 的返回值，在组件卸载时执行；并新增 `execute("onUnmount")` 清理链。
  2. `ScrollLockPlugin` 增加 `onUnmount`：恢复 `body.style.overflow = savedOverflow`，移除 touchmove；`savedOverflow` 在 onPropsChange 中记录。
  3. `FocusTrapPlugin` 增加 `onUnmount`：移除 keydown、`restoreFocus`、清空 savedFocus。
  4. `KeyboardAvoidPlugin` 在 onUnmount 里移除 visualViewport 监听并 `ctx.setViewportInset(0)`（即使 cleanup 丢失也能兜底）。
  5. HOC 首帧：`useEffect` 中若 `props.isOpen` 为 true，先以合成 prev `{...props, isOpen:false}` 执行一次 `onPropsChange`，再执行 `onMount`；避免与已有 onMount 重复（EscClose 的栈只加一次）。
- 测试（`test/plugins.test.tsx`）：
  - 挂载即 open，断言 `body.style.overflow === "hidden"`、焦点进入面板；
  - 直接 `unmount()`，断言 overflow 恢复、`document` 上无遗留 keydown（用 spy 计数）、焦点归还；
  - 首帧 open 的 KeepMounted 不报错、History pushState 被调用一次。
- 验收：打开状态下切路由卸载弹层，页面仍可滚动；再次打开焦点正常。
- 实施记录：已确认 `vane-plugin-core` 的 `usePluginRuntime` 在卸载时执行 `onUnmount` 钩子链并 `manager.clear()`（清理函数逆序执行），HOC 无需重复实现。三个插件补幂等 `onUnmount`；HOC 首帧合成 prev 后执行 `onPropsChange` + `onMount`。单测覆盖首帧锁定/焦点进入、卸载恢复、keydown 计数平衡、History pushState 仅一次。

***

## BATCH 3 · P2 清扫与示例补齐

### \[x] B3-1 引擎状态机与 timer（P2-1 / P2-2 / P2-8）

- 文件：`src/components/ModalSheetPlugin/engine.ts`
- 改法：
  - `open()` 置 `phase="opening"`，补间结束置 `"open"`；`close()` 置 `"closing"`，结束置 `"closed"`；`snapTo()` 置 `"snapping"`；`handlePointerDown` 成功置 `"dragging"`，`handleUp` 进入 snapping。
  - `close()` 在 `opening` 阶段允许执行：先 `clearTimer()` 再补间到 hiddenY。
  - `handlePointerDown` 只在 `phase === "open"` 或 `"snapping"` 的稳态允许；`closing` 阶段拒绝。
  - open 的 `setTimeout(startTween, 32)` 存入 `startTimer`，`clearTimer()` / `destroy()` 一并清除。
  - `resolveSnap` 速度关闭前增加最小位移保护：`y - topY >= 8` 才允许 velocity 关闭（阈值可配置，默认 8）。
- 测试：`test/engine.test.ts` 增加 opening 中 close、closing 中 pointerdown、卸载后无 onOpen 回调、轻扫 5px 不关闭四个用例。
- 验收：打开动画中按 Esc/点遮罩能立即关闭；关闭动画中拖拽无效。
- 实施记录：状态机与 `startTimer`/`rafId`/`destroyed` 全部落地；`close()` 幂等且允许从 opening/open/snapping/dragging 关闭；`snapTo` 在 closing/closed no-op；最小关闭位移默认 8px。engine 测试 26 → 32 条。

### \[x] B3-2 外部关闭策略（P2-3）

- 文件：`src/components/ModalSheetPlugin/ModalSheetCore.tsx`
- 改法（决策：保持受控语义，但补关闭补间）：
  - 增加内部 `visible` state；`isOpen` true → `visible=true` 并 `engine.open()`；
  - `isOpen` false 且 `visible` → 调 `engine.close()`，在引擎 onClose 内置 `setVisible(false)` 后卸载 portal；
  - 引擎 onClose 回调需带 `fromExternal` 标记，避免父级重复收到 `onClose`（用户已在外部关闭时不再回调）。
- 验收：业务侧 `setOpen(false)` 有 240ms 下滑与遮罩淡出；`KeepMounted` 的 onClose 收尾会执行；拖拽关闭仍只回调一次 `onClose`。
- 实施记录：`useSheetController` 用 `visible` + `visibleRef` 控制 portal 卸载；外部 `isOpen=false` 走 `engine.close(true)`，引擎 onClose 带 `fromExternal`，裸 Core 时不再回调用户 `onClose`，插件桥仍执行 `onClose`（KeepMounted 等收尾）。

### \[x] B3-3 onPropsChange 门控与 propsRef 同步（P2-4 / P2-12）

- 文件：
  - `src/components/ModalSheetPlugin/plugins/withPlugins.tsx` L131–L136
  - `src/components/ModalSheetPlugin/ModalSheetCore.tsx` L52–L53
- 改法：
  - `onPropsChange` 仅在 `prev.isOpen !== props.isOpen` 或 `snapPoints/detent/maxHeight/width` 签名变化时执行；其余高频 props（children、style 对象）不触发插件链。
  - `propsRef.current = props` 移入 `useLayoutEffect`（无依赖），保留首帧同步兜底。
- 验收：demo 04 连续输入时，插件钩子调用次数不再随按键增长（可用临时 console 计数验证后移除）。
- 实施记录：HOC 用 `changeKey = [isOpen, JSON.stringify(snapPoints), detent, maxHeight, width]` 门控；`propsRef` 同步改到无依赖 `useLayoutEffect`，排在 isOpen effect 之前。

### \[x] B3-4 拖拽面与关闭按钮（P2-5）

- 文件：
  - `src/custom-plugins/DragHandlePlugin/create.tsx`
  - `src/custom-plugins/HeaderPlugin/create.tsx`
  - `src/custom-plugins/SnapDotsPlugin/create.tsx`
- 改法：
  - 样式合并改为 `style={{ ...drag.style, ...自定义 }}`，保留 `touchAction:"none"`；
  - Header：拖拽面只挂标题区域，关闭按钮外层 `onPointerDown={e => e.stopPropagation()}`，按钮不进入拖拽面；
  - SnapDots：点位按钮 `stopPropagation`，避免 pointerdown 启动拖拽后再触发 click。
- 验收：鼠标拖标题可换档，点关闭按钮只关闭不吸附；触屏拖把手不触发页面滚动。
- 实施记录：DragHandle 样式合并保留 `touchAction:"none"`；Header 拖拽 props 只挂标题区、关闭按钮 `stopPropagation`；SnapDots 点位按钮同样阻断 pointerdown。

### \[x] B3-5 无障碍名称与示例（P2-6）

- 文件：
  - `src/components/ModalSheetPlugin/plugins/types.ts`：新增 `ariaLabel?: string`
  - `src/components/ModalSheetPlugin/ModalSheetCore.tsx`：panel 增加 `aria-label={ariaLabel}`（为空时不写）
  - `src/custom-plugins/HeaderPlugin/create.tsx`：config 增加 `titleId?: string`，标题 div 写 `id`；文档建议 `ariaLabel` 或 `ariaLabelledby`（Core 增加 `ariaLabelledby?: string`）。
- 验收：axe/读屏能看到 dialog 名称；无 aria 时不出错。
- 实施记录：新增 `ariaLabel` / `ariaLabelledby`，panel 固定 `role="dialog" aria-modal="true"`，空值不写；Header 支持 `titleId` 并写入标题 `id`；单测断言 `aria-label` 透传。

### \[x] B3-6 HistoryPlugin 与副作用（P2-7）

- 文件：`src/custom-plugins/HistoryPlugin/create.tsx`
- 改法：
  - onUnmount 不再 `history.back()`，只移除监听和 `armed=false`；
  - `pushState` 包 try/catch，DataCloneError 时以 `null` 重试并 console.warn；
  - 文档注明「仅在需要返回键关闭的页面启用」。
- 验收：卸载不跳页；传函数型 state 不抛错。
- 实施记录：卸载只解绑 + `armed=false`；`pushState` 异常回退 `null` 并 warn；history 缺失时 no-op；doc 增补启用建议。

### \[x] B3-7 SSR 守卫与 Core 拆分（P2-9 / P2-10）

- 文件：
  - `src/components/ModalSheetPlugin/ModalSheetCore.tsx`
  - 新增 `src/components/ModalSheetPlugin/SheetPanel.tsx`（可选，仅为 ≤150 行目标）
- 改法：
  - `if (typeof document === "undefined") return null`，并在 render 前判断（SSR 首屏不渲染弹层，客户端 hydrate 后正常）；
  - 把 portal 内的面板 DOM/样式拆到子组件，Core 保留状态机与生命周期；
  - README 声明 client-only。
- 验收：`tsc` 通过；Next.js 页面 SSR 无异常；Core 行数 ≤150（不含类型导入）。
- 实施记录：Core 拆为 `ModalSheetCore.tsx`（76 行）+ `useSheetController.ts` + `SheetPanel.tsx`；`typeof document === "undefined"` 提前返回；README 标注 client-only。

### \[x] B3-8 补齐 13 个插件的示例（P1-7 后半）

- 新增文件（命名沿用 `NN-slug.tsx`）：
  - `demo/src/demos/06-environment.tsx`：ScrollLock + EscClose + History + NestedScroll（长列表滚到中部时拖拽锁定）。
  - `demo/src/demos/07-responsive-pc.tsx`：ResponsivePlugin + `width={560}` + `maxHeight={640}`，展示 PC 居中浮窗与垂直留白。
  - `demo/src/demos/08-a11y-feedback.tsx`：FocusTrap + Announcer + Haptics + ModalEffect（提供「播报 / 震动 / 背景缩放」开关）。
  - `demo/src/demos/09-states.tsx`：LoadingState + EmptyState + KeepMounted + SafeArea（加载 1.2s → 空态 → 重开恢复滚动位置）。
  - `demo/src/demos/10-nested-scroll.tsx`：NestedScroll 单独演示（若不与 06 合并）。
- `demo/src/data/plugins.ts`：为 13 个未覆盖插件补齐 `group` / `factory` / `doc`，供工坊使用。
- 验收：工坊与逐项示例中 21/21 插件均可触发；导航分组不超过 4 组；每页有 `meta.intro`。
- 实施记录：新增 06–10 五个示例，逐项示例由 6 页增至 11 页；工坊按 visual/behavior/feedback 三组覆盖 21/21；每页均有 `meta.intro`。

### \[x] B3-9 README / docs 补 PC 用法（P2-11）

- 文件：
  - `packages/vane-modal-sheet/README.md`
  - `docs/components/vane-modal-sheet/api.md`
  - `docs/components/vane-modal-sheet/recipes.md`
- 改法：
  - 特性区增加「PC：width / horizontalAlign / maxHeight / 居中浮窗」；
  - 30 秒上手增加 `width={560} maxHeight={640}` 示例；
  - 明确 21 个插件、示例覆盖矩阵、client-only、零依赖；
  - recipes 增加「不要在 render 里调用 withModalSheetPlugins」的反例。
- 验收：README 代码片段可复制运行；docs 与 `package.json` exports 一致。
- 实施记录：README 增 PC 特性与 30 秒上手（`width={560} maxHeight={640} snapPoints={[0.6]}`）、21 插件/11 示例、client-only、零依赖、HOC 反例；api.md 补 `maxHeight`/`ariaLabel`/`ariaLabelledby` 与关闭补间语义；recipes.md 增 3 个 PC/几何变更/HOC 反例配方。

***

## 4. 测试与门禁（每批必跑）

```bash
pnpm --filter vane-modal-sheet typecheck
pnpm --filter vane-modal-sheet lint
pnpm --filter vane-modal-sheet test
pnpm --filter vane-modal-sheet build
pnpm --filter vane-modal-sheet build:demo
node scripts/check-packages.mjs
node scripts/check-structure.mjs --strict
pnpm verify
```

- [x] 门禁执行记录（2026-11-02，最终一轮）：
  - `pnpm verify` → exit 0（lint / typecheck / test / check / check:structure / check:config / check:demo 全部通过）。
  - `check-packages`：`vane-modal-sheet 入口导入图 gzip 10.0KB / 预算 15KB`。
  - `check-structure --strict`：`FAIL=0 INFO=2`，结构与 eslint/tsconfig/vitest/vite/scripts 外壳一致。
  - `build:demo`：148 modules，`demo-dist/demo/index.html` + `assets/index-*.js` 287.58 kB（gzip 93.06 kB）。
- [x] 浏览器：`?selftest=1` → `SELFTEST PASS 22/22`；新增断言覆盖：
  1. `maxHeight` 生效（panel height === 设定值）；
  2. 首帧 `isOpen` 时 focus trap 生效、body 锁定；
  3. 打开状态 `root.unmount()` 后 overflow 恢复、无 keydown 残留。
- [x] 人工回归（浏览器实测，1282×732 视口）：
  - 05 不重开：连续 `snapTo(0→1→2→0)` 面板节点身份不变，根节点恒为 1，progress 1.00/0.68/0.37 对应可见高度 695/476/256px；
  - 04 不失焦：连续输入 20 字符 `blurred=0`；
  - 01 打开中切档生效（单测 snapPoints 200→400px 重算通过）；
  - 02 无多余滚动条（content 自然高测量生效，happy-dom 下该断言 skip）；
  - PC `width=560` 居中（left 353）、`720` 居中（left 273）、全宽 1266，`maxHeight=640` 写入 `style.maxHeight`；
  - 卸载后页面可滚、焦点归还（单测覆盖）；
  - 插件工坊 21 个 checkbox / 默认 20 勾选 / 预览 520px / 代码块实时刷新。

## 5. 交付顺序

| 批次      | 内容                 | 完成判据                                               | 状态      |
| ------- | ------------------ | -------------------------------------------------- | ------- |
| BATCH 1 | B1-1 / B1-2 / B1-3 | 示例可交互、工坊四段式、55/56 事实一致                             | \[x] 完成 |
| BATCH 2 | B2-1 \~ B2-4       | maxHeight、重算、detent 测高、清理与首帧四条单测通过                 | \[x] 完成 |
| BATCH 3 | B3-1 \~ B3-9       | P2 清扫 + 21/21 示例覆盖 + README PC 用法，`pnpm verify` 全绿 | \[x] 完成 |

## 6. 审批点

- [x] 用户确认本清单范围（尤其确认「D 组 5 个领域插件不实现，只修订 55/56」）。
- [x] 用户确认 batch 顺序与每批一个 commit。
- [x] BATCH 2 完成后复核一次，再进入 BATCH 3。
- [x] 全部完成后才讨论发布（npm 发布仍需单独显式确认）——本轮未执行任何 npm 发布操作。

