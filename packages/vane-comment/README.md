<p align="center">
  <a href="https://www.npmjs.com/package/vane-comment"><img src="https://img.shields.io/npm/v/vane-comment.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-comment"><img src="https://img.shields.io/npm/dm/vane-comment.svg" alt="npm downloads" /></a>
</p>

# 通用评论区引擎

> 插件式通用评论区：`CommentCore` 负责数据驱动渲染评论列表，其余能力（点赞 / 排序 / 楼中楼 / 富编辑）全部通过插件按需组合。
>
> **视频 / 社交 / 电商评论区的差异不在内核，而在"装配了哪些插件 + 各自的配置"**——同一份内核，三套预设即可通用。

## 特性

- **能力即插件**：4 个领域插件（点赞 / 排序 / 楼中楼 / 富编辑），要哪几个装哪几个，没装的区块不进产物
- **受控 / 展示型**：组件不内置后端，consumer 拥有数据与回调，跨平台 API 形态各异也能通用
- **结构化富内容**：评论内容是 `CommentNode[]`（文字 / emoji / 图片 / @提及），而非纯字符串，抖音/电商/社交评论统一渲染
- **领域槽复用内核基建**：`renderToolbar / renderFooter / renderCommentActions / renderNested` 走包内 `renderCommentSlot`（复用内核 order 排序 + `priority` 决策 + `PluginErrorBoundary` 单槽隔离）
- **Tree-shaking 友好**：根入口不桶导出插件，每个插件走独立子路径；`vane-plugin-core` 为 peer 依赖
- **零 CSS 文件**：布局用内联 + 功能样式，不引额外样式文件

## 安装

```bash
npm install vane-comment
```

> `vane-comment` 的 peer 依赖含 `vane-plugin-core`、`react`、`react-dom`，请确保项目已安装。

## 30 秒上手

```tsx
import { CommentCore, withCommentPlugins } from "vane-comment";
import { createLikePlugin } from "vane-comment/custom-plugins/LikePlugin";
import { createSortPlugin } from "vane-comment/custom-plugins/SortPlugin";
import { createThreadPlugin } from "vane-comment/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "vane-comment/custom-plugins/RichComposerPlugin";

// 装配：一个组件类型，模块顶层调一次
const Comment = withCommentPlugins(CommentCore, [
  createLikePlugin(),
  createSortPlugin({ modes: ["hottest", "newest"] }),
  createThreadPlugin({ maxDepth: 3 }),
  createRichComposerPlugin({ features: { emoji: true, image: true } }),
]);

// 使用：受控数据 + 回调
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

`CommentCore` 的布局壳自带：顶栏（排序/计数）→ 评论列表（头像/昵称/时间/富内容/操作行/楼中楼）→ 加载更多 → 底部评论框。

## 导入方式与体积

| 导入 | 内容 | 预算 Gzip |
| --- | --- | --- |
| `vane-comment` | 核心 + 装配 + 领域槽 + 类型（不含任何插件） | **4 KB** |
| `vane-comment/entries/core` | 同上，只含 `CommentCore` + 领域槽（无 `withCommentPlugins`）| 更小 |
| `vane-comment/custom-plugins/LikePlugin` | 单个插件（4 选 n）| 2 KB |
| `vane-comment/custom-plugins/*` | 通配子路径，按需取 | 2 KB |
| `vane-comment/presets/video` | 视频评论区整装预设（逃生口）| 插件并集 |

> 根入口**不桶导出插件**——插件请走子路径，未引入的不进产物。

## 包内有什么

```
CommentCore                数据驱动列表壳 + ref 契约 + 列表/逐条槽消费，不含业务行为
withCommentPlugins         装配层：内核 runtime + 领域上下文 + Core 回调桥接 + transformData 应用
plugins/slots.tsx          CommentSlotProvider / renderCommentSlot / useCommentSlot / useCommentContext
plugins/types.ts           CommentCoreProps / CommentCoreRef / CommentPluginContext / CommentPluginHooks
custom-plugins/            4 个领域插件（LikePlugin / SortPlugin / ThreadPlugin / RichComposerPlugin）
presets/                   3 平台预设（video / social / ecommerce）
demo/                      演示站（P2 阶段补充）
```

## 插件目录速览

| 插件 | 领域槽 | 一句话 |
| --- | --- | --- |
| `LikePlugin` | `renderCommentActions` | 点赞按钮 + 本地爆裂动画，回调 `onLike` |
| `SortPlugin` | `renderToolbar` + `transformData` | 排序栏（最新/最早/最热/最赞）+ 列表重排 |
| `ThreadPlugin` | `renderNested` + `renderCommentActions` | 楼中楼递归 + 限深折叠 + 内联回复 |
| `RichComposerPlugin` | `renderFooter` | 根评论框（emoji/图片/@提及）→ 结构化内容 |

完整配置项见 [插件目录](../../docs/components/vane-comment/plugins.md)。

## 文档

- [API](../../docs/components/vane-comment/api.md)
- [插件目录](../../docs/components/vane-comment/plugins.md)
- [组合配方](../../docs/components/vane-comment/recipes.md)

## License

MIT
