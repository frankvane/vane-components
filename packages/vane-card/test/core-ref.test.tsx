/**
 * C1.4 / C2 · Core Ref 契约（getContainer / getSize / forceUpdate）
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderCore, installObservers } from "./helpers";

beforeEach(() => {
  installObservers();
});

describe("CardCore Ref 契约", () => {
  it("getContainer 返回真实 DOM 容器", () => {
    const { container, ref } = renderCore({});
    const dom = ref.current?.getContainer();
    expect(dom).not.toBeNull();
    expect(dom?.tagName).toBe("DIV");
    expect(container.contains(dom as any)).toBe(true);
  });

  it("getSize 返回 { width, height }（happy-dom 下为 0）", () => {
    const { ref } = renderCore({});
    const size = ref.current?.getSize();
    expect(size).toEqual({ width: 0, height: 0 });
  });

  it("forceUpdate 不抛错", () => {
    const { ref } = renderCore({});
    expect(() => ref.current?.forceUpdate()).not.toThrow();
  });

  it("ref 双通道：containerRefExternal 也能拿到容器", () => {
    const ext = { current: null as any };
    const { container } = renderCore({ containerRefExternal: ext as any });
    expect(ext.current).not.toBeNull();
    expect(container.contains(ext.current)).toBe(true);
  });
});
