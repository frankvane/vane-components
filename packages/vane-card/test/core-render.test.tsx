/**
 * C1.4 / C2 · Core 渲染契约（直接渲染 CardCore）
 */
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderCore, installObservers } from "./helpers";

beforeEach(() => {
  installObservers();
});

describe("CardCore 渲染契约", () => {
  it("cardId 写入 data-card-id", () => {
    const { container } = renderCore({ cardId: "my-card" });
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.getAttribute("data-card-id")).toBe("my-card");
  });

  it("data + renderContent 渲染主体内容", () => {
    const { container } = renderCore({
      data: { title: "商品A" },
      renderContent: (d: any) =>
        React.createElement("div", { id: "rc" }, d.title),
    });
    expect(container.querySelector("#rc")?.textContent).toBe("商品A");
  });

  it("padding 数字 → 四边同值", () => {
    const { container } = renderCore({ padding: 16 });
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.style.paddingTop).toContain("16");
    expect(el.style.paddingBottom).toContain("16");
  });

  it("padding 对象 → 按边生效", () => {
    const { container } = renderCore({ padding: { top: 4, right: 8, bottom: 12, left: 16 } });
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.style.paddingTop).toContain("4");
    expect(el.style.paddingRight).toContain("8");
    expect(el.style.paddingBottom).toContain("12");
    expect(el.style.paddingLeft).toContain("16");
  });

  it("layout horizontal → card-horizontal 类", () => {
    const { container } = renderCore({ layout: "horizontal" });
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.className).toContain("card-horizontal");
  });

  it("layout vertical（默认）→ card-vertical 类", () => {
    const { container } = renderCore({});
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.className).toContain("card-vertical");
  });

  it("containerClassName 透传", () => {
    const { container } = renderCore({ containerClassName: "x-custom" });
    const el = container.querySelector(".card-core") as HTMLElement;
    expect(el.className).toContain("x-custom");
  });
});
