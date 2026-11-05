import React from "react";
import type { BadgeType } from "../../components/ProfilePlugin/plugins/types";

/** 内联 SVG 对勾徽标（不引外部资源） */
export function BadgeIcon({ type }: { type: BadgeType }) {
  const color = type === "institution" ? "#ff8f00" : "#1da1f2";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={color} />
      <path
        d="M7 12.5l3 3 7-7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
