import React, { useState } from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface DepthMapConfig {
  /** 深度效果样式 */
  style?: "tilt" | "parallax" | "float" | "rotate-3d";
  /** 效果强度 0~1 */
  intensity?: number;
  /** 最大倾斜角度 */
  maxTilt?: number;
  /** 启用透视 */
  enablePerspective?: boolean;
  /** 透视距离（px） */
  perspective?: number;
  /** 启用光泽 */
  enableGlare?: boolean;
  /** 光泽颜色 */
  glareColor?: string;
  /** 光泽不透明度 0~1 */
  glareOpacity?: number;
  /** 启用阴影 */
  enableShadow?: boolean;
  /** 过渡时长（毫秒） */
  transitionDuration?: number;
  /** 离开时重置 */
  resetOnLeave?: boolean;
}

const DepthMapOverlay: React.FC<{
  config: DepthMapConfig;
  context: LazyImageContext;
}> = ({ config }) => {
  const {
    style = "tilt",
    intensity = 0.5,
    maxTilt = 20,
    enablePerspective = true,
    perspective = 1000,
    enableGlare = true,
    glareColor = "rgba(255, 255, 255, 0.3)",
    glareOpacity = 0.5,
    enableShadow = true,
    transitionDuration = 300,
    resetOnLeave = true,
  } = config;

  const [tf, setTf] = useState({
    rotateX: 0,
    rotateY: 0,
    translateZ: 0,
    translateY: 0,
  });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const ref = React.useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    let next = { rotateX: 0, rotateY: 0, translateZ: 0, translateY: 0 };
    switch (style) {
      case "tilt":
        next = {
          rotateX: -py * maxTilt * intensity,
          rotateY: px * maxTilt * intensity,
          translateZ: 0,
          translateY: 0,
        };
        break;
      case "parallax":
        next = {
          rotateX: -py * maxTilt * intensity * 0.5,
          rotateY: px * maxTilt * intensity * 0.5,
          translateZ: Math.abs(px + py) * 10 * intensity,
          translateY: 0,
        };
        break;
      case "float":
        next = {
          rotateX: 0,
          rotateY: 0,
          translateZ: -py * 50 * intensity,
          translateY: -py * 40 * intensity,
        };
        break;
      case "rotate-3d":
        next = {
          rotateX: -py * maxTilt * intensity * 1.5,
          rotateY: px * maxTilt * intensity * 1.5,
          translateZ: 15 * intensity,
          translateY: 0,
        };
        break;
    }
    setTf(next);
    setGlare({ x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 });
  };

  const onLeave = () => {
    if (resetOnLeave)
      setTf({ rotateX: 0, rotateY: 0, translateZ: 0, translateY: 0 });
    setGlare({ x: 50, y: 50 });
  };

  const wrapper: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transformStyle: "preserve-3d",
    perspective: enablePerspective ? `${perspective}px` : undefined,
    transition: `transform ${transitionDuration}ms ease-out`,
    zIndex: 1,
  };
  const inner: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transform: `translateY(${tf.translateY}px) rotateX(${tf.rotateX}deg) rotateY(${tf.rotateY}deg) translateZ(${tf.translateZ}px)`,
    transformStyle: "preserve-3d",
    transition: resetOnLeave ? `transform ${transitionDuration}ms ease-out` : "none",
    boxShadow: enableShadow
      ? `${tf.rotateY * 0.5}px ${tf.rotateX * 0.5 + tf.translateY * 0.3}px ${
          20 + Math.abs(tf.translateZ) * 0.5
        }px rgba(0,0,0,0.3)`
      : "none",
  };
  const glareStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${glareColor} 0%, transparent 50%)`,
    opacity: glareOpacity,
    pointerEvents: "none",
    mixBlendMode: "overlay",
    transition: resetOnLeave ? `opacity ${transitionDuration}ms ease-out` : "none",
  };

  return (
    <div
      ref={ref}
      style={wrapper}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div style={inner}>
        {enableGlare && <div style={glareStyle} />}
      </div>
    </div>
  );
};

/**
 * DepthMapPlugin — 鼠标跟随的 3D 视差深度效果（纯 CSS transforms，无依赖）。
 */
export function createDepthMapPlugin(
  config: DepthMapConfig = {}
): LazyImagePlugin {
  return {
    name: "depth-map",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => (
        <DepthMapOverlay config={config} context={context} />
      ),
    },
  };
}
