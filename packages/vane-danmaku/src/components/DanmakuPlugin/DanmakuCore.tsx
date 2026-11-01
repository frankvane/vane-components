import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { DanmakuCoreProps, DanmakuCoreRef, Rect } from "./plugins/types";
import { useDanmakuSlot } from "./plugins/slots";
import {
  DanmakuScheduler,
  draw,
  measure,
  type RenderOptions,
} from "./render";

const DEFAULTS: Omit<RenderOptions, "stroke"> = {
  trackHeight: 28,
  fontFamily:
    'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
  baseFontSize: 22,
  opacity: 1,
  defaultDuration: 8,
  gap: 24,
  fadeMs: 450,
  accent: "#ff7a29",
  topInset: 0,
  bottomInset: 0,
};

/** 矩形并集面积（x 方向扫描 + y 区间合并）：避让框数量通常个位数，开销可忽略 */
function unionArea(rects: Rect[]): number {
  const xs = Array.from(new Set(rects.flatMap((r) => [r.x, r.x + r.w])).values()).sort(
    (a, b) => a - b
  );
  let area = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i];
    const x1 = xs[i + 1];
    const dx = x1 - x0;
    if (dx <= 0) continue;
    const mid = (x0 + x1) / 2;
    const spans = rects
      .filter((r) => r.x <= mid && r.x + r.w >= mid)
      .map((r) => [r.y, r.y + r.h] as [number, number])
      .sort((a, b) => a[0] - b[0]);
    let coveredY = 0;
    let start = -Infinity;
    let end = -Infinity;
    for (const [s, e] of spans) {
      if (e <= end) continue;
      if (s > end) {
        if (end > start) coveredY += end - start;
        start = s;
        end = e;
      } else {
        end = Math.max(end, e);
      }
    }
    if (end > start) coveredY += end - start;
    area += dx * coveredY;
  }
  return area;
}

/**
 * 把避让区裁成「可挖空的洞」：裁到画布内、丢掉退化矩形，并保护一个极端情况 ——
 * 避让区几乎覆盖整屏时（模型框明显异常 / 人物贴满镜头）放弃遮罩，
 * 宁可轻微压人，也不能让整块画布一条弹幕都看不见。
 * 覆盖率按并集算：重叠的两个框直接相加会翻倍，误判成「覆盖全屏」。
 */
function clipZones(zones: Rect[], width: number, height: number): Rect[] | null {
  const holes: Rect[] = [];
  for (const z of zones) {
    const x = Math.max(0, z.x);
    const y = Math.max(0, z.y);
    const w = Math.min(width, z.x + z.w) - x;
    const h = Math.min(height, z.y + z.h) - y;
    if (w <= 1 || h <= 1) continue;
    holes.push({ x, y, w, h });
  }
  if (!holes.length) return null;
  if (unionArea(holes) > width * height * 0.85) return null;
  return holes;
}

/**
 * DanmakuCore —— 弹幕核心组件（canvas 渲染内核）。
 *
 * 铁律：
 *  1. 内核只做「canvas 绘制 + 轨道调度 + 生命周期转发」，业务语义全交插件。
 *  2. 插件绝不直绘 canvas；它们经 transformData 操作弹幕流，写 renderHint，
 *     由本内核的渲染器消费。
 *  3. 防遮挡避让区经 avoidZoneProvider 道具桥接（HOC 从运行时 shared 读取），
 *     保证 Core 可脱离插件运行时独立使用。
 */
export const DanmakuCore = forwardRef<DanmakuCoreRef, DanmakuCoreProps>(
    function DanmakuCore(props, ref) {
    const {
      items,
      currentTime = 0,
      playing = true,
      trackHeight = DEFAULTS.trackHeight,
      baseFontSize = DEFAULTS.baseFontSize,
      opacity = DEFAULTS.opacity,
      fadeMs = DEFAULTS.fadeMs,
      gap = DEFAULTS.gap,
      defaultDuration = DEFAULTS.defaultDuration,
      accent = DEFAULTS.accent,
      containerClassName,
      containerStyle,
      onMount,
      onUnmount,
      debug,
      containerRefExternal,
      avoidZoneProvider,
      children,
      topInset = 0,
      bottomInset = 0,
    } = props;

    // 领域 DOM 插槽：控制面板 / 工具条 / 指令输入框等（弹幕主体仍由 canvas 绘制）
    const headerNodes = useDanmakuSlot("renderHeader");
    const overlayNodes = useDanmakuSlot("renderOverlay");
    const footerNodes = useDanmakuSlot("renderFooter");

    const internalRef = useRef<HTMLDivElement | null>(null);
    const containerRef = containerRefExternal ?? internalRef;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // 惰性初始化：useRef 的参数每次渲染都会求值，直接 new 会白构造一个随即被丢弃的实例
    const schedulerRef = useRef<DanmakuScheduler | null>(null);
    if (!schedulerRef.current) schedulerRef.current = new DanmakuScheduler();
    const scheduler = schedulerRef.current;

    const [, forceTick] = useState(0);
    const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

    // 把随渲染变化的值放进 ref，供 rAF 闭包读取最新值。
    // 更新放在 layout effect（提交后、绘制前），避免在渲染期写 ref 拿到未提交的中间值。
    const liveRef = useRef({
      items,
      currentTime,
      playing,
      trackHeight,
      baseFontSize,
      opacity,
      fadeMs,
      gap,
      defaultDuration,
      accent,
      avoidZoneProvider,
      topInset,
      bottomInset,
    });
    useLayoutEffect(() => {
      liveRef.current = {
        items,
        currentTime,
        playing,
        trackHeight,
        baseFontSize,
        opacity,
        fadeMs,
        gap,
        defaultDuration,
        accent,
        avoidZoneProvider,
        topInset,
        bottomInset,
      };
    });

    useImperativeHandle(
      ref,
      () => ({
        getContainer: () => containerRef.current,
        forceUpdate: () => forceTick((t) => t + 1),
        getSize: () => ({
          width: containerRef.current?.offsetWidth ?? 0,
          height: containerRef.current?.offsetHeight ?? 0,
        }),
        getCanvas: () => canvasRef.current,
        clearScreen: () => scheduler.clear(),
        /** 运行时读数：在飞条数（真正参与绘制的量）与本轮饱和丢弃数 */
        getStats: () => ({
          active: scheduler.activeCount,
          dropped: scheduler.droppedCount,
        }),
      }),
      [containerRef, scheduler]
    );

    // 尺寸观测：DPR 缩放 canvas，绘制用 CSS 像素坐标
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const apply = () => {
        const rect = el.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        sizeRef.current = { width: rect.width, height: rect.height, dpr };
        const c = canvasRef.current;
        if (c) {
          c.width = Math.max(1, Math.round(rect.width * dpr));
          c.height = Math.max(1, Math.round(rect.height * dpr));
          c.style.width = `${rect.width}px`;
          c.style.height = `${rect.height}px`;
        }
      };
      apply();
      const ro = new ResizeObserver(apply);
      ro.observe(el);
      return () => ro.disconnect();
    }, [containerRef]);

    // rAF 渲染循环：调度 → 绘制
    useEffect(() => {
      const c = canvasRef.current;
      const el = containerRef.current;
      if (!c || !el) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      let raf = 0;
      let frameErrorLogged = false;
      // 先调度下一帧再执行绘制：单帧异常（旧浏览器缺 roundRect / 脏数据）不会让循环永久停摆
      const frame = () => {
        raf = requestAnimationFrame(frame);
        // 后台 / 隐藏标签页不绘制（浏览器本就节流 rAF，这里直接跳过省掉光栅化）
        if (document.hidden) return;
        try {
          renderFrame();
        } catch (err) {
          if (!frameErrorLogged) {
            frameErrorLogged = true;
            console.error("[DanmakuCore] 渲染帧异常，已跳过该帧", err);
          }
        }
      };
      const renderFrame = () => {
        const { width, height, dpr } = sizeRef.current;
        const live = liveRef.current;
        const opts: RenderOptions = {
          ...DEFAULTS,
          trackHeight: live.trackHeight,
          baseFontSize: live.baseFontSize,
          opacity: live.opacity,
          fadeMs: live.fadeMs,
          gap: live.gap,
          defaultDuration: live.defaultDuration,
          accent: live.accent,
          stroke: "rgba(0,0,0,0.85)",
          topInset: live.topInset,
          bottomInset: live.bottomInset,
        };
        // 调度期也要真实宽度：字符类估算在 emoji / 粉丝牌 / 长拉丁串上会偏小，
        // 而速度 = (画布宽 + 宽度) / 时长，估小了就等于让后车「以为追不上」却真的追尾。
        opts.measureWidth = (item) => measure(item, ctx, opts).width;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const zones: Rect[] = live.avoidZoneProvider ? live.avoidZoneProvider() : [];
        const active = scheduler.tick(
          live.items,
          { width, height },
          live.currentTime,
          live.playing,
          opts,
          zones
        );

        // 避让区裁剪：把人物矩形从画布里「挖空」（evenodd），落在人物身上的那部分弹幕
        // 直接不绘制 —— 这是「人物区域里绝不能有弹幕」的最终保证，调度绕不开时也不会压人。
        // 每帧最多几条矩形，clip 走的是路径栅格化，开销可忽略。
        const holes = zones.length ? clipZones(zones, width, height) : null;
        if (holes) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, width, height);
          for (const z of holes) ctx.rect(z.x, z.y, z.w, z.h);
          ctx.clip("evenodd");
        }

        ctx.globalAlpha = opts.opacity;
        for (const a of active) {
          // 完全在画布外（右侧刚入场 / 左侧已滑出）或已渐隐到看不见的条目直接跳过：
          // 满载时能省掉可观的光栅化开销（strokeText/fillText 是最贵的一步）
          if (a.x > width || a.x + a.width < 0 || a.alpha <= 0.01) continue;
          draw(a, ctx, opts);
        }
        ctx.globalAlpha = 1;
        if (holes) ctx.restore();

      };
      raf = requestAnimationFrame(frame);
      return () => cancelAnimationFrame(raf);
    }, [containerRef, scheduler]);

    useEffect(() => {
      if (debug) console.debug("[DanmakuCore] mounted");
      onMount?.();
      return () => onUnmount?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={containerClassName}
        style={{ position: "relative", overflow: "hidden", ...containerStyle }}
      >
        <canvas
          ref={canvasRef as React.RefObject<HTMLCanvasElement>}
          role="img"
          aria-label="弹幕画布"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
        {/* 顶部工具条（StatsBar / FilterToggle 等） */}
        {headerNodes.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              padding: 8,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {headerNodes}
          </div>
        )}
        {/* 浮层（SettingsPanel 等自由定位面板） */}
        {overlayNodes.length > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            {overlayNodes}
          </div>
        )}
        {/* 底部条（CommandInput 等） */}
        {footerNodes.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              gap: 8,
              padding: 8,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {footerNodes}
          </div>
        )}
        {children}
      </div>
    );
  }
);

DanmakuCore.displayName = "DanmakuCore";
