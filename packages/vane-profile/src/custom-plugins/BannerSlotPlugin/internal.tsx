import React, { useState } from "react";

/** 默认人形占位（内联 SVG，不引外部资源） */
function PersonGlyph({ size }: { size: number }) {
  const s = Math.round(size * 0.5);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7.5" r="4.2" fill="currentColor" />
      <path
        d="M4.5 21c0-4.2 3.4-7 7.5-7s7.5 2.8 7.5 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 头像：加载失败 / 无 src 时切到占位块，绝不留下破图或空白圆 */
export function Avatar({
  src,
  size,
  round,
  alt,
  fallback,
}: {
  src?: string;
  size: number;
  round: boolean;
  alt: string;
  fallback?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  const base: React.CSSProperties = {
    position: "absolute",
    left: 16,
    bottom: -size / 2,
    width: size,
    height: size,
    borderRadius: round ? "50%" : 8,
    border: "3px solid #fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    objectFit: "cover",
  };

  if (!src || failed) {
    return (
      <div
        className="vp-avatar-fallback"
        role="img"
        aria-label={alt}
        style={{
          ...base,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e9ecef",
          color: "#6b6b6b",
          fontSize: Math.round(size / 3),
          lineHeight: 1,
        }}
      >
        {fallback ?? <PersonGlyph size={size} />}
      </div>
    );
  }

  return (
    <img
      className="vp-avatar"
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={base}
    />
  );
}
