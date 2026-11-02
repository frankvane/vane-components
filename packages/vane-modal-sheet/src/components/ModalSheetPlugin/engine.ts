/**
 * vane-modal-sheet 几何引擎 —— 内核唯一决策者（插件不碰 transform）。
 *
 * 坐标约定：y = 面板 translateY(px)。0 = 完全展开（最高档顶到视口顶），
 * hiddenY = 完全关闭（面板整体滑出视口底）。velocity 单位 px/s，向下滑为正。
 *
 * resolveSnap / resolveSnapPixels 是纯函数，CI（happy-dom 无布局）也能全量单测；
 * createSheetEngine 是命令式拖拽控制器，React 只负责挂载与桥接。
 */

export type SheetPhase =
  | "closed"
  | "opening"
  | "open"
  | "dragging"
  | "snapping"
  | "closing";

export type SheetDetent = "default" | "content" | "full";

/** 内核与领域 context 共享的可变时基状态（真源；React 侧不持有第二份） */
export interface SheetEngineState {
  phase: SheetPhase;
  /** 当前吸附档索引 */
  snapIndex: number;
  /** 当前 translateY px */
  y: number;
  /** 0–1 打开进度（1 = 完全展开） */
  progress: number;
  /** 每档的 translateY，升序（index 0 = 最高档） */
  snapYs: number[];
  /** 完全关闭时的 y（= 视口高 - inset） */
  hiddenY: number;
  viewportH: number;
  contentH: number;
  /** 键盘等占用的视口 inset px */
  viewportInset: number;
  /**
   * 拖拽锁：NestedScroll / LoadingState 等插件置 true 时 handlePointerDown 直接
   * 忽略（内容还没滚到顶 / 加载中不允许拖拽）。
   */
  dragLock?: boolean;
  /**
   * 引擎控制器由 Core 创建后回写到共享 state 上 —— HOC 的 context.getDragProps
   * 从这里读，不走 forwardRef（槽位渲染发生在 useImperativeHandle 之前，ref 那条路
   * 首帧拿不到，拖拽面会静默失效）。
   */
  engine?: SheetEngine | null;
}

export function createSheetState(): SheetEngineState {
  return {
    phase: "closed",
    snapIndex: 0,
    y: 0,
    progress: 0,
    snapYs: [0],
    hiddenY: 0,
    viewportH: 0,
    contentH: 0,
    viewportInset: 0,
  };
}

// ---------- 纯函数决策引擎 ----------

export interface SnapDecisionInput {
  /** 当前 y（translateY px） */
  y: number;
  /** 松手速度 px/s，向下滑（关闭方向）为正 */
  velocity: number;
  /** 每档 translateY，升序（index 0 = 最高档） */
  snapYs: number[];
  /** 完全关闭时的 y */
  hiddenY: number;
  /** 快速下滑关闭速度阈值 px/s */
  velocityThreshold: number;
  /** 拖出比例关闭阈值 0–1（相对最高档 → 完全关闭的距离） */
  closeThreshold: number;
}

export type SnapDecision =
  | { type: "snap"; index: number }
  | { type: "close" };

/**
 * 松手后去哪（裁决顺序：快速下滑 → 拖出比例 → 最近档）。
 * 纯函数：CI 无布局环境即可全量单测。
 */
export function resolveSnap(input: SnapDecisionInput): SnapDecision {
  const { y, velocity, snapYs, hiddenY, velocityThreshold, closeThreshold } = input;
  if (snapYs.length === 0) return { type: "close" };
  const topY = snapYs[0];
  const range = Math.max(hiddenY - topY, 1);
  // 1. 快速下滑：直接关闭
  if (velocity >= velocityThreshold) return { type: "close" };
  // 2. 拖出比例超阈值：关闭
  if (y - topY > range * closeThreshold) return { type: "close" };
  // 3. 最近档
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < snapYs.length; i++) {
    const d = Math.abs(snapYs[i] - y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return { type: "snap", index: best };
}

/**
 * snapPoints（升序；0–1 比例 / >1 像素）→ 每档 translateY（升序）。
 * detent === "content"：最高档夹到 min(contentH, viewportH)；
 * detent === "full"：最高档夹到 viewportH。
 */
export function resolveSnapPixels(
  snapPoints: number[] | undefined,
  opts: { viewportH: number; contentH: number; detent: SheetDetent }
): number[] {
  const { viewportH, contentH, detent } = opts;
  if (viewportH <= 0) return [0];
  const pts =
    snapPoints && snapPoints.length > 0
      ? [...snapPoints].sort((a, b) => a - b)
      : [1];
  const last = pts.length - 1;
  return pts
    .map((p, i) => {
      let h = p <= 1 ? p * viewportH : p;
      if (i === last) {
        if (detent === "full") h = viewportH;
        else if (detent === "content" && contentH > 0) h = Math.min(h, contentH);
      }
      return Math.max(viewportH - h, 0);
    })
    // 升序（index 0 = 最高档）；快照档约定见 SheetEngineState.snapYs
    .sort((a, b) => a - b);
}

export function computeProgress(s: {
  y: number;
  hiddenY: number;
  snapYs: number[];
}): number {
  const range = Math.max(s.hiddenY - (s.snapYs[0] ?? 0), 1);
  return Math.min(Math.max((s.hiddenY - s.y) / range, 0), 1);
}

// ---------- 命令式拖拽控制器 ----------

export interface SheetEngineOps {
  state: SheetEngineState;
  getRoot(): HTMLElement | null;
  getPanel(): HTMLElement | null;
  getContent(): HTMLElement | null;
  getSnapPoints(): number[] | undefined;
  getDetent(): SheetDetent;
  getInitialSnap(): number;
  getTweenDuration(): number;
  getPrefersReducedMotion(): boolean;
  getVelocityThreshold(): number;
  getCloseThreshold(): number;
  /** 吸附完成（含打开补间结束） */
  onSnap(index: number): void;
  /** 打开补间完成 */
  onOpen(): void;
  /** 关闭补间完成 */
  onClose(): void;
}

export interface SheetEngine {
  measure(): void;
  open(): void;
  close(): void;
  snapTo(index: number): void;
  setViewportInset(px: number): void;
  handlePointerDown(e: { clientY: number }): void;
  destroy(): void;
}

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function createSheetEngine(ops: SheetEngineOps): SheetEngine {
  const s = ops.state;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let drag: {
    startY: number;
    y0: number;
    lastY: number;
    lastT: number;
    velocity: number;
  } | null = null;

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), hi);

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function measure() {
    const vh =
      (typeof window !== "undefined" ? window.innerHeight : 0) - s.viewportInset;
    s.viewportH = Math.max(vh, 0);
    s.hiddenY = s.viewportH;
    s.contentH = ops.getContent()?.scrollHeight ?? 0;
    s.snapYs = resolveSnapPixels(ops.getSnapPoints(), {
      viewportH: s.viewportH,
      contentH: s.contentH,
      detent: ops.getDetent(),
    });
    // 面板高度 = 最高档高度（bottom 锚定，translate 控制档位）——直接写 DOM，
    // 避免为几何值引入一帧 React 渲染
    const panel = ops.getPanel();
    if (panel && s.snapYs.length > 0) {
      panel.style.height = `${Math.max(s.hiddenY - s.snapYs[0], 0)}px`;
    }
  }

  function applyY(y: number, transition: boolean) {
    s.y = y;
    s.progress = computeProgress(s);
    const panel = ops.getPanel();
    if (panel) {
      panel.style.transition = transition
        ? `transform ${ops.getTweenDuration()}ms ${EASE}`
        : "none";
      panel.style.transform = `translate3d(0, ${y}px, 0)`;
    }
    // 进度联动走 CSS 变量（遮罩透明度等零 React 渲染成本）
    ops
      .getRoot()
      ?.style.setProperty("--vane-ms-progress", s.progress.toFixed(4));
  }

  function waitTween(cb: () => void) {
    const ms = ops.getPrefersReducedMotion() ? 0 : ops.getTweenDuration();
    if (ms <= 0) {
      cb();
      return;
    }
    clearTimer();
    timer = setTimeout(cb, ms + 16);
  }

  function clampIndex(index: number): number {
    if (s.snapYs.length === 0) return 0;
    return clamp(Math.round(index), 0, s.snapYs.length - 1);
  }

  function open() {
    clearTimer();
    measure();
    if (s.snapYs.length === 0) return;
    const index = clampIndex(ops.getInitialSnap());
    s.snapIndex = index;
    applyY(s.hiddenY, false);
    // 首帧渲染在隐藏位，下一帧补间到目标档。rAF 在后台标签页 / 部分无头
    // 环境会被节流甚至不跑，必须挂 setTimeout 兜底（幂等，先到先执行），
    // 否则弹层永远停在视口外、progress 停 0。
    let started = false;
    const startTween = () => {
      if (started) return;
      started = true;
      applyY(s.snapYs[index], true);
      waitTween(() => {
        s.phase = "open";
        ops.onOpen();
        ops.onSnap(index);
      });
    };
    requestAnimationFrame(startTween);
    setTimeout(startTween, 32);
  }

  function close() {
    clearTimer();
    if (s.phase === "closed") return;
    applyY(s.hiddenY, true);
    waitTween(() => {
      s.phase = "closed";
      s.progress = 0;
      ops.getRoot()?.style.setProperty("--vane-ms-progress", "0");
      ops.onClose();
    });
  }

  function snapTo(index: number) {
    measure();
    if (s.snapYs.length === 0) return;
    const i = clampIndex(index);
    clearTimer();
    s.snapIndex = i;
    applyY(s.snapYs[i], true);
    waitTween(() => {
      s.phase = "open";
      ops.onSnap(i);
    });
  }

  function setViewportInset(px: number) {
    const next = Math.max(0, Math.round(px));
    if (next === s.viewportInset) return;
    s.viewportInset = next;
    if (s.phase === "open" || s.phase === "snapping" || s.phase === "dragging") {
      snapTo(s.snapIndex);
    } else {
      measure();
    }
  }

  function handleMove(e: PointerEvent) {
    if (!drag) return;
    const t = typeof performance !== "undefined" ? performance.now() : Date.now();
    const dt = t - drag.lastT;
    if (dt > 0) {
      // 指数平滑速度估计（px/s，向下为正）
      drag.velocity =
        0.8 * drag.velocity + 0.2 * ((e.clientY - drag.lastY) / dt) * 1000;
      drag.lastY = e.clientY;
      drag.lastT = t;
    }
    const next = clamp(drag.y0 + (e.clientY - drag.startY), 0, s.hiddenY);
    applyY(next, false);
  }

  function handleUp() {
    detachDragListeners();
    if (!drag) return;
    const d = drag;
    drag = null;
    const decision = resolveSnap({
      y: s.y,
      velocity: d.velocity,
      snapYs: s.snapYs,
      hiddenY: s.hiddenY,
      velocityThreshold: ops.getVelocityThreshold(),
      closeThreshold: ops.getCloseThreshold(),
    });
    if (decision.type === "close") {
      close();
    } else {
      snapTo(decision.index);
    }
  }

  function detachDragListeners() {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  }

  function handlePointerDown(e: { clientY: number }) {
    // 只能在稳态（open）下发起拖拽；snapping 中打断会出现半途速度误判
    if (s.phase !== "open") return;
    // 插件拖拽锁（NestedScroll / LoadingState）
    if (s.dragLock) return;
    clearTimer();
    const t = typeof performance !== "undefined" ? performance.now() : Date.now();
    drag = { startY: e.clientY, y0: s.y, lastY: e.clientY, lastT: t, velocity: 0 };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  function destroy() {
    clearTimer();
    detachDragListeners();
    drag = null;
  }

  return {
    measure,
    open,
    close,
    snapTo,
    setViewportInset,
    handlePointerDown,
    destroy,
  };
}
