import React, { useEffect, useState } from "react";
import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface GlitchEffectConfig {
  /** 故障风格 */
  style?: "rgb-split" | "scan-lines" | "digital" | "glitch-mix" | "intense";
  /** 是否持续动画 */
  continuous?: boolean;
  /** 一次性触发时长（毫秒，非持续模式） */
  duration?: number;
  /** 效果强度 0~1 */
  intensity?: number;
  /** 是否悬停触发 */
  triggerOnHover?: boolean;
  /** RGB 分离距离（px） */
  rgbOffset?: number;
  /** 扫描线数量 */
  scanLineCount?: number;
  /** 扫描线是否动画 */
  animateScanLines?: boolean;
}

function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("glitch-effect-styles")) return;
  const el = document.createElement("style");
  el.id = "glitch-effect-styles";
  el.textContent = `
    @keyframes glitch-anim {
      0% { clip-path: inset(40% 0 30% 0); transform: translate(2px, 2px); }
      10% { clip-path: inset(70% 0 10% 0); transform: translate(-3px, 3px); }
      20% { clip-path: inset(10% 0 70% 0); transform: translate(3px, -2px); }
      30% { clip-path: inset(50% 0 30% 0); transform: translate(-2px, 2px); }
      40% { clip-path: inset(20% 0 60% 0); transform: translate(3px, 3px); }
      50% { clip-path: inset(60% 0 20% 0); transform: translate(-3px, -2px); }
      60% { clip-path: inset(30% 0 50% 0); transform: translate(2px, 3px); }
      70% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, -3px); }
      80% { clip-path: inset(15% 0 65% 0); transform: translate(3px, 2px); }
      90% { clip-path: inset(45% 0 35% 0); transform: translate(-3px, 2px); }
      100% { clip-path: inset(25% 0 55% 0); transform: translate(0, 0); }
    }
    @keyframes glitch-rgb-split {
      0%, 100% { transform: translate(0); opacity: 1; }
      25% { transform: translate(-1px, 1px); opacity: 0.8; }
      50% { transform: translate(1px, -1px); opacity: 0.9; }
      75% { transform: translate(-1px, -1px); opacity: 0.85; }
    }
    @keyframes scan-line-move { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
  `;
  document.head.appendChild(el);
}

const GlitchOverlay: React.FC<{
  config: GlitchEffectConfig;
  context: LazyImageContext;
}> = ({ config }) => {
  const {
    style = "glitch-mix",
    continuous = false,
    duration = 1000,
    intensity = 0.7,
    triggerOnHover = false,
    rgbOffset = 3,
    scanLineCount = 30,
    animateScanLines = true,
  } = config;
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    ensureStyles();
    if (!continuous && !triggerOnHover) {
      setActive(true);
      const t = setTimeout(() => setActive(false), duration);
      return () => clearTimeout(t);
    }
  }, [continuous, triggerOnHover, duration]);

  const on = continuous || active || (triggerOnHover && hover);

  const rgbLayer = {
    position: "absolute" as const,
    inset: 0,
    background: `linear-gradient(90deg, rgba(255,0,0,${intensity * 0.15}) 0%, transparent ${
      rgbOffset * 2
    }px, transparent calc(100% - ${rgbOffset * 2}px), rgba(0,255,255,${
      intensity * 0.15
    }) 100%)`,
    mixBlendMode: "color" as const,
    animation: on ? "glitch-rgb-split 0.5s ease-in-out infinite" : "none",
    pointerEvents: "none" as const,
  };

  const scanLines = Array.from({ length: scanLineCount }, (_, i) => (
    <div
      key={i}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: "1px",
        top: `${(i / scanLineCount) * 100}%`,
        background: `rgba(255,255,255,${intensity * 0.1})`,
        animation:
          animateScanLines && on
            ? `scan-line-move ${2 + Math.random() * 2}s linear infinite`
            : "none",
        animationDelay: `${Math.random() * 2}s`,
      }}
    />
  ));

  const digitalLayer = (idx: number) => {
    const palettes = [
      { main: "rgba(255,0,0,0.15)", secondary: "rgba(0,255,255,0.15)" },
      { main: "rgba(0,255,0,0.15)", secondary: "rgba(255,0,255,0.15)" },
      { main: "rgba(0,100,255,0.15)", secondary: "rgba(255,255,0,0.15)" },
    ];
    const p = palettes[idx - 1] || palettes[0];
    return {
      position: "absolute" as const,
      inset: 0,
      background: `linear-gradient(${idx * 45}deg, ${p.main} 0%, transparent 30%, transparent 70%, ${p.secondary} 100%)`,
      animation: on
        ? `glitch-anim ${0.4 + idx * 0.1}s infinite ${idx % 2 === 0 ? "normal" : "reverse"}`
        : "none",
      animationDelay: `${idx * 0.06}s`,
      opacity: intensity * 0.7,
      mixBlendMode: "screen" as const,
      pointerEvents: "none" as const,
      filter: `blur(${intensity * 0.5}px)`,
    };
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: triggerOnHover ? "auto" : "none",
        overflow: "hidden",
      }}
      onMouseEnter={() => triggerOnHover && setHover(true)}
      onMouseLeave={() => triggerOnHover && setHover(false)}
    >
      {(style === "rgb-split" || style === "glitch-mix" || style === "intense") &&
        on && <div style={rgbLayer} />}
      {(style === "scan-lines" || style === "glitch-mix") && on && scanLines}
      {(style === "digital" || style === "glitch-mix" || style === "intense") &&
        on && (
          <>
            <div style={digitalLayer(1)} />
            <div style={digitalLayer(2)} />
            {style === "intense" && <div style={digitalLayer(3)} />}
          </>
        )}
      {style === "intense" &&
        on && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `repeating-linear-gradient(0deg, rgba(0,255,0,${
                intensity * 0.03
              }) 0px, rgba(0,255,0,0) 2px, rgba(0,255,0,0) 4px, rgba(0,255,0,${
                intensity * 0.03
              }) 6px)`,
              animation: "glitch-anim 0.8s ease-in-out infinite",
              pointerEvents: "none",
              opacity: 0.5,
            }}
          />
        )}
    </div>
  );
};

/**
 * GlitchEffectPlugin — 赛博朋克故障艺术效果（纯 CSS，无依赖）。
 */
export function createGlitchEffectPlugin(
  config: GlitchEffectConfig = {}
): LazyImagePlugin {
  return {
    name: "glitch-effect",
    version: "1.0.0",
    config,
    hooks: {
      renderOverlay: (context: LazyImageContext) => (
        <GlitchOverlay config={config} context={context} />
      ),
    },
  };
}
