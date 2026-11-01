# 33 · vane-danmaku 分析

> 按 vane-package-builder 标准流程（P1→P2→P3）。user 已就两处分叉拍板：渲染内核 = **Canvas/WebGL**；防遮挡 = **MediaPipe（人物避让）**。
> 用户原始需求：弹幕组件；轨道渲染之上做业务语义（敏感词过滤 / 粉丝牌 / 高赞置顶 / 互动指令）；TrackRender 轨道渲染 + 4 个命名插件；15+ 插件；canvas 提性能；视频人物遮挡用骨骼捕捉。
> 已纠偏两点：① TrackRender 是**内核不是插件**；② MediaPipe「骨骼点」≠ 遮挡区，正确原语是 Selfie Segmentation 掩膜（或 Pose 点→凸包），且 ML 必须跑在 60fps 之外。

## 1. 目标与边界

- 做一个**插件式 React 弹幕组件**：内核（DanmakuCore）独占 canvas 渲染层 + 轨道调度，业务语义全交插件。
- **三层分离（本包架构核心）**：
  1. **Core（TrackRender）= 唯一绘制者**，持有 `<canvas>` + `requestAnimationFrame` 循环，画所有飞行弹幕；坐标/绘制全由内核 `computeLayout` 补。
  2. **数据面插件 = 纯函数 over 数据流**（敏感词/粉丝牌/置顶/指令…），**从不碰 canvas**，返回「富集后的 item / 请求的轨道 / 拦截动作」。
  3. **UI 面插件 = 走 vane 的 DOM slot**（设置面板/过滤开关/指令输入框/统计条），React 节点绝对定位浮在 canvas 之上。
- **防遮挡 = 一个轨道分配策略插件 + 消费方注入的 ML**：`SafeZonePlugin` 只定义契约 `getAvoidZones(): Rect[]`；真正的 MediaPipe 集成由**消费方**注入（他们自己 `import @mediapipe/tasks-vision`）。发布包**不捆绑 MediaPipe**，体积预算不受影响，也符合「运行时第三方 → dependencies + vane external」硬规则（我们直接不进）。
- 冻结线：对外导出符号（DanmakuCore / `withDanmakuPlugins` / 类型 / 子路径插件）、`package.json` exports、README 首屏、demo 外壳四件套——改法走 sync，不动手写产物。

## 2. 领域模型（DanmakuData / DanmakuItem）

```ts
type DanmakuMode = 'scroll' | 'top' | 'bottom' | 'reverse'; // 右→左 / 顶部固定 / 底部固定 / 左→右
interface FanBadge { name: string; level: number; color: string }
interface DanmakuMeta {
  userId?: string; userName?: string; level?: number;
  fanBadge?: FanBadge; isAdmin?: boolean;
  color?: string; fontSize?: number; emoji?: string[];
}
interface DanmakuCommand { type: string; payload?: any } // CmdParse 识别出的指令(不渲染)
interface DanmakuItem {
  id: string; text: string; mode: DanmakuMode;
  time: number;            // 相对视频的出现时间(秒)
  duration?: number;       // 飞行时长(scroll/reverse)
  meta: DanmakuMeta;
  // 经插件富化、由 core 消费、插件绝不直绘的渲染提示：
  renderHint?: {
    track?: number;        // 指定轨道(置顶/防遮挡策略产出)
    ring?: boolean;        // 高赞高亮环
    pinned?: boolean;      // 置顶固定(停在该轨道)
    masked?: boolean;      // 敏感词已打码
    avoidZones?: Rect[];   // 该条避让区(可选)
  };
  _cmd?: DanmakuCommand;   // CmdParse 标记, 命中则不进入渲染流
}
interface Rect { x: number; y: number; w: number; h: number }
interface DanmakuData { items: DanmakuItem[]; now: number } // now=当前播放时间
```

**领域语义边界**（对应 SKILL「缺货/禁用」类）：
- `mode:'top'|'bottom'` 的 item 不参与水平滚动，钉在顶/底条带（PinnedTop 置顶也走此机制 + `pinned:true`）。
- `_cmd` 命中 → 不渲染，改触发 `ctx.action`（如 `/clear` 清屏、`#抽奖` 弹层），由 CmdParse 在 `transformData` 里拦截。
- `renderHint.masked` 驱动 SensitiveFilter 把命中词替换为 `***`，文案仍占位（不删条，避免闪烁）。

## 3. 入口划分（ADR-6：根不桶导出插件）

- `.` = `index.ts`：聚合 `DanmakuCore` + `withDanmakuPlugins` + 契约类型。
- `./entries/core` = `entries/core.ts`：只要内核（Core + withDanmakuPlugins），无插件。
- `./entries/plugins` = `entries/plugins.ts`：插件全家桶。
- `./custom-plugins/<Name>Plugin`：每个插件独立子路径（构建与 sync-exports 共用 discover-entries）。

## 4. 内核（DanmakuCore / TrackRender）—— 非插件

- `<canvas>` + rAF 循环；`Renderer` 抽象接口（`Canvas2DRenderer` 起步，WebGL 作后续可换实现，满足「Canvas/WebGL 内核」且不过度设计）。
- **轨道调度**：把每条弹幕分配到一条垂直 track；scroll 模式 x 从右到左。避让区每帧消费 `avoidZones`，调度时留出对应轨道。
- **绘制**：纯 canvas 画文字 + 粉丝牌底块 + 高赞环；描边/字号来自 `renderHint`/meta。
- 消费方传入 `<video>` 引用或画面尺寸；core 不内置视频播放器。

## 5. 插件清单与插槽（23 个，≥15）

**数据面（priority 10–29，transformData / onReceive 拦截，纯数据变换）：**

| # | 插件 | priority | 职责 |
|---|------|----------|------|
| 1 | SensitiveFilterPlugin | 10 | 敏感词打码(***)/替换/隐藏 |
| 2 | FanBadgePlugin | 11 | 富化粉丝牌(meta.fanBadge 补/格式化) |
| 3 | PinnedTopPlugin | 12 | 高赞置顶(钉 track + `pinned`/`ring`) |
| 4 | CmdParsePlugin | 13 | 互动指令拦截(/clear #抽奖)→ ctx.action |
| 5 | DedupPlugin | 14 | 同屏去重(相同文本限频) |
| 6 | RateLimitPlugin | 15 | 总速率/分用户限流 |
| 7 | KeywordHighlightPlugin | 16 | 关键词高亮(ring/color) |
| 8 | KeywordBlockPlugin | 17 | 关键词屏蔽(用户级) |
| 9 | UserMutePlugin | 18 | 用户禁言/拉黑 |
| 10 | EmojiRenderPlugin | 19 | 表情包文本→图占位 |
| 11 | AtMentionPlugin | 20 | @提及富化 |
| 12 | GiftComboPlugin | 21 | 礼物连击合并 |
| 13 | LangFilterPlugin | 22 | 字符集/语言过滤 |
| 14 | AuditLogPlugin | 23 | 审计留存(数据上报钩子) |
| 15 | StylePresetPlugin | 24 | 字体/描边/字号策略 |
| 16 | TrackStrategyPlugin | 25 | 轨道分配(含防遮挡策略入口) |
| 17 | SpeedControlPlugin | 26 | 滚动速度策略 |
| 18 | ColorPolicyPlugin | 27 | 颜色策略(粉丝牌色/等级色) |

**UI 面（priority 30–49，renderOverlay / renderToolbar / renderFooter，DOM slot）：**

| # | 插件 | priority | 槽位 | 职责 |
|---|------|----------|------|------|
| 19 | SettingsPanelPlugin | 30 | renderOverlay | 设置面板(速度/字号/屏蔽词) |
| 20 | FilterTogglePlugin | 31 | renderToolbar | 过滤开关 |
| 21 | CommandInputPlugin | 32 | renderFooter | 指令输入框 |
| 22 | StatsBarPlugin | 33 | renderToolbar | 实时统计(在屏数/总条数) |
| 23 | SafeZonePlugin | 34 | lifecycle+data | 防遮挡：`getAvoidZones(): Rect[]` 契约 + 可选接入 MediaPipe |

**插槽**：`renderOverlay` / `renderToolbar` / `renderFooter` / `renderHeader`（DOM UI）+ 核心钩子 `transformData` / `transformProps` / `onMount` / `onUnmount` / `onReceive`（数据面拦截）。同槽多插件按 `config.order` 升序 → `priority` 降序；单插件抛错由 `PluginErrorBoundary` 隔离。priority 分区间：数据面 10–29 / UI 面 30–49。

## 6. 防遮挡（MediaPipe）落地约束

- `SafeZonePlugin` **不依赖 MediaPipe**：暴露 `getAvoidZones(): Rect[]`（同步取最新，或 `setAvoidZones` 由外部喂）。默认实现 = 静态安全区（顶/底条带保留，中间留空，`reservedBands` 配置）。
- **消费方注入 ML**（demo + recipes 文档示范，不在发布包）：
  - 用 **MediaPipe Selfie Segmentation** 拿 person mask → 腐蚀/降采样成几个 `Rect` 避让区（正确原语）；
  - 或 **BlazePose 33 点 → 可见关键点凸包**当避让区（姿态感知时用，凸包会框进空隙，接受）；
  - 跑在 **Worker / 独立管线，低频(~10–30fps)**，产出「最新避让区」。
- **Core 每帧只消费「上一帧已知避让区」**，同步 60fps 画，**绝不 `await` ML**；人不会瞬移，几帧延迟可接受。
- 发布包零 ML 依赖 → 体积预算不受侵；MediaPipe wasm 由消费方按需在宿主加载。

## 7. 依赖派系

**peer 外部化派**（镜像 vane-sign-in）：`vane-plugin-core` 放 `peerDependencies`（`workspace:*`），发前临时改 `*`；根入口不含 core，体积精简。react/react-dom 仅 peer。MediaPipe **不进** dependencies（消费方自选）。

## 8. 体积预算

- 根入口 `sizeBudgetKb: 15`（core + withDanmakuPlugins + 共享类型 + canvas 渲染器雏形；peer 外部化保持精简）。
- 子路径各 `2KB`（含同目录 doc.json 元数据）。
- 超了要么真减（根不桶导出、插件走子路径），要么改口径 + `sizeBudgetNote`，不许静默调大。

## 9. demo 场景（demo.config.tsx + 23 单页）

- 基础弹幕流（full：scroll+top+bottom+reverse）
- 直播弹幕（高并发 + 礼物连击 + 粉丝牌 + 高赞置顶）
- 防遮挡演示（接入 MediaPipe Selfie Seg 的 demo 集成，可视化避让区矩形）
- 互动指令（/clear #抽奖）
- 敏感词 + 屏蔽（管理后台视角）
- 自定义工坊（23 插件开关 + 实时装配代码）

## 10. 验收门禁

- P1：tsc 0 / eslint 0 / check-packages 绿（**先 `vite build --mode lib` 再 check**）/ check-structure --strict 0。
- P2：build:demo 成功 / selftest PASS n/n / 对比度 0 处不达标。
- P3：docs 四件 + changeset + 双远端 HEAD 一致 + 用户确认发 npm + registry 可查。

## 11. 风险与约定

- 事件钩子改闭包状态必须 `context.forceUpdate()`；context 动态字段用 getter。
- 装配工厂 `withDanmakuPlugins(plugins)` 模块顶层调用；用例内按需重建。
- canvas 绘制在 `useEffect` + rAF 里做，React 只挂载 `<canvas>` 与 DOM slot 层；**插件绝不直绘 canvas**。
- demo 去 StrictMode；自测用 dispatchEvent + tick；happy-dom 无布局引擎，几何断言先探测布局可用性。
- 样式：DOM slot 层全内联（tokens 收敛 `plugins/tokens.ts`）；容器有 background 必有 color；不用 opacity 压字。
- ML 集成是消费方职责，lib 只定义契约；防遮挡默认静态安全区，零 ML 即可跑。
