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

/**
 * 抽伸方位：底部（默认）/ 顶部 / 左侧 / 右侧。
 * 横向方位（left/right）沿视口宽抽伸，snapPoints 的比例按视口宽折算；
 * 纵向方位（bottom/top）沿视口高抽伸。
 */
export type SheetPlacement = "bottom" | "top" | "left" | "right";

export function isHorizontalPlacement(placement: SheetPlacement = "bottom"): boolean {
  return placement === "left" || placement === "right";
}

/**
 * 关闭行程是否等于面板自身主尺寸。
 * top/left/right 都贴边锚定（top:0 / left:0 / right:0），滑出视口只需自身尺寸；
 * bottom 的锚点是面板顶部（top:0），要滑到视口底就必须走满视口高 + 面板高，
 * 因此用视口尺寸。
 */
export function closesByOwnSize(placement: SheetPlacement = "bottom"): boolean {
  return placement !== "bottom";
}

/** 内核与领域 context 共享的可变时基状态（真源；React 侧不持有第二份） */
export interface SheetEngineState {
  phase: SheetPhase;
  /** 当前吸附档索引 */
  snapIndex: number;
  /**
   * 当前「向关闭方向」的位移 px（与方位无关的标量）：
   * 0 = 完全展开，hiddenY = 完全关闭；实际 transform 由 applyY 按 placement 投影。
   */
  y: number;
  /** 0–1 打开进度（1 = 完全展开） */
  progress: number;
  /** 每档的关闭方向位移，升序（index 0 = 最高档） */
  snapYs: number[];
  /** 完全关闭时的位移：bottom = 视口尺寸，top/left/right = 面板自身主尺寸 */
  hiddenY: number;
  /** 沿抽伸轴的单向尺寸（纵向 = 视口高 - inset，横向 = 视口宽） */
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
  /** 速度关闭的最小下移量 px（默认 8，防止轻扫误关） */
  minCloseDistance?: number;
}

export type SnapDecision =
  | { type: "snap"; index: number }
  | { type: "close" };

/**
 * 松手后去哪（裁决顺序：快速下滑 → 拖出比例 → 最近档）。
 * 纯函数：CI 无布局环境即可全量单测。
 */
export function resolveSnap(input: SnapDecisionInput): SnapDecision {
  const {
    y,
    velocity,
    snapYs,
    hiddenY,
    velocityThreshold,
    closeThreshold,
    minCloseDistance = 8,
  } = input;
  if (snapYs.length === 0) return { type: "close" };
  const topY = snapYs[0];
  const range = Math.max(hiddenY - topY, 1);
  // 1. 快速下滑：直接关闭（必须真的拖出一段距离，避免轻扫误关）
  if (velocity >= velocityThreshold && y - topY >= minCloseDistance) {
    return { type: "close" };
  }
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
 * maxHeight 归一化：undefined / 非法 / <=0 → Infinity（无上限）。
 * 支持数字 px、"480px"、"72vh"、"80%"（后两者按 viewportH 折算）。
 */
export function resolveMaxHeight(
  value: number | string | undefined,
  viewportH: number
): number {
  if (value === undefined || value === null) return Infinity;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : Infinity;
  }
  const raw = value.trim().toLowerCase();
  if (!raw) return Infinity;
  const match = /^([+-]?(?:\d+\.?\d*|\.\d+))(vh|%|px)?$/.exec(raw);
  if (!match) return Infinity;
  const n = parseFloat(match[1]);
  if (!Number.isFinite(n) || n <= 0) return Infinity;
  const unit = match[2];
  if (unit === "vh" || unit === "%") {
    const resolved = (n / 100) * viewportH;
    return Number.isFinite(resolved) && resolved > 0 ? resolved : Infinity;
  }
  return n;
}

/**
 * snapPoints（升序；0–1 比例 / >1 像素）→ 每档「沿抽伸轴」的尺寸 px（升序）。
 * detent === "content"：最高档夹到 min(contentSize, viewportSize)；
 * detent === "full"：最高档夹到 viewportSize；
 * 每档最终都夹到 maxSize（纵向 = maxHeight，横向 = Infinity）。
 */
export function resolveSnapSizes(
  snapPoints: number[] | undefined,
  opts: {
    /** 沿抽伸轴的单向尺寸：纵向 = 视口高，横向 = 视口宽 */
    viewportH: number;
    contentH: number;
    detent: SheetDetent;
    maxHeight?: number;
  }
): number[] {
  const { viewportH, contentH, detent, maxHeight = Infinity } = opts;
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
      h = Math.min(h, maxHeight);
      return Math.min(Math.max(h, 0), viewportH);
    })
    .sort((a, b) => a - b);
}

/**
 * 尺寸 → 每档「向关闭方向」的位移（升序，index 0 = 最高档）。
 * bottom：hidden = viewportSize（面板顶锚定，需滑出视口底）；
 * top/left/right：hidden = 最大档尺寸（面板贴边锚定，滑出自身尺寸即完全关闭）。
 */
export function resolveSnapPixels(
  snapPoints: number[] | undefined,
  opts: {
    viewportH: number;
    contentH: number;
    detent: SheetDetent;
    maxHeight?: number;
    placement?: SheetPlacement;
  }
): number[] {
  const { viewportH, contentH, detent, maxHeight = Infinity, placement = "bottom" } = opts;
  if (viewportH <= 0) return [0];
  const sizes = resolveSnapSizes(snapPoints, { viewportH, contentH, detent, maxHeight });
  const hidden = closesByOwnSize(placement)
    ? (sizes[sizes.length - 1] ?? 0)
    : viewportH;
  return sizes
    .map((h) => Math.max(hidden - h, 0))
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
  /** 面板最大高度（Infinity = 无上限）；横向方位下作为交叉轴（高）上限 */
  getMaxHeight(): number;
  /** 抽伸方位（缺省 bottom，兼容旧调用） */
  getPlacement?(): SheetPlacement;
  getInitialSnap(): number;
  getTweenDuration(): number;
  getPrefersReducedMotion(): boolean;
  getVelocityThreshold(): number;
  getCloseThreshold(): number;
  /** 速度关闭的最小下移量 px（可选，默认 8） */
  getCloseMinDistance?(): number;
  /** 吸附完成（含打开补间结束） */
  onSnap(index: number): void;
  /** 打开补间完成 */
  onOpen(): void;
  /** 关闭补间完成；fromExternal 表示由外部受控关闭触发 */
  onClose(fromExternal?: boolean): void;
}

export interface SheetEngine {
  measure(): void;
  open(): void;
  close(fromExternal?: boolean): void;
  snapTo(index: number): void;
  setViewportInset(px: number): void;
  handlePointerDown(e: { clientX?: number; clientY?: number }): void;
  destroy(): void;
}

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function createSheetEngine(ops: SheetEngineOps): SheetEngine {
  const s = ops.state;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let tweenEndHandler: ((e: Event) => void) | null = null;
  let destroyed = false;
  let drag: {
    startX: number;
    startY: number;
    /** 起手时的关闭方向位移 */
    y0: number;
    /** 上次累计位移（用于速度估计） */
    lastDelta: number;
    lastT: number;
    velocity: number;
  } | null = null;

  /** 指针位移 → 关闭方向位移（底部向下、顶部向上、右侧向右、左侧向左为正） */
  function axisDelta(clientX: number, clientY: number): number {
    if (!drag) return 0;
    const placement = ops.getPlacement?.() ?? "bottom";
    switch (placement) {
      case "top":
        return drag.startY - clientY;
      case "left":
        return drag.startX - clientX;
      case "right":
        return clientX - drag.startX;
      default:
        return clientY - drag.startY;
    }
  }

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), hi);

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (tweenEndHandler) {
      ops.getPanel()?.removeEventListener("transitionend", tweenEndHandler);
      tweenEndHandler = null;
    }
  }

  function measure() {
    const placement = ops.getPlacement?.() ?? "bottom";
    const horizontal = isHorizontalPlacement(placement);
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const vh = typeof window !== "undefined" ? window.innerHeight : 0;
    // 沿抽伸轴的单向尺寸：纵向 = 视口高 - 键盘 inset；横向 = 视口宽
    const axisSize = Math.max(horizontal ? vw : vh - s.viewportInset, 0);
    s.viewportH = axisSize;
    const panel = ops.getPanel();
    const content = ops.getContent();
    const detent = ops.getDetent();
    const maxHeight = ops.getMaxHeight();
    // 纵向：maxHeight 夹主尺寸；横向：maxHeight 是交叉轴（高）上限，主尺寸不设限
    const maxMainSize = horizontal ? Infinity : maxHeight;
    let contentH = horizontal
      ? content?.scrollWidth ?? 0
      : content?.scrollHeight ?? 0;

    // detent=content 要按「面板自然尺寸」算（把手/header/footer 都算进去），
    // 否则 flex 内容区会把 chrome 的尺寸挤进内容滚动区，导致档位偏小。
    if (detent === "content" && panel) {
      const prevWidth = panel.style.width;
      const prevHeight = panel.style.height;
      const prevMaxHeight = panel.style.maxHeight;
      panel.style.width = "auto";
      panel.style.height = "auto";
      panel.style.maxHeight = "none";
      const natural = horizontal ? panel.scrollWidth : panel.scrollHeight;
      panel.style.width = prevWidth;
      panel.style.height = prevHeight;
      panel.style.maxHeight = prevMaxHeight;
      if (natural > 0) {
        contentH = natural;
      } else if (content) {
        // 无布局环境兜底：内容尺寸 + chrome 尺寸（panel 未受尺寸约束时的差值）
        contentH = horizontal
          ? content.scrollWidth
          : content.scrollHeight +
            Math.max(panel.offsetHeight - content.clientHeight, 0);
      }
    }

    s.contentH = contentH;
    const sizes = resolveSnapSizes(ops.getSnapPoints(), {
      viewportH: axisSize,
      contentH,
      detent,
      maxHeight: maxMainSize,
    });
    s.snapYs = resolveSnapPixels(ops.getSnapPoints(), {
      viewportH: axisSize,
      contentH,
      detent,
      maxHeight: maxMainSize,
      placement,
    });
    const mainSize = sizes[sizes.length - 1] ?? 0;
    // 顶部 / 左侧 / 右侧贴边锚定，按面板自身尺寸滑出；底部按视口尺寸滑出
    s.hiddenY = closesByOwnSize(placement) ? mainSize : axisSize;

    // 面板尺寸直接写 DOM，避免为几何值引入一帧 React 渲染：
    // 纵向 = 高度（主尺寸）+ width 交给 SheetPanel；横向 = 宽度（主尺寸）+
    // 高度（交叉轴，受 maxHeight 限制并垂直居中）。
    if (panel && s.snapYs.length > 0) {
      if (horizontal) {
        const crossH = Math.min(vh, maxHeight);
        panel.style.width = `${mainSize}px`;
        panel.style.height = `${crossH}px`;
        panel.style.maxHeight = maxHeight === Infinity ? "" : `${maxHeight}px`;
        panel.style.top = `${Math.max((vh - crossH) / 2, 0)}px`;
      } else {
        panel.style.height = `${mainSize}px`;
        panel.style.maxHeight = maxHeight === Infinity ? "" : `${maxHeight}px`;
        panel.style.top = "0px";
      }
    }
  }

  function applyY(y: number, transition: boolean) {
    s.y = y;
    s.progress = computeProgress(s);
    const panel = ops.getPanel();
    if (panel) {
      const placement = ops.getPlacement?.() ?? "bottom";
      // 位移标量 → 各方位实际 transform：顶部/左侧取负，底部/右侧取正
      const transform =
        placement === "top"
          ? `translate3d(0, ${-y}px, 0)`
          : placement === "left"
            ? `translate3d(${-y}px, 0, 0)`
            : placement === "right"
              ? `translate3d(${y}px, 0, 0)`
              : `translate3d(0, ${y}px, 0)`;
      panel.style.transition = transition
        ? `transform ${ops.getTweenDuration()}ms ${EASE}`
        : "none";
      panel.style.transform = transform;
    }
    // 进度联动走 CSS 变量（遮罩透明度等零 React 渲染成本）
    ops
      .getRoot()
      ?.style.setProperty("--vane-ms-progress", s.progress.toFixed(4));
  }

  /**
   * 补间完成判定：优先用 transitionend（事件驱动，后台标签 / 无头环境里
   * setTimeout 会被节流，但合成器仍会派发过渡结束事件，避免 phase 卡在
   * opening/snapping 导致拖拽被拒）；再挂 setTimeout 兜底（过渡事件漏发 /
   * 抖动 / 被其它过渡干扰）。
   */
  function tweenEnd(cb: () => void) {
    const ms = ops.getPrefersReducedMotion() ? 0 : ops.getTweenDuration();
    if (ms <= 0) {
      cb();
      return;
    }
    clearTimer();
    let done = false;
    const finish = () => {
      if (done || destroyed) return;
      done = true;
      if (tweenEndHandler) {
        ops.getPanel()?.removeEventListener("transitionend", tweenEndHandler);
        tweenEndHandler = null;
      }
      timer = null;
      cb();
    };
    const panel = ops.getPanel();
    const onEnd = (e: Event) => {
      if (e.target === panel && (e as TransitionEvent).propertyName === "transform") {
        finish();
      }
    };
    tweenEndHandler = onEnd;
    panel?.addEventListener("transitionend", onEnd);
    timer = setTimeout(finish, ms + 24);
  }

  function clampIndex(index: number): number {
    if (s.snapYs.length === 0) return 0;
    return clamp(Math.round(index), 0, s.snapYs.length - 1);
  }

  function open() {
    if (destroyed) return;
    clearTimer();
    measure();
    if (s.snapYs.length === 0) return;
    const index = clampIndex(ops.getInitialSnap());
    s.snapIndex = index;
    s.phase = "opening";
    // 首帧落在隐藏位（无过渡），随后强制回流再补间到目标档。
    // 用「写隐藏位 → 强制回流 → 写目标位（带过渡）」的 FLIP 手法，
    // 不依赖 requestAnimationFrame：后台标签 / 无头环境里 rAF 会被节流甚至
    // 不跑，否则弹层永远停在视口外、progress 停在 0。
    applyY(s.hiddenY, false);
    const panel = ops.getPanel();
    if (panel) void panel.offsetHeight; // 强制回流，让过渡从 hiddenY 起算
    applyY(s.snapYs[index], true);
    tweenEnd(() => {
      if (destroyed) return;
      s.phase = "open";
      ops.onOpen();
      ops.onSnap(index);
    });
  }

  function close(fromExternal?: boolean) {
    if (destroyed) return;
    // 关闭补间进行中 / 已关闭：幂等返回
    if (s.phase === "closing" || s.phase === "closed") return;
    // opening / open / snapping / dragging 都允许关闭：先取消打开/吸附补间
    clearTimer();
    s.phase = "closing";
    applyY(s.hiddenY, true);
    tweenEnd(() => {
      if (destroyed) return;
      s.phase = "closed";
      s.progress = 0;
      ops.getRoot()?.style.setProperty("--vane-ms-progress", "0");
      ops.onClose(fromExternal);
    });
  }

  function snapTo(index: number) {
    if (destroyed) return;
    // 关闭中 / 已关闭不允许把面板拉回（ref.snapTo 在关闭态是 no-op）
    if (s.phase === "closing" || s.phase === "closed") return;
    measure();
    if (s.snapYs.length === 0) return;
    const i = clampIndex(index);
    clearTimer();
    s.snapIndex = i;
    s.phase = "snapping";
    applyY(s.snapYs[i], true);
    tweenEnd(() => {
      if (destroyed) return;
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
    const delta = axisDelta(e.clientX, e.clientY);
    if (dt > 0) {
      // 指数平滑速度估计（px/s，关闭方向为正）
      drag.velocity =
        0.8 * drag.velocity + 0.2 * ((delta - drag.lastDelta) / dt) * 1000;
      drag.lastDelta = delta;
      drag.lastT = t;
    }
    const next = clamp(drag.y0 + delta, 0, s.hiddenY);
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
      minCloseDistance: ops.getCloseMinDistance?.() ?? 8,
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

  function handlePointerDown(e: { clientX?: number; clientY?: number }) {
    if (destroyed) return;
    // 只允许稳态（open / snapping）下发起拖拽；opening / closing / closed 拒绝
    if (s.phase !== "open" && s.phase !== "snapping") return;
    // 插件拖拽锁（NestedScroll / LoadingState）
    if (s.dragLock) return;
    clearTimer();
    s.phase = "dragging";
    const t = typeof performance !== "undefined" ? performance.now() : Date.now();
    drag = {
      startX: e.clientX ?? 0,
      startY: e.clientY ?? 0,
      y0: s.y,
      lastDelta: 0,
      lastT: t,
      velocity: 0,
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  function destroy() {
    destroyed = true;
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
