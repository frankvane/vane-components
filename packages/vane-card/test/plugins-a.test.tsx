/**
 * C3.1 · A 级 9 个插件冒烟（近零改动，逐个确认「真的渲染出来」）
 *
 * 每个用例只做两件事：装进真实插件链 → 断言它产出可见结果。
 * 之前这 9 个插件里的 Gallery/Video/Coupon/Actions/Hover/Responsive
 * 从未在新内核下跑过（旧 demo 指向 npm 1.0.8），这里补上第一道门。
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createBadgePlugin,
  createUserTagPlugin,
  createHoverPlugin,
  createVideoPlugin,
  createGalleryPlugin,
  createResponsivePlugin,
  createCouponPlugin,
  createActionsPlugin,
  createReviewPlugin,
} from "../src/components/CardPlugin/custom-plugins";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import { renderCard, installObservers, flush } from "./helpers";

beforeEach(() => {
  installObservers();
});

const card = (plugins: CardPlugin[], data: Record<string, unknown> = {}) =>
  renderCard(plugins, { data });

describe("A 级插件在真实插件链下渲染", () => {
  it("BadgePlugin：config 文案优先，角标可见", async () => {
    const { container } = card([createBadgePlugin({ text: "甄选", type: "premium" })]);
    await flush();
    expect(container.textContent).toContain("甄选");
  });

  it("BadgePlugin：config 无文案时回落到 data.badge；都没有则不渲染", async () => {
    const withData = card([createBadgePlugin()], { badge: "限时", badgeType: "sale" });
    await flush();
    expect(withData.container.textContent).toContain("限时");

    const empty = card([createBadgePlugin()]);
    await flush();
    expect(empty.container.textContent?.trim()).toBe("");
  });

  it("UserTagPlugin：标签渲染并受 maxTags 截断", async () => {
    const p = createUserTagPlugin({
      tags: [{ label: "A" }, { label: "B" }, { label: "C" }],
      maxTags: 2,
    });
    const { container } = card([p]);
    await flush();
    const text = container.textContent ?? "";
    expect(text).toContain("A");
    expect(text).toContain("B");
    expect(text).not.toContain("C");
  });

  it("HoverPlugin：transformProps 注入 pointer 光标与过渡", async () => {
    const { container } = card([createHoverPlugin()]);
    await flush();
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.style.cursor).toBe("pointer");
    expect(el.style.transition).toContain("0.3s");
  });

  it("VideoPlugin：渲染 video 并写入 src", async () => {
    const { container } = card([createVideoPlugin({ src: "/demo.mp4" })]);
    await flush();
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.querySelector("source")?.getAttribute("src")).toBe("/demo.mp4");
  });

  it("GalleryPlugin：多图渲染出图片节点", async () => {
    const { container } = card([createGalleryPlugin({ images: ["/a.jpg", "/b.jpg", "/c.jpg"] })]);
    await flush();
    expect(container.querySelectorAll("img").length).toBeGreaterThan(0);
  });

  it("ResponsivePlugin：窄容器写 data-layout=vertical（happy-dom 宽度为 0）", async () => {
    const { container } = card([createResponsivePlugin()]);
    await flush();
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.getAttribute("data-layout")).toBe("vertical");
  });

  it("CouponPlugin：券列表可见，无券时不渲染页脚", async () => {
    const { container } = card([
      createCouponPlugin({ coupons: [{ code: "NEW10", discount: 10 }] }),
    ]);
    await flush();
    expect(container.textContent).toContain("可用优惠券");
    expect(container.textContent).toContain("NEW10");

    const none = card([createCouponPlugin({ coupons: [] })]);
    await flush();
    expect(none.container.textContent?.trim()).toBe("");
  });

  it("ActionsPlugin：两个按钮都在", async () => {
    const { container } = card([createActionsPlugin()]);
    await flush();
    expect(container.textContent).toContain("加入购物车");
    expect(container.textContent).toContain("加入心愿单");
  });

  it("ReviewPlugin：评分按一位小数展示，评价数带单位", async () => {
    const { container } = card([createReviewPlugin()], { rating: 4.6, ratingCount: 128 });
    await flush();
    expect(container.textContent).toContain("4.6");
    expect(container.textContent).toContain("128 评价");
  });
});
