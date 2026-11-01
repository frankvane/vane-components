/**
 * P1-1 回归：Core 的加载令牌。
 *
 * 原缺陷：`runLoad` 在 `await onBeforeLoad()` 之后直接 commit。用户从 A 切到 B 时，
 * A 的 Promise 晚到，会把 B 的 loaded / error 覆盖成 A 的结果。
 */
import { describe, expect, it, vi } from "vitest";
import { act } from "react";

import { flush, renderCore } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const A: FileInfo = {
  name: "a.txt",
  size: 1,
  type: "text/plain",
  extension: "txt",
  url: "blob:a",
};

const B: FileInfo = { ...A, name: "b.txt", url: "blob:b" };

/** 每次调用生成一个可控 Promise，测试里按调用顺序 resolve */
function deferredGate() {
  const resolvers: Array<(value: boolean) => void> = [];
  const onBeforeLoad = vi.fn(
    () => new Promise<boolean>((resolve) => resolvers.push(resolve))
  );
  return { onBeforeLoad, resolvers };
}

describe("P1-1 · Core 加载令牌", () => {
  it("旧文件的 onBeforeLoad 晚到，不会覆盖新文件的状态", async () => {
    const { onBeforeLoad, resolvers } = deferredGate();
    const h = renderCore({ file: A, onBeforeLoad });
    await flush(1);

    // 第一个文件的门还开着，用户已经切到第二个文件
    await h.rerender({ file: B });
    expect(resolvers.length).toBe(2);

    // 新文件先放行 → loaded
    resolvers[1](true);
    await flush();
    expect(h.ref.current?.getState().state).toBe("loaded");

    // 旧文件晚到并返回 false：没有令牌时这里会把 B 改成 unsupported
    resolvers[0](false);
    await flush();
    expect(h.ref.current?.getState().state).toBe("loaded");
    h.unmount();
  });

  it("旧文件的 reportState 被丢弃，当前文件的照常生效", async () => {
    const h = renderCore({ file: A });
    await flush();
    expect(h.ref.current?.getState().state).toBe("loaded");

    await h.rerender({ file: B });

    act(() => {
      h.ref.current?.reportState(
        { state: "error", message: "旧文件解析失败" },
        A.url
      );
    });
    await flush();
    expect(h.ref.current?.getState().state).toBe("loaded");

    act(() => {
      h.ref.current?.reportState(
        { state: "error", message: "新文件解析失败" },
        B.url
      );
    });
    await flush();
    expect(h.ref.current?.getState().state).toBe("error");
    expect(h.ref.current?.getState().message).toBe("新文件解析失败");
    h.unmount();
  });
});
