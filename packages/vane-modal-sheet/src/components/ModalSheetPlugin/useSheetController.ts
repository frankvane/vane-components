import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  createSheetEngine,
  createSheetState,
  resolveMaxHeight,
  type SheetEngine,
  type SheetEngineState,
} from "./engine";
import type {
  ModalSheetCoreProps,
  ModalSheetCoreRef,
  ModalSheetDragProps,
} from "./plugins/types";

export interface SheetController {
  containerRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.MutableRefObject<HTMLDivElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  visible: boolean;
  state: SheetEngineState;
}

/**
 * Core 的状态机 / 生命周期 / 几何控制器（Core 私有 hook）：
 * 创建引擎、绑定 ref、跑打开关闭补间与几何重算；DOM 交给 SheetPanel。
 */
export function useSheetController(
  props: ModalSheetCoreProps,
  ref: React.ForwardedRef<ModalSheetCoreRef>
): SheetController {
  const {
    isOpen,
    containerRefExternal,
    sheetState,
    onMount,
    onUnmount,
    debug,
  } = props;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const containerRef: React.RefObject<HTMLDivElement | null> =
    containerRefExternal ?? rootRef;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [, setTick] = useState(0);
  // 关闭补间期间保持 portal 挂载；引擎 onClose 完成后才真正卸载
  const [visible, setVisible] = useState(isOpen);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const propsRef = useRef(props);

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
      getPlacement: () => propsRef.current.placement ?? "bottom",
      getDetent: () => propsRef.current.detent ?? "default",
      getMaxHeight: () =>
        resolveMaxHeight(
          propsRef.current.maxHeight,
          typeof window !== "undefined" ? window.innerHeight : 0
        ),
      getInitialSnap: () => propsRef.current.initialSnap ?? 0,
      getTweenDuration: () => propsRef.current.tweenDuration ?? 240,
      getPrefersReducedMotion: () => propsRef.current.prefersReducedMotion ?? false,
      getVelocityThreshold: () => propsRef.current.dragVelocityThreshold ?? 500,
      getCloseThreshold: () => propsRef.current.dragCloseThreshold ?? 0.6,
      getCloseMinDistance: () => 8,
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
      onClose: (fromExternal?: boolean) => {
        setVisible(false);
        visibleRef.current = false;
        const bridge = propsRef.current.engineCallbacks;
        if (bridge?.onClose) bridge.onClose(fromExternal);
        else if (!fromExternal) propsRef.current.onClose?.();
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

  // 同一次提交内先同步 propsRef，再执行打开 / 几何测量（hook 顺序很重要）
  useLayoutEffect(() => {
    propsRef.current = props;
  });

  // 打开：先量几何再从 hiddenY 补间到初始档；
  // 外部关闭：先补间下滑，引擎 onClose 完成后再卸载 portal。
  useLayoutEffect(() => {
    if (isOpen) {
      setVisible(true);
      visibleRef.current = true;
      engine.open();
    } else if (visibleRef.current && s.phase !== "closed") {
      engine.close(true);
    } else {
      setVisible(false);
      visibleRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(
    () => () => {
      engine.destroy();
      s.engine = null;
    },
    [engine, s]
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

  // 几何参数变化时重算，保持当前档并夹紧索引；不触发关闭/重开。
  const geomSignatureRef = useRef<string | null>(null);
  useEffect(() => {
    const signature = JSON.stringify([
      props.placement,
      props.snapPoints,
      props.detent,
      props.maxHeight,
      props.initialSnap,
    ]);
    if (geomSignatureRef.current === null) {
      geomSignatureRef.current = signature;
      return;
    }
    if (geomSignatureRef.current === signature) return;
    geomSignatureRef.current = signature;
    if (!isOpen || !panelRef.current) return;
    engine.measure();
    if (s.phase === "open") {
      engine.snapTo(Math.min(s.snapIndex, s.snapYs.length - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.placement,
    props.snapPoints,
    props.detent,
    props.maxHeight,
    props.initialSnap,
    isOpen,
  ]);

  useEffect(() => {
    if (debug) console.debug("[ModalSheetCore] mounted");
    onMount?.();
    return () => onUnmount?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { containerRef, panelRef, contentRef, visible, state: s };
}
