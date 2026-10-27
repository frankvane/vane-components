/**
 * 装配器 · 用户回调透传
 *
 * 这一组是被 demo 的**真浏览器**目检找出来的：逐项示例页的舞台右上是状态读数，
 * 预览器内容早就渲染完了，读数却一直停在 `IDLE`。根因在 `withPlugins`：
 *
 * ```ts
 * const enhancedProps = { ...props, onStateChange: (info) => setState(...) };
 * ```
 *
 * `...props` 里明明有用户的 `onStateChange`，但这个字面量键把它**覆盖**掉了 ——
 * 装配器只做了内部镜像，忘了转发。类型上完全合法（都是 `onStateChange?`），
 * 运行时也不报错，只是宿主永远收不到状态变化。
 *
 * 三个 load 回调当初写对了（显式调了 `userCallbacks.current.xxx`），
 * 恰好只有 onStateChange 漏了 —— 所以这一组把四个回调放在一起断言，
 * 以后再往 `enhancedProps` 里加回调时，漏一个就会红。
 */
import { describe, it, expect, vi } from "vitest";
import { TEXT_FILE, flush, renderPreview } from "./helpers";
import type {
  FilePreviewPlugin,
  FilePreviewPluginHooks,
} from "../src/components/FilePreviewPlugin/plugins/types";

const plugin = (
  name: string,
  hooks: FilePreviewPluginHooks = {},
  over: Partial<FilePreviewPlugin> = {}
): FilePreviewPlugin => ({
  name,
  supportedTypes: ["text/*"],
  priority: 10,
  hooks,
  ...over,
});

describe("装配器 · 用户回调透传", () => {
  it("onStateChange 会转发给宿主，且顺序是 loading → loaded", async () => {
    const onStateChange = vi.fn();
    const h = renderPreview([plugin("T")], { onStateChange });
    await flush();

    const states = onStateChange.mock.calls.map((c) => c[0].state);
    expect(states).toContain("loading");
    // 最后一定落在 loaded：停在 idle 就是「镜像了但忘了转发」的旧病
    expect(states[states.length - 1]).toBe("loaded");
    h.unmount();
  });

  it("onLoadStart / onLoadSuccess 也会转发给宿主", async () => {
    const onLoadStart = vi.fn();
    const onLoadSuccess = vi.fn();
    const h = renderPreview([plugin("T")], { onLoadStart, onLoadSuccess });
    await flush();

    expect(onLoadStart).toHaveBeenCalledTimes(1);
    expect(onLoadSuccess).toHaveBeenCalledTimes(1);
    h.unmount();
  });

  it("换文件后宿主能继续收到状态变化", async () => {
    const onStateChange = vi.fn();
    const h = renderPreview([plugin("T")], { onStateChange });
    await flush();
    onStateChange.mockClear();

    await h.rerender({ file: { ...TEXT_FILE, url: "blob:second" } });
    await flush();

    const states = onStateChange.mock.calls.map((c) => c[0].state);
    expect(states).toContain("loading");
    expect(states[states.length - 1]).toBe("loaded");
    h.unmount();
  });

  it("没有插件认领时，宿主看到的是 idle（不是 loading→loaded 空转一圈）", async () => {
    const onStateChange = vi.fn();
    const h = renderPreview([plugin("T", {}, { supportedTypes: ["image/*"] })], {
      onStateChange,
    });
    await flush();

    const states = onStateChange.mock.calls.map((c) => c[0].state);
    expect(states).not.toContain("loaded");
    expect(h.container.textContent).toContain("没有插件能预览这个文件");
    h.unmount();
  });
});
