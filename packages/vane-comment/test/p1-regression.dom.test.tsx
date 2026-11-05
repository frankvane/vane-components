import React from "react";
import { flushSync } from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommentCore, withCommentPlugins } from "../src";
import type { CommentNode, Comment } from "../src";
import { createThreadPlugin } from "../src/custom-plugins/ThreadPlugin";
import { createModerationPlugin } from "../src/custom-plugins/ModerationPlugin";
import { createRichComposerPlugin } from "../src/custom-plugins/RichComposerPlugin";
import { mount, tick, typeInto } from "./helpers";

// React 18 的 act 环境标记（与既有 selftest.dom.test.tsx 一致）
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const AUTHOR = { id: "u-test", name: "测试用户" };

function nodes(value: string): CommentNode[] {
  return [{ type: "text", value }];
}

function makeComment(
  id: string,
  value: string,
  extra: Partial<Comment> = {}
): Comment {
  return {
    id,
    author: { ...AUTHOR, name: `作者${id}` },
    content: nodes(value),
    createdAt: Date.now(),
    likeCount: 0,
    ...extra,
  };
}

/** 造一条 length 层的链式嵌套：n1 → n2 → … → n{length} */
function chain(length: number): Comment {
  let current = makeComment(`n${length}`, `L${length}`);
  for (let i = length - 1; i >= 1; i -= 1) {
    current = makeComment(`n${i}`, `L${i}`, {
      replies: [current],
      replyCount: 1,
    });
  }
  return current;
}

const itemCount = (host: HTMLElement) =>
  host.querySelectorAll('[data-testid="comment-item"]').length;

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("P1-1 · ThreadPlugin 深度递增 + maxDepth + 环检测", () => {
  it("6 层嵌套在 maxDepth=3 下只渲染 3 层回复（顶层 + 3 = 4 项）", async () => {
    const Thread = withCommentPlugins(CommentCore, [
      createThreadPlugin({ maxDepth: 3 }),
    ]);
    const t = await mount(<Thread comments={[chain(6)]} />);

    // 旧实现把 depth 写死为 1 → 6 层全部展开（7 项）且 maxDepth 完全不生效
    expect(itemCount(t.host)).toBe(4);
    expect(t.host.textContent).not.toContain("L5");
    expect(t.host.textContent).not.toContain("L6");
    t.unmount();
  });

  it("maxDepth=1 时只渲染 1 层回复", async () => {
    const Thread = withCommentPlugins(CommentCore, [
      createThreadPlugin({ maxDepth: 1 }),
    ]);
    const t = await mount(<Thread comments={[chain(4)]} />);
    expect(itemCount(t.host)).toBe(2);
    expect(t.host.textContent).not.toContain("L3");
    t.unmount();
  });

  it("自引用 replies 不会无限递归（旧实现会 RangeError 栈溢出）", async () => {
    const self = makeComment("self", "自引用");
    self.replies = [self];

    const Thread = withCommentPlugins(CommentCore, [
      createThreadPlugin({ maxDepth: 3 }),
    ]);
    const t = await mount(<Thread comments={[self]} />);
    // 顶层 + 1 层（环处截断）
    expect(itemCount(t.host)).toBe(2);
    t.unmount();
  });

  it("A→B→A 的循环 replies 在祖先命中时停止（级别继续递增）", async () => {
    const a = makeComment("a", "A");
    const b = makeComment("b", "B");
    a.replies = [b];
    b.replies = [a];

    const Thread = withCommentPlugins(CommentCore, [
      createThreadPlugin({ maxDepth: 3 }),
    ]);
    const t = await mount(<Thread comments={[a]} />);
    // A(0) → B(1) → A(2，命中祖先 id 截断)
    expect(itemCount(t.host)).toBe(3);
    t.unmount();
  });
});

describe("P1-2 · ModerationPlugin 覆盖 replies 与 text 回退", () => {
  const moderation = (words: string[]) => createModerationPlugin({ words });

  it("嵌套回复里的敏感词同样被脱敏", async () => {
    const top = makeComment("top", "正常内容", {
      replies: [makeComment("r1", "加微信领福利")],
      replyCount: 1,
    });
    const Comp = withCommentPlugins(CommentCore, [
      moderation(["加微信"]),
      createThreadPlugin(),
    ]);
    const t = await mount(<Comp comments={[top]} />);

    expect(t.host.textContent).not.toContain("加微信");
    expect(t.host.textContent).toContain("**");
    t.unmount();
  });

  it("content 为空时 text 回退路径也被脱敏", async () => {
    const c = makeComment("t1", "", { content: [], text: "广告私聊我" });
    const Comp = withCommentPlugins(CommentCore, [moderation(["广告"])]);
    const t = await mount(<Comp comments={[c]} />);

    const text = t.q(".vc-content")?.textContent ?? "";
    expect(text).not.toContain("广告");
    expect(text).toContain("**");
    t.unmount();
  });

  it("hidePending 也过滤待审 / 已删的嵌套回复", async () => {
    const top = makeComment("top", "顶层内容", {
      replies: [
        makeComment("ok", "可见回复"),
        makeComment("pending", "待审回复", { status: "pending" }),
        makeComment("deleted", "已删回复", { status: "deleted" }),
      ],
      replyCount: 3,
    });
    const Comp = withCommentPlugins(CommentCore, [
      moderation(["广告"]),
      createThreadPlugin(),
    ]);
    const t = await mount(<Comp comments={[top]} />);

    expect(t.host.textContent).toContain("可见回复");
    expect(t.host.textContent).not.toContain("待审回复");
    expect(t.host.textContent).not.toContain("已删回复");
    t.unmount();
  });

  it("循环 replies 在 transformData 内也被截断（不递归溢出）", async () => {
    const self = makeComment("s", "广告内容");
    self.replies = [self];

    const Comp = withCommentPlugins(CommentCore, [
      moderation(["广告"]),
      createThreadPlugin({ maxDepth: 3 }),
    ]);
    const t = await mount(<Comp comments={[self]} />);

    expect(itemCount(t.host)).toBe(2);
    expect(t.host.textContent).not.toContain("广告");
    t.unmount();
  });
});

describe("P1-3 · RichComposerPlugin 提交态", () => {
  it("onSubmit 抛错时保留草稿并给出失败提示", async () => {
    const onSubmit = vi.fn(() => {
      throw new Error("network down");
    });
    const Comp = withCommentPlugins(CommentCore, [createRichComposerPlugin()]);
    const t = await mount(<Comp comments={[]} onSubmit={onSubmit} />);

    typeInto(t.q("textarea") as HTMLTextAreaElement, "未发送成功的草稿");
    await tick();
    await t.click('[data-testid="composer-submit"]');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((t.q("textarea") as HTMLTextAreaElement).value).toBe(
      "未发送成功的草稿"
    );
    expect(t.q('[data-testid="composer-error"]')?.textContent).toContain(
      "发布失败"
    );
    t.unmount();
  });

  it("Promise 提交期间按钮置灰、文案切「发布中…」，且不重复提交", async () => {
    let release!: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    const Comp = withCommentPlugins(CommentCore, [createRichComposerPlugin()]);
    const t = await mount(<Comp comments={[]} onSubmit={onSubmit} />);

    typeInto(t.q("textarea") as HTMLTextAreaElement, "并发草稿");
    await tick();
    await t.click('[data-testid="composer-submit"]');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    // 旧实现没有提交态：这里仍是「发布」，草稿也已被清空
    expect(t.q('[data-testid="composer-submit"]')?.textContent?.trim()).toBe(
      "发布中…"
    );
    expect(
      (t.q('[data-testid="composer-submit"]') as HTMLButtonElement).disabled
    ).toBe(true);

    flushSync(() => {
      t.q('[data-testid="composer-submit"]')?.click();
    });
    await tick();
    expect(onSubmit).toHaveBeenCalledTimes(1);

    release();
    await tick();
    await tick();
    expect(t.q('[data-testid="composer-submit"]')?.textContent?.trim()).toBe(
      "发布"
    );
    expect((t.q("textarea") as HTMLTextAreaElement).value).toBe("");
    t.unmount();
  });
});
