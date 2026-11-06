import type {
  CommentData,
  CommentPlugin,
  CommentPluginContext,
  Comment,
  CommentNode,
} from "../../components/CommentPlugin/plugins/types";
import doc from "./doc.json";

export interface ModerationPluginConfig {
  /** 敏感词集合，命中替换为 **，默认 ["傻逼","广告","加微信","加我"] */
  words?: string[];
  /** 是否过滤待审 / 已删评论（默认 true） */
  hidePending?: boolean;
}

const DEFAULT_WORDS = ["傻逼", "广告", "加微信", "加我"];

/** 文本脱敏：命中敏感词替换为 ** */
function maskText(value: string, words: string[]): string {
  let v = value;
  for (const w of words) {
    if (w && v.includes(w)) v = v.split(w).join("**");
  }
  return v;
}

/** 把文本节点中的敏感词替换为 ** */
function maskNodes(nodes: CommentNode[], words: string[]): CommentNode[] {
  return nodes.map((n) => {
    if (n.type === "text") {
      return { ...n, value: maskText(n.value, words) };
    }
    return n;
  });
}

const EMPTY_SEEN: ReadonlySet<string> = new Set();

/**
 * 递归脱敏单条评论：content（结构化富内容）+ text（纯文本回退）+ replies（楼中楼）。
 * 回退路径也必须脱敏——CommentCore / ThreadPlugin 在 content 为空时直接渲染 text，
 * 只处理 content 等于给历史数据与简化接入留了一道审核旁路。
 * `seen` 为祖先 id 集合：循环 replies 时断开子树，避免 transformData 自身无限递归。
 */
function maskComment(
  comment: Comment,
  words: string[],
  hidePending: boolean,
  seen: ReadonlySet<string>
): Comment {
  const next: Comment = {
    ...comment,
    content: maskNodes(comment.content ?? [], words),
  };
  if (typeof comment.text === "string") {
    next.text = maskText(comment.text, words);
  }
  const replies = comment.replies;
  if (!replies || replies.length === 0) return next;
  if (seen.has(comment.id)) {
    // 环检测：同一 id 已在祖先链里出现过，断开引用防止无限递归
    next.replies = undefined;
    return next;
  }
  const path = new Set(seen);
  path.add(comment.id);
  next.replies = replies
    .filter(
      (r) => !hidePending || (r.status !== "pending" && r.status !== "deleted")
    )
    .map((r) => maskComment(r, words, hidePending, path));
  return next;
}

/**
 * ModerationPlugin - 审核：经 transformData 屏蔽敏感词（替换为 **）并过滤待审/已删评论。
 *
 * 泛型默认值收敛为 CommentData（真实领域数据类型）；自定义 data 形态的调用方请显式写泛型参数。
 */
export function createModerationPlugin<T = CommentData>(
  config: ModerationPluginConfig = {}
): CommentPlugin<T> {
  const words = config.words ?? DEFAULT_WORDS;
  const hidePending = config.hidePending ?? true;
  return {
    name: "ModerationPlugin",
    version: "0.1.0",
    description:
      "审核：经 transformData 屏蔽敏感词（替换为 **）并过滤待审/已删评论（hidePending 默认开）。",
    priority: 14,
    enabled: true,
    hooks: {
      transformData: (context: CommentPluginContext<T>, data: T): T => {
        if (!Array.isArray(data)) return data;
        let arr = data as Comment[];
        if (hidePending)
          arr = arr.filter(
            (c) => c.status !== "pending" && c.status !== "deleted"
          );
        return arr.map((c) =>
          maskComment(c, words, hidePending, EMPTY_SEEN)
        ) as unknown as T;
      },
    },
  };
}

export { doc };
