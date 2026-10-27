/**
 * 测试公共桩。
 *
 * happy-dom 没有布局引擎，也没有真实的计时器语义，所以这里只做两件事：
 *  - `flush()`：把 async 钩子推进到稳定（Core 的加载流程是 async 的，
 *    同步断言会读到「还没跑」的假象）
 *  - `renderCore()`：渲染裸 Core（状态机就在这一层，插件无关）
 * P2 换掉装配器后再补 `renderPreview()`。
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import FilePreviewCore, {
  type FilePreviewCoreProps,
  type FilePreviewCoreRef,
} from "../src/components/FilePreviewPlugin/core/FilePreviewCore";
import { withPlugins } from "../src/components/FilePreviewPlugin/plugins/withPlugins";
import type {
  FileInfo,
  FilePreviewPlugin,
} from "../src/components/FilePreviewPlugin/plugins/types";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

export const TEXT_FILE: FileInfo = {
  name: "notes.txt",
  size: 12,
  type: "text/plain",
  extension: "txt",
  url: "blob:notes",
  lastModified: 1_700_000_000_000,
};

export interface CoreHandle {
  container: HTMLDivElement;
  root: Root;
  ref: React.RefObject<FilePreviewCoreRef>;
  unmount: () => void;
  /** 用新的 props 重渲染同一棵树（验证 file.url 变化才会重跑加载） */
  rerender: (next: Partial<FilePreviewCoreProps>) => Promise<void>;
}

/**
 * 冲刷微任务。
 *
 * Core 的 `runLoad` 至少有一次 `await Promise.resolve(onBeforeLoad?.())`，
 * 所以渲染后必须显式等一轮；包在 `act` 里保证期间的 setState 被正常处理。
 */
export async function flush(times = 3): Promise<void> {
  await act(async () => {
    for (let i = 0; i < times; i += 1) {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
}

/**
 * 等到某个条件成立，最多轮询 `rounds` 次。
 *
 * 为什么需要它：`flush(n)` 是「猜 n 够不够」。B 批插件的链路长度不一样
 * （Zip：import → fetch → 解包；Pptx：再乘上逐页 DOMParser），
 * 猜小了断言在 loading 面板上失败，猜大了白等，而且换个 happy-dom 版本就可能翻车。
 * 这里改成「轮询到条件成立」——断言本身还是那条断言，只是不再依赖轮数。
 */
export async function waitFor(
  check: () => boolean,
  message = "waitFor 超出轮数上限",
  rounds = 60
): Promise<void> {
  for (let i = 0; i < rounds; i += 1) {
    if (check()) return;
    await flush(1);
  }
  if (check()) return;
  throw new Error(message);
}

export function renderCore(
  props: Partial<FilePreviewCoreProps> = {}
): CoreHandle {
  const ref = React.createRef<FilePreviewCoreRef>();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  let current: FilePreviewCoreProps = { file: TEXT_FILE, ...props };
  const render = (p: FilePreviewCoreProps) =>
    root.render(React.createElement(FilePreviewCore, { ref, ...p } as never));

  act(() => {
    render(current);
  });

  return {
    container,
    root,
    ref,
    unmount: () => act(() => root.unmount()),
    rerender: async (next) => {
      current = { ...current, ...next };
      await act(async () => {
        render(current);
      });
      await flush();
    },
  };
}

/**
 * 渲染「Core + 装配器」的完整链路。
 *
 * `plugins` 传进来后立刻 `withPlugins` 定型 —— 测试里每个用例只渲染一次，
 * 不需要像 demo 那样顾虑「每次渲染造新组件类型」。
 */
export function renderPreview(
  plugins: FilePreviewPlugin[],
  props: Partial<FilePreviewCoreProps> = {}
): CoreHandle {
  const Wrapped = withPlugins(FilePreviewCore, { plugins });
  const ref = React.createRef<FilePreviewCoreRef>();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  let current: FilePreviewCoreProps = { file: TEXT_FILE, ...props };
  const render = (p: FilePreviewCoreProps) =>
    root.render(React.createElement(Wrapped, { ref, ...p }));

  act(() => {
    render(current);
  });

  return {
    container,
    root,
    ref,
    unmount: () => act(() => root.unmount()),
    rerender: async (next) => {
      current = { ...current, ...next };
      await act(async () => {
        render(current);
      });
      await flush();
    },
  };
}
