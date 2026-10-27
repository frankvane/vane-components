import React from "react";

export type DividerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export const Divider: React.FC<DividerProps> = ({ style, className }) => {
  return (
    <div
      className={className}
      style={{ height: 1, background: "#eee", margin: "8px 0", ...style }}
    />
  );
};