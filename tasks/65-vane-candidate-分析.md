# 65 · vane-candidate 分析

> 分期：S1 分析 / S2 脚手架 / S3 内核入口 / S4 插件家族(19) / S5 DEMO 外壳 / S6 三页套 / S7 逐项示例 / S8 自测对比度 / S9 文档 / S10 门禁 / S11 聚合 / S12 发布
> 同族参考：vane-resume（peer 外部化派 + 大插件家族 + P2 五样齐全的 demo 范式基准）

## 0. 组件定位
`vane-candidate` = 候选人流水线（ATS）UI 容器。内核 `CandidateCore` 持有候选人列表与阶段定义，渲染看板骨架（阶段列 + 候选人卡片 + 工具栏/页脚），阶段流转语义（推进/退回）通过领域帮助函数 + 上下文扩展 `moveCandidate` / `updateCandidate` 暴露，全部可变能力交给插件。候选人卡片上另有 per-card 领域槽（徽章 / 操作钮 / 卡体覆盖），工具栏 / 页脚 / 浮层为全局槽。

## 1. 入口划分（ADR-6/14：根不桶导出插件）
- `src/index.ts`：聚合 `CandidateCore` + `withCandidatePlugins`（含 `withPlugins` 别名）+ 槽 provider/hooks + 领域类型 + 复用内核类型。不导出任何插件。
- `src/entries/core.ts`：仅核心（CandidateCore + withCandidatePlugins + 类型）。
- `src/entries/plugins.ts`：`withCandidatePlugins` + `export * from "../custom-plugins"` + 类型。
- `src/components/CandidatePlugin/{CandidateCore.tsx, withPlugins.tsx, plugins/{slots.tsx, types.ts, tokens.tsx, overlay.tsx}, domain.ts}`。
- `src/custom-plugins/<Name>Plugin/{create.tsx, doc.json, index.ts}` ×19。

## 2. 数据模型与领域语义
```ts
interface Candidate {
  id: string; name: string; avatar?: string; role: string;
  stage: string;                 // 阶段 key，见 StageConfig
  score?: number;                // 匹配分 0-100
  tags?: string[]; source?: string; appliedAt?: string;
  email?: string; phone?: string; summary?: string; resumeUrl?: string;
  starred?: boolean; archived?: boolean;
  interview?: { date: string; interviewer?: string; mode?: "onsite" | "video" | "phone" };
  offer?: { salary?: string; status: "draft" | "sent" | "accepted" | "declined" };
  history?: { at: string; action: string; detail?: string }[];
  notes?: { id: string; author: string; at: string; text: string }[];
}
interface StageConfig { key: string; label: string; tone?: "neutral"|"info"|"warn"|"good"|"bad" }
```
- 阶段流转 = `domain.ts` 纯函数：`stageIndexOf` / `moveStage(stages, stage, delta)`（到边界即停）。插件经 `ctx.moveCandidate(id, +1|-1)` 推进/退回；`ctx.updateCandidate(id, patch)` 局部更新。
- 内部数据策略：withPlugins 维护 `internalData`，监听 bus 事件 `candidate:update` 应用补丁；宿主回写 `props.data` 后受控同步（对齐 vane-resume restoredData 模式），并同步发 `candidate:change` 通知宿主。
- `archived: true` 的候选人默认不进看板列（ArchivePool 插件提供查看/恢复）。

## 3. 领域槽与插件清单（19 个，按槽位分 priority 区间）

| 槽 | 语义 | 插件（priority） |
|---|---|---|
| `renderToolbar` | 装饰累积 | Filter(10) Search(20) BatchOp(30) ViewSwitch(40) ArchivePool(50) Export(60) |
| `renderCardBadges` | per-card 装饰累积，签名 `(ctx, candidate)` | Score(10) DupCheck(20) Tag(30) Offer(40) |
| `renderCardActions` | per-card 装饰累积 | Star(10) StageFlow(20) Note(30) InterviewSlot(40) RejectTpl(50) BatchOp 复选(60) |
| `renderCards` | 内容覆盖（单值，最高 priority 胜出；默认=看板列） | ViewSwitch(70，列表视图) |
| `renderColumnHeader` | per-stage 装饰累积，签名 `(ctx, stage, count)` | Stats 列内计数(20) |
| `renderFooter` | 装饰累积 | Stats 漏斗统计(10) ActivityLog(20) |
| `renderOverlay` | 浮层 | Note(10) InterviewSlot(20) RejectTpl(30) ActivityLog(40) ArchivePool(50) |
| `transformData` | 数据管道 | RecommendSort(30，先排序) → ContactMask(10，后脱敏，priority 低后执行？) |

transformData 执行顺序=内核「依赖拓扑 + priority 降序」：RecommendSort priority 30 先跑，ContactMask priority 10 后跑（先排序后脱敏，避免掩码干扰排序分值；脱敏在展示前完成）。

19 个插件：`ScorePlugin(score)` `DupCheckPlugin(dup-check)` `TagPlugin(tags)` `OfferPlugin(offer)` `StarPlugin(star)` `StageFlowPlugin(stage-flow)` `NotePlugin(note)` `InterviewSlotPlugin(interview-slot)` `RejectTplPlugin(reject-tpl)` `FilterPlugin(filter)` `SearchPlugin(search)` `BatchOpPlugin(batch-op)` `ViewSwitchPlugin(view-switch)` `ArchivePoolPlugin(archive-pool)` `ExportPlugin(export)` `StatsPlugin(stats)` `ActivityLogPlugin(activity-log)` `RecommendSortPlugin(recommend-sort)` `ContactMaskPlugin(contact-mask)`。

## 4. Core 依赖派系
同 vane-resume：**peer 外部化派**。`vane-plugin-core` 置于 `peerDependencies`(workspace:*)；react/react-dom 仅 peer；无运行时第三方依赖（导出 CSV 用 Blob 手拼，不引库）。

## 5. 体积预算（首次 build 后据实校准）
- `sizeBudgetKb`（根入口）：**10KB**（容器 + withPlugins + slots + tokens + 类型）。
- `subpathBudgets`：19 插件各 **3KB**（薄壳为主；BatchOp/ViewSwitch/ArchivePool 稍大可到 4KB）。
- `fullSizeBudgetKb`：全量并集 **60KB**。
- 超标路径：真减 → 写 `sizeBudgetNote`（禁止静默调大）。

## 6. demo 场景
- 逐项示例：19 页 `demos/NN-*.tsx`（每插件一页）。
- 三页套：总览（HomePage）+ 插件工坊（PluginsPage）+ 场景示例（ScenariosPage ≥3：招聘看板、批量筛选日、人才库复盘）。
- 数据：演示站共用 `SAMPLE_CANDIDATES`（10+ 候选人、5 阶段、含 offer/面试/备注完整字段）。

## 7. 无障碍与对比度（ADR-13）
- 卡片按钮均带 `aria-label`；弹层走共用 Overlay（dialog 语义 + Esc + 焦点圈）。
- 徽章/标签配色取自 tokens（正文 ≥4.5:1、UI 元件 ≥3:1、禁用 ≥3:1）；禁用态实色不用 opacity。
- 品牌色 accent = **#2563eb 招聘蓝**，S5 落到 App.css 四令牌 + `package.json vane.demo.accent`。

## 8. 已拍板决策
1. 19 插件（用户点名的 Score/Tag/Note/InterviewSlot/RejectTpl/BatchOp/RecommendSort/ArchivePool 全含）。
2. per-card 槽走 `(ctx, candidate)` 双参签名，复用内核排序规则；renderCards 为单值覆盖槽。
3. 阶段流转数据写入内部态 + `candidate:change` 事件外通知，插件零数据感知负担。
4. 无运行时第三方依赖（CSV 导出 Blob 手拼）。
