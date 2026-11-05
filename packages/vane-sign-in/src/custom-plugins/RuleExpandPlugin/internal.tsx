import React, { useId, useState } from "react";
import { TEXT_2, TEXT_3 } from "../tokens";

export function RuleBlock({
  rules,
  initialOpen,
}: {
  rules?: string[];
  initialOpen: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const panelId = useId();
  if (!rules || !rules.length) return null;
  return (
    <div>
      <button
        type="button"
        data-testid="si-rule-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        style={{
          border: "none",
          background: "transparent",
          color: TEXT_2,
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
        }}
      >
        {open ? "收起活动规则 ▲" : "活动规则 ▼"}
      </button>
      {open && (
        <ul
          id={panelId}
          style={{
            margin: "6px 0 0",
            paddingLeft: 18,
            fontSize: 12,
            color: TEXT_3,
          }}
        >
          {rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
