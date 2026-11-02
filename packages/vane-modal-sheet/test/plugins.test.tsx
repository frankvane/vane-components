import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModalSheetCore } from "../src/components/ModalSheetPlugin/ModalSheetCore";
import { withModalSheetPlugins } from "../src/components/ModalSheetPlugin/plugins/withPlugins";
import { createHeaderPlugin } from "../src/custom-plugins/HeaderPlugin";
import { createKeepMountedPlugin } from "../src/custom-plugins/KeepMountedPlugin";
import { createHistoryPlugin } from "../src/custom-plugins/HistoryPlugin";
import { createBackdropPlugin } from "../src/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "../src/custom-plugins/DragHandlePlugin";
import { createSnapDotsPlugin } from "../src/custom-plugins/SnapDotsPlugin";
import { createStepFlowPlugin } from "../src/custom-plugins/StepFlowPlugin";
import { createSearchBarPlugin } from "../src/custom-plugins/SearchBarPlugin";
import { createFooterPlugin } from "../src/custom-plugins/FooterPlugin";
import { createKeyboardAvoidPlugin } from "../src/custom-plugins/KeyboardAvoidPlugin";
import { createScrollLockPlugin } from "../src/custom-plugins/ScrollLockPlugin";
import { createFocusTrapPlugin } from "../src/custom-plugins/FocusTrapPlugin";
import { createResponsivePlugin } from "../src/custom-plugins/ResponsivePlugin";

/** MVP 10 插件：工厂返回结构 + meta 挂载 + doc.json 完整性 */
const FACTORIES = [
  createBackdropPlugin,
  createDragHandlePlugin,
  createSnapDotsPlugin,
  createHeaderPlugin,
  createStepFlowPlugin,
  createSearchBarPlugin,
  createFooterPlugin,
  createKeyboardAvoidPlugin,
  createScrollLockPlugin,
  createFocusTrapPlugin,
];

describe("MVP 插件三件套", () => {
  it("每个工厂返回合规 Plugin 结构且 meta 已挂载", () => {
    for (const factory of FACTORIES) {
      const plugin = factory();
      expect(typeof plugin.name).toBe("string");
      expect(plugin.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(plugin.hooks).toBeTruthy();
      expect(plugin.version).toBeTruthy();
      // .meta = doc.json（demo 插件卡与文档生成的真源）
      expect(factory.meta).toBeTruthy();
      expect(factory.meta.name).toBeTruthy();
      expect(factory.meta.description).toBeTruthy();
      expect(typeof factory.meta.example).toBe("string");
    }
  });

  it("插件 name 全局唯一", () => {
    const names = FACTORIES.map((f) => f().name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("priority 落在各槽位约定带内", () => {
    const p = (f: (typeof FACTORIES)[number]) => f().priority ?? 0;
    expect(p(createBackdropPlugin)).toBe(10);
    expect(p(createDragHandlePlugin)).toBe(20);
    expect(p(createSnapDotsPlugin)).toBe(24);
    expect(p(createHeaderPlugin)).toBe(30);
    expect(p(createStepFlowPlugin)).toBe(32);
    expect(p(createSearchBarPlugin)).toBe(34);
    expect(p(createFooterPlugin)).toBe(40);
    expect(p(createKeyboardAvoidPlugin)).toBe(50);
    expect(p(createScrollLockPlugin)).toBe(52);
    expect(p(createFocusTrapPlugin)).toBe(54);
  });

  it("视觉件插件声明了对应的渲染槽钩子", () => {
    expect(typeof createBackdropPlugin().hooks.renderBackdrop).toBe("function");
    expect(typeof createDragHandlePlugin().hooks.renderHandle).toBe("function");
    expect(typeof createHeaderPlugin().hooks.renderHeader).toBe("function");
    expect(typeof createSearchBarPlugin().hooks.renderHeader).toBe("function");
    expect(typeof createFooterPlugin().hooks.renderFooter).toBe("function");
    expect(typeof createStepFlowPlugin().hooks.renderHeader).toBe("function");
    expect(typeof createStepFlowPlugin().hooks.renderFooter).toBe("function");
  });

  it("行为插件声明了生命周期/属性钩子", () => {
    expect(typeof createKeyboardAvoidPlugin().hooks.onMount).toBe("function");
    expect(typeof createScrollLockPlugin().hooks.onPropsChange).toBe("function");
    expect(typeof createFocusTrapPlugin().hooks.onPropsChange).toBe("function");
  });

  it("SnapDots 在单档时不渲染", () => {
    const plugin = createSnapDotsPlugin();
    const node = plugin.hooks.renderHandle?.({
      snapCount: 1,
      currentSnap: 0,
    } as any);
    expect(node).toBeNull();
  });
});

// ---------- BATCH 2 · 核心几何与生命周期（真实挂载） ----------

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ORIGINAL_INNER_HEIGHT = window.innerHeight;
const ORIGINAL_INNER_WIDTH = window.innerWidth;

/** happy-dom 无布局：显式判定，布局不可用时 skip 而不是假绿 */
const HAS_LAYOUT = (() => {
  const probe = document.createElement("div");
  probe.style.cssText = "height:40px;width:10px";
  document.body.appendChild(probe);
  const height = probe.offsetHeight;
  probe.remove();
  return height === 40;
})();
const itLayout = HAS_LAYOUT ? it : it.skip;

async function mountSheet(ui: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const flush = async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  await act(async () => {
    root.render(ui);
    await flush();
    await flush();
  });
  return { root, flush };
}

const panelEl = () => document.querySelector(".vc-ms-panel") as HTMLElement | null;

beforeEach(() => {
  // 固定视口，避免依赖 happy-dom 默认 innerHeight / innerWidth
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: 800,
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1024,
  });
  document.body.style.overflow = "";
});

afterEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: ORIGINAL_INNER_HEIGHT,
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: ORIGINAL_INNER_WIDTH,
  });
  vi.restoreAllMocks();
});

describe("maxHeight", () => {
  it("maxHeight={500} + snapPoints=[1] 时面板高度夹到 500px", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const { root } = await mountSheet(
      <Enhanced isOpen snapPoints={[1]} maxHeight={500} tweenDuration={0}>
        内容
      </Enhanced>
    );

    const panel = panelEl();
    expect(panel?.style.height).toBe("500px");
    expect(panel?.style.maxHeight).toBe("500px");

    await act(async () => root.unmount());
  });

  it("maxHeight 字符串按 vh 折算", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const { root } = await mountSheet(
      <Enhanced isOpen snapPoints={[1]} maxHeight="72vh" tweenDuration={0}>
        内容
      </Enhanced>
    );

    // 视口 800 → 72vh = 576px
    expect(panelEl()?.style.height).toBe("576px");

    await act(async () => root.unmount());
  });
});

describe("四向抽伸几何", () => {
  it("right：主尺寸 = 宽度，maxHeight 作为交叉轴高度并垂直居中", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const { root } = await mountSheet(
      <Enhanced
        isOpen
        placement="right"
        snapPoints={[300]}
        maxHeight={500}
        tweenDuration={0}
      >
        内容
      </Enhanced>
    );

    const panel = panelEl()!;
    expect(panel.style.width).toBe("300px");
    expect(panel.style.height).toBe("500px");
    expect(panel.style.maxHeight).toBe("500px");
    // 视口高 800 / 面板高 500 → 垂直居中上边距 150
    expect(panel.style.top).toBe("150px");
    // 吸右：right = 0，left = auto
    expect(panel.style.right).toBe("0px");
    expect(panel.style.left).toBe("auto");
    // 贴右锚定：完全展开时 transform 为 0（不再向视口外平移）
    expect(panel.style.transform).toContain("translate3d(0");

    await act(async () => root.unmount());
  });

  it("left：吸左，宽度由引擎写，最高档贴边（y = 0）", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const { root } = await mountSheet(
      <Enhanced isOpen placement="left" snapPoints={[300]} tweenDuration={0}>
        内容
      </Enhanced>
    );

    const panel = panelEl()!;
    expect(panel.style.width).toBe("300px");
    // 无 maxHeight → 交叉轴撑满视口高
    expect(panel.style.height).toBe("800px");
    expect(panel.style.left).toBe("0px");
    expect(panel.style.right).toBe("auto");
    expect(panel.style.transform).toContain("translate3d(0");

    await act(async () => root.unmount());
  });

  it("top：高度 = 主尺寸，最高档贴顶（关闭行程 = 面板高）", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const { root } = await mountSheet(
      <Enhanced isOpen placement="top" snapPoints={[300]} tweenDuration={0}>
        内容
      </Enhanced>
    );

    const panel = panelEl()!;
    expect(panel.style.height).toBe("300px");
    expect(panel.style.top).toBe("0px");
    expect(panel.style.width).toBe("100%");
    expect(panel.style.transform).toContain("translate3d(0");

    await act(async () => root.unmount());
  });

  it("ResponsivePlugin 在横向方位跳过桌面浮窗策略", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, [
      createResponsivePlugin({ desktopWidth: 560 }),
    ]);
    const { root } = await mountSheet(
      <Enhanced isOpen placement="right" snapPoints={[300]} tweenDuration={0}>
        内容
      </Enhanced>
    );

    const panel = panelEl()!;
    // 桌面居中浮窗的 maxWidth / auto 外边距不得作用到贴边抽屉
    expect(panel.style.maxWidth).toBe("");
    expect(panel.style.marginLeft).toBe("");
    expect(panel.style.marginRight).toBe("");

    await act(async () => root.unmount());
  });

  it("纵向方位忽略 maxHeight 以外的交叉轴定位，缺省仍为 bottom", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const { root } = await mountSheet(
      <Enhanced isOpen snapPoints={[1]} tweenDuration={0}>
        内容
      </Enhanced>
    );

    const panel = panelEl()!;
    expect(panel.style.height).toBe("800px");
    expect(panel.style.width).toBe("100%");
    expect(panel.style.top).toBe("0px");

    await act(async () => root.unmount());
  });
});

describe("把手位置随方位贴内边缘", () => {
  const handleEl = () =>
    document.querySelector("[data-vane-ms-handle]") as HTMLElement | null;

  async function mountWith(
    placement: "bottom" | "top" | "left" | "right"
  ) {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, [
      createDragHandlePlugin(),
    ]);
    const mounted = await mountSheet(
      <Enhanced isOpen placement={placement} snapPoints={[0.5]} tweenDuration={0}>
        内容
      </Enhanced>
    );
    return mounted;
  }

  it("bottom：把手留在面板顶部的文档流里（横条）", async () => {
    const { root } = await mountWith("bottom");
    const handle = handleEl()!;
    expect(handle.style.position).toBe("");
    expect(handle.style.order).toBe("0");
    expect(handle.style.top).toBe("");
    expect(handle.style.bottom).toBe("");
    await act(async () => root.unmount());
  });

  it("top：order=99 排到面板底部（横条）", async () => {
    const { root } = await mountWith("top");
    const handle = handleEl()!;
    expect(handle.style.position).toBe("");
    expect(handle.style.order).toBe("99");
    await act(async () => root.unmount());
  });

  it("left：绝对定位在面板右边缘（竖条）", async () => {
    const { root } = await mountWith("left");
    const handle = handleEl()!;
    expect(handle.style.position).toBe("absolute");
    expect(handle.style.right).toBe("0px");
    expect(handle.style.left).toBe("");
    expect(handle.style.top).toBe("0px");
    expect(handle.style.bottom).toBe("0px");
    await act(async () => root.unmount());
  });

  it("right：绝对定位在面板左边缘（竖条）", async () => {
    const { root } = await mountWith("right");
    const handle = handleEl()!;
    expect(handle.style.position).toBe("absolute");
    expect(handle.style.left).toBe("0px");
    expect(handle.style.right).toBe("");
    await act(async () => root.unmount());
  });
});

describe("B3-5 无障碍名称", () => {
  it("ariaLabel 写到 panel", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, [
      createHeaderPlugin({ title: "标题", titleId: "sheet-title" }),
    ]);
    const { root } = await mountSheet(
      <Enhanced
        isOpen
        ariaLabel="x"
        ariaLabelledby="sheet-title"
        snapPoints={[1]}
        tweenDuration={0}
      >
        内容
      </Enhanced>
    );

    const panel = panelEl();
    expect(panel?.getAttribute("aria-label")).toBe("x");
    expect(panel?.getAttribute("aria-labelledby")).toBe("sheet-title");
    const title = document.querySelector("#sheet-title");
    expect(title?.textContent).toBe("标题");

    await act(async () => root.unmount());
  });

  it("aria 为空时不写属性", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const { root } = await mountSheet(
      <Enhanced isOpen snapPoints={[1]} tweenDuration={0}>
        内容
      </Enhanced>
    );

    const panel = panelEl();
    expect(panel?.hasAttribute("aria-label")).toBe(false);
    expect(panel?.hasAttribute("aria-labelledby")).toBe(false);

    await act(async () => root.unmount());
  });
});

describe("B3-2 外部关闭补间", () => {
  it("父级 setOpen(false) 下滑补间后才卸载，且不重复回调用户 onClose", async () => {
    const onClose = vi.fn();
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const renderSheet = (isOpen: boolean) => (
      <Enhanced
        isOpen={isOpen}
        onClose={onClose}
        snapPoints={[1]}
        tweenDuration={16}
      >
        内容
      </Enhanced>
    );

    const { root } = await mountSheet(renderSheet(true));
    expect(panelEl()).not.toBeNull();

    await act(async () => {
      root.render(renderSheet(false));
      await Promise.resolve();
    });
    // 补间中 portal 仍在（visible 尚未落 false）
    expect(panelEl()).not.toBeNull();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(panelEl()).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => root.unmount());
  });
});

describe("几何参数变更重算", () => {
  it("snapPoints 变化后重新测量面板高度", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, []);
    const renderSheet = (snapPoints: number[]) => (
      <Enhanced isOpen snapPoints={snapPoints} tweenDuration={0}>
        内容
      </Enhanced>
    );

    const { root } = await mountSheet(renderSheet([0.25]));
    expect(panelEl()?.style.height).toBe("200px");

    await act(async () => {
      root.render(renderSheet([0.5]));
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(panelEl()?.style.height).toBe("400px");

    await act(async () => root.unmount());
  });
});

describe("B2-3 detent:content 自然高度", () => {
  itLayout("面板高度 = Header + 3 条内容自然高度", async () => {
    const Enhanced = withModalSheetPlugins(ModalSheetCore, [
      createHeaderPlugin({ title: "标题" }),
    ]);
    const { root } = await mountSheet(
      <Enhanced isOpen detent="content" tweenDuration={0}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 24 }} />
        ))}
      </Enhanced>
    );

    const panel = panelEl()!;
    const header = document.querySelector(
      '[data-vane-ms-header=""]'
    ) as HTMLElement;
    expect(parseFloat(panel.style.height)).toBe(header.offsetHeight + 72);

    await act(async () => root.unmount());
  });
});

describe("卸载清理与首帧初始化", () => {
  it("首帧 isOpen：body 锁定 + 焦点进面板；卸载后恢复", async () => {
    const opener = document.createElement("button");
    opener.textContent = "打开前";
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const Enhanced = withModalSheetPlugins(ModalSheetCore, [
      createScrollLockPlugin(),
      createFocusTrapPlugin(),
    ]);
    const { root } = await mountSheet(
      <Enhanced isOpen snapPoints={[1]} tweenDuration={0}>
        <input data-autofocus aria-label="焦点输入" />
      </Enhanced>
    );

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(
      document.querySelector("input[data-autofocus]")
    );

    await act(async () => root.unmount());

    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("首帧 open：KeepMounted 不报错，History 只 pushState 一次且卸载不回退", async () => {
    const pushSpy = vi
      .spyOn(window.history, "pushState")
      .mockImplementation(() => {});
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});

    const Enhanced = withModalSheetPlugins(ModalSheetCore, [
      createKeepMountedPlugin(),
      createHistoryPlugin(),
    ]);
    const { root } = await mountSheet(
      <Enhanced isOpen snapPoints={[1]} tweenDuration={0}>
        内容
      </Enhanced>
    );

    expect(pushSpy).toHaveBeenCalledTimes(1);

    await act(async () => root.unmount());
    // B3-6：卸载只摘监听，不主动 history.back()（避免把用户带离当前页）
    expect(backSpy).not.toHaveBeenCalled();
  });
});
