/**
 * `vane-file-preview/custom-plugins/ImagePreviewPlugin`
 *
 * 图片预览：缩放 / 旋转 / 复位 / 下载。全部用原生 `<img>` + CSS transform，
 * 不引任何依赖，所以它同时出现在根入口与 `./plugins` 里（ADR-16 D3）。
 *
 * ## 迁移时改掉的三处
 *
 * 1. **状态只有一份**。迁移前缩放值存了三份：组件 `useState`、`context.sharedData`
 *    里的 `imageScale`，外加 bus 上的 `zoom` / `rotate` 事件来回同步，三份靠三个
 *    `useEffect` 互相追。实际效果是**工具栏的百分比不跟着变** —— 因为工具栏由
 *    `withPlugins` 渲染，`sharedData` 不是响应式的，它读到的永远是上一次次渲染
 *    的快照。现在真源只有 `sharedData` 一份，改完调 `context.forceUpdate()`
 *    让装配层重渲染一次（内核给的「只重渲染不重排」）。
 *
 * 2. **`priority` 改成声明式**。迁移前是 `hooks.getPriority: () => 10`，
 *    10 个插件里 9 个都是常量函数，`resolve.ts` 还得为此保留一条兼容分支。
 *
 * 3. **图片加载失败不再只是 console.error**。迁移前 `onError` 里打一行日志，
 *    界面上留一块空白灰底；现在上报 `error` 状态，由 Core 显示失败面板。
 *
 * ## 一条硬约束：`render` / `renderToolbar` 里不许有 hooks
 *
 * 它们是**普通函数**（装配层直接 `winner.hooks.render(ctx)` 调用后把返回的元素
 * 塞进自己的 JSX），不是组件。在里面写 `useState` 会把 hook 注册到 `withPlugins`
 * 的 hook 链上，而这个函数在「没有赢家」「换文件」时可能一次都不被调用 ——
 * hook 数量一变，React 立刻抛 “Rendered fewer hooks than expected”。
 * 所以下面把正文与工具栏各自包成组件，钩子函数只负责**返回元素**。
 */

import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { ImageBody, ImageToolbar } from "./internal";

export interface ImagePreviewPluginConfig {
  /** 显示缩放按钮（±0.2/次）。默认 true */
  enableZoom?: boolean;
  /** 显示旋转按钮（+90°/次）。默认 true */
  enableRotate?: boolean;
  /** 缩放上限。默认 5（500%） */
  maxZoom?: number;
  /** 缩放下限。默认 0.1（10%） */
  minZoom?: number;
}

type ResolvedConfig = Required<ImagePreviewPluginConfig>;

// ============ 工厂 ============

export function createImagePreviewPlugin(
  config: ImagePreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: ResolvedConfig = {
    enableZoom: config.enableZoom ?? true,
    enableRotate: config.enableRotate ?? true,
    maxZoom: config.maxZoom ?? 5,
    minZoom: config.minZoom ?? 0.1,
  };

  return {
    name: "ImagePreviewPlugin",
    version: "1.0.0",
    description: "图片预览：缩放 / 旋转 / 复位",
    supportedTypes: ["image/*"],
    supportedExtensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".ico",
      ".avif",
    ],
    priority: 10,
    config: resolved,

    hooks: {
      render: (context) => <ImageBody context={context} config={resolved} />,
      renderToolbar: (context) => (
        <ImageToolbar context={context} config={resolved} />
      ),
    },
  };
}

export default createImagePreviewPlugin;
