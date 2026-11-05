import React from "react";
import { flushSync } from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommentCore, withCommentPlugins } from "../src";
import type { CommentNode, Comment, CommentPlugin } from "../src";
import { createModerationPlugin } from "../src/custom-plugins/ModerationPlugin";
import { createPinPlugin } from "../src/custom-plugins/PinPlugin";
import { createFavoritePlugin } from "../src/custom-plugins/FavoritePlugin";
import { createCopyPlugin } from "../src/custom-plugins/CopyPlugin";
import { createSharePlugin } from "../src/custom-plugins/SharePlugin";
import { createLikePlugin } from "../src/custom-plugins/LikePlugin";
import { createRichComposerPlugin } from "../src/custom-plugins/RichComposerPlugin";
import { fileOf, mount, mountSync, tick } from "./helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const AUTHOR = { id: "u-test", name: "测试用户" };
const clipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);

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

/** 极简第三方插件：只挂一个 transformData / renderToolbar，用于观测流水线 */
function spyPlugin(hooks: Record<string, unknown>): CommentPlugin {
  return { name: "SpyPlugin", hooks } as unknown as CommentPlugin;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  } else {
    delete (navigator as unknown as Record<string, unknown>).clipboard;
  }
});

describe("P2-1 / P2-2 · 流水线缓存与 context.data 口径", () => {
  it("CM-P2-1 · 同一评论数组连续渲染不再重复跑 transformData", async () => {
    const comments = [makeComment("c1", "memo")];
    const spy = vi.fn((_ctx: unknown, data: unknown) => data);
    const Comp = withCommentPlugins(CommentCore, [
      spyPlugin({ transformData: spy }),
    ]);

    function Host() {
      const [n, setN] = React.useState(0);
      return (
        <div>
          <button data-testid="bump" onClick={() => setN((v) => v + 1)}>
            {n}
          </button>
          <Comp comments={comments} />
        </div>
      );
    }

    const t = await mount(<Host />);
    expect(spy).toHaveBeenCalledTimes(1);

    // 父级 state 变化 → WithPlugins 重渲染（props 对象变了，但 comments 引用没变）
    await t.click('[data-testid="bump"]');
    expect(spy).toHaveBeenCalledTimes(1);
    t.unmount();
  });

  it("CM-P2-2 · context.data 与 comments 一致（已过滤 + 已脱敏的可见列表）", async () => {
    let seenData: Comment[] | null = null;
    const capture = spyPlugin({
      renderToolbar: (ctx: { data?: Comment[]; comments?: Comment[] }) => {
        seenData = (ctx.data ?? ctx.comments ?? []).slice();
        return null;
      },
    });

    const c1 = makeComment("c1", "广告内容");
    const c2 = makeComment("c2", "待审内容", { status: "pending" });
    const Comp = withCommentPlugins(CommentCore, [
      createModerationPlugin({ words: ["广告"] }),
      capture,
    ]);
    const t = await mount(<Comp comments={[c1, c2]} />);

    expect(seenData).not.toBeNull();
    // 旧实现里 context.data 是原始列表（含 pending、含未脱敏文本）
    expect(seenData!.map((c) => c.id)).toEqual(["c1"]);
    expect(JSON.stringify(seenData![0].content)).not.toContain("广告");
    t.unmount();
  });
});

describe("P2-3 · Pin / Favorite 跟随 props 同步", () => {
  it("置顶 / 收藏按钮以 props 为唯一事实来源（刷新后回正）", async () => {
    const pinned = makeComment("p1", "置顶评论", {
      pinned: true,
      favorited: true,
    });
    const Comp = withCommentPlugins(CommentCore, [
      createPinPlugin(),
      createFavoritePlugin(),
    ]);
    const t = await mount(<Comp comments={[pinned]} />);

    expect(t.q('[data-testid="comment-pin"]')?.textContent?.trim()).toBe(
      "📌取消置顶"
    );
    expect(t.q('[data-testid="comment-favorite"]')?.textContent?.trim()).toBe(
      "★已收藏"
    );

    // 服务端拒绝 / 列表刷新：props 回传未置顶、未收藏
    t.render(
      <Comp comments={[{ ...pinned, pinned: false, favorited: false }]} />
    );
    expect(t.q('[data-testid="comment-pin"]')?.textContent?.trim()).toBe(
      "📌置顶"
    );
    expect(t.q('[data-testid="comment-favorite"]')?.textContent?.trim()).toBe(
      "☆收藏"
    );
    t.unmount();
  });
});

describe("P2-4 · 复制 / 分享的真实成功语义", () => {
  it("剪贴板写入失败时提示「复制失败」而不是「已复制」", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });

    const Comp = withCommentPlugins(CommentCore, [
      createCopyPlugin(),
      createSharePlugin(),
    ]);
    const t = await mount(<Comp comments={[makeComment("c1", "复制我")]} />);

    await t.click('[data-testid="comment-copy"]');
    expect(t.q('[data-testid="comment-copy"]')?.textContent?.trim()).toBe(
      "复制失败"
    );

    await t.click('[data-testid="comment-share"]');
    expect(t.q('[data-testid="comment-share"]')?.textContent?.trim()).toBe(
      "复制失败"
    );
    t.unmount();
  });
});

describe("P2-5 · 点赞爆裂动画定时器生命周期", () => {
  it("点赞后产生的定时器随卸载清理（旧实现泄漏）", () => {
    vi.useFakeTimers();
    const Comp = withCommentPlugins(CommentCore, [createLikePlugin()]);
    const t = mountSync(<Comp comments={[makeComment("c1", "点赞")]} />);

    flushSync(() => {
      t.q('[data-testid="comment-like"]')?.click();
    });
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    t.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("P2-6 · 相对时间自动刷新", () => {
  it("常驻页面里「刚刚」会在下一分钟变为「1 分钟前」", () => {
    const NOW = 1_700_000_000_000;
    vi.useFakeTimers({ now: NOW });

    const c = makeComment("c1", "时间文案", { createdAt: NOW - 59_000 });
    const Comp = withCommentPlugins(CommentCore, []);
    const t = mountSync(<Comp comments={[c]} />);
    const label = () => t.q(".vc-meta")?.textContent ?? "";

    expect(label()).toContain("刚刚");

    // 旧实现没有任何时间驱动，这里永远停在「刚刚」
    flushSync(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(label()).toContain("1 分钟前");

    t.unmount();
  });
});

describe("P2-7 · 富编辑图片校验", () => {
  it("类型白名单 / 体积上限拦截，且 accept 收窄为白名单", async () => {
    const Comp = withCommentPlugins(CommentCore, [createRichComposerPlugin()]);
    const t = await mount(<Comp comments={[]} />);

    const input = t.q('input[type="file"]') as HTMLInputElement;
    expect(input.getAttribute("accept")).toBe(
      "image/jpeg,image/png,image/gif,image/webp"
    );

    // 非图片 MIME（改扩展名 / 拖拽可绕过选择器）
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [fileOf("note.txt", "text/plain")],
    });
    flushSync(() => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await tick();
    expect(t.q('[data-testid="composer-error"]')?.textContent).toContain(
      "不支持"
    );
    expect(t.host.querySelectorAll("img").length).toBe(0);

    // 体积超限（默认 5MB）
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [fileOf("big.png", "image/png", 6 * 1024 * 1024)],
    });
    flushSync(() => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await tick();
    expect(t.q('[data-testid="composer-error"]')?.textContent).toContain("5MB");
    expect(t.host.querySelectorAll("img").length).toBe(0);

    t.unmount();
  });
});
