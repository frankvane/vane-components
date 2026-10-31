# 每日签到 · API

## `SignInCore`

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `SignInData` | - | 签到领域数据（必填，见下） |
| `callbacks` | `SignInCallbacks` | `{}` | 业务动作入口（见下） |
| `containerClassName` | `string` | - | 容器类名 |
| `containerStyle` | `React.CSSProperties` | - | 容器样式 |
| `onMount` / `onUnmount` | `() => void` | - | 挂载/卸载回调（被插件钩子转发） |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref（`SignInCoreRef`）

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 |

## `withSignInPlugins(Core, plugins)`

把插件装配到核心组件上。两种写法等价：

```tsx
withSignInPlugins(SignInCore, [createStreakStatePlugin()]);
withSignInPlugins(SignInCore, { plugins: [createStreakStatePlugin()], enableDebug: true });
```

## `SignInData`

```ts
interface SignInData {
  todaySigned: boolean;          // 今日是否已签（驱动签到 CTA 禁用态）
  streak: number;               // 当前连签天数
  maxStreak: number;            // 历史最高连签
  totalDays: number;            // 累计签到天数
  points: number;               // 累计积分
  calendar: DayCell[];          // 日历单格（五态）
  rewards: RewardInfo[];        // 逐日奖励清单
  makeup: MakeupInfo;           // 补签配额
  nextResetAt?: number;         // 下次可签到时间戳（倒计时用）
  level?: LevelInfo;            // 会员等级（可选）
  rules?: string[];             // 活动规则（可选）
  history?: ClaimRecord[];      // 领取记录（可选）
}
```

## `SignInCallbacks`

```ts
interface SignInCallbacks {
  sign?: () => void | Promise<void>;       // 今日签到
  claim?: (day: number) => void | Promise<void>;  // 领取第 N 天奖励
  makeup?: (date: string) => void | Promise<void>; // 补签某日
  share?: () => void;                       // 分享成就
  remind?: (enabled: boolean) => void;      // 提醒开关
  invite?: () => void;                      // 邀请好友
}
```

## 插件接口

```ts
interface SignInPlugin {
  name: string;                 // 唯一标识，kebab-case
  version?: string;
  hooks: SignInPluginHooks;     // 通用钩子 + 领域钩子
  priority?: number;            // 越大越先执行
  enabled?: boolean;
  sandbox?: boolean;            // 默认 true，错误隔离
  config?: Record<string, any>; // 渲染排序用 config.order
}
```

通用钩子：`onMount` / `onUnmount` / `onPropsChange` / `onError` / `transformProps` / `transformData` / `renderOverlay` / `renderHeader` / `renderFooter`。

签到领域钩子（结构化槽）：`renderHeader` / `renderCalendar` / `renderRewards` / `renderActions` / `renderFooter`，钩子签名 `(ctx: SignInPluginContext) => ReactNode`。

## 上下文 `SignInPluginContext`

继承内核 `PluginContext`，并补充：

```ts
interface SignInPluginContext {
  data: SignInData;            // 收敛为领域视图（必填）
  callbacks: SignInCallbacks;  // 业务动作入口
}
```

钩子返回语义：`false` 中断链；其他非 `undefined/true` 的值短路返回。

## 自定义插件

```tsx
import type { SignInPlugin, SignInPluginContext } from "vane-sign-in";

export function createMyPlugin() {
  return {
    name: "my-plugin",
    priority: 41,
    hooks: {
      renderActions: (ctx: SignInPluginContext) => (
        <button onClick={() => ctx.callbacks.invite?.()}>我的按钮</button>
      ),
    },
  } satisfies SignInPlugin;
}
```
