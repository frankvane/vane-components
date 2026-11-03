# 候选人流水线 · 组合配方

配方 = 一组插件的预设组合，用来降低「面对 19 个插件不知道选谁」的成本。

```tsx
import { CandidateCore, withPlugins } from "vane-candidate";
import { createScorePlugin } from "vane-candidate/custom-plugins/ScorePlugin";
import { createStageFlowPlugin } from "vane-candidate/custom-plugins/StageFlowPlugin";
import { createNotePlugin } from "vane-candidate/custom-plugins/NotePlugin";

/** 配方：日常刷简历（匹配分 + 流转 + 备注） */
export const DailyReview = withPlugins(CandidateCore, [
  createScorePlugin(),
  createStageFlowPlugin(),
  createNotePlugin(),
]);
```

## 场景配方

### 1. 面试官工作台

```tsx
withPlugins(CandidateCore, [
  createScorePlugin(),
  createStageFlowPlugin(),
  createInterviewSlotPlugin({ slots: ["周二 14:00", "周四 16:00"] }),
  createNotePlugin({ authorName: "面试官" }),
]);
```

### 2. HR 筛选日（批量）

```tsx
withPlugins(CandidateCore, [
  createFilterPlugin(),
  createSearchPlugin(),
  createBatchOpPlugin(),
  createRecommendSortPlugin({ by: "score" }),
  createRejectTplPlugin(),
]);
```

### 3. 人才库运营

```tsx
withPlugins(CandidateCore, [
  createArchivePoolPlugin(),
  createStarPlugin(),
  createTagPlugin({ suggestTags: ["银牌", "六个月后再看"] }),
  createContactMaskPlugin({ visibleStages: ["offer", "hired"] }),
  createExportPlugin({ filename: "人才库" }),
]);
```

## 推荐做法

- 常用组合沉淀为配方导出，让用户免于每次自己拼；
- 配方是「快捷方式」不是「白名单」——任何插件都可以单独引入；
- priority 按槽位分区间：toolbar 10–69 / badges 10–49 / actions 10–69 / overlay 10–59 / footer 10–29 / transformData 10–70，新增插件落在对应区间避免撞车。
