# 候选人流水线 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
| [ActivityLog](#activitylog) | 操作日志：汇总所有候选人的 history 动作（流转/备注等，写操作链路自动记录），按时间倒序在浮层展示，页脚提供入口（带总数）。 | `maxEntries` = 100 | 0.1.0 | activity-log, renderFooter, renderOverlay |
| [ArchivePool](#archivepool) | 人才库归档池：transformData 把已归档候选人从主看板滤除，工具栏「人才库」浮层支持一键恢复，卡片操作区提供归档入口。 | `poolPageSize` = 0 | 0.1.0 | archive-pool, transformData, renderToolbar, renderOverlay, renderCardActions |
| [BatchOp](#batchop) | 批量操作：工具栏「批量」进入选择模式，卡片出现复选框，支持全选/清空/批量流转到指定阶段/批量归档。写操作逐条走 updateCandidate / moveCandidate。 | `targetStages` = 跟随核心阶段定义 | 0.1.0 | batch-op, renderToolbar, renderCardActions |
| [ContactMask](#contactmask) | 联系方式脱敏：transformData 把邮箱/手机号替换为掩码（138****5678 / a***c@example.com），指定阶段可豁免（招聘后期需完整联系方式）。数据管道末位执行，不影响排序。 | `maskEmail` = true<br/>`maskPhone` = true<br/>`visibleStages` = [] | 0.1.0 | contact-mask, transformData |
| [DupCheck](#dupcheck) | 重复候选人检测：按姓名/邮箱/手机号扫描列表，命中者在卡片上显示「疑似重复」警示徽章，辅助 HR 及时发现重复投递。 | `fields` = ['name','email','phone'] | 0.1.0 | dup-check, renderCardBadges |
| [Export](#export) | CSV 导出：工具栏按钮把当前看板数据（经筛选/排序管道后）导出为带 BOM 的 UTF-8 CSV，内置公式注入防护与阶段名翻译，列可扩展。 | `filename` = 'candidates'<br/>`columns` = 内置 8 列 | 0.1.0 | export, renderToolbar |
| [Filter](#filter) | 阶段/标签筛选：工具栏阶段与标签下拉（标签选项可配置或自动从数据收集），transformData 按所选条件过滤看板。 | `tagOptions` = 自动从数据收集 | 0.1.0 | filter, renderToolbar, transformData |
| [InterviewSlot](#interviewslot) | 面试安排：卡片操作区「安排面试」入口，浮层内从时间槽/面试官/形式中点选保存到 candidate.interview，卡片正文显示面试信息条。 | `slots` = ['周二 14:00','周三 10:00','周四 16:00','周五 15:00']<br/>`interviewers` = ['王工','李总监']<br/>`modes` = ['onsite','video'] | 0.1.0 | interview-slot, renderCardActions, renderCardBody, renderOverlay |
| [Note](#note) | 招聘备注：卡片操作区备注按钮（带条数角标），浮层内查看/新增/删除备注，写回 candidate.notes。面试沟通、背调结论都记在这里。 | `authorName` = '我'<br/>`maxNotes` = 50 | 0.1.0 | note, renderCardActions, renderOverlay |
| [Offer](#offer) | Offer 状态徽章：候选人带 offer 字段时展示状态胶囊（审批中灰 / 已发出蓝 / 已接受绿 / 已婉拒红），可自定义文案。纯展示。 | `labels` = 内置中文文案 | 0.1.0 | offer, renderCardBadges |
| [RecommendSort](#recommendsort) | 智能推荐排序：transformData 对候选人列表按匹配分（默认，同分按投递时间新在前）或投递时间排序，仅重排不增删。 | `by` = 'score'<br/>`desc` = true | 0.1.0 | recommend-sort, transformData |
| [RejectTpl](#rejecttpl) | 婉拒模板：卡片操作区「婉拒」入口，浮层内选择模板（可预览编辑），确认后候选人流转到婉拒阶段并保留流转历史。 | `templates` = 内置 2 套<br/>`targetStage` = 'rejected' | 0.1.0 | reject-tpl, renderCardActions, renderOverlay |
| [Score](#score) | 岗位匹配分徽章：候选人卡片右上角展示 0-100 匹配分胶囊，按阈值着色（优秀绿 / 待定橙 / 偏低红）。纯展示，不改数据。 | `goodThreshold` = 80<br/>`warnThreshold` = 60 | 0.1.0 | score, renderCardBadges |
| [Search](#search) | 关键词搜索：工具栏搜索框（姓名/岗位/摘要/标签/来源），transformData 实时过滤看板，空关键词不过滤。 | `fields` = 全部字段 | 0.1.0 | search, renderToolbar, transformData |
| [StageFlow](#stageflow) | 阶段流转：卡片操作区「◀ 推进 ▶」按钮，按阶段定义推进/退回候选人（自动追加流转历史，越界自动禁用）。流转核心动作插件。 | `step` = 1<br/>`allowBackward` = true | 0.1.0 | stage-flow, renderCardActions |
| [Star](#star) | 星标收藏：卡片操作区 ☆/★ 一键切换星标，可选把星标候选人置顶到各自阶段列最前（transformData）。 | `pinTop` = true | 0.1.0 | star, renderCardActions, transformData |
| [Stats](#stats) | 漏斗统计：页脚渲染各阶段人数占比条（tone 着色，aria 可读），列头显示计数徽章（可关）。纯统计，不改数据。 | `columnCount` = true | 0.1.0 | stats, renderFooter, renderColumnHeader |
| [Tag](#tag) | 候选人标签：卡片徽章区展示标签 chips，浮层内可添加/删除标签（支持快捷建议标签），写回 candidate.tags。 | `suggestTags` = ['重点','备选','急招','内推']<br/>`maxTags` = 8 | 0.1.0 | tags, renderCardBadges, renderOverlay |
| [ViewSwitch](#viewswitch) | 看板/列表视图切换：工具栏互斥按钮切换 state.view，list 模式经 renderCards 内容覆盖槽渲染紧凑表格视图，kanban 模式回落核心默认看板。 | `pageSize` = 0 | 0.1.0 | view-switch, renderToolbar, renderCards |

## 插件能力明细

### ActivityLog

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxEntries` | `number` | `100` | 浮层最多展示条数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，页脚 | 日志入口按钮（带总数） |
| `renderOverlay` | state.activityLogOpen 时 | 日志时间线浮层 |

**方法 Methods**

只读取 ctx.data 中各候选人的 history，不调用上下文方法

### ArchivePool

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `poolPageSize` | `number` | `0` | 人才库浮层条数上限（0 = 不限制） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前 | 滤除 archived 候选人 |
| `renderToolbar` | 每次渲染，工具栏 | 人才库入口（带归档计数） |
| `renderOverlay` | state.archivePoolOpen 时 | 人才库浮层（恢复/查看） |
| `renderCardActions` | 每次渲染，每张候选人卡片 | 归档按钮 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `undefined` | `undefined` | undefined |

### BatchOp

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `targetStages` | `StageConfig[]` | `跟随核心阶段定义` | 批量流转目标阶段 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染，工具栏 | 批量开关与批量操作按钮组 |
| `renderCardActions` | 批量模式开启时 | 卡片复选框 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `undefined` | `undefined` | undefined |
| `undefined` | `undefined` | undefined |

### ContactMask

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maskEmail` | `boolean` | `true` | 是否脱敏邮箱 |
| `maskPhone` | `boolean` | `true` | 是否脱敏手机号 |
| `visibleStages` | `string[]` | `[]` | 免脱敏阶段 key 列表 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对联系方式脱敏 | email / phone 掩码化，visibleStages 豁免 |

**方法 Methods**

只读取 candidate.email / phone / stage，不调用上下文方法

### DupCheck

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fields` | `('name'\|'email'\|'phone')[]` | `['name','email','phone']` | 参与判重的字段 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardBadges` | 每次渲染，每张候选人卡片 | 命中重复时渲染警示徽章 |

**方法 Methods**

只读取 ctx.data 与 candidate 字段，不调用上下文方法

### Export

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `filename` | `string` | `'candidates'` | 导出文件名（自动带日期后缀） |
| `columns` | `{header, get}[]` | `内置 8 列` | 额外导出列 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染，工具栏 | 导出 CSV 按钮（点击触发 Blob 下载） |

**方法 Methods**

只读取 ctx.data，不调用上下文方法

### Filter

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tagOptions` | `string[]` | `自动从数据收集` | 可选的标签筛选项 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染，工具栏 | 阶段/标签筛选控件与清除按钮 |
| `transformData` | 渲染前，筛选条件变化时重跑 | 按 filterStage / filterTag 过滤 |

**方法 Methods**

通过 ctx.setState({ filterStage, filterTag }) 驱动

### InterviewSlot

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `slots` | `string[]` | `['周二 14:00','周三 10:00','周四 16:00','周五 15:00']` | 可选时间槽 |
| `interviewers` | `string[]` | `['王工','李总监']` | 可选面试官 |
| `modes` | `('onsite'\|'video'\|'phone')[]` | `['onsite','video']` | 面试形式 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardActions` | 每次渲染，每张候选人卡片 | 安排/改期面试入口 |
| `renderCardBody` | candidate.interview 存在时 | 面试信息条（时间/形式/面试官） |
| `renderOverlay` | state.interviewEditingId 非空时 | 面试安排浮层 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `undefined` | `undefined` | undefined |

### Note

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `authorName` | `string` | `'我'` | 备注作者署名 |
| `maxNotes` | `number` | `50` | 每位候选人最多保留备注条数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardActions` | 每次渲染，每张候选人卡片 | 备注入口按钮 |
| `renderOverlay` | state.noteEditingId 非空时 | 备注管理浮层 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `undefined` | `undefined` | undefined |

### Offer

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `labels` | `Partial<Record<status, string>>` | `内置中文文案` | 各状态自定义文案 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardBadges` | 每次渲染，每张候选人卡片 | candidate.offer 存在时渲染状态徽章 |

**方法 Methods**

只读取 candidate.offer，不调用上下文方法

### RecommendSort

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `by` | `'score' \| 'fresh'` | `'score'` | 排序依据 |
| `desc` | `boolean` | `true` | 是否降序 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `transformData` | 渲染前，对列表排序 | score / fresh 两种排序模式，可升降序 |

**方法 Methods**

只读取 candidate.score / appliedAt，不调用上下文方法

### RejectTpl

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `templates` | `RejectTemplate[]` | `内置 2 套` | 婉拒信模板（id/title/body） |
| `targetStage` | `string` | `'rejected'` | 流转目标阶段 key |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardActions` | 每次渲染，每张候选人卡片 | 婉拒入口按钮 |
| `renderOverlay` | state.rejectEditingId 非空时 | 模板选择与编辑浮层 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `undefined` | `undefined` | undefined |

### Score

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `goodThreshold` | `number` | `80` | ≥该值显示绿色 |
| `warnThreshold` | `number` | `60` | ≥该值显示橙色，否则红色 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardBadges` | 每次渲染，每张候选人卡片 | 渲染匹配分徽章（阈值着色） |

**方法 Methods**

只读取 candidate.score，不调用上下文方法

### Search

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fields` | `('name'\|'role'\|'summary'\|'tags'\|'source')[]` | `全部字段` | 参与搜索的字段 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染，工具栏 | 搜索输入框 |
| `transformData` | 渲染前，关键词变化时重跑 | 按 searchKeyword 匹配过滤 |

**方法 Methods**

通过 ctx.setState({ searchKeyword }) 驱动

### StageFlow

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `step` | `number` | `1` | 每次流转的步长 |
| `allowBackward` | `boolean` | `true` | 是否允许回退 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardActions` | 每次渲染，每张候选人卡片 | 渲染推进/退回按钮，边界禁用 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `undefined` | `undefined` | undefined |

### Star

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pinTop` | `boolean` | `true` | 星标候选人在列内置顶 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardActions` | 每次渲染，每张候选人卡片 | 星标切换按钮（aria-pressed） |
| `transformData` | pinTop 开启时，渲染前 | 星标候选人置顶排序 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `undefined` | `undefined` | undefined |

### Stats

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `columnCount` | `boolean` | `true` | 是否在列头显示计数徽章 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderFooter` | 每次渲染，页脚 | 漏斗条形统计 |
| `renderColumnHeader` | 每次渲染，每列头部 | 列内人数徽章 |

**方法 Methods**

只读取 ctx.data 与 props.stages，不调用上下文方法

### Tag

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `suggestTags` | `string[]` | `['重点','备选','急招','内推']` | 快捷标签建议 |
| `maxTags` | `number` | `8` | 每位候选人最多标签数 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderCardBadges` | 每次渲染，每张候选人卡片 | 展示标签 chips 与管理入口 |
| `renderOverlay` | state.tagEditingId 非空时 | 标签管理浮层（添加/删除/快捷建议） |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `undefined` | `undefined` | undefined |

### ViewSwitch

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pageSize` | `number` | `0` | 列表视图条数上限（0 = 不分页） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `renderToolbar` | 每次渲染，工具栏 | 看板/列表切换按钮组 |
| `renderCards` | state.view 为 list 时 | 渲染列表视图（覆盖默认看板） |

**方法 Methods**

通过 ctx.setState({ view }) 驱动

<!-- AUTO-GENERATED:END -->

## 如何新增一个插件

1. 在 `src/custom-plugins/` 下新建目录 `MyPlugin/`；
2. 写三件套：`doc.json`（机器可读文档）、`create.tsx`（工厂）、`index.ts`（桶导出）；
3. 跑 `pnpm docs:plugins` 重新生成本表和文档站导航；
4. 跑 `pnpm docs:sync` 把文档同步成 npm README。
