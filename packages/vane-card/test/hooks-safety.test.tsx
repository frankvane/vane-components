/**
 * hooks 安全回归
 *
 * 迁移前两个插件把 hook 写进了「渲染期间被调用的普通函数」里：
 *  - CountdownPlugin.renderOverlay 里 React.useMemo 生成组件
 *  - ReviewPlugin.renderFooter 里 React.useState 管评分/评论
 * 这些 hook 会挂到父组件（CardCore）的 hook 链上：插槽里有没有插件、
 * 插件启停都会改变 hook 数量 → "Rendered more hooks than during the previous render"。
 *
 * 修法是把它们抽成模块级组件。规则本身由 eslint 的 react-hooks/rules-of-hooks
 * 兜底（改回旧写法会直接报 error，闸门不允许 --quiet 之外的红灯）；下面的用例
 * 补的是行为面：组件被正确挂载、内容真的渲染、父级重渲染时不丢不炸。
 */
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import type { CardPlugin } from "../src/components/CardPlugin/plugins/types";
import {
  createCountdownPlugin,
  createReviewPlugin,
} from "../src/custom-plugins";
import { renderCard, installObservers, flush } from "./helpers";

beforeEach(() => {
  installObservers();
});

describe("插件渲染函数里的 hook 必须被隔离在独立组件内", () => {
  it("CountdownPlugin：渲染出倒计时文本，且父级重渲染不重置/不抛错", async () => {
    const plugins: CardPlugin[] = [
      createCountdownPlugin({ durationMs: 90 * 60 * 1000, prefix: "⏰" }),
    ];
    const { container, rerender } = renderCard(plugins);
    await flush();

    const before = container.textContent ?? "";
    expect(before).toMatch(/⏰\s+\d{2}:\d{2}:\d{2}/);

    // 换 data 触发父级重渲染：倒计时组件身份稳定，不应抛错、文本仍在
    await rerender({ data: { price: 42 } });
    const after = container.textContent ?? "";
    expect(after).toMatch(/⏰\s+\d{2}:\d{2}:\d{2}/);
  });

  it("ReviewPlugin：enableUserReview 渲染评分输入区，父级重渲染不抛错", async () => {
    const plugins: CardPlugin[] = [
      createReviewPlugin({
        showRating: true,
        showReviewCount: true,
        enableUserReview: true,
      }),
    ];
    const { container, rerender } = renderCard(plugins, {
      data: { rating: 4.5, ratingCount: 12 },
    });
    await flush();

    expect(container.textContent).toContain("4.5");
    expect(container.textContent).toContain("12 评价");
    expect(container.querySelector("textarea")).not.toBeNull();

    await rerender({ data: { rating: 4.5, ratingCount: 13 } });
    expect(container.textContent).toContain("13 评价");
    expect(container.querySelector("textarea")).not.toBeNull();
  });

  it("两个插件同槽共存：overlay 与 footer 互不干扰", async () => {
    const plugins: CardPlugin[] = [
      createCountdownPlugin({ durationMs: 60 * 1000 }),
      createReviewPlugin({ enableUserReview: false }),
    ];
    const { container } = renderCard(plugins, { data: { rating: 3 } });
    await flush();

    expect(container.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(container.textContent).toContain("3.0");
    expect(container.querySelector(".card-core")).not.toBeNull();
  });
});
