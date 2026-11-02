import React, { forwardRef } from "react";
import { createPortal } from "react-dom";
import { SheetPanel } from "./SheetPanel";
import { useSheetController } from "./useSheetController";
import { useModalSheetSlot } from "./plugins/slots";
import type {
  ModalSheetCoreProps,
  ModalSheetCoreRef,
} from "./plugins/types";

/**
 * 弹层核心组件（默认底部，支持 bottom/top/left/right 四向抽伸）。
 * 铁律：核心只做「渲染 + 生命周期 + 几何」，是 snap/拖拽的唯一决策者；
 * 视觉件（遮罩/把手/头尾/叠加层）全交插件槽位，可变需求不进核心。
 * 状态机 / 生命周期 / 几何在 useSheetController，DOM 壳在 SheetPanel。
 */
export const ModalSheetCore = forwardRef<ModalSheetCoreRef, ModalSheetCoreProps>(
  (props, ref) => {
    const {
      isOpen,
      children,
      zIndex = 1000,
      placement = "bottom",
      width,
      horizontalAlign = "center",
      containerClassName,
      containerStyle,
      panelStyle,
      contentStyle,
      ariaLabel,
      ariaLabelledby,
    } = props;

    const { containerRef, panelRef, contentRef, visible } = useSheetController(
      props,
      ref
    );

    const backdropNodes = useModalSheetSlot("renderBackdrop");
    const handleNodes = useModalSheetSlot("renderHandle");
    const headerNodes = useModalSheetSlot("renderHeader");
    const footerNodes = useModalSheetSlot("renderFooter");
    const overlayNodes = useModalSheetSlot("renderOverlay");

    // SSR 首屏不 portal；客户端 hydrate 后正常渲染
    if (typeof document === "undefined") return null;
    const shouldRender = isOpen || visible;
    if (!shouldRender) return null;

    return createPortal(
      <SheetPanel
        containerRef={containerRef as React.Ref<HTMLDivElement>}
        containerClassName={containerClassName}
        containerStyle={containerStyle}
        zIndex={zIndex}
        panelRef={panelRef}
        contentRef={contentRef}
        placement={placement}
        width={width}
        horizontalAlign={horizontalAlign}
        panelStyle={panelStyle}
        contentStyle={contentStyle}
        ariaLabel={ariaLabel}
        ariaLabelledby={ariaLabelledby}
        backdrop={backdropNodes}
        handle={handleNodes}
        header={headerNodes}
        footer={footerNodes}
        overlay={overlayNodes}
      >
        {children}
      </SheetPanel>,
      document.body
    );
  }
);

ModalSheetCore.displayName = "ModalSheetCore";
