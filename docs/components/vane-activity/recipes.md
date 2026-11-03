# 营销活动 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对 19 个插件不知道选谁」的成本。

```tsx
import { ActivityCore, withPlugins } from "vane-activity";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";

/** 配方：最简活动（只有任务清单） */
export const Basic = withPlugins(ActivityCore, [
  createTaskListPlugin(),
]);
```

## 推荐做法

- 常用组合沉淀为配方导出在包内（建议 3-5 个起步，不设上限），让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- 低频 / 重型插件用动态导入：`const { createTaskListPlugin } = await import("vane-activity/custom-plugins/TaskListPlugin")`。

## 常用配方

### 每日签到（全装）

最完整的活动页：进度条 + 任务清单 + 奖励领取 + 规则折叠。

```tsx
import { ActivityCore, withPlugins } from "vane-activity";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";
import { createRuleExpandPlugin } from "vane-activity/custom-plugins/RuleExpandPlugin";

export const DailyCheckIn = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createTaskListPlugin(),
  createRewardClaimPlugin(),
  createRuleExpandPlugin(),
]);

// 使用
<DailyCheckIn
  data={activity}
  onTaskAction={(id) => trackTask(id)}
  onClaim={(id) => claimReward(id)}
/>;
```

### 限时秒杀（轻量，无规则折叠）

进度区 + 任务清单 + 奖励领取，省掉规则面板。

```tsx
export const FlashSale = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createTaskListPlugin(),
  createRewardClaimPlugin(),
]);
```

### 纯进度看板（只有进度条）

进度达成 100% 自动浮层庆祝，不渲染任务 / 奖励 / 规则。

```tsx
export const ProgressBoard = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
]);
// 仍要传 data（progress 从 tasks 加权求得），否则渲染空态
<ProgressBoard data={{ tasks: [], rewards: [], rules: "" }} />;
```

## 数据驱动，而非配置驱动

所有配方的「长相」都由 `ActivityData` 决定：任务进度、奖励阈值、规则文案改数据即可，无需换配方。例如把 `rewards[].threshold` 调高，对应奖励的领取按钮会自动从「可领」变「锁定」。这与 [API](api.md) 里的派生状态（`locked` / `claimable` / `claimed`）一致。
