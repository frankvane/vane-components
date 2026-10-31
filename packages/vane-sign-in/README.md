<p align="center">
  <a href="https://www.npmjs.com/package/vane-sign-in"><img src="https://img.shields.io/npm/v/vane-sign-in.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-sign-in"><img src="https://img.shields.io/npm/dm/vane-sign-in.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 每日签到

> 插件式 React 每日签到：连签状态 / 日历条 / 奖励预告 / 补签，各平台运营位通用
>
> 插件式组件：`SignInCore` 负责核心渲染与生命周期转发，其余能力（积分 / 等级 / 分享 / 提醒 / 邀请 / 规则 / 记录 …）全部通过插件按需组合。

## 特性

- **区块即插件**：17 个领域插件挂在 5 个领域槽（头部 / 日历 / 奖励 / 操作 / 底部）上，互不覆盖
- **领域槽复用内核基建**：走包内 `renderSignInSlot`（复用内核 order 排序 + `priority` 决策 + `PluginErrorBoundary` 单槽隔离），单插件渲染抛错不影响其他槽
- **数据驱动禁用态**：`todaySigned` 驱动签到 CTA、`canMakeup` 驱动补签入口、`reward.claimed` 驱动领取终态——状态真相在消费方数据
- **受控数据**：`SignInCore` 只渲染 + 转发 `sign / claim / makeup / share / remind / invite` 回调，业务动作全在消费方
- **Tree-shaking 友好**：根入口不桶导出插件，每个插件走独立子路径，未引入的不进产物
- **零运行时依赖**（`vane-plugin-core` / react / react-dom 均为 peer），不引 CSS 文件

## 安装

```bash
npm install vane-sign-in
```

## 30 秒上手

```tsx
import { SignInCore, withSignInPlugins } from "vane-sign-in";
import { createStreakStatePlugin } from "vane-sign-in/custom-plugins/StreakStatePlugin";
import { createCalendarStripPlugin } from "vane-sign-in/custom-plugins/CalendarStripPlugin";
import { createRewardPreviewPlugin } from "vane-sign-in/custom-plugins/RewardPreviewPlugin";
import { createMakeupSlotPlugin } from "vane-sign-in/custom-plugins/MakeupSlotPlugin";
import { createTodayCheckInPlugin } from "vane-sign-in/custom-plugins/TodayCheckInPlugin";

// 装配：一个组件类型，模块顶层调一次
const SignIn = withSignInPlugins(SignInCore, [
  createStreakStatePlugin(),
  createCalendarStripPlugin(),
  createRewardPreviewPlugin(),
  createMakeupSlotPlugin(),
  createTodayCheckInPlugin(),
]);

<SignIn
  data={signInData}
  callbacks={{ sign: () => api.sign(), makeup: (d) => api.makeup(d) }}
/>;
```

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 仅核心 `vane-sign-in/core` | ~3 KB |
| 核心 + 5 个核心插件 | ~10 KB |

## 文档

- [API](../../docs/components/vane-sign-in/api.md)
- [插件目录](../../docs/components/vane-sign-in/plugins.md)
- [组合配方](../../docs/components/vane-sign-in/recipes.md)

## License

MIT
