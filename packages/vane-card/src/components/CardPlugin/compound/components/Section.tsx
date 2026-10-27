import React from "react";

export type SectionProps = {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const Section: React.FC<SectionProps> = ({ title, children, className, style }) => {
  return (
    <div className={className} style={style}>
      {title ? <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div> : null}
      <div>{children}</div>
    </div>
  );
};