import React from "react";
import { isHorizontalPlacement, type SheetPlacement } from "./engine";

/**
 * 弹层 DOM 壳：portal 根节点 + 面板 + 内容区 + overlay。
 * 只承载结构与内联样式，状态机 / 生命周期 / 几何全部留在 ModalSheetCore；
 * transform / 主尺寸 / 横向交叉轴高度由引擎直接写 DOM，这里不参与决策。
 */
export interface SheetPanelProps {
  containerRef: React.Ref<HTMLDivElement>;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  zIndex: number;
  panelRef: React.MutableRefObject<HTMLDivElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  placement?: SheetPlacement;
  width?: number | string;
  horizontalAlign: "left" | "center" | "right";
  panelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  ariaLabel?: string;
  ariaLabelledby?: string;
  backdrop?: React.ReactNode;
  handle?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  overlay?: React.ReactNode[];
  children?: React.ReactNode;
}

export function SheetPanel({
  containerRef,
  containerClassName,
  containerStyle,
  zIndex,
  panelRef,
  contentRef,
  placement = "bottom",
  width,
  horizontalAlign,
  panelStyle,
  contentStyle,
  ariaLabel,
  ariaLabelledby,
  backdrop,
  handle,
  header,
  footer,
  overlay,
  children,
}: SheetPanelProps) {
  const horizontal = isHorizontalPlacement(placement);
  // 圆角按抽伸边：底部圆上方两角、顶部圆下方两角、左右圆朝向内容一侧
  const radius = "var(--vane-modal-sheet-radius, 16px)";
  const borderRadius =
    placement === "top"
      ? `0 0 ${radius} ${radius}`
      : placement === "left"
        ? `0 ${radius} ${radius} 0`
        : placement === "right"
          ? `${radius} 0 0 ${radius}`
          : `${radius} ${radius} 0 0`;

  return (
    <div
      ref={containerRef}
      className={containerClassName ?? "vc-ms-root"}
      data-vane-modal-sheet=""
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        pointerEvents: "none",
        ...containerStyle,
      }}
    >
      {backdrop}
      <div
        ref={panelRef}
        className="vc-ms-panel"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || undefined}
        aria-labelledby={ariaLabelledby || undefined}
        style={{
          position: "absolute",
          // 纵向：width 不为全宽时由 horizontalAlign 决定停靠边；
          // 横向：left/right 各自吸边，主尺寸（宽）与交叉轴高度由引擎写 DOM，
          // 这里不能声明 width/height/top，否则 React 重渲染会把引擎的 px 覆盖掉。
          left: horizontal
            ? placement === "right"
              ? "auto"
              : 0
            : horizontalAlign === "right"
              ? "auto"
              : 0,
          right: horizontal
            ? placement === "left"
              ? "auto"
              : 0
            : horizontalAlign === "left"
              ? "auto"
              : 0,
          margin:
            !horizontal && horizontalAlign === "center" && width !== undefined
              ? "0 auto"
              : undefined,
          width: horizontal ? undefined : width ?? "100%",
          // 顶部锚定：engine 的 translate 语义是「面板顶点 = 锚点」。
          // 不能用 bottom:0 —— 那会让面板初始顶部落在 (viewportH - panelH)，
          // 叠加 translate 后实际位置系统性偏低同样的量：矮面板（detent:content
          // 的 100px 条）会被整条推出视口外。横向的 top 由引擎写（可垂直居中）。
          top: horizontal ? undefined : 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
          // 容器自带 color + background（ADR-13），颜色走 token 可覆盖
          background: "var(--vane-modal-sheet-bg, #ffffff)",
          color: "var(--vane-modal-sheet-ink, #1f2329)",
          borderRadius,
          pointerEvents: "auto",
          ...panelStyle,
        }}
      >
        {handle}
        {header}
        <div
          ref={contentRef}
          className="vc-ms-content"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            boxSizing: "border-box",
            ...contentStyle,
          }}
        >
          {children}
        </div>
        {footer}
        {overlay && overlay.length > 0 ? (
          <div
            className="vc-ms-overlay"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {overlay}
          </div>
        ) : null}
      </div>
    </div>
  );
}
