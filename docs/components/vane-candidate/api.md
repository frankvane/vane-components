# 候选人流水线 · API

## `CandidateCore`

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `Candidate[]` | - | 候选人列表（透传内核 context.data，经 transformData 链改写） |
| `stages` | `StageConfig[]` | `DEFAULT_STAGES` | 阶段定义（看板列顺序），默认 6 阶段 |
| `onDataChange` | `(data: Candidate[]) => void` | - | 插件流转/更新后的整表回调（宿主持久化入口） |
| `containerClassName` | `string` | - | 容器类名 |
| `containerStyle` | `React.CSSProperties` | - | 容器样式 |
| `onMount` / `onUnmount` | `() => void` | - | 挂载/卸载回调（会被插件钩子转发） |
| `debug` | `boolean` | `false` | 打印插件注册与钩子日志 |

### Ref

| 方法 | 说明 |
| --- | --- |
| `getContainer()` | 取根 DOM |
| `forceUpdate()` | 强制刷新 |
| `getSize()` | 取容器尺寸 |
| `getStageKeys()` | 取当前阶段 key 列表 |

## 数据模型

```ts
interface Candidate {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  stage: string;            // 对应 StageConfig.key
  score?: number;           // 匹配分 0-100
  tags?: string[];
  source?: string;
  appliedAt?: string;
  email?: string;
  phone?: string;
  summary?: string;
  resumeUrl?: string;
  starred?: boolean;
  archived?: boolean;
  interview?: { date: string; interviewer?: string; mode?: "onsite" | "video" | "phone" };
  offer?: { salary?: string; status: "draft" | "sent" | "accepted" | "declined" };
  history?: { at: string; action: string; detail?: string }[];
  notes?: { id: string; author: string; at: string; text: string }[];
}

interface StageConfig {
  key: string;
  label: string;
  tone?: "neutral" | "info" | "warn" | "good" | "bad";
}
```

## `withPlugins(Core, plugins)`

把插件装配到核心组件上。两种写法等价：

```tsx
withPlugins(CandidateCore, [createScorePlugin()]);
withPlugins(CandidateCore, { plugins: [createScorePlugin()], enableDebug: true });
```

装配后插件上下文（`ctx`）额外暴露两个领域动作：

| 方法 | 说明 |
| --- | --- |
| `ctx.updateCandidate(id, patch)` | 局部更新候选人（浅合并，广播 `candidate:update` → `candidate:change`） |
| `ctx.moveCandidate(id, ±n)` | 阶段流转（越界停住，自动追加 history，广播 `candidate:move`） |

## 领域槽

| 槽 | 语义 | 签名 |
| --- | --- | --- |
| `renderToolbar` / `renderFooter` | 装饰累积（多插件拼接） | `(ctx) => ReactNode` |
| `renderCardBadges` / `renderCardActions` | per-card 装饰累积 | `(ctx, candidate) => ReactNode` |
| `renderColumnHeader` | per-stage 装饰累积 | `(ctx, stage, count) => ReactNode` |
| `renderCards` | 整体内容覆盖（单值，非 null 胜出） | `(ctx, { stages, candidates }) => ReactNode` |
| `renderCardBody` | per-card 内容覆盖（单值） | `(ctx, candidate) => ReactNode` |

排序规则：`config.order` 升序 → `priority` 降序；单插件抛错由 PluginErrorBoundary 隔离。

## 领域纯函数（根入口导出）

`stageIndexOf` / `moveStage` / `withHistory` / `applyCandidatePatch` / `csvCell` / `maskPhone` / `maskEmail`。
