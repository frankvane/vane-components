import React from "react";

export type A11yToolbarProps = {
  className?: string;
  style?: React.CSSProperties;
  applyTo?: "document" | "scoped"; // 目前实现 document 级别
};

function ensureA11yStyles() {
  const id = "a11y-toolbar-global-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    :root[data-a11y-large-font="true"] { font-size: 18px; }
    :root[data-a11y-high-contrast="true"] { filter: contrast(1.2) saturate(1.1); }
    :root[data-a11y-underline-links="true"] a { text-decoration: underline !important; }
    :root[data-a11y-focus-visible="true"] *:focus { outline: 2px solid #4663d9 !important; outline-offset: 2px; }
    :root[data-a11y-reduce-motion="true"] * { transition: none !important; animation: none !important; }
  `;
  document.head.appendChild(style);
}

export const A11yToolbar: React.FC<A11yToolbarProps> = ({
  className = "",
  style,
  applyTo = "document",
}) => {
  const [largeFont, setLargeFont] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);
  const [underlineLinks, setUnderlineLinks] = React.useState(false);
  const [focusVisible, setFocusVisible] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    ensureA11yStyles();
  }, []);

  React.useEffect(() => {
    if (applyTo !== "document") return;
    const root = document.documentElement;
    root.setAttribute("data-a11y-large-font", String(largeFont));
    root.setAttribute("data-a11y-high-contrast", String(highContrast));
    root.setAttribute("data-a11y-underline-links", String(underlineLinks));
    root.setAttribute("data-a11y-focus-visible", String(focusVisible));
    root.setAttribute("data-a11y-reduce-motion", String(reduceMotion));
  }, [largeFont, highContrast, underlineLinks, focusVisible, reduceMotion, applyTo]);

  const btn = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        border: active ? "2px solid #4663d9" : "1px solid #ddd",
        background: active ? "#eef2ff" : "#fff",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className={`a11y-toolbar ${className}`} style={{ display: "flex", gap: 8, flexWrap: "wrap", ...style }}>
      {btn("大字号", largeFont, () => setLargeFont(v => !v))}
      {btn("高对比度", highContrast, () => setHighContrast(v => !v))}
      {btn("链接加下划线", underlineLinks, () => setUnderlineLinks(v => !v))}
      {btn("可见焦点", focusVisible, () => setFocusVisible(v => !v))}
      {btn("减少动画", reduceMotion, () => setReduceMotion(v => !v))}
    </div>
  );
};