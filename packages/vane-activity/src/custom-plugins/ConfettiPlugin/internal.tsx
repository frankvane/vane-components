/**
 * ConfettiPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import { useEffect, useState } from "react";

/** 确定性伪随机（同一 index 每次渲染结果一致，避免重渲染跳变） */
function rand(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const COLORS = ["#ff7a29", "#cf4407", "#15803d", "#5d636a", "#f5b60f"];

/** P2-8：尊重系统「减少动态效果」设置，避免常驻动画。 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export function ConfettiBurst({
  progress,
  count,
  durationSec,
  threshold,
}: {
  progress: number;
  count: number;
  durationSec: number;
  threshold: number;
}) {
  const reduced = usePrefersReducedMotion();
  const reached = progress >= (Number.isFinite(threshold) ? threshold : 1);
  if (!reached || reduced) return null;

  // P2-5：数量与时长做上限保护
  const total = Math.max(0, Math.min(60, Math.floor(Number.isFinite(count) ? count : 28)));
  const duration =
    Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 2.6;

  const pieces = Array.from({ length: total }, (_, i) => {
    const left = rand(i, 1) * 100;
    const delay = rand(i, 2) * 1.2;
    const dur = duration * (0.7 + rand(i, 3) * 0.6);
    const size = 5 + rand(i, 4) * 5;
    const color = COLORS[i % COLORS.length];
    const round = rand(i, 5) > 0.6;
    return (
      <span
        key={i}
        aria-hidden
        style={{
          position: "absolute",
          top: -12,
          left: `${left}%`,
          width: size,
          height: size * (round ? 1 : 1.8),
          borderRadius: round ? "50%" : 1,
          background: color,
          // P2-8：只播两轮，不再 infinite 常驻合成层
          animation: `va-confetti-fall ${dur}s linear ${delay}s 2`,
          opacity: 0.9,
        }}
      />
    );
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <style>{`@keyframes va-confetti-fall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(340px) rotate(540deg)}}`}</style>
      {pieces}
    </div>
  );
}
