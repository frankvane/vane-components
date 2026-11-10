import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetLibraryCore, createAssetLibrary, withPlugins } from "../src";

/** 裸网格：不带任何插件（Core + 装配器） */
const Bare = createAssetLibrary([]);
import type {
  AssetItem,
  AssetLibraryContext,
  AssetPlugin,
} from "../src";
import { createSelectMarkPlugin } from "../src/custom-plugins/SelectMarkPlugin";
import { createBulkBarPlugin } from "../src/custom-plugins/BulkBarPlugin";
import { createEmptyStatePlugin } from "../src/custom-plugins/EmptyStatePlugin";
import { createPaginationPlugin } from "../src/custom-plugins/PaginationPlugin";

// 让 React 的 act() 安静（happy-dom 下需显式声明 act 环境）
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  container = null;
  root = null;
});

async function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(ui);
  });
  return container;
}

const items: AssetItem[] = [
  { id: "a", kind: "image", src: "https://x/a.png", title: "封面 A" },
  { id: "b", kind: "video", src: "https://x/b.mp4", thumbnail: "https://x/b.jpg", title: "预告片" },
  { id: "c", kind: "image", src: "https://x/c.png", title: "封面 C", status: "processing" },
  { id: "d", kind: "image", src: "https://x/d.png", title: "封面 D", status: "failed" },
  { id: "e", kind: "image", src: "https://x/e.png", title: "封面 E" },
];

const cards = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLElement>('[role="option"]'));

const click = async (el: HTMLElement) => {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

/** 把上下文暴露给测试：真实插件写法，只是把 ctx 存下来 */
function makeSpyPlugin(sink: { ctx?: AssetLibraryContext }): AssetPlugin {
  return {
    name: "spy",
    version: "0.1.0",
    hooks: {
      renderToolbar: (ctx) => {
        sink.ctx = ctx;
        return <span data-testid="spy" />;
      },
    },
  };
}

describe("裸网格（无插件）", () => {
  it("渲染全部素材，卡片带 role=option 与 aria-selected", async () => {
    const el = await mount(<Bare items={items} />);
    expect(cards(el)).toHaveLength(5);
    expect(cards(el)[0].getAttribute("aria-selected")).toBe("false");
    expect(el.querySelector('[role="listbox"]')).not.toBeNull();
  });

  it("roving tabindex：只有一张卡可 Tab 到达", async () => {
    const el = await mount(<Bare items={items} />);
    const tabbable = cards(el).filter((card) => card.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
  });

  it("缺 title 时回落到 id，并按 status 标记卡片", async () => {
    const el = await mount(
      <Bare items={[{ id: "no-title", kind: "image", src: "" }]} />
    );
    const card = cards(el)[0];
    expect(card.getAttribute("aria-label")).toBe("no-title");
    expect(card.getAttribute("data-status")).toBe("ready");
  });

  it("空库走兜底空态，筛选无结果文案不同", async () => {
    const empty = await mount(<Bare items={[]} />);
    expect(empty.querySelector(".vc-asset__empty")?.textContent).toContain("素材库还是空的");

    container?.remove();
    root = null;
    const filtered = await mount(
      <AssetLibraryCore items={items} cards={[]} emptyReason="filtered" />
    );
    expect(filtered.querySelector(".vc-asset__empty")?.textContent).toContain("没有符合条件");
  });
});

describe("选择语义", () => {
  it("点击卡片切换选择，并按勾选顺序回传", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy)]);
    const onChange = vi.fn();
    const el = await mount(<Lib items={items} onSelectionChange={onChange} />);

    await click(cards(el)[4]);
    await click(cards(el)[0]);
    expect(onChange).toHaveBeenLastCalledWith(["e", "a"], expect.any(Array));
    expect(spy.ctx?.selectedIds).toEqual(["e", "a"]);
  });

  it("processing / failed 素材可见但不可选", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy)]);
    const onChange = vi.fn();
    const el = await mount(<Lib items={items} onSelectionChange={onChange} />);

    await click(cards(el)[2]); // processing
    await click(cards(el)[3]); // failed
    expect(onChange).not.toHaveBeenCalled();
    expect(spy.ctx?.selectedIds).toEqual([]);
  });

  it("maxSelected：达上限后未选项 blocked，已选项仍可取消", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy), createSelectMarkPlugin()]);
    const el = await mount(<Lib items={items} maxSelected={1} />);

    await click(cards(el)[0]);
    expect(spy.ctx?.selectedIds).toEqual(["a"]);

    await click(cards(el)[1]);
    expect(spy.ctx?.selectedIds).toEqual(["a"]);
    expect(cards(el)[1].getAttribute("data-blocked")).toBe("true");

    // 已选项仍可取消
    await click(cards(el)[0]);
    expect(spy.ctx?.selectedIds).toEqual([]);
  });

  it("受控模式：不改选中的真相，只回传", async () => {
    const Lib = createAssetLibrary([createSelectMarkPlugin()]);
    const onChange = vi.fn();
    const el = await mount(
      <Lib items={items} selectedIds={["b"]} onSelectionChange={onChange} />
    );

    expect(cards(el)[1].getAttribute("aria-selected")).toBe("true");
    await click(cards(el)[0]);
    expect(onChange).toHaveBeenCalledWith(["b", "a"], expect.any(Array));
    // 宿主没回传新值 → 渲染仍是 ["b"]
    expect(cards(el)[0].getAttribute("aria-selected")).toBe("false");
    expect(cards(el)[1].getAttribute("aria-selected")).toBe("true");
  });

  it("多选关闭时点击即单选替换", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy)]);
    const el = await mount(<Lib items={items} multiple={false} />);

    await click(cards(el)[0]);
    await click(cards(el)[1]);
    expect(spy.ctx?.selectedIds).toEqual(["b"]);
  });

  it("selectAllVisible 只选当前页就绪素材", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy)]);
    await mount(<Lib items={items} pageSize={2} />);

    act(() => spy.ctx!.selectAllVisible());
    expect(spy.ctx?.selectedIds).toEqual(["a", "b"]);

    act(() => spy.ctx!.clearSelection());
    expect(spy.ctx?.selectedIds).toEqual([]);
  });
});

describe("筛选 / 排序 / 分页", () => {
  it("setQuery 与 setKinds 改可见集，且筛选后回到第 1 页", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy)]);
    const el = await mount(<Lib items={items} pageSize={2} />);

    expect(cards(el)).toHaveLength(2);
    act(() => spy.ctx!.setPage(2));
    expect(spy.ctx?.page).toBe(2);

    act(() => spy.ctx!.setKinds(["video"]));
    expect(spy.ctx?.page).toBe(1);
    expect(spy.ctx?.filtered.map((item) => item.id)).toEqual(["b"]);
    expect(cards(el)).toHaveLength(1);
  });

  it("emptyReason 在筛选无命中时为 filtered", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy), createEmptyStatePlugin()]);
    const el = await mount(<Lib items={items} />);

    act(() => spy.ctx!.setQuery("不存在的关键词"));
    expect(spy.ctx?.emptyReason).toBe("filtered");
    expect(el.querySelector(".vc-asset__empty")?.textContent).toContain("没有符合当前条件");
  });

  it("空库时 emptyReason 为 empty", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy)]);
    await mount(<Lib items={[]} />);
    expect(spy.ctx?.emptyReason).toBe("empty");
  });

  it("分页 clamp：超界 page 自动回到最后一页", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy), createPaginationPlugin()]);
    await mount(<Lib items={items} pageSize={2} />);

    act(() => spy.ctx!.setPage(99));
    expect(spy.ctx?.page).toBe(3);
  });

  it("排序与标签 / 分组筛选联动", async () => {
    const spy: { ctx?: AssetLibraryContext } = {};
    const Lib = createAssetLibrary([makeSpyPlugin(spy)]);
    await mount(
      <Lib
        items={[
          { id: "1", kind: "image", src: "x", title: "乙", tags: ["t1"], folderId: "f1" },
          { id: "2", kind: "image", src: "y", title: "甲", tags: ["t2"], folderId: "f2" },
        ]}
        folders={[{ id: "f1", name: "组一" }]}
      />
    );

    act(() => spy.ctx!.setSort("name", "asc"));
    expect(spy.ctx?.filtered.map((item) => item.id)).toEqual(["2", "1"]);

    act(() => spy.ctx!.setFolder("f1"));
    expect(spy.ctx?.filtered.map((item) => item.id)).toEqual(["1"]);

    act(() => spy.ctx!.setFolder(null));
    act(() => spy.ctx!.toggleTag("t2"));
    expect(spy.ctx?.filtered.map((item) => item.id)).toEqual(["2"]);

    act(() => spy.ctx!.clearFilters());
    expect(spy.ctx?.filtered).toHaveLength(2);
  });
});

describe("插件与槽位", () => {
  it("插件渲染进各自槽位，per-card 槽按卡片调用", async () => {
    const Lib = createAssetLibrary([createSelectMarkPlugin(), createBulkBarPlugin()]);
    const el = await mount(<Lib items={items} />);

    expect(el.querySelectorAll(".vc-asset-mark").length).toBe(3); // 5 张卡里 2 张不可选
    expect(el.querySelector(".vc-asset-footer")).toBeNull(); // 未选择时不占位

    await click(cards(el)[0]);
    expect(el.querySelector(".vc-asset-footer")?.textContent).toContain("已选 1 项");
  });

  it("选择上限时标记按钮禁用，并给出 aria-label 原因", async () => {
    const Lib = createAssetLibrary([createSelectMarkPlugin()]);
    const el = await mount(<Lib items={items} maxSelected={1} />);

    await click(cards(el)[0]);
    const blockedMark = cards(el)[1].querySelector<HTMLButtonElement>(".vc-asset-mark");
    expect(blockedMark?.disabled).toBe(true);
    expect(blockedMark?.getAttribute("aria-label")).toContain("已达选择上限");
  });

  it("单个插件抛错不影响其它插件（沙箱隔离）", async () => {
    const bad: AssetPlugin = {
      name: "bad",
      hooks: {
        renderToolbar: () => {
          throw new Error("boom");
        },
      },
    };
    const good: AssetPlugin = {
      name: "good",
      hooks: {
        renderToolbar: () => <span data-testid="good">ok</span>,
      },
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Lib = withPlugins(AssetLibraryCore, [bad, good]);
    const el = await mount(<Lib items={items} />);

    expect(el.querySelector('[data-testid="good"]')).not.toBeNull();
    warn.mockRestore();
  });

  it("onMount / onUnmount 生命周期被转发", async () => {
    const onMount = vi.fn();
    const onUnmount = vi.fn();
    const Lib = createAssetLibrary([]);
    await mount(<Lib items={items} onMount={onMount} onUnmount={onUnmount} />);
    expect(onMount).toHaveBeenCalled();

    act(() => root!.unmount());
    root = null;
    expect(onUnmount).toHaveBeenCalled();
  });

  it("归一化告警只报一次，且不影响渲染", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Lib = createAssetLibrary([]);
    const el = await mount(
      <Lib items={[{ id: "a", kind: "image", src: "x" }, { kind: "image", src: "y" } as AssetItem]} />
    );
    expect(cards(el)).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
