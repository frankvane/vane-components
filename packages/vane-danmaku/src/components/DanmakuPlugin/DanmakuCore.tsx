import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
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

const DEFAULTS: Omit<RenderOptions, "accent" | "stroke"> = {
  trackHeight: 28,
  fontFamily:
    'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
  baseFontSize: 22,
  opacity: 1,
  defaultDuration: 8,
  gap: 24,
};

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
      opacity = 1,
      containerClassName,
      containerStyle,
      onMount,
      onUnmount,
      debug,
      containerRefExternal,
      avoidZoneProvider,
      children,
    } = props;

    // 领域 DOM 插槽：控制面板 / 工具条 / 指令输入框等（弹幕主体仍由 canvas 绘制）
    const headerNodes = useDanmakuSlot("renderHeader");
    const overlayNodes = useDanmakuSlot("renderOverlay");
    const footerNodes = useDanmakuSlot("renderFooter");

    const internalRef = useRef<HTMLDivElement | null>(null);
    const containerRef = containerRefExternal ?? internalRef;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const schedulerRef = useRef<DanmakuScheduler>(new DanmakuScheduler());

    const [, forceTick] = useState(0);
    const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

    // 把随渲染变化的值放进 ref，供 rAF 闭包读取最新值
    const liveRef = useRef({
      items,
      currentTime,
      playing,
      trackHeight,
      baseFontSize,
      opacity,
      avoidZoneProvider,
    });
    liveRef.current = {
      items,
      currentTime,
      playing,
      trackHeight,
      baseFontSize,
      opacity,
      avoidZoneProvider,
    };

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
      }),
      [containerRef]
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
      const frame = () => {
        const { width, height, dpr } = sizeRef.current;
        const live = liveRef.current;
        const opts: RenderOptions = {
          ...DEFAULTS,
          trackHeight: live.trackHeight,
          baseFontSize: live.baseFontSize,
          opacity: live.opacity,
          accent: "#ff7a29",
          stroke: "rgba(0,0,0,0.85)",
        };

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const zones: Rect[] = live.avoidZoneProvider ? live.avoidZoneProvider() : [];
        const active = schedulerRef.current.tick(
          live.items,
          { width, height },
          live.currentTime,
          live.playing,
          opts,
          zones
        );

        ctx.globalAlpha = opts.opacity;
        for (const a of active) {
          // 用真实 ctx 复测宽度（含粉丝牌），保证碰撞与绘制一致
          a.width = measure(a.item, ctx, opts).width;
          draw(a, ctx, opts);
        }
        ctx.globalAlpha = 1;

        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      return () => cancelAnimationFrame(raf);
    }, [containerRef]);

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
