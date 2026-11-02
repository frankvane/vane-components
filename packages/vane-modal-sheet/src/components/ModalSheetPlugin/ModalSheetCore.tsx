import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  createSheetEngine,
  createSheetState,
  type SheetEngine,
  type SheetEngineState,
} from "./engine";
import { useModalSheetSlot } from "./plugins/slots";
import type {
  ModalSheetCoreProps,
  ModalSheetCoreRef,
  ModalSheetDragProps,
} from "./plugins/types";

/**
 * 底部弹层核心组件。
 * 铁律：核心只做「渲染 + 生命周期 + 几何」，是 snap/拖拽的唯一决策者；
 * 视觉件（遮罩/把手/头尾/叠加层）全交插件槽位，可变需求不进核心。
 */
export const ModalSheetCore = forwardRef<ModalSheetCoreRef, ModalSheetCoreProps>(
  (props, ref) => {
    const {
      isOpen,
      children,
      zIndex = 1000,
      width,
      horizontalAlign = "center",
      containerClassName,
      containerStyle,
      panelStyle,
      contentStyle,
      containerRefExternal,
      sheetState,
      onMount,
      onUnmount,
      debug,
    } = props;

    const rootRef = useRef<HTMLDivElement | null>(null);
    const containerRef = containerRefExternal ?? rootRef;
    const panelRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [, setTick] = useState(0);
    const propsRef = useRef(props);
    propsRef.current = props;

    const localStateRef = useRef<SheetEngineState | null>(null);
    if (localStateRef.current === null) {
      localStateRef.current = sheetState ?? createSheetState();
    }
    const s = localStateRef.current;

    const engineRef = useRef<SheetEngine | null>(null);
    if (engineRef.current === null) {
      engineRef.current = createSheetEngine({
        state: s,
        getRoot: () => containerRef.current,
        getPanel: () => panelRef.current,
        getContent: () => contentRef.current,
        getSnapPoints: () => propsRef.current.snapPoints,
        getDetent: () => propsRef.current.detent ?? "default",
        getInitialSnap: () => propsRef.current.initialSnap ?? 0,
        getTweenDuration: () => propsRef.current.tweenDuration ?? 240,
        getPrefersReducedMotion: () => propsRef.current.prefersReducedMotion ?? false,
        getVelocityThreshold: () => propsRef.current.dragVelocityThreshold ?? 500,
        getCloseThreshold: () => propsRef.current.dragCloseThreshold ?? 0.6,
        onSnap: (index) => {
          s.snapIndex = index;
          const bridge = propsRef.current.engineCallbacks;
          if (bridge?.onSnap) bridge.onSnap(index);
          else propsRef.current.onSnap?.(index);
        },
        onOpen: () => {
          const bridge = propsRef.current.engineCallbacks;
          if (bridge?.onOpen) bridge.onOpen();
          else propsRef.current.onOpen?.();
        },
        onClose: () => {
          const bridge = propsRef.current.engineCallbacks;
          if (bridge?.onClose) bridge.onClose();
          else propsRef.current.onClose?.();
        },
      });
    }
    const engine = engineRef.current;
    // 回写到共享 state，供 HOC 的 context.getDragProps 在首帧渲染期就能拿到
    // （槽位渲染发生在本组件 useImperativeHandle 之前）
    s.engine = engine;

    const getDragProps = (): ModalSheetDragProps => ({
      onPointerDown: (e) => {
        e.preventDefault();
        engine.handlePointerDown(e);
      },
      style: { touchAction: "none" },
      "data-vane-ms-drag": "true",
    });

    useImperativeHandle(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        getPanel: () => panelRef.current,
        forceUpdate: () => setTick((t) => t + 1),
        snapTo: (index: number) => engine.snapTo(index),
        close: () => engine.close(),
        getProgress: () => s.progress,
        getCurrentSnap: () => s.snapIndex,
        setViewportInset: (px: number) => engine.setViewportInset(px),
        getDragProps,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [engine, containerRef]
    );

    // 开关：打开时先量几何再从 hiddenY 补间到初始档
    useLayoutEffect(() => {
      if (isOpen) engine.open();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(
      () => () => {
        engine.destroy();
        s.engine = null;
      },
      [engine, s],
    );

    // 视口变化（旋转/缩放）重算吸附；稳态下回到当前档
    useEffect(() => {
      const onResize = () => {
        if (s.phase === "open") engine.snapTo(s.snapIndex);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [engine]);

    useEffect(() => {
      if (debug) console.debug("[ModalSheetCore] mounted");
      onMount?.();
      return () => onUnmount?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const backdropNodes = useModalSheetSlot("renderBackdrop");
    const handleNodes = useModalSheetSlot("renderHandle");
    const headerNodes = useModalSheetSlot("renderHeader");
    const footerNodes = useModalSheetSlot("renderFooter");
    const overlayNodes = useModalSheetSlot("renderOverlay");

    if (!isOpen) return null;

    return createPortal(
      <div
        ref={containerRef as React.Ref<HTMLDivElement>}
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
        {backdropNodes}
        <div
          ref={panelRef}
          className="vc-ms-panel"
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            // 水平停靠：width 不为全宽时由 horizontalAlign 决定停靠边
            left: horizontalAlign === "right" ? "auto" : 0,
            right: horizontalAlign === "left" ? "auto" : 0,
            margin:
              horizontalAlign === "center" && width !== undefined
                ? "0 auto"
                : undefined,
            width: width ?? "100%",
            // 顶部锚定：engine 的 translateY(y) 语义是「面板顶部 = y」。
            // 不能用 bottom:0 —— 那会让面板初始顶部落在 (viewportH - panelH)，
            // 叠加 translateY 后实际位置系统性偏低同样的量：矮面板（detent:content
            // 的 100px 条）会被整条推出视口外。
            top: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxSizing: "border-box",
            // 容器自带 color + background（ADR-13），颜色走 token 可覆盖
            background: "var(--vane-modal-sheet-bg, #ffffff)",
            color: "var(--vane-modal-sheet-ink, #1f2329)",
            borderRadius: "var(--vane-modal-sheet-radius, 16px) 16px 0 0",
            pointerEvents: "auto",
            ...panelStyle,
          }}
        >
          {handleNodes}
          {headerNodes}
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
          {footerNodes}
          {overlayNodes.length > 0 ? (
            <div
              className="vc-ms-overlay"
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              {overlayNodes}
            </div>
          ) : null}
        </div>
      </div>,
      document.body
    );
  }
);

ModalSheetCore.displayName = "ModalSheetCore";
