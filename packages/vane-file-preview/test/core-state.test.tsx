/**
 * P1.2 · Core 状态机（唯一真源）
 *
 * 这一组测试的作用不只是「验证新实现」——它首先**钉住旧实现的两个 bug**：
 *
 *  ① `reset()` 之后状态会被 effect 拉回 `loaded`
 *     旧实现：`useEffect(() => startLoad(), [startLoad])`，而 `startLoad` 的依赖里
 *     有 `state.state`。reset 把状态置 idle → startLoad 身份变化 → effect 重跑 → 又跑回 loaded。
 *  ② `onBeforeLoad` 返回 false 会导致无限重试
 *     同一个循环：置 idle → startLoad 变化 → effect 重跑 → 又调 onBeforeLoad。
 *
 * 两个 bug 在旧代码里是**推演**出来的（P1 之前没有测试跑过这条路径），所以这里的第一版
 * 断言的写法是「次数必须恰好等于 1」——旧实现下它会跑成几十上百次然后被 React 的
 * update-depth 保护打断。
 */
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { TEXT_FILE, flush, renderCore } from "./helpers";

describe("Core 加载状态机", () => {
  it("挂载后自动从 idle 走到 loaded", async () => {
    const h = renderCore();
    await flush();
    expect(h.ref.current?.getState().state).toBe("loaded");
    h.unmount();
  });

  it("reset() 之后停在 idle，不会自己跑回 loaded", async () => {
    const h = renderCore();
    await flush();
    expect(h.ref.current?.getState().state).toBe("loaded");

    act(() => h.ref.current?.reset());
    await flush(5);

    // 旧实现这里是 "loaded"：reset 反而触发了一次重新加载
    expect(h.ref.current?.getState().state).toBe("idle");
    h.unmount();
  });

  it("onBeforeLoad 返回 false 时只跑一次，不循环", async () => {
    const onBeforeLoad = vi.fn(() => false);
    const onLoadSuccess = vi.fn();
    const h = renderCore({ onBeforeLoad, onLoadSuccess });
    await flush(5);

    expect(onBeforeLoad).toHaveBeenCalledTimes(1);
    expect(onLoadSuccess).not.toHaveBeenCalled();
    expect(h.ref.current?.getState().state).toBe("idle");
    h.unmount();
  });

  it("reload() 强制重走一遍（即使当前已是 loaded）", async () => {
    const onLoadStart = vi.fn();
    const onLoadSuccess = vi.fn();
    const h = renderCore({ onLoadStart, onLoadSuccess });
    await flush();
    expect(onLoadStart).toHaveBeenCalledTimes(1);

    act(() => h.ref.current?.reload());
    await flush();

    expect(onLoadStart).toHaveBeenCalledTimes(2);
    expect(onLoadSuccess).toHaveBeenCalledTimes(2);
    expect(h.ref.current?.getState().state).toBe("loaded");
    h.unmount();
  });

  it("onBeforeLoad 抛错 → error 状态 + message 透传 + onLoadError 被调", async () => {
    const onLoadError = vi.fn();
    const h = renderCore({
      onBeforeLoad: () => {
        throw new Error("门没开");
      },
      onLoadError,
    });
    await flush();

    const state = h.ref.current?.getState();
    expect(state?.state).toBe("error");
    expect(state?.message).toBe("门没开");
    expect(state?.error).toBeInstanceOf(Error);
    expect(onLoadError).toHaveBeenCalledTimes(1);
    h.unmount();
  });

  it("非 Error 抛出物会被包成 Error（守卫 error 是 Error 实例）", async () => {
    const h = renderCore({
      onBeforeLoad: () => {
        // 线上真实场景：某插件 reject 了一个字符串
        throw "字符串而不是 Error";
      },
    });
    await flush();

    const state = h.ref.current?.getState();
    expect(state?.state).toBe("error");
    expect(state?.error).toBeInstanceOf(Error);
    expect(state?.message).toContain("字符串而不是 Error");
    h.unmount();
  });

  it("只有 file.url 变化才重新加载（同对象、同 url 重渲染不重跑）", async () => {
    const onLoadStart = vi.fn();
    const h = renderCore({ onLoadStart });
    await flush();
    expect(onLoadStart).toHaveBeenCalledTimes(1);

    // 同一个 url 的新对象：不该重跑
    await h.rerender({ file: { ...TEXT_FILE } });
    expect(onLoadStart).toHaveBeenCalledTimes(1);

    // 换 url：该重跑
    await h.rerender({ file: { ...TEXT_FILE, url: "blob:other" } });
    expect(onLoadStart).toHaveBeenCalledTimes(2);
    h.unmount();
  });
});

describe("Core 的 reportState（插件上报，Core 是唯一真源）", () => {
  it("插件上报会覆盖 state，并保留未提及的字段", async () => {
    const h = renderCore();
    await flush();

    act(() => h.ref.current?.reportState({ message: "正在解析第 3 页" }));
    expect(h.ref.current?.getState().message).toBe("正在解析第 3 页");
    // 只补 message 不该动 state
    expect(h.ref.current?.getState().state).toBe("loaded");

    act(() =>
      h.ref.current?.reportState({ state: "error", message: "解析失败" })
    );
    expect(h.ref.current?.getState().state).toBe("error");
    h.unmount();
  });

  it("onStateChange 收到每一次状态变化（供上层镜像，不再自己存一份）", async () => {
    const seen: string[] = [];
    const h = renderCore({ onStateChange: (info) => seen.push(info.state) });
    await flush();
    expect(seen).toEqual(["loading", "loaded"]);

    act(() => h.ref.current?.reportState({ state: "error", message: "x" }));
    expect(seen).toEqual(["loading", "loaded", "error"]);
    h.unmount();
  });
});
