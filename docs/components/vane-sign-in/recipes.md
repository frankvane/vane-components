# 每日签到 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对 17 个插件不知道选谁」的成本。

```tsx
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createStreakStatePlugin } from "vane-sign-in/custom-plugins/StreakStatePlugin";
import { createCalendarStripPlugin } from "vane-sign-in/custom-plugins/CalendarStripPlugin";
import { createRewardPreviewPlugin } from "vane-sign-in/custom-plugins/RewardPreviewPlugin";
import { createMakeupSlotPlugin } from "vane-sign-in/custom-plugins/MakeupSlotPlugin";
import { createTodayCheckInPlugin } from "vane-sign-in/custom-plugins/TodayCheckInPlugin";

/** 配方：电商签到台（核心四件套 + 积分展示） */
export const EcomCheckIn = withSignInPlugins(SignInCore, [
  createStreakStatePlugin(),
  createCalendarStripPlugin(),
  createRewardPreviewPlugin(),
  createMakeupSlotPlugin(),
  createTodayCheckInPlugin(),
]);
```

## 按场景选插件

| 场景 | 推荐插件 |
| --- | --- |
| 电商签到 | StreakState + CalendarStrip + RewardPreview + MakeupSlot + TodayCheckIn + PointsBalance |
| 内容/社区 | StreakState + RewardPreview + Share + Remind + StatRow |
| 游戏签到 | StreakState + LevelBadge + Milestone + Invite + RewardPreview |
| 会员签到 | StreakState + LevelBadge + Milestone + RewardHistory |

## 推荐做法

- 常用组合沉淀为配方导出在业务侧（建议 3-5 个起步），让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- 低频区块（如规则、记录）可按需装配，或动态导入以减小首屏：

```tsx
// 规则/记录等低频区块用动态导入
const { createRuleExpandPlugin } = await import(
  "vane-sign-in/custom-plugins/RuleExpandPlugin"
);
```
