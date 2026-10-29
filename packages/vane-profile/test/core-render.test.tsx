import { describe, it, expect } from "vitest";
import { renderProfile, flush } from "./helpers";
import { createBannerSlotPlugin } from "../src/custom-plugins/BannerSlotPlugin";
import { createStatRowPlugin } from "../src/custom-plugins/StatRowPlugin";
import { createVerifyBadgePlugin } from "../src/custom-plugins/VerifyBadgePlugin";
import { createFollowEchoPlugin } from "../src/custom-plugins/FollowEchoPlugin";

describe("ProfileCore 三段式布局壳", () => {
  it("无插件时渲染骨架且不崩溃（头图区/数据行区/内容区齐备）", async () => {
    const h = renderProfile([]);
    await flush();
    expect(h.container.querySelector(".vp-profile")).toBeTruthy();
    expect(h.container.querySelector(".vp-banner-area")).toBeTruthy();
    expect(h.container.querySelector(".vp-meta-area")).toBeTruthy();
    expect(h.container.querySelector(".vp-content-area")).toBeTruthy();
    h.unmount();
  });

  it("BannerSlot 渲染头图区并应用配置高度", async () => {
    const h = renderProfile([createBannerSlotPlugin({ height: 120 })]);
    await flush();
    const banner = h.container.querySelector(".vp-banner") as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.style.height).toBe("120px");
    h.unmount();
  });

  it("StatRow 渲染指标（值 + 标签）", async () => {
    const h = renderProfile([
      createStatRowPlugin({
        items: [
          { value: 128, label: "关注" },
          { value: "1.2w", label: "粉丝" },
        ],
      }),
    ]);
    await flush();
    expect(h.container.textContent).toContain("关注");
    expect(h.container.textContent).toContain("粉丝");
    expect(h.container.textContent).toContain("128");
    expect(h.container.textContent).toContain("1.2w");
    h.unmount();
  });

  it("VerifyBadge 受 verified 控制显隐（institution 文案不同）", async () => {
    const off = renderProfile([createVerifyBadgePlugin()], { verified: false });
    await flush();
    expect(off.container.querySelector(".vp-badge")).toBeNull();
    off.unmount();

    const on = renderProfile(
      [createVerifyBadgePlugin()],
      { verified: true, badgeType: "institution" }
    );
    await flush();
    expect(on.container.querySelector(".vp-badge")).toBeTruthy();
    expect(on.container.textContent).toContain("机构认证");
    on.unmount();
  });

  it("FollowEcho 按 followState 渲染对应文案", async () => {
    const h = renderProfile(
      [createFollowEchoPlugin()],
      { followState: "following" }
    );
    await flush();
    const btn = h.container.querySelector(
      ".vp-follow-area button"
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe("已关注");
    h.unmount();
  });

  it("单个插件渲染抛错被隔离，其余槽位照常渲染（PluginErrorBoundary 行为）", async () => {
    const boom = createBannerSlotPlugin();
    boom.hooks.renderBannerArea = () => {
      throw new Error("boom");
    };
    const h = renderProfile([
      boom,
      createStatRowPlugin({ items: [{ value: 1, label: "作品" }] }),
    ]);
    await flush();
    // banner 区因抛错为空，但 statRow 仍渲染
    expect(h.container.querySelector(".vp-banner")).toBeNull();
    expect(h.container.textContent).toContain("作品");
    h.unmount();
  });
});
