/**
 * 回归测试：tasks/41 评审报告的 P1 × 5 + P2 × 8 修复项。
 * 每条用例都对应「修复前会失败 / 修复后才成立」的行为。
 */
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { renderProfile, flush } from "./helpers";
import { useProfileContext } from "../src/index";
import { renderProfileSlot } from "../src/components/ProfilePlugin/plugins/slots";
import {
  safeHref,
  cssImageUrl,
} from "../src/components/ProfilePlugin/plugins/safe-url";
import type { ProfilePlugin } from "../src/components/ProfilePlugin/plugins/types";
import { createFollowEchoPlugin } from "../src/custom-plugins/FollowEchoPlugin";
import { createTabSyncPlugin } from "../src/custom-plugins/TabSyncPlugin";
import { createWorksGridPlugin } from "../src/custom-plugins/WorksGridPlugin";
import { createBannerSlotPlugin } from "../src/custom-plugins/BannerSlotPlugin";
import { createSocialLinksPlugin } from "../src/custom-plugins/SocialLinksPlugin";
import { createStatRowPlugin } from "../src/custom-plugins/StatRowPlugin";
import { createQRSharePlugin } from "../src/custom-plugins/QRSharePlugin";

const tabs = [
  { id: "works", label: "作品" },
  { id: "feeds", label: "动态" },
];

function TabContent() {
  const ctx = useProfileContext();
  return <div data-testid="content">{ctx?.activeTab ?? "none"}</div>;
}

describe("PF-P1-1 FollowEcho 乐观态：pending + 失败回滚 + 可见错误", () => {
  it("onFollow reject 后按钮回到原态并显示错误文案", async () => {
    const onFollow = vi.fn(() => Promise.reject(new Error("网络异常")));
    const h = renderProfile([createFollowEchoPlugin({ onFollow })], {
      followState: "none",
    });
    await flush();
    const button = () =>
      h.container.querySelector(".vp-follow-area button") as HTMLButtonElement;
    expect(button().textContent).toBe("关注");

    await act(async () => {
      button().click();
    });
    await flush();

    expect(button().textContent).toBe("关注");
    expect(button().disabled).toBe(false);
    const error = h.container.querySelector(".vp-follow-error");
    expect(error?.textContent).toContain("网络异常");
    h.unmount();
  });

  it("pending 期间按钮禁用，重复点击不会重复发请求", async () => {
    let finish: (() => void) | null = null;
    const onFollow = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const h = renderProfile([createFollowEchoPlugin({ onFollow })], {
      followState: "none",
    });
    await flush();
    const button = () =>
      h.container.querySelector(".vp-follow-area button") as HTMLButtonElement;

    await act(async () => {
      button().click();
    });
    expect(button().disabled).toBe(true);
    expect(onFollow).toHaveBeenCalledTimes(1);

    await act(async () => {
      button().click();
    });
    expect(onFollow).toHaveBeenCalledTimes(1);

    await act(async () => {
      finish?.();
    });
    await flush();
    expect(button().disabled).toBe(false);
    expect(button().textContent).toBe("已关注");
    h.unmount();
  });

  it("onFollow 返回 { error } 同样回滚", async () => {
    const onFollow = vi.fn(async () => ({ error: "服务端拒绝" }));
    const h = renderProfile([createFollowEchoPlugin({ onFollow })], {
      followState: "none",
    });
    await flush();
    const button = () =>
      h.container.querySelector(".vp-follow-area button") as HTMLButtonElement;
    await act(async () => {
      button().click();
    });
    await flush();
    expect(button().textContent).toBe("关注");
    expect(
      h.container.querySelector(".vp-follow-error")?.textContent
    ).toContain("服务端拒绝");
    h.unmount();
  });
});

describe("PF-P1-2 页签受控化", () => {
  it("受控模式点页签只回调 onActiveTabChange，不改内部状态", async () => {
    const seen: Array<[string | null, string | null]> = [];
    const h = renderProfile([createTabSyncPlugin({ tabs })], {
      activeTab: "works",
      onActiveTabChange: (id, prev) => seen.push([id, prev]),
      children: <TabContent />,
    });
    await flush();
    expect(
      h.container.querySelector('[data-testid="content"]')?.textContent
    ).toBe("works");

    const buttons = h.container.querySelectorAll(".vp-tab-bar-inner button");
    await act(async () => {
      (buttons[1] as HTMLButtonElement).click();
    });
    await flush();

    expect(seen).toEqual([["feeds", "works"]]);
    // 消费方没有回写 props，因此内部态不动
    expect(
      h.container.querySelector('[data-testid="content"]')?.textContent
    ).toBe("works");
    h.unmount();
  });

  it("非受控模式仍写内部 state，同时通知 onActiveTabChange", async () => {
    const seen: Array<[string | null, string | null]> = [];
    const h = renderProfile([createTabSyncPlugin({ tabs })], {
      defaultActiveTab: "works",
      onActiveTabChange: (id, prev) => seen.push([id, prev]),
      children: <TabContent />,
    });
    await flush();
    const buttons = h.container.querySelectorAll(".vp-tab-bar-inner button");
    await act(async () => {
      (buttons[1] as HTMLButtonElement).click();
    });
    await flush();
    expect(seen).toEqual([["feeds", "works"]]);
    expect(
      h.container.querySelector('[data-testid="content"]')?.textContent
    ).toBe("feeds");
    h.unmount();
  });
});

describe("PF-P1-3 内容槽不再吞掉 children / 内核三槽", () => {
  it("内容插件与 children、内核 renderHeader 插件同时可见", async () => {
    const kernelHeader: ProfilePlugin = {
      name: "KernelHeader",
      hooks: {
        renderHeader: () => <div data-testid="kernel-header">内核头部</div>,
      },
    };
    const h = renderProfile(
      [
        kernelHeader,
        createWorksGridPlugin({ items: [{ id: "w1", title: "作品一" }], tab: "works" }),
      ],
      {
        activeTab: "works",
        children: <div data-testid="host-content">宿主内容</div>,
      }
    );
    await flush();

    expect(h.container.querySelector(".vp-works-grid")).toBeTruthy();
    expect(h.container.querySelector('[data-testid="kernel-header"]')).toBeTruthy();
    expect(h.container.querySelector('[data-testid="host-content"]')).toBeTruthy();
    h.unmount();
  });
});

describe("PF-P1-4 URL 协议白名单", () => {
  it("safeHref / cssImageUrl 拒绝 javascript:、data: 与注入字符", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html;base64,PHNjcmlwdD4=")).toBeUndefined();
    expect(safeHref("vbscript:msgbox(1)")).toBeUndefined();
    expect(safeHref("//evil.example.com")).toBeUndefined();
    expect(safeHref("mailto:a@b.com?subject=hi")).toBeUndefined();
    expect(safeHref("https://example.com/u/1")).toBe("https://example.com/u/1");
    expect(safeHref("/profile/u/1")).toBe("/profile/u/1");
    expect(safeHref("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(cssImageUrl("javascript:alert(1)")).toBeUndefined();
    // 能闭合 url() 的字符被编码，不会撑破 CSS 声明
    expect(cssImageUrl("https://a.example.com/x.png)")).toBe(
      'url("https://a.example.com/x.png%29")'
    );
  });

  it("社交链接非法协议降级为纯文本", async () => {
    const h = renderProfile([
      createSocialLinksPlugin({
        links: [
          { platform: "github", href: "javascript:alert(1)" },
          { platform: "site", href: "https://example.com" },
        ],
      }),
    ]);
    await flush();
    expect(h.container.querySelector('a[href^="javascript"]')).toBeNull();
    const items = h.container.querySelectorAll(".vp-social-item");
    expect(items.length).toBe(2);
    expect(items[0].tagName).toBe("SPAN");
    expect(items[1].tagName).toBe("A");
    expect(h.container.textContent).toContain("GitHub");
    h.unmount();
  });

  it("头图 cover 非法协议回退渐变背景", async () => {
    const h = renderProfile([
      createBannerSlotPlugin({ cover: "javascript:alert(1)" }),
    ]);
    await flush();
    const banner = h.container.querySelector(".vp-banner") as HTMLElement;
    expect(banner.style.background).toContain("linear-gradient");
    h.unmount();
  });
});

describe("PF-P1-5 TabSync 空 tabs 软关闭", () => {
  it("tabs=[] 不抛错，返回禁用插件且渲染不崩溃", async () => {
    expect(() => createTabSyncPlugin({ tabs: [] })).not.toThrow();
    const plugin = createTabSyncPlugin({ tabs: [] });
    expect(plugin.enabled).toBe(false);

    const h = renderProfile([plugin]);
    await flush();
    expect(h.container.querySelector(".vp-profile")).toBeTruthy();
    expect(h.container.querySelector(".vp-tab-bar-inner")).toBeNull();
    h.unmount();
  });
});

describe("PF-P2-1 领域槽 key 去 index", () => {
  it("key 只用插件名，顺序变化后仍按插件身份绑定", () => {
    const a: ProfilePlugin = {
      name: "A",
      priority: 1,
      hooks: { renderBioArea: () => <i data-testid="a" /> },
    };
    const b: ProfilePlugin = {
      name: "B",
      priority: 2,
      hooks: { renderBioArea: () => <i data-testid="b" /> },
    };
    const ctx = {} as never;
    // priority 降序：B(2) 先于 A(1)
    const forward = renderProfileSlot([a, b], ctx, "renderBioArea");
    expect(forward.map((n) => (n as { key: string }).key)).toEqual([
      "profile-slot-B",
      "profile-slot-A",
    ]);

    // 调整 priority 让顺序反转：key 仍由插件名派生（若用 index 会得到 -0/-1）
    const promoted = { ...a, priority: 5 };
    const reordered = renderProfileSlot([promoted, b], ctx, "renderBioArea");
    expect(reordered.map((n) => (n as { key: string }).key)).toEqual([
      "profile-slot-A",
      "profile-slot-B",
    ]);
  });
});

describe("PF-P2-2/P2-3 槽位缓存", () => {
  it("宿主 forceUpdate（props/context 未变）不触发插件重算", async () => {
    let calls = 0;
    const counter: ProfilePlugin = {
      name: "Counter",
      hooks: {
        renderStatRow: () => {
          calls += 1;
          return <div className="counter-node">n</div>;
        },
      },
    };
    const h = renderProfile([counter]);
    await flush();
    expect(calls).toBeGreaterThan(0);
    const before = calls;

    await act(async () => {
      h.ref.current?.forceUpdate();
    });
    await flush();

    expect(calls).toBe(before);
    expect(h.container.querySelector(".counter-node")).toBeTruthy();
    h.unmount();
  });
});

describe("PF-P2-4 页签切换事件参数", () => {
  it("onTabChange 收到 (新页签, 旧页签)，连续切换不会错位", async () => {
    const calls: Array<[string | null, string | null]> = [];
    const spy: ProfilePlugin = {
      name: "TabSpy",
      hooks: {
        onTabChange: (_ctx, next, prev) => {
          calls.push([next, prev]);
        },
      },
    };
    const h = renderProfile([createTabSyncPlugin({ tabs }), spy]);
    await flush();

    const tabEls = () => h.container.querySelectorAll('[role="tab"]');
    await act(async () => {
      (tabEls()[1] as HTMLButtonElement).click();
    });
    await flush();
    await act(async () => {
      (tabEls()[0] as HTMLButtonElement).click();
    });
    await flush();

    expect(calls).toEqual([
      ["feeds", null],
      ["works", "feeds"],
    ]);
    h.unmount();
  });
});

describe("PF-P2-5 transformData 契约接线", () => {
  it("transformData 被执行，插件从 ctx.data 读到归一化结果", async () => {
    const normalizer: ProfilePlugin = {
      name: "Normalizer",
      hooks: {
        transformData: (_ctx: unknown, data: { tag?: string }) => ({
          ...data,
          tag: `T:${data.tag}`,
        }),
      },
    };
    const reader: ProfilePlugin = {
      name: "DataReader",
      hooks: {
        renderBioArea: (ctx: { data?: { tag?: string } }) => (
          <div data-testid="data">{String(ctx.data?.tag)}</div>
        ),
      },
    };
    const h = renderProfile([normalizer, reader], { data: { tag: "raw" } });
    await flush();
    expect(h.container.querySelector('[data-testid="data"]')?.textContent).toBe(
      "T:raw"
    );
    h.unmount();
  });
});

describe("PF-P2-6 头像降级", () => {
  it("非法头像协议直接走占位块，alt 不再是空字符串", async () => {
    const h = renderProfile([
      createBannerSlotPlugin({ avatar: "javascript:alert(1)", avatarAlt: "小王" }),
    ]);
    await flush();
    expect(h.container.querySelector("img.vp-avatar")).toBeNull();
    const fallback = h.container.querySelector(".vp-avatar-fallback");
    expect(fallback).toBeTruthy();
    expect(fallback?.getAttribute("aria-label")).toBe("小王");
    // 没有可用头像时不预留 32px 空白
    expect((h.container.querySelector(".vp-banner") as HTMLElement).style.marginBottom).toBe("0px");
    h.unmount();
  });

  it("头像加载失败（error 事件）切换到占位块", async () => {
    const h = renderProfile([
      createBannerSlotPlugin({ avatar: "https://cdn.example.com/a.png" }),
    ]);
    await flush();
    const img = h.container.querySelector("img.vp-avatar") as HTMLImageElement;
    expect(img.getAttribute("alt")).toBe("头像");
    await act(async () => {
      img.dispatchEvent(new Event("error"));
    });
    await flush();
    expect(h.container.querySelector("img.vp-avatar")).toBeNull();
    expect(h.container.querySelector(".vp-avatar-fallback")).toBeTruthy();
    h.unmount();
  });
});

describe("PF-P2-7 空数据态", () => {
  it("未传 onStatClick 时指标输出 span，meta 区仅在非空时渲染", async () => {
    const h = renderProfile([
      createStatRowPlugin({ items: [{ value: 12, label: "关注" }] }),
    ]);
    await flush();
    expect(h.container.querySelector(".vp-meta-area")).toBeTruthy();
    expect(h.container.querySelector(".vp-stat-row button")).toBeNull();
    expect(h.container.querySelector(".vp-stat-item")?.tagName).toBe("SPAN");
    h.unmount();
  });

  it("WorksGrid 空态用实色文字而不是 opacity", async () => {
    const h = renderProfile([createWorksGridPlugin({ items: [], empty: "暂无作品" })]);
    await flush();
    const empty = h.container.querySelector(".vp-works-empty") as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.style.opacity).toBe("");
    expect(empty.style.color).toBe("#6b6b6b");
    h.unmount();
  });
});

describe("PF-P2-8 可访问性与默认值", () => {
  it("页签补齐 role=tablist / role=tab / aria-selected", async () => {
    const h = renderProfile([createTabSyncPlugin({ tabs })], {
      activeTab: "works",
    });
    await flush();
    expect(
      h.container.querySelector(".vp-tab-bar-inner")?.getAttribute("role")
    ).toBe("tablist");
    const tabEls = h.container.querySelectorAll('[role="tab"]');
    expect(tabEls.length).toBe(2);
    expect(tabEls[0].getAttribute("aria-selected")).toBe("true");
    expect(tabEls[1].getAttribute("aria-selected")).toBe("false");
    h.unmount();
  });

  it("QRShare 无 url 不渲染；有 url 可展开；复制失败有提示；Esc 可关闭", async () => {
    const none = renderProfile([createQRSharePlugin()]);
    await flush();
    expect(none.container.querySelector(".vp-qrshare")).toBeNull();
    none.unmount();

    const writeText = vi.fn(() => Promise.reject(new Error("denied")));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const h = renderProfile([
      createQRSharePlugin({ url: "https://example.com/u/1" }),
    ]);
    await flush();
    const trigger = h.container.querySelector(
      ".vp-qrshare > button"
    ) as HTMLButtonElement;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      trigger.click();
    });
    await flush();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(h.container.querySelector('[role="dialog"]')).toBeTruthy();

    const copyButton = h.container.querySelector(
      '[role="dialog"] button'
    ) as HTMLButtonElement;
    await act(async () => {
      copyButton.click();
    });
    await flush();
    expect(copyButton.textContent).toBe("复制失败");

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    await flush();
    expect(h.container.querySelector('[role="dialog"]')).toBeNull();

    h.unmount();
    delete (navigator as unknown as { clipboard?: unknown }).clipboard;
  });
});
