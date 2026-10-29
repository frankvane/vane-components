import type React from "react";
import type {
  PluginContext,
  PluginHooks,
  Plugin,
  PluginCreator,
  PluginDoc,
  PluginBus,
} from "vane-plugin-core";

/**
 * vane-comment 领域类型层。
 *
 * 内核 vane-plugin-core 已提供 PluginContext / PluginHooks / Plugin 等通用类型，
 * 这里只声明「评论领域层」的差异：
 *  - CommentNode / CommentAuthor / Comment / SortMode：领域数据；
 *  - CommentCoreProps / CommentCoreRef：核心组件 props / ref；
 *  - CommentPluginContext：内核 context + 评论专属字段（comments / sortMode / setSortMode）；
 *  - CommentPluginHooks：内核 9 钩子 + 4 个领域槽（renderToolbar / renderFooter /
 *    renderCommentActions / renderNested）；
 *  - CommentPlugin：插件定义。
 *
 * 约定：领域钩子一律用「方法语法」声明参数，以便内核把 context 收窄为领域上下文时
 * 通过 bivariance 校验（strictFunctionTypes 下参数逆变会拒绝领域钩子赋值）。
 */

// ============ 领域数据 ============

/** 富内容节点（通用渲染模型：文字 / emoji / 图片 / @提及） */
export type CommentNode =
  | { type: "text"; value: string }
  | { type: "emoji"; value: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "mention"; userId: string; name: string };

/** 评论作者 */
export interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
  /** 认证用户（渲染认证标） */
  verified?: boolean;
  /** 自定义徽标文案（如「作者」「UP主」） */
  badge?: string;
}

/** 评论图片（顶层晒单 / 配图） */
export interface CommentImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

/** 评论状态（删除 / 审核中不参与正常渲染与计数） */
export type CommentStatus = "normal" | "pending" | "deleted";

/** 单条评论（楼中楼：replies 递归嵌套） */
export interface Comment {
  id: string;
  author: CommentAuthor;
  /** 富内容（结构化）；缺省回退到 text */
  content: CommentNode[];
  /** 纯文本兜底 */
  text?: string;
  /** 创建时间（epoch ms） */
  createdAt: number;
  likeCount: number;
  liked?: boolean;
  /** 楼中楼回复（嵌套）；replyCount 可 > replies.length 表示懒加载未展开 */
  replies?: Comment[];
  replyCount?: number;
  /** 置顶（数据属性，Core 直接渲染置顶标） */
  pinned?: boolean;
  status?: CommentStatus;
  /** 顶层配图（电商晒单 / 视频截帧） */
  images?: CommentImage[];
  /** 热度分（hottest 排序用） */
  hotScore?: number;
}

/** 排序模式；`custom` = 保留传入原始顺序（无排序 UI 时默认） */
export type SortMode = "newest" | "oldest" | "hottest" | "mostLiked" | "custom";

/** 评论区默认数据形态 */
export type CommentData = Comment[];

// ============ 核心组件 props / ref ============

export interface CommentCoreProps<T = CommentData> {
  /** 受控评论数据（便捷 prop，映射到 data） */
  comments?: Comment[];
  /** 内核数据（透传给 context.data），与 comments 二选一 */
  data?: T;
  /** 点赞切换回调（乐观更新由 consumer 完成） */
  onLike?: (commentId: string, nextLiked: boolean) => void;
  /** 回复提交回调（content 为结构化富内容） */
  onReply?: (parentId: string, content: CommentNode[]) => void;
  /** 根评论提交回调 */
  onSubmit?: (content: CommentNode[]) => void;
  /** 排序变化回调 */
  onSortChange?: (mode: SortMode) => void;
  /** 加载更多回调 */
  onLoadMore?: () => void;
  /** 举报回调 */
  onReport?: (commentId: string) => void;
  /** @提及候选（RichComposer 下拉） */
  mentions?: { id: string; name: string; avatar?: string }[];
  /** 默认排序模式（SortPlugin 未命中时兜底） */
  defaultSortMode?: SortMode;
  /** 单页条数（留作扩展，当前仅影响分页 UI 文案） */
  pageSize?: number;
  /** 加载中 */
  loading?: boolean;
  /** 空态文案 */
  emptyText?: React.ReactNode;
  /** 容器类名 */
  containerClassName?: string;
  /** 容器内联样式 */
  containerStyle?: React.CSSProperties;
  /** 生命周期回调 */
  onMount?: () => void;
  onUnmount?: () => void;
  /** 调试开关 */
  debug?: boolean;
  /** 由 withCommentPlugins 注入，插件通过 ctx.refs.container 拿到同一引用 */
  containerRefExternal?: React.RefObject<HTMLDivElement>;
}

export interface CommentCoreRef {
  getContainer: () => HTMLDivElement | null;
  forceUpdate: () => void;
  getSize: () => { width: number; height: number };
}

// ============ 插件上下文 ============

/**
 * 评论插件上下文：内核 PluginContext 已携带 props / data / bus / refs / state /
 * setState / shared / deviceInfo / forceUpdate / getSize / logger；这里补充评论
 * 专属字段，供插件按语义访问。
 */
export interface CommentPluginContext<T = CommentData>
  extends PluginContext<CommentCoreProps<T>, T> {
  /** 经插件 transformData 处理后的评论列表（已排序） */
  comments: Comment[];
  /** 当前排序模式（SortPlugin 写入 state；无 SortPlugin 时为 defaultSortMode） */
  sortMode: SortMode;
  /** 切换排序模式（写入内核 state，触发 context 重建与列表重排） */
  setSortMode: (mode: SortMode) => void;
}

// ============ 插件钩子 ============

/**
 * 内核 9 钩子（onMount / onUnmount / onPropsChange / onError / transformProps /
 * transformData / renderOverlay / renderHeader / renderFooter）+ 评论领域 4 槽：
 *   renderToolbar（列表级顶栏：排序/计数）
 *   renderFooter（列表级底部：评论框）
 *   renderCommentActions（逐条：点赞/回复按钮，payload=comment）
 *   renderNested（逐条：楼中楼嵌套，payload=comment）
 */
export interface CommentPluginHooks<T = CommentData>
  extends PluginHooks<CommentCoreProps<T>, T> {
  /** 列表级顶栏（排序栏 / 计数 / 筛选） */
  renderToolbar?: (context: CommentPluginContext<T>) => React.ReactNode;
  /** 列表级底部（根评论框 / 加载更多） */
  renderFooter?: (context: CommentPluginContext<T>) => React.ReactNode;
  /** 逐条操作行（点赞 / 回复），payload 为当前评论 */
  renderCommentActions?: (
    context: CommentPluginContext<T>,
    comment: Comment
  ) => React.ReactNode;
  /** 逐条楼中楼嵌套区，payload 为当前评论（取其 replies） */
  renderNested?: (
    context: CommentPluginContext<T>,
    comment: Comment
  ) => React.ReactNode;
}

// ============ 插件定义 ============

/** 评论插件：在内核 Plugin 基础上把 hooks 收窄为领域钩子 */
export interface CommentPlugin<T = CommentData>
  extends Plugin<CommentCoreProps<T>, T> {
  hooks: CommentPluginHooks<T>;
}

/** 插件工厂：可调用 + 挂载 meta，供文档生成与 demo 导航使用 */
export type CommentPluginCreator<Config = any, T = CommentData> = PluginCreator<
  Config,
  CommentCoreProps<T>,
  T
>;

/** 领域槽位名（包内 renderCommentSlot 消费，复用内核排序 + priority + 错误边界） */
export type CommentSlotName =
  | "renderToolbar"
  | "renderFooter"
  | "renderCommentActions"
  | "renderNested";

export type { PluginBus, PluginDoc };
