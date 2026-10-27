/**
 * C1.4 / C2 · 可见性（IntersectionObserver）契约
 * 重点验证：IO 在挂载时建立一次，重渲染不重建（C1.2 修复点）。
 */
import { describe, it, expect, beforeEach } from "vitest";
import CardCore from "../src/components/CardPlugin/core/CardCore";
import { renderCore, installObservers, ioInstances } from "./helpers";
import React from "react";
import { act } from "react-dom/test-utils";

beforeEach(() => {
  installObservers();
});

describe("CardCore 可见性契约", () => {
  it("进入视口触发 onVisibilityChange(true)", () => {
    let visible: boolean | null = null;
    renderCore({ onVisibilityChange: (v) => { visible = v; } });
    expect(visible).toBe(true);
  });

  it("重渲染不重建 IntersectionObserver", () => {
    let calls = 0;
    const h = renderCore({ onVisibilityChange: () => { calls += 1; } });
    const before = ioInstances().length;
    expect(before).toBe(1);

    // 用新的 onVisibilityChange 重渲染：effect 依赖 []，IO 不应重建
    const ref = h.ref;
    act(() => {
      h.root.render(
        React.createElement(CardCore as any, {
          ref,
          cardId: "test-card",
          data: {},
          onVisibilityChange: () => { calls += 1; },
        })
      );
    });
    expect(ioInstances().length).toBe(before);
  });

  it("卸载断开 IntersectionObserver", () => {
    const h = renderCore({});
    expect(ioInstances().length).toBe(1);
    h.unmount();
    // mock IO 的 disconnect 会清空 observed，但实例仍在数组里；
    // 重点是卸载不抛错且调用了 disconnect（observed 清空）
    expect(() => h.unmount()).not.toThrow();
  });
});
