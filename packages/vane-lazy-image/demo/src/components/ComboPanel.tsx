import React, { useState } from "react";
import type { ComboMeta } from "../data/plugin-catalog";
import { CodeBlock } from "./CodeBlock";

export const ComboPanel: React.FC<{ combo: ComboMeta }> = ({ combo }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="combo-panel">
      <h3 className="section-title">组合构成</h3>
      <p className="combo-desc">{combo.description}</p>
      <ul className="combo-plugins">
        {combo.plugins.map((p, i) => (
          <li key={i} className="combo-plugin">
            <span className="combo-plugin-name">{p.name}</span>
            <span className="combo-plugin-role">{p.role}</span>
          </li>
        ))}
      </ul>
      <div className="example-actions">
        <button
          type="button"
          className="example-toggle"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "隐藏源码" : "查看源码"}
        </button>
      </div>
      {open && (
        <div className="example-source">
          <CodeBlock code={combo.code} />
        </div>
      )}
    </section>
  );
};
