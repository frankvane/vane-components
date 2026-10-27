/**
 * P1.2 · Core 渲染结构
 *
 * 三层约定（插件的 `containerRef` / `contentRef` 全靠它）：
 *   容器层（containerRef）→ 状态遮罩（loading / error，绝对定位）+ 内容层
 *   内容层（contentRef）  → children（插件渲染的东西）
 *
 * 样式合并优先级：**调用方的 containerStyle 覆盖默认值**。
 * 这条容易写反 —— 默认值写在后面就会把用户传的 background 吃掉，
 * 而症状只是「颜色不生效」，很难想到是合并顺序。
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { flush, renderCore } from "./helpers";

describe("Core 渲染结构", () => {
  it("容器层与内容层都能挂 className，且嵌套关系是 container > content > children", async () => {
    const h = renderCore({
      containerClassName: "vfp-container",
      contentClassName: "vfp-content",
      children: React.createElement("span", { id: "inner" }, "插件内容"),
    });
    await flush();

    const container = h.container.querySelector(".vfp-container");
    const content = h.container.querySelector(".vfp-content");
    expect(container).toBeTruthy();
    expect(content).toBeTruthy();
    expect(container?.contains(content!)).toBe(true);

    const inner = h.container.querySelector("#inner");
    expect(inner).toBeTruthy();
    expect(content?.contains(inner!)).toBe(true);
    h.unmount();
  });

  it("children 在内容层里，不在容器层直接挂着", async () => {
    const h = renderCore({
      contentClassName: "vfp-content",
      children: React.createElement("span", { id: "inner" }, "x"),
    });
    await flush();

    const content = h.container.querySelector(".vfp-content")!;
    // 内容层的第一个元素就是 children（工具栏归装配器塞，Core 不管）
    expect(content.firstElementChild?.id).toBe("inner");
    h.unmount();
  });

  it("调用方的 containerStyle 覆盖默认值（不是被默认值吃掉）", async () => {
    const h = renderCore({
      containerClassName: "vfp-container",
      containerStyle: { background: "rgb(1, 2, 3)", height: 320 },
    });
    await flush();

    const container = h.container.querySelector(".vfp-container") as HTMLElement;
    expect(container.style.background).toBe("rgb(1, 2, 3)");
    expect(container.style.height).toBe("320px");
    // 没被覆盖的默认值仍在
    expect(container.style.position).toBe("relative");
    h.unmount();
  });

  it("漏传 containerStyle 时用默认 #fafafa，出错时转 #fee", async () => {
    // 颜色断言要容忍两种写法：happy-dom 原样保留 `#fafafa`，真实浏览器会把
    // style.background 归一化成 `rgb(250, 250, 250)`。断言写死任一种，
    // 换个测试环境就红一次，而代码根本没变。
    const FAFAFA = /#fafafa|rgb\(250,\s*250,\s*250\)/;
    const FEE = /#fee\b|#ffeeee|rgb\(255,\s*238,\s*238\)/;

    const h = renderCore({ containerClassName: "vfp-container" });
    await flush();
    const container = h.container.querySelector(".vfp-container") as HTMLElement;
    expect(container.style.background).toMatch(FAFAFA);

    h.unmount();

    const h2 = renderCore({
      containerClassName: "vfp-container",
      onBeforeLoad: () => {
        throw new Error("x");
      },
    });
    await flush();
    const container2 = h2.container.querySelector(".vfp-container") as HTMLElement;
    expect(container2.style.background).toMatch(FEE);
    h2.unmount();
  });

  it("loading 与 error 各显示自己的遮罩，且 error 带 message", async () => {
    const h = renderCore();
    // 同步时刻：runLoad 已经 commit 了 loading，但 await 还没回来
    expect(h.container.textContent).toContain("Loading...");

    await flush();
    expect(h.container.textContent).not.toContain("Loading...");
    h.unmount();

    const h2 = renderCore({
      onBeforeLoad: () => {
        throw new Error("文件损坏");
      },
    });
    await flush();
    expect(h2.container.textContent).toContain("Load Failed");
    expect(h2.container.textContent).toContain("文件损坏");
    h2.unmount();
  });
});
