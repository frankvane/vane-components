<p align="center">
  <a href="https://www.npmjs.com/package/vane-activity"><img src="https://img.shields.io/npm/v/vane-activity.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-activity"><img src="https://img.shields.io/npm/dm/vane-activity.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 营销活动

> 插件式 React 营销活动容器：任务 / 进度 / 奖励 / 规则按需装配
>
> 插件式组件：`ActivityCore` 负责核心渲染，其余能力全部通过插件按需组合。

`vane-activity` 解决的是「签到 / 秒杀 / 任务中心这类活动页怎么复用」这一件事：给出活动数据，它负责把

- **数据驱动渲染**（核心能力，内置在 `ActivityCore`）：公告条 / 头部横幅 / 进度区 / 任务清单 / 奖励领取 / 规则折叠 / 底部社交区，区块由内核按数据编排，行为交给插件；
- 签到日历、分组任务、抽奖九宫格、兑换码、券堆叠、领取提示、助力、榜单等长尾能力，做成**按需子路径插件**，用几个装几个，没装的区块不进产物。

与「写死一套活动组件」的关系：后者每个活动复制一份、改一处分号全局。本引擎把可变能力外挂成插件，内核只管语义布局，每日签到 / 限时秒杀只是不同的插件装配。

## 安装

```bash
npm install vane-activity
```

> 本包的 peer 依赖含 `vane-plugin-core`、`react`、`react-dom`，请确保项目已安装（monorepo 内为 `workspace:*`）。

## 30 秒上手

```tsx
import { ActivityCore, withPlugins } from "vane-activity";
import { createTaskListPlugin } from "vane-activity/custom-plugins/TaskListPlugin";
import { createProgressFxPlugin } from "vane-activity/custom-plugins/ProgressFxPlugin";
import { createRewardClaimPlugin } from "vane-activity/custom-plugins/RewardClaimPlugin";
import { createRuleExpandPlugin } from "vane-activity/custom-plugins/RuleExpandPlugin";

// 装配：一个组件类型，模块顶层调一次（不要在渲染期反复 new）
const Activity = withPlugins(ActivityCore, [
  createProgressFxPlugin(),
  createTaskListPlugin(),
  createRewardClaimPlugin(),
  createRuleExpandPlugin(),
]);

// 使用：受控数据 + 回调（组件不内置后端，consumer 拥有数据与状态真相）
function ActivityPage() {
  return (
    <Activity
      data={activity}                      // ActivityData：任务 / 奖励 / 规则
      onTaskAction={(taskId) => api.doTask(taskId)}   // 「去完成」等动作
      onClaim={(rewardId) => api.claim(rewardId)}     // 领取奖励（受控时需在此回写 claimedRewardIds）
    />
  );
}
```

`ActivityCore` 的布局壳自带：头部横幅（`renderHeader`）→ 顶部进度区（`renderProgress`）→ 任务清单（`renderTasks`）→ 奖励领取（`renderRewards`）→ 规则折叠（`renderRules`）→ 底部社交区（`renderFooter`）→ 浮层特效（`renderOverlay`，绝对定位叠加）。

> 嫌插件逐个引太啰嗦？直接拿预设组合（见 [组合配方](../../docs/components/vane-activity/recipes.md)）。

## 数据模型

```ts
interface ActivityTask {
  id: string;
  title: string;
  desc?: string;
  progress: number;       // 当前完成度 0..1（completed 态应为 1）
  status: "locked" | "available" | "completed";
  actionLabel?: string;   // 「去完成」「查看」等按钮文案
  rewardId?: string;      // 关联奖励 id（任务完成时点亮对应奖励）
  weight?: number;        // 权重（默认 1），影响总体进度占比
}

interface ActivityReward {
  id: string;
  title: string;
  threshold: number;      // 触发领取所需的总体进度阈值 0..1
  icon?: string;          // emoji 图标
  desc?: string;
}

interface ActivityRule {
  title?: string;         // 分段标题
  content: string;        // 规则正文（长文）
}

interface ActivityData {
  title?: string;
  tasks: ActivityTask[];
  rewards: ActivityReward[];
  rules: string | ActivityRule[];   // 单段长文或分段
  endTime?: string | number;        // 截止时间：倒计时 / 天数徽章读取
  leaderboard?: ActivityLeaderboardEntry[];  // 好友榜（LeaderboardPlugin）
  share?: ActivityShareState;       // 助力名额（ShareBoostPlugin）
  announcements?: string[];         // 公告条目（AnnouncementPlugin）
  taskGroups?: ActivityTaskGroup[]; // 任务分组（TaskTabsPlugin，任务用 task.group 归属）
  checkin?: ActivityCheckinState;   // 签到态（CheckinCalendarPlugin）
}
```

**总体进度**由任务完成度加权求得（`Σ progress·weight / Σ weight`）。奖励按 `threshold` 派生状态：`progress ≥ threshold` → `claimable`，否则 `locked`；领取后 → `claimed`。进度达到 `1` 时 `ProgressFxPlugin` 在浮层叠加「🎉 进度达成 100%」庆祝条。

## 插件（19 个，全部按需子路径）

> 内核只提供语义布局壳与 6 个领域槽（头部 / 进度 / 任务 / 奖励 / 规则 / 底部）+ 浮层，行为全部由插件注入。同槽插件按 `config.order` 升序 → `priority` 降序并联；声明 `exclusiveSlots` 的插件装配期去重，同槽只留 priority 最高者（见 [插件目录](../../docs/components/vane-activity/plugins.md) 与 [组合配方](../../docs/components/vane-activity/recipes.md)）。

| 插件 | 槽位 | 作用 |
| --- | --- | --- |
| `TaskListPlugin` | renderTasks（独占） | 任务清单：标题 / 描述 / 进度与状态，带「去完成」动作按钮 |
| `TaskTabsPlugin` | renderTasks（独占） | 分组任务：页签切换 + 每组完成度计数，与 TaskList 二选一 |
| `RewardClaimPlugin` | renderRewards（独占） | 奖励行：按派生状态展示按钮（可领 / 已领 / 锁定），点击调 `claim` |
| `RedeemCodePlugin` | renderRewards | 兑换码：长度 / 前缀本地校验 + 成功失败回执，与奖励列表共存 |
| `RuleExpandPlugin` | renderRules（独占） | 「活动规则」可折叠面板，折叠态按行数截断，同步 `aria-expanded` |
| `RuleModalPlugin` | renderRules（独占） | 弹窗版规则：规则区只留触发按钮，点击弹模态窗 |
| `AnnouncementPlugin` | renderHeader | 活动公告条：纯 CSS 跑马灯，悬停暂停、减动效偏好下静止 |
| `ActivityHeaderPlugin` | renderHeader | 头部横幅：标题 + 副标题 + 标签 + endTime 派生徽章 |
| `ProgressFxPlugin` | renderProgress | 顶部进度条 fill + 百分比数字；100% 时浮层庆祝条 |
| `ProgressRingPlugin` | renderProgress | SVG 环形进度 + 中心百分比 +「距下一档还差 N%」 |
| `CheckinCalendarPlugin` | renderProgress | 签到日历：三态格子 + 连续天数 + 签到按钮（乐观 +1） |
| `MilestoneBarPlugin` | renderProgress | 里程碑节点轨道（绿=已领 / 橙=可领 / 灰=未达标） |
| `CountdownTimerPlugin` | renderProgress | 「距活动结束 x天HH:MM:SS」每秒自走，紧急态变色 |
| `CouponStackPlugin` | renderRewards（独占） | 奖励渲染成一摞错位票券卡 |
| `JackpotPlugin` | renderFooter | 抽奖九宫格：8 格奖池 + 减速停格动画，次数用完禁用 |
| `ClaimToastPlugin` | renderOverlay | 领取后右下角淡入「已领取：xx」，自动消失 |
| `ConfettiPlugin` | renderOverlay | 达成阈值时容器内下落彩纸 |
| `ShareBoostPlugin` | renderFooter | 好友助力：分段名额 + 头像堆 +「还差 N 人」 |
| `LeaderboardPlugin` | renderFooter | 好友榜：前 N 名 + 我的名次高亮 |

插件一律走子路径按需引入（ADR-6），不进根入口。桶文件 `vane-activity/custom-plugins` 可一次引入全部（体积会变大，非推荐用法）。

每个插件的**属性（props）/ 事件（events）/ 方法（methods）**三件表都写在 `doc.json` 里，由 `pnpm docs:plugins` 生成到 [插件能力明细](../../docs/components/vane-activity/plugins.md#插件能力明细)，不手写、不漂移。

## 包体积

| 导入方式 | Gzip 实测 / 预算 |
| --- | --- |
| 根入口 `vane-activity`（core + 装配 + 领域槽 + 类型，不含任何插件） | 6.8 KB / 8 KB |
| 单个插件子路径（15 个常规插件） | 1.9 – 2.9 KB / 3 KB |
| 单个交互型插件（Checkin / TaskTabs / RedeemCode / Jackpot） | 3.0 – 3.7 KB / 3.5 – 4 KB |
| 全量并集（19 个插件都装） | 36.6 KB / 38 KB |

> 体积门：`pnpm check` 逐包卡。基线仍是 3 KB/子路径；只有 4 个交互型插件（表单 / 九宫格 / 页签这类内联样式密集的 UI）按实际体积放宽到 3.5–4 KB，理由记录在 `package.json` 的 `vane.sizeBudgetNote`。再加能力应拆分而不是继续放宽。

## 文档

- [API](../../docs/components/vane-activity/api.md)
- [插件目录](../../docs/components/vane-activity/plugins.md)
- [组合配方](../../docs/components/vane-activity/recipes.md)

## License

MIT
