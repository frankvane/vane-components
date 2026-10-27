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

import React from "react";

import { triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import { useSharedValue } from "../../components/FilePreviewPlugin/shared/useSharedValue";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

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

// 带插件前缀：sharedData 是一张跨插件的表，裸 key 会和别的插件互踩
const KEY_SCALE = "image:scale";
const KEY_ROTATION = "image:rotation";

const SCALE_STEP = 0.2;
const ROTATE_STEP = 90;

function clampScale(scale: number, config: ResolvedConfig): number {
  return Math.min(Math.max(scale, config.minZoom), config.maxZoom);
}

// ============ 正文 ============

function ImageBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const [scale, setScale] = useSharedValue(context, KEY_SCALE, 1);
  const [rotation, setRotation] = useSharedValue(context, KEY_ROTATION, 0);
  const { file, state } = context;

  // 加载中由 Core 的 loading 覆盖层显示，失败由 Core 的 error 面板显示 ——
  // 这里只管「成功之后画什么」，不重复造状态 UI。
  if (state.state !== "loaded") return null;

  const reset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <img
        src={file.url}
        alt={file.name}
        draggable={false}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          transform: `scale(${clampScale(scale, config)}) rotate(${rotation}deg)`,
          // 复位/缩放走同一条过渡，避免「点复位时突跳」
          transition: "transform 0.2s ease",
          cursor: config.enableZoom ? "zoom-in" : "default",
          userSelect: "none",
        }}
        onDoubleClick={reset}
        onError={() => {
          context.reportState({
            state: "error",
            message: `图片加载失败：${file.name}`,
          });
        }}
      />
    </div>
  );
}

// ============ 工具栏 ============

function ImageToolbar({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const [scale, setScale] = useSharedValue(context, KEY_SCALE, 1);
  const [rotation, setRotation] = useSharedValue(context, KEY_ROTATION, 0);

  const zoomBy = (delta: number) => {
    const next = clampScale(scale + delta, config);
    // 定到 3 位小数：0.2 累加会出 0.30000000000000004
    setScale(Math.round(next * 1000) / 1000);
  };

  return (
    <ToolbarContainer>
      <FileMeta
        name={context.file.name}
        size={context.file.size}
        type="Image"
        icon="🖼️"
      />

      <ToolbarSeparator />

      <span
        style={{
          fontSize: 12,
          color: "#656d76",
          fontWeight: 500,
          width: 50,
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
        }}
      >
        {Math.round(scale * 100)}%
      </span>

      {config.enableZoom && (
        <>
          <ToolbarButton
            onClick={() => zoomBy(-SCALE_STEP)}
            title="缩小"
            variant="icon"
            disabled={scale <= config.minZoom}
          >
            −
          </ToolbarButton>
          <ToolbarButton
            onClick={() => zoomBy(SCALE_STEP)}
            title="放大"
            variant="icon"
            disabled={scale >= config.maxZoom}
          >
            +
          </ToolbarButton>
        </>
      )}

      {config.enableRotate && (
        <ToolbarButton
          onClick={() => setRotation((rotation + ROTATE_STEP) % 360)}
          title={`旋转（当前 ${rotation}°）`}
          variant="icon"
        >
          ⟳
        </ToolbarButton>
      )}

      <ToolbarButton
        onClick={() => {
          setScale(1);
          setRotation(0);
        }}
        title="复位"
        variant="icon"
      >
        ↺
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => triggerDownload(context.file.url, context.file.name)}
        icon="📥"
        title="下载图片"
      >
        下载
      </ToolbarButton>
    </ToolbarContainer>
  );
}

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
