import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { CommentCore, withCommentPlugins } from "../../../src";
import { createLikePlugin } from "../../../src/custom-plugins/LikePlugin";
import { createSortPlugin } from "../../../src/custom-plugins/SortPlugin";
import { createThreadPlugin } from "../../../src/custom-plugins/ThreadPlugin";
import { createRichComposerPlugin } from "../../../src/custom-plugins/RichComposerPlugin";
import { createReportPlugin } from "../../../src/custom-plugins/ReportPlugin";
import { createSharePlugin } from "../../../src/custom-plugins/SharePlugin";
import { createCopyPlugin } from "../../../src/custom-plugins/CopyPlugin";
import { createReactionPlugin } from "../../../src/custom-plugins/ReactionPlugin";
import { createFavoritePlugin } from "../../../src/custom-plugins/FavoritePlugin";
import { createPinPlugin } from "../../../src/custom-plugins/PinPlugin";
import { createLocationPlugin } from "../../../src/custom-plugins/LocationPlugin";
import { createTimestampPlugin } from "../../../src/custom-plugins/TimestampPlugin";
import { createCountPlugin } from "../../../src/custom-plugins/CountPlugin";
import { createFilterPlugin } from "../../../src/custom-plugins/FilterPlugin";
import { createSearchPlugin } from "../../../src/custom-plugins/SearchPlugin";
import { createModerationPlugin } from "../../../src/custom-plugins/ModerationPlugin";
import { createLoginPromptPlugin } from "../../../src/custom-plugins/LoginPromptPlugin";
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
        createReportPlugin(),
        createSharePlugin(),
        createCopyPlugin(),
        createReactionPlugin(),
        createFavoritePlugin(),
        createPinPlugin(),
        createLocationPlugin(),
        createTimestampPlugin(),
        createCountPlugin(),
        createFilterPlugin(),
        createSearchPlugin(),
        createLoginPromptPlugin(),
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
      onFavorite={() => {}}
      onPin={() => {}}
      onReact={() => {}}
      onLogin={() => {}}
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

  // ---- 4. 新插件渲染（逐条操作行 + 顶栏 + 底部） ----
  {
    const t = await mount(<Harness sortMode="newest" />);
    ok("新插件：举报按钮渲染", !!t.q('[data-testid="comment-report"]'));
    ok("新插件：分享按钮渲染", !!t.q('[data-testid="comment-share"]'));
    ok("新插件：复制按钮渲染", !!t.q('[data-testid="comment-copy"]'));
    ok("新插件：多表情反应渲染", !!t.q('[data-testid="comment-reaction"]'));
    ok("新插件：收藏按钮渲染", !!t.q('[data-testid="comment-favorite"]'));
    ok("新插件：置顶按钮渲染", !!t.q('[data-testid="comment-pin"]'));
    ok("新插件：绝对时间渲染", !!t.q('[data-testid="comment-timestamp"]'));
    ok("新插件：计数条渲染（含「条评论」）", (t.q('[data-testid="comment-count"]')?.textContent ?? "").includes("条评论"));
    ok("新插件：筛选栏渲染", !!t.q('[data-testid="comment-filter"]'));
    ok("新插件：搜索框渲染", !!t.q('[data-testid="comment-search"]'));
    ok("新插件：未登录引导渲染", !!t.q('[data-testid="comment-login-prompt"]'));
    flushSync(() => t.root.unmount());
    t.host.remove();
  }

  // ---- 5. 数据级插件：Moderation 脱敏 + Location 展示 ----
  {
    const modComments: Comment[] = [
      {
        id: "m1",
        author: { id: "a", name: "A" },
        content: [{ type: "text", value: "这是一段广告内容请加微信" }],
        createdAt: Date.now(),
        likeCount: 0,
      },
    ];
    const ModComment = withCommentPlugins(CommentCore, [
      createModerationPlugin({ words: ["广告", "加微信"] }),
    ]);
    const t = await mount(<ModComment comments={modComments} />);
    const txt = t.q(".vc-content")?.textContent ?? "";
    ok("审核：敏感词被脱敏（广告/加微信 不再出现）", !txt.includes("广告") && !txt.includes("加微信"));
    flushSync(() => t.root.unmount());
    t.host.remove();

    const locComments: Comment[] = [
      {
        id: "l1",
        author: { id: "a", name: "A" },
        content: [{ type: "text", value: "好店推荐" }],
        createdAt: Date.now(),
        likeCount: 0,
        location: "上海",
      },
    ];
    const LocComment = withCommentPlugins(CommentCore, [createLocationPlugin()]);
    const t2 = await mount(<LocComment comments={locComments} />);
    ok("地理位置：含 location 时渲染 📍 标", !!t2.q('[data-testid="comment-location"]'));
    flushSync(() => t2.root.unmount());
    t2.host.remove();
  }

  // ---- 6. 操作行布局：不再把按钮压成竖排（flex-wrap + 子项 flex-shrink:0） ----
  {
    const t = await mount(<Harness sortMode="newest" />);
    const actions = t.qa(".vc-actions");
    ok("布局：存在操作行容器 .vc-actions", actions.length > 0);
    ok(
      "布局：操作行开启 flex-wrap（避免按钮挤成竖排）",
      actions.every((el) => (el.style.flexWrap || "").toLowerCase() === "wrap")
    );
    // 每个操作行里的直接子节点都应显式 flex-shrink:0，否则 CJK 文字会被压成逐字竖排
    const allKids = actions.reduce((n, el) => n + el.children.length, 0);
    const shrunkKids = actions.reduce(
      (n, el) =>
        n +
        Array.from(el.children).filter(
          (c) => (c as HTMLElement).style.flexShrink === "0"
        ).length,
      0
    );
    ok("布局：操作行子项均 flex-shrink:0（不挤压）", allKids > 0 && shrunkKids === allKids);
    flushSync(() => t.root.unmount());
    t.host.remove();
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
