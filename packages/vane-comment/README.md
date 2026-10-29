<p align="center">
  <a href="https://www.npmjs.com/package/vane-comment"><img src="https://img.shields.io/npm/v/vane-comment.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-comment"><img src="https://img.shields.io/npm/dm/vane-comment.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 通用评论区引擎

> 插件式通用评论区：`CommentCore` 负责数据驱动渲染评论列表，其余能力（点赞 / 排序 / 楼中楼 / 富编辑）全部通过插件按需组合。
>
> **视频 / 社交 / 电商评论区的差异不在内核，而在「装配了哪些插件 + 各自的配置」**——同一份内核，三套预设即可通用。

`vane-comment` 解决的是「不同平台的评论区怎么复用」这一件事：给出评论数据，它负责

- **数据驱动渲染**（核心能力，内置在 `CommentCore`）：头像 / 昵称 / 时间 / 富内容 / 操作行 / 楼中楼，逐条壳由内核渲染，行为交给插件；
- 点赞 / 排序 / 楼中楼 / 富编辑等长尾能力，做成**按需子路径插件**，用几个装几个，没装的区块不进产物。

与「写死一套评论组件」的关系：后者每个平台复制一份、改一处分号全局。本引擎把可变能力外挂成插件，内核只管列表布局，三平台只是不同的插件装配。

## 安装

```bash
npm install vane-comment
```

> 本包的 peer 依赖含 `vane-plugin-core`、`react`、`react-dom`，请确保项目已安装（monorepo 内为 `workspace:*`）。

## 30 秒上手

```tsx
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";
import { createSortPlugin } from "vane-comment/custom-plugins/SortPlugin";
import { createThreadPlugin } from "vane-comment/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "vane-comment/custom-plugins/RichComposerPlugin";

// 装配：一个组件类型，模块顶层调一次（不要在渲染期反复 new）
const Comment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({ modes: ["hottest", "newest"] }),
  createThreadPlugin({ maxDepth: 3 }),
  createRichComposerPlugin({ features: { emoji: true, image: true } }),
]);

// 使用：受控数据 + 回调（组件不内置后端，consumer 拥有数据与状态真相）
function CommentPage({ comments }: { comments: Comment[] }) {
  return (
    <Comment
      comments={comments}
      onLike={(id, next) => api.toggleLike(id, next)}
      onReply={(pid, content) => api.postReply(pid, content)}
      onSubmit={(content) => api.postComment(content)}
    />
  );
}
```

`CommentCore` 的布局壳自带：顶栏（排序 / 计数）→ 评论列表（头像 / 昵称 / 时间 / 富内容 / 操作行 / 楼中楼）→ 加载更多 → 底部评论框。

> 嫌四个插件逐个引太啰嗦？直接拿平台预设：`createVideoComment()` / `createSocialComment()` / `createEcommerceComment()`（见 [组合配方](../../docs/components/vane-comment/recipes.md)）。

## 数据模型

```ts
interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;       // 缺省渲染首字母圆头像
  verified?: boolean;    // 认证标（蓝色 ✓）
  badge?: string;        // 自定义徽标，如「作者」「UP主」
}

type CommentNode =
  | { type: "text"; value: string }
  | { type: "emoji"; value: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "mention"; userId: string; name: string };

interface CommentImage { url: string; alt?: string; width?: number; height?: number }

interface Comment {
  id: string;
  author: CommentAuthor;
  content: CommentNode[]; // 结构化富内容；缺省回退到 text
  text?: string;
  createdAt: number;      // epoch ms
  likeCount: number;      // 必填：点赞数（渲染与「最赞」排序都读它）
  liked?: boolean;        // 当前用户是否已赞（消费方回填）
  replies?: Comment[];    // 楼中楼嵌套（replies 递归）
  replyCount?: number;    // 可 > replies.length 表示懒加载未展开
  pinned?: boolean;       // 置顶（数据属性，Core 直接渲染置顶标）
  status?: "normal" | "pending" | "deleted"; // 审核中 / 已删除不进正常计数
  images?: CommentImage[]; // 顶层配图（电商晒单 / 视频截帧）
  hotScore?: number;      // 热度分（hottest 排序用，缺省 0）
}
```

`content` 用结构化 `CommentNode[]` 而非纯字符串，是抖音 / 电商 / 社交评论统一渲染的刚需（emoji、图片、@提及都能被内核识别并渲染）。`likeCount` 是**必填**字段——点赞数渲染与「最赞」排序都读它，漏传会让点赞按钮计数与排序失效。

## 排序怎么算

排序是纯视图变换（由内核 `extendContext` 的 `sortComments` 幂等完成，对已排数据再排不抖动）。四种模式：

| 模式 | 字段 | 规则 |
| --- | --- | --- |
| `newest` | 最新 | `createdAt` 倒序 |
| `oldest` | 最早 | `createdAt` 正序 |
| `mostLiked` | 最赞 | `likeCount` 倒序（并列按时间倒序） |
| `hottest` | 最热 | `hotScore` 倒序（并列按时间倒序）；无 `hotScore` 则退化为按时间 |
| `custom` | 默认 | 保留传入原始顺序（不排序） |

排序结果**同时**覆盖 `comments` 与 `data` 两个字段——`CommentCore` 读取顺序是 `comments ?? data`，消费方无论传哪个都能拿到排好序的列表。

## 插件（4 个，全部按需子路径）

### 互动与列表

| 插件 | 子路径 | 作用 |
| --- | --- | --- |
| `LikePlugin` | `.../custom-plugins/LikePlugin` | 每条评论操作行渲染点赞按钮 + 计数，点击回调 `onLike`；本地爆裂动画 |
| `SortPlugin` | `.../custom-plugins/SortPlugin` | 顶栏渲染排序栏（最新 / 最早 / 最热 / 最赞），切换即时重排 |

### 楼中楼与输入

| 插件 | 子路径 | 作用 |
| --- | --- | --- |
| `ThreadPlugin` | `.../custom-plugins/ThreadPlugin` | 递归楼中楼（限深折叠 + 展开/收起）+ 内联回复框，提交回调 `onReply` |
| `RichComposerPlugin` | `.../custom-plugins/RichComposerPlugin` | 底部评论框（emoji / 图片 / @提及）+ 实时预览，提交回调 `onSubmit(CommentNode[])` |

插件一律走子路径按需引入（ADR-6），不进根入口。桶文件 `vane-comment/custom-plugins` 可一次引入全部（体积会变大，非推荐用法）。

## 包体积

| 导入方式 | Gzip 预算 |
| --- | --- |
| 根入口 `vane-comment`（core + 装配 + 领域槽 + 类型，不含任何插件） | ≤4 KB（实测 3.7） |
| 单个插件子路径 `.../custom-plugins/LikePlugin` | ≤2 KB（实测 1.5） |
| 单个插件子路径 `.../custom-plugins/SortPlugin` | ≤2 KB（实测 1.9） |
| 单个插件子路径 `.../custom-plugins/ThreadPlugin` | ≤4.5 KB（实测 4.1） |
| 单个插件子路径 `.../custom-plugins/RichComposerPlugin` | ≤4.5 KB（实测 3.9） |

> 体积门：`pnpm check` 逐包卡。根入口含内联的领域槽 / 上下文（复用 peer 外部化的 `vane-plugin-core`，不进 dist）。`ThreadPlugin` 与 `RichComposerPlugin` 各自背着真实 UI（递归楼中楼 + 内联回复框 / emoji 选择器 + 图片 + @提及 + 预览），初版拍的 2KB 扁平预算对这俩重插件不成立，按「改口径必须写理由」的硬约束调到 4.5KB，而非静默调大（理由见 `package.json` 的 `sizeBudgetNote`）。根入口 4KB 预算守住，因为 ADR-6 规定插件绝不进根入口。

## 文档

- [API](../../docs/components/vane-comment/api.md)
- [插件目录](../../docs/components/vane-comment/plugins.md)
- [组合配方](../../docs/components/vane-comment/recipes.md)

## License

MIT
