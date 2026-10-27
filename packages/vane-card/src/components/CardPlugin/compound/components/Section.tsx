import React from "react";

export type SectionProps = {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const Section: React.FC<SectionProps> = ({ title, children, className, style }) => {
  return (
    <div className={`vc-section ${className ?? ""}`.trim()} style={style}>
      {title ? <div className="vc-section__title">{title}</div> : null}
      <div>{children}</div>
    </div>
  );
};