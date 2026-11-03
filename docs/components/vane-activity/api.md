# 营销活动 · API

## `ActivityCore`

活动领域容器（受控数据 + 回调）。经 `withPlugins` 装配插件后才是最终组件。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `ActivityData` | - | **必填**：活动定义（任务 / 奖励 / 规则）。缺省渲染空态 `emptyText` |
| `claimedRewardIds` | `string[]` | - | 受控已领取列表；传了即为受控模式（consumer 持有真值）。**必须**在 `onClaim` 中回写新数组；未回写时该奖励保持请求中，重复点击不会再次回调 |
| `onClaim` | `(rewardId: string) => void` | - | 领取奖励回调（`RewardClaimPlugin` 点击按钮时触发）；受控模式下负责回写 `claimedRewardIds` |
| `onTaskAction` | `(taskId: string) => void` | - | 任务动作回调（点击「去完成 / 查看」等按钮时触发） |
| `emptyText` | `ReactNode` | `"活动暂未开始"` | 空态文案 |
| `loading` | `boolean` | `false` | 加载态 |
| `containerClassName` | `string` | - | 容器类名 |
| `containerStyle` | `React.CSSProperties` | - | 容器内联样式（会合入根节点默认浅底深字） |
| `onMount` / `onUnmount` | `() => void` | - | 挂载 / 卸载回调（会被插件钩子链转发） |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 `{ width, height }` |

## `withPlugins(Core, config)`

把插件装配到核心组件上。名字是全仓插件包的统一约定（`vane-sku` / `vane-waterfall` / `vane-comment` 等都叫 `withPlugins`），**不**另起 `withXxxPlugins`。两种写法等价：

```tsx
withPlugins(ActivityCore, [createTaskListPlugin()]);
withPlugins(ActivityCore, { plugins: [createTaskListPlugin()], enableDebug: true });
```

- **模块顶层调用一次**：工厂返回的是组件类型，不要在渲染期反复 `new`，否则每次都重建插件运行时。
- `config` 为数组时等价于 `{ plugins: 数组 }`；`enableDebug` 可在开发期打开插件注册 / 钩子日志。

## 领域上下文 `ActivityPluginContext`

插件钩子拿到的 `context` 在内核 `PluginContext` 基础上附加活动专属派生字段：

```ts
interface ActivityPluginContext<T = ActivityData> extends PluginContext<ActivityCoreProps<T>, T> {
  tasks: ActivityTask[];                 // 经派生的任务列表（直接来自 data.tasks）
  rewards: ActivityRewardWithStatus[];   // 带派生状态：locked | claimable | claimed
  progress: number;                     // 总体进度 0..1（任务完成度加权）
  claimedIds: string[];                 // 已领取奖励 id（受控或内部态）
  claim: (rewardId: string) => void;    // 领取：仅 claimable 生效，未知/锁定/已领忽略并告警
}
```

通用 `PluginContext` 还提供：`props` / `data` / `bus`（emit/on/once/off + getData/setData）/ `refs` / `state` / `setState(patch)` / `shared`（Map）/ `deviceInfo` / `forceUpdate()` / `getSize()` / `logger`。

## 领域渲染槽

`ActivityCore` 提供 6 个领域槽 + 复用内核浮层钩子，插件通过对应钩子注入：

| 钩子 | 槽位 | 说明 |
| --- | --- | --- |
| `renderHeader` | 活动头部区 | 公告条 / 头部横幅（如 `AnnouncementPlugin`、`ActivityHeaderPlugin`） |
| `renderProgress` | 顶部进度区 | 进度条 / 环 / 签到日历 / 倒计时（如 `ProgressFxPlugin`、`CheckinCalendarPlugin`） |
| `renderTasks` | 任务清单主体 | 任务列表 / 分组页签（如 `TaskListPlugin`、`TaskTabsPlugin`，独占槽） |
| `renderRewards` | 奖励领取区 | 奖励行 / 兑换码（如 `RewardClaimPlugin`，独占槽；`RedeemCodePlugin` 与之共存） |
| `renderRules` | 规则折叠面板 | 规则展示（如 `RuleExpandPlugin`，独占槽） |
| `renderFooter` | 活动底部社交区 | 助力 / 榜单 / 抽奖（如 `ShareBoostPlugin`、`LeaderboardPlugin`、`JackpotPlugin`） |
| `renderOverlay` | 浮层特效 | 绝对定位叠加层（如 100% 庆祝条、领取 toast），复用内核钩子 |

钩子返回 `ReactNode`；返回 `null` 则该区块不渲染、不进产物。多插件同槽按
`config.order` 升序 → `priority` 降序并联，互不覆盖；声明 `exclusiveSlots` 的插件
在装配期按 priority 去重，同一槽位只保留 priority 最高者（低者被丢弃并 `console.warn`）。

## 插件接口

```ts
interface Plugin<TProps = any> {
  name: string;                 // 唯一标识，kebab-case
  version: string;              // 语义化版本（doc.json 机器可读，源码另有字面量）
  description: string;          // 机器可读描述（来自 doc.json）
  hooks: PluginHooks<TProps>;   // 通用钩子 + 领域钩子
  dependencies?: string[];      // 依赖的插件（先注册依赖）
  priority?: number;            // 越大越先执行
  sandbox?: boolean;            // 默认 true，错误隔离
  timeout?: number;             // 异步钩子超时，默认 3000ms
  config?: Record<string, any>; // 渲染排序用 config.order / config.slotPosition
}
```

通用钩子：`onMount` / `onUnmount` / `onPropsChange` / `onError` / `transformProps` / `transformData` / `renderOverlay` / `renderHeader` / `renderFooter`。
领域钩子见 `plugins/types.ts`（如 `renderTasks`）。

钩子返回语义：领域渲染槽返回 `false` / `null` 表示不渲染该区块；通用钩子 `false` 中断链，其他非 `undefined/true` 的值短路返回。

## 插件文档：属性 / 事件 / 方法

每个插件的 `doc.json` 必须把三类能力写清楚，`pnpm docs:plugins` 会把它们渲染成 [插件目录](plugins.md#插件能力明细) 里的「插件能力明细」（目录表链接直达页内锚点）：

| 字段 | 含义 | 说明 |
| --- | --- | --- |
| `props[]` | 属性：工厂配置项 | `name` / `type` / `default` / `description`；旧字段名 `config` 仍兼容 |
| `events[]` | 事件：插件参与的钩子与对外回调 | `name` / `when`（触发时机）/ `description` |
| `methods[]` | 方法：插件调用的上下文方法 | `name` / `signature` / `description`；不调用时写 `[]` |
| `methodsNote` | `methods` 为空时的补充说明 | 如「只读取 `ctx.tasks`，不调用任何上下文方法」 |

以 `ProgressFxPlugin` 为例（除 `height` 外它没有别的属性，但它有两个事件、不调任何方法）：

```json
{
  "props": [{ "name": "height", "type": "number", "default": "8", "description": "进度条高度（px）" }],
  "events": [
    {
      "name": "renderProgress",
      "when": "每次渲染；进度槽无更高 order 的插件接管时",
      "description": "输出「进度条 + 百分比数字」，百分比 = round(ctx.progress × 100)"
    },
    {
      "name": "renderOverlay",
      "when": "ctx.progress >= 1（全部任务完成）",
      "description": "浮层渲染「🎉 进度达成 100%」庆祝条；未达成返回 null"
    }
  ],
  "methods": [],
  "methodsNote": "纯展示：只读取 ctx.progress（0..1），不调用任何上下文方法，也不触发回调。"
}
```

全部 19 个官方插件的完整三件表见 [插件能力明细](plugins.md#插件能力明细)；每个官方插件都有 props / events / methods 三件文档。

## 数据扩展字段

`ActivityData` 除 `title / tasks / rewards / rules` 外，还有几个可选字段供对应插件读取：

| 字段 | 类型 | 消费插件 |
| --- | --- | --- |
| `endTime` | `string \| number` | `CountdownTimerPlugin`（秒级倒计时）、`ActivityHeaderPlugin`（天数徽章） |
| `leaderboard` | `ActivityLeaderboardEntry[]` | `LeaderboardPlugin`（不传则显示空态卡片） |
| `share` | `ActivityShareState` | `ShareBoostPlugin`（不传则回退工厂配置的 total / used） |
| `announcements` | `string[]` | `AnnouncementPlugin`（不传则回退工厂配置的 items） |
| `taskGroups` | `ActivityTaskGroup[]` | `TaskTabsPlugin`（任务用 `task.group` 归属；不传则回退 config.tabs） |
| `checkin` | `ActivityCheckinState` | `CheckinCalendarPlugin`（days / done / todayIndex；不传则回退工厂配置） |

## 自定义插件

```tsx
import type { ActivityPluginCreator } from "vane-activity";

export const createHelloPlugin: ActivityPluginCreator = (config = {}) => ({
  name: "HelloPlugin",
  version: "0.1.0",
  description: "示例：在规则区下方追加一行提示",
  priority: 50,
  config,
  hooks: {
    renderRules: (ctx) => (
      <div style={{ marginTop: 8, color: "#5d636a", fontSize: 12 }}>
        当前进度 {(ctx.progress * 100).toFixed(0)}%，继续加油～
      </div>
    ),
  },
});

createHelloPlugin.meta = { name: "HelloPlugin", description: "…", since: "0.1.0", tags: ["ui"] };
```

> 写插件三件套：`doc.json`（机器可读文档，喂 `pnpm docs:plugins`）+ `create.tsx`（工厂）+ `index.ts`（桶导出）。详见 [插件目录](plugins.md)。
