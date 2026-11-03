# 候选人流水线 vane-candidate

> 插件式 React 候选人流水线（ATS）组件：候选人卡片 + 阶段流转，19 个官方插件按需组合。

`CandidateCore` 负责看板骨架（阶段列 + 候选人卡片 + 工具栏/页脚），匹配分、标签、备注、面试安排、婉拒模板、批量操作、人才库等能力全部通过插件按需装配。

## 特性

- 插件化架构：核心只做「看板布局 + 生命周期转发」，可变能力全交插件
- 19 个官方插件：徽章 / 卡片操作 / 工具栏 / 页脚 / 数据管道五类槽位，多对多挂载
- 阶段流转内建：`moveCandidate` 推进/退回 + 自动流转历史，`updateCandidate` 局部落库
- Tree-shaking 友好：插件走子路径导入，只打包你用到的
- TypeScript 类型完备；容器自带 `color`+`background`，对比度符合 ADR-13

## 安装

```bash
npm install vane-candidate
# peer：react / react-dom / vane-plugin-core
```

## 30 秒上手

```tsx
import { CandidateCore, withPlugins } from "vane-candidate";
import { createScorePlugin } from "vane-candidate/custom-plugins/ScorePlugin";
import { createStageFlowPlugin } from "vane-candidate/custom-plugins/StageFlowPlugin";
import { createNotePlugin } from "vane-candidate/custom-plugins/NotePlugin";
import type { Candidate } from "vane-candidate";

const data: Candidate[] = [
  {
    id: "c-001",
    name: "陈知远",
    role: "高级前端工程师",
    stage: "interview",
    score: 92,
    email: "zhiyuan.chen@example.com",
  },
  // …
];

const Enhanced = withPlugins(CandidateCore, [
  createScorePlugin(),
  createStageFlowPlugin(),
  createNotePlugin({ authorName: "张HR" }),
]);

<Enhanced data={data} onDataChange={(list) => save(list)} />;
```

不传 `onDataChange` 也能用：流转/更新落在组件内部态（总线事件驱动），传了则同步回宿主做持久化。

## 插件一览（19 个）

| 插件 | 子路径 | 槽位 | 一句话 |
| --- | --- | --- | --- |
| Score | `custom-plugins/ScorePlugin` | 卡片徽章 | 匹配分胶囊，阈值着色 |
| DupCheck | `custom-plugins/DupCheckPlugin` | 卡片徽章 | 同名/同邮箱/同手机号疑似重复警示 |
| Tag | `custom-plugins/TagPlugin` | 卡片徽章 + 浮层 | 标签 chips 增删管理 |
| Offer | `custom-plugins/OfferPlugin` | 卡片徽章 | Offer 状态胶囊 |
| Star | `custom-plugins/StarPlugin` | 卡片操作 + 管道 | 星标收藏，可置顶 |
| StageFlow | `custom-plugins/StageFlowPlugin` | 卡片操作 | 推进/退回阶段 |
| Note | `custom-plugins/NotePlugin` | 卡片操作 + 浮层 | 招聘备注 |
| InterviewSlot | `custom-plugins/InterviewSlotPlugin` | 卡片操作 + 卡体 + 浮层 | 面试时间槽安排 |
| RejectTpl | `custom-plugins/RejectTplPlugin` | 卡片操作 + 浮层 | 婉拒信模板与一键婉拒 |
| Filter | `custom-plugins/FilterPlugin` | 工具栏 + 管道 | 阶段/标签筛选 |
| Search | `custom-plugins/SearchPlugin` | 工具栏 + 管道 | 关键词搜索 |
| BatchOp | `custom-plugins/BatchOpPlugin` | 工具栏 + 卡片操作 | 批量选择/流转/归档 |
| ViewSwitch | `custom-plugins/ViewSwitchPlugin` | 工具栏 + 整体覆盖 | 看板/列表视图切换 |
| ArchivePool | `custom-plugins/ArchivePoolPlugin` | 工具栏 + 浮层 + 管道 | 人才库归档与恢复 |
| Export | `custom-plugins/ExportPlugin` | 工具栏 | CSV 导出（防公式注入） |
| Stats | `custom-plugins/StatsPlugin` | 页脚 + 列头 | 漏斗统计与列计数 |
| ActivityLog | `custom-plugins/ActivityLogPlugin` | 页脚 + 浮层 | 操作日志时间线 |
| RecommendSort | `custom-plugins/RecommendSortPlugin` | 管道 | 匹配分/投递时间排序 |
| ContactMask | `custom-plugins/ContactMaskPlugin` | 管道 | 联系方式脱敏 |

## 核心概念

- **阶段（Stage）**：`stages?: StageConfig[]` 定义看板列，默认 6 阶段（已投递→筛选中→面试中→Offer→已入职→已婉拒）。
- **领域动作**：插件经 `ctx.updateCandidate(id, patch)` / `ctx.moveCandidate(id, ±1)` 改数据；装配层广播 `candidate:change`（bus）并回调 `onDataChange`。
- **领域槽**：`renderToolbar` / `renderFooter` / `renderCardBadges` / `renderCardActions` / `renderColumnHeader` 为装饰累积槽；`renderCards` / `renderCardBody` 为内容覆盖槽（priority 最高且非 null 者胜出）。
- **自定义插件**：实现 `CandidatePluginCreator` 三件套（create + doc.json + index），按槽位分区间分配 priority。

## 包体积

| 导入方式 | Gzip |
| --- | --- |
| 根入口（核心 + 装配 + 类型） | ~9 KB |
| 仅核心 `vane-candidate/entries/core` | 更小 |

## 文档

- [API](api.md)
- [插件目录](plugins.md)
- [组合配方](recipes.md)

## License

MIT
