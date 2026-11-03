# 61 · vane-activity 分析

> 分期：S1 分析 / S2 脚手架 / S3 内核入口 / S4 四插件 / S5 DEMO 外壳 / S6 三页套 / S7 逐项示例 / S8 自测对比度 / S9 文档 / S10 门禁 / S11 聚合 / S12 发布 / S13 SKILL 优化
> 同族参考：vane-comment（peer 外部化派 + 插件家族 + presets 整装）

## 0. 组件定位
`vane-activity` = 营销/运营活动 UI 容器。内核 `ActivityCore` 持有活动领域状态机（任务 / 进度 / 奖励 / 领取），渲染语义骨架，通过领域槽把可视区块交给插件。四个官方插件（TaskList / ProgressFx / RewardClaim / RuleExpand）各自填充一个主槽，ProgressFx 额外贡献 overlay 特效。

## 1. 入口划分（ADR-6/14：根不桶导出插件）
- `src/index.ts`：聚合 `ActivityCore` + `withActivityPlugins` + 槽 provider/hooks + 领域类型 + 复用内核类型。**不导出任何插件**（体积门前提）。
- `src/entries/core.ts`：仅核心（ActivityCore + withActivityPlugins + 类型）。
- `src/entries/plugins.ts`：`withActivityPlugins` + `export * from "../custom-plugins"` + 类型。
- `src/components/ActivityPlugin/{ActivityCore.tsx, withPlugins.tsx, plugins/slots.tsx, plugins/types.ts, domain.ts(状态机/纯函数)}`。
- `src/custom-plugins/<Name>Plugin/{create.tsx, doc.json, index.ts}` ×4。
- `src/custom-plugins/index.ts`：re-export 四个插件。
- （可选/延后）`src/presets/`：活动预设整装（新手7日 / 消费满赠），S1 不强制，留逃生口。

## 2. 插件清单与插槽
领域槽（一对多，同槽可多插件共用）：

| 槽 | 职责 | 主插件 | priority 区间 |
|---|---|---|---|
| `renderProgress` | 进度可视化（条/环/数字） | ProgressFx (10) | 10–19 |
| `renderTasks` | 任务清单主体 | TaskList (20) | 20–29 |
| `renderRewards` | 奖励领取区 | RewardClaim (30) | 30–39 |
| `renderRules` | 规则折叠面板 | RuleExpand (40) | 40–49 |
| `renderOverlay` | 浮层特效（达成庆祝/领取 toast） | ProgressFx 复用 (50) | 50–59 |

- 每个插件分配单一 priority（按槽位区间，避免撞车）。
- ProgressFx 同时挂 `renderProgress(10)` 与 `renderOverlay(50)`：单 priority 在各自槽内排序，不冲突。
- 核心钩子复用 vane-plugin-core：`transformData` / `transformProps` / `renderOverlay` / `onMount` / `onUnmount` 等。

## 3. Core 依赖派系
- 同 vane-comment：**peer 外部化派**。`vane-plugin-core` 同时置于 `peerDependencies`(workspace:*) 与 `devDependencies`(workspace:*)；`react`/`react-dom` 仅 peer。
- 运行时第三方库（若有，如 clsx）→ `dependencies` + vite `external`；demo 用库（react-router-dom 等）→ 仅 `devDependencies`。

## 4. 体积预算（首次 build 后据实校准）
- `sizeBudgetKb`（根入口）：**8KB**（容器 + withPlugins + slots + 类型，peer 外置不进 dist；留余量，疑似超标写 `sizeBudgetNote`）。
- `coreSizeBudgetKb`（dist/core.js）：**6KB**。
- `subpathBudgets`：四插件各 **3KB**（薄壳为主；ProgressFx 含 overlay 可能偏大，build 后据实）。
- `fullSizeBudgetKb`：全量并集 **20KB**。
- 注：模板默认根 30 / 实测 comment 4.1KB；活动核复杂度相近，8 为保守起点，S10 据实收紧或写 note。

## 5. demo 场景
- 预设场景（ScenariosPage ≥2）：「新手 7 日任务」「消费满赠领券」「每日签到」——每个 = 多插件真实组合 + 完整样例数据。
- 逐项示例（demos/NN-*.tsx）：每插件一页（TaskList / ProgressFx / RewardClaim / RuleExpand）+ 总览 / 插件工坊 / 场景示例三页套。
- 数据：演示站共用 `SAMPLE_ACTIVITY`（任务/奖励/规则完整样例）。

## 6. 领域语义（状态与无障碍）
- 任务 `Task`：`{ id, title, desc?, progress(0..1), status: 'locked'|'available'|'completed', actionLabel, rewardId? }`。
- 奖励 `Reward`：`{ id, title, threshold(0..1), status: 'locked'|'claimable'|'claimed', icon? }`。
- 进度 = 已完成任务权重和 / 总权重；ProgressFx 据阈值点亮对应奖励。
- 领取：RewardClaim 调 `onClaim(rewardId)`；claimable 高亮可点，claimed 禁用态（≥3:1），locked 灰（≥3:1）。
- 规则 RuleExpand：长文 `line-clamp` 截断 + 展开/收起；`aria-expanded` 同步。
- 颜色（ADR-13）：容器自带 `color`+`background`；内联 background 必内联 color；不用 opacity 压字；禁用/锁定态实色 ≥3:1，正文 ≥4.5:1。
- 品牌色：先用模板默认 accent，S5 在 `App.css` 四令牌 + `package.json vane.demo.accent` 对齐。

## 7. 已拍板决策（S1 收尾）
1. 品牌色 accent = **#ff7a29 暖橙**（与 vane-comment 同色系）。S5 落到 App.css 四令牌 + `package.json vane.demo.accent`。
2. **本批做 presets**：`src/presets/` 整装逃生口（新手7日 / 消费满赠 / 每日签到），与 vane-comment 同族。
3. 任务进度模型 = **带百分比 + 状态**：`Task.progress(0..1)` + `status: 'locked'|'available'|'completed'`。ProgressFx 据阈值点亮奖励。
