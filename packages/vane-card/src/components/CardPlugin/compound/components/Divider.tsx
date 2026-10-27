import React from "react";

export type DividerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export const Divider: React.FC<DividerProps> = ({ style, className }) => {
  return <div className={`vc-divider ${className ?? ""}`.trim()} style={style} />;
};