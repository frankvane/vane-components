import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { CommentCore, withCommentPlugins } from "../../../src";
import { createLikePlugin } from "../../../src/custom-plugins/LikePlugin";
import { createSortPlugin } from "../../../src/custom-plugins/SortPlugin";
import { createThreadPlugin } from "../../../src/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "../../../src/custom-plugins/RichComposerPlugin";
import type { Comment, CommentNode, SortMode } from "../../../src";
import { MENTIONS, freshComments } from "../data/sample";
import { auditComment } from "./audit-comment";

/**
 * 浏览器内自测（?selftest=1）
 *
 * 为什么需要它：本仓库的浏览器工具链（截图 / DOM 快照）在部分环境下不可用，
 * 靠肉眼看截图也验不出「点赞到底有没有 +1」「排序是否真的生效」。这里把断言搬进真实浏览器：
 * 挂载真实组件 → 派发真实点击 → 读真实 DOM，结果写进 document.title 供外部读取。
 */
const ME = { id: "u-me", name: "我", avatar: undefined };

/** 受控 Harness：自带 comments 状态，onLike/onReply/onSubmit 真的改它并重渲染 */
function Harness({ sortMode }: { sortMode?: SortMode }) {
  const [comments, setComments] = React.useState<Comment[]>(() => freshComments());

  const onLike = React.useCallback((id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likeCount: (c.likeCount ?? 0) + (c.liked ? -1 : 1) }
          : c
      )
    );
  }, []);
  const onReply = React.useCallback((parentId: string, content: CommentNode[]) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? {
              ...c,
              replies: [
                { id: `${parentId}-r${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
                ...(c.replies ?? []),
              ],
              replyCount: (c.replyCount ?? 0) + 1,
            }
          : c
      )
    );
  }, []);
  const onSubmit = React.useCallback((content: CommentNode[]) => {
    setComments((prev) => [
      { id: `c-${Date.now()}`, author: ME, content, createdAt: Date.now(), likeCount: 0, liked: false },
      ...prev,
    ]);
  }, []);

  const Comment = React.useMemo(
    () =>
      withCommentPlugins(CommentCore, [
        createLikePlugin(),
        createSortPlugin({ modes: ["newest", "oldest", "hottest", "mostLiked"], defaultMode: "newest" }),
        createThreadPlugin({ maxDepth: 3 }),
        createRichComposerPlugin({ features: { emoji: true, image: true, mention: true } }),
      ]),
    []
  );

  return (
    <Comment
      comments={comments}
      defaultSortMode={sortMode ?? "newest"}
      onLike={onLike}
      onReply={onReply}
      onSubmit={onSubmit}
      onReport={() => {}}
      mentions={MENTIONS}
    />
  );
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

async function mount(ui: React.ReactElement) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:0;top:0;width:520px;background:#fff";
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => root.render(ui));
  await tick();
  return {
    host,
    root,
    q: (sel: string) => host.querySelector(sel) as HTMLElement | null,
    qa: (sel: string) => Array.from(host.querySelectorAll<HTMLElement>(sel)),
    click: async (sel: string) => {
      const el = host.querySelector(sel) as HTMLElement | null;
      if (!el) throw new Error(`找不到元素 ${sel}`);
      flushSync(() => el.click());
      await tick();
    },
  };
}

/** 顶层评论项（排除嵌套回复）的作者名列表 */
function topAuthors(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll<HTMLElement>('[data-testid="comment-item"]'))
    .filter((el) => !el.parentElement?.closest('[data-testid="comment-item"]'))
    .map((el) => el.querySelector(".vc-meta span")?.textContent?.trim() ?? "");
}

export interface SelfTestResult {
  total: number;
  passed: number;
  failed: string[];
}

export async function runSelfTest(): Promise<SelfTestResult> {
  const failed: string[] = [];
  let total = 0;
  const ok = (name: string, cond: boolean) => {
    total += 1;
    // 同步写入计数：卡住时能看出停在第几项
    document.title = `SELFTEST RUNNING ${total}`;
    if (!cond) failed.push(name);
  };

  // ---- 1. 渲染 / 楼中楼 / 富编辑 / 几何 ----
  {
    const t = await mount(<Harness sortMode="newest" />);

    const top = topAuthors(t.host);
    ok("渲染：顶层评论项 = 5", top.length === 5);

    const allItems = t.qa('[data-testid="comment-item"]');
    const nested = allItems.filter(
      (el) => !!el.parentElement?.closest('[data-testid="comment-item"]')
    );
    ok("楼中楼：含嵌套回复（≥2）", nested.length >= 2);

    ok("富编辑：渲染评论框 textarea", !!t.q("textarea"));

    ok(
      "几何体检：评论项无越界/负坐标/零尺寸/重叠",
      auditComment(t.host).problems.length === 0
    );
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 2. 点赞 ----
  {
    const t = await mount(<Harness sortMode="newest" />);
    const btn = t.q('[data-testid="comment-like"]');
    ok("点赞：首个评论项渲染点赞按钮", !!btn);
    const before = btn?.textContent?.trim() ?? "";
    await t.click('[data-testid="comment-like"]');
    const after = t.q('[data-testid="comment-like"]')?.textContent?.trim() ?? "";
    ok(`点赞：点击后计数变化（${before} → ${after}）`, before !== after && after !== "");
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 3. 排序：newest 最新在前 / oldest 最早在前 ----
  {
    const newest = await mount(<Harness sortMode="newest" />);
    ok("排序 newest：首条为最新（Monica）", topAuthors(newest.host)[0] === "Monica");
    flushSync(() => newest.root.unmount());
    newest.host.remove();

    const oldest = await mount(<Harness sortMode="oldest" />);
    ok("排序 oldest：首条为最早（Ross）", topAuthors(oldest.host)[0] === "Ross");
    flushSync(() => oldest.root.unmount());
    oldest.host.remove();
  }

  return { total, passed: total - failed.length, failed };
}

/** 供 main.tsx 调用：跑完把结论写进 document.title，便于外部（无截图时）读取 */
export async function runSelfTestToTitle(): Promise<void> {
  // 先落一个「已启动」标记：便于区分「根本没跑」与「跑了一半卡住」
  document.title = "SELFTEST RUNNING";
  try {
    const r = await runSelfTest();
    document.title =
      r.failed.length === 0
        ? `SELFTEST OK ${r.passed}/${r.total}`
        : `SELFTEST FAIL ${r.passed}/${r.total} :: ${r.failed.join(" | ")}`;
  } catch (e) {
    document.title = `SELFTEST ERROR :: ${(e as Error).message}`;
  }
}
