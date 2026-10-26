import React, { useEffect, useRef, useState } from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface AnimatedCursorConfig {
  /** 光标样式 */
  style?:
    | "zoom-in"
    | "zoom-out"
    | "pointer"
    | "crosshair"
    | "move"
    | "grab"
    | "custom-dot"
    | "custom-ring"
    | "custom-plus"
    | "none";
  /** 是否启用跟随光标 */
  enableFollower?: boolean;
  /** 跟随光标颜色 */
  followerColor?: string;
  /** 跟随光标大小（px） */
  followerSize?: number;
  /** 跟随延迟系数（0~1，越大越跟手） */
  followerDelay?: number;
  /** 悬停时跟随光标缩放 */
  scaleOnHover?: boolean;
  /** 悬停缩放比例 */
  hoverScale?: number;
  /** 自定义光标图标 URL */
  customIcon?: string;
  /** 光标附带文字 */
  cursorText?: string;
  /** 点击时产生涟漪 */
  showRipple?: boolean;
}

const AnimatedCursorOverlay: React.FC<{
  config: AnimatedCursorConfig;
  context: LazyImageContext;
}> = ({ config }) => {
  const {
    style = "zoom-in",
    enableFollower = true,
    followerColor = "rgba(59, 130, 246, 0.5)",
    followerSize = 40,
    followerDelay = 0.1,
    scaleOnHover = true,
    hoverScale = 1.5,
    customIcon,
    cursorText,
    showRipple = false,
  } = config;

  const [hovering, setHovering] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [follow, setFollow] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>(
    []
  );
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | undefined>(undefined);

  const cursorCss = (() => {
    const map: Record<string, string> = {
      "zoom-in": "zoom-in",
      "zoom-out": "zoom-out",
      pointer: "pointer",
      crosshair: "crosshair",
      move: "move",
      grab: "grab",
      "custom-dot": "none",
      "custom-ring": "none",
      "custom-plus": "none",
      none: "none",
    };
    return customIcon ? `url(${customIcon}), auto` : map[style] ?? "auto";
  })();

  useEffect(() => {
    if (!enableFollower) return;
    const tick = () => {
      setFollow((prev) => ({
        x: prev.x + (pos.x - prev.x) * (1 - followerDelay),
        y: prev.y + (pos.y - prev.y) * (1 - followerDelay),
      }));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [pos, enableFollower, followerDelay]);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const onClick = (e: React.MouseEvent) => {
    if (!showRipple || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - r.left, y: e.clientY - r.top },
    ]);
    setTimeout(() => setRipples((prev) => prev.filter((x) => x.id !== id)), 1000);
  };

  const scale = hovering && scaleOnHover ? hoverScale : 1;
  const wrapper: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    cursor: cursorCss,
    overflow: "hidden",
    zIndex: 5,
  };
  const followerDot: React.CSSProperties = {
    position: "absolute",
    left: follow.x,
    top: follow.y,
    width: followerSize,
    height: followerSize,
    transform: `translate(-50%, -50%) scale(${scale})`,
    backgroundColor: followerColor,
    borderRadius: "50%",
    pointerEvents: "none",
    transition: "transform 0.3s ease",
    zIndex: 10,
  };
  const followerRing: React.CSSProperties = {
    position: "absolute",
    left: follow.x,
    top: follow.y,
    width: followerSize,
    height: followerSize,
    border: "2px solid #3b82f6",
    borderRadius: "50%",
    transform: `translate(-50%, -50%) scale(${scale})`,
    pointerEvents: "none",
    transition: "transform 0.2s ease",
    zIndex: 11,
  };
  const followerPlus: React.CSSProperties = {
    position: "absolute",
    left: follow.x,
    top: follow.y,
    width: 20,
    height: 20,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 11,
  };
  const textStyle: React.CSSProperties = {
    position: "absolute",
    left: pos.x + 15,
    top: pos.y - 10,
    padding: "4px 8px",
    fontSize: 12,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 4,
    pointerEvents: "none",
    whiteSpace: "nowrap",
    zIndex: 12,
  };

  return (
    <div
      ref={ref}
      style={wrapper}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={onClick}
    >
      {enableFollower && <div style={followerDot} />}
      {style === "custom-dot" && <div style={followerDot} />}
      {style === "custom-ring" && <div style={followerRing} />}
      {style === "custom-plus" && (
        <div style={followerPlus}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="0" x2="10" y2="20" stroke="#3b82f6" strokeWidth="2" />
            <line x1="0" y1="10" x2="20" y2="10" stroke="#3b82f6" strokeWidth="2" />
          </svg>
        </div>
      )}
      {cursorText && hovering && <div style={textStyle}>{cursorText}</div>}
      {ripples.map((r) => (
        <div
          key={r.id}
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            width: 0,
            height: 0,
            border: "2px solid rgba(59, 130, 246, 0.8)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ripple-expand 1s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}
      {showRipple && (
        <style>{`@keyframes ripple-expand { from { width: 0; height: 0; opacity: 1; } to { width: 80px; height: 80px; opacity: 0; } }`}</style>
      )}
    </div>
  );
};

/**
 * AnimatedCursorPlugin — 自定义光标与跟随动画（纯 CSS + JS，无依赖）。
 */
export function createAnimatedCursorPlugin(
  config: AnimatedCursorConfig = {}
): LazyImagePlugin {
  return {
    name: "animated-cursor",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => (
        <AnimatedCursorOverlay config={config} context={context} />
      ),
    },
  };
}
