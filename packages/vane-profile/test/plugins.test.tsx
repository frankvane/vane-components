import { describe, it, expect } from "vitest";
import { act } from "react";
import { renderProfile, flush } from "./helpers";
import { useProfileContext } from "../src/index";
import { createTabSyncPlugin } from "../src/custom-plugins/TabSyncPlugin";
import { createFollowEchoPlugin } from "../src/custom-plugins/FollowEchoPlugin";
import { createBannerSlotPlugin } from "../src/custom-plugins/BannerSlotPlugin";

/** 内容区子组件：经 useProfileContext 订阅 activeTab */
function Content() {
  const ctx = useProfileContext();
  return <div data-testid="content">{ctx?.activeTab ?? "none"}</div>;
}

const tabs = [
  { id: "works", label: "作品" },
  { id: "feeds", label: "动态" },
];

describe("TabSync 页签联动（核心机制）", () => {
  it("渲染所有页签按钮", async () => {
    const h = renderProfile([createTabSyncPlugin({ tabs })], {
      children: <Content />,
    });
    await flush();
    const buttons = h.container.querySelectorAll(".vp-tab-bar-inner button");
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe("作品");
    h.unmount();
  });

  it("点击页签 → setActiveTab → 内容区经 useProfileContext 联动重渲染", async () => {
    const h = renderProfile([createTabSyncPlugin({ tabs })], {
      children: <Content />,
    });
    await flush();
    expect(
      h.container.querySelector('[data-testid="content"]')?.textContent
    ).toBe("none");

    const buttons = h.container.querySelectorAll(".vp-tab-bar-inner button");
    await act(async () => {
      (buttons[1] as HTMLButtonElement).click();
    });
    await flush();

    expect(
      h.container.querySelector('[data-testid="content"]')?.textContent
    ).toBe("feeds");
    h.unmount();
  });

  it("onTabChange 回调收到 (newTab, oldTab)", async () => {
    let captured: [string | null, string | null] | null = null;
    const h = renderProfile(
      [
        createTabSyncPlugin({
          tabs,
          onChange: (id, old) => {
            captured = [id, old];
          },
        }),
      ],
      { children: <Content /> }
    );
    await flush();
    const buttons = h.container.querySelectorAll(".vp-tab-bar-inner button");
    await act(async () => {
      (buttons[1] as HTMLButtonElement).click();
    });
    await flush();
    // 初始 activeTab 为 null，old 应为 null 而非 "none"
    expect(captured).toEqual(["feeds", null]);
    h.unmount();
  });
});

describe("FollowEcho onPropsChange", () => {
  it("followState 由非 mutual 变为 mutual 时触发 onMutual", async () => {
    let mutualFired: string | null = null;
    const h = renderProfile(
      [createFollowEchoPlugin({ onMutual: (n) => (mutualFired = n) })],
      { followState: "following" }
    );
    await flush();
    await h.rerender({ followState: "mutual" });
    expect(mutualFired).toBe("mutual");
    h.unmount();
  });
});

describe("插件 meta 契约（PluginCreator）", () => {
  it("工厂挂载 .meta（name 与目录一致）", () => {
    expect((createBannerSlotPlugin as any).meta?.name).toBe("BannerSlot");
    expect((createTabSyncPlugin as any).meta?.name).toBe("TabSync");
  });

  it("子路径工厂可独立引入且功能一致", async () => {
    const h = renderProfile([createBannerSlotPlugin({ cover: "x" })]);
    await flush();
    expect(h.container.querySelector(".vp-banner")).toBeTruthy();
    h.unmount();
  });
});
