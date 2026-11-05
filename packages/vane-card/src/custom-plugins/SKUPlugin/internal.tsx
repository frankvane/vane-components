import React from "react";

export const Selector: React.FC<{
  attributes: { name: string; options: string[] }[];
  selection: Record<string, string>;
  onChange: (name: string, value: string) => void;
}> = ({ attributes, selection, onChange }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
      {attributes.map((attr) => (
        <div key={attr.name} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#666", minWidth: 60 }}>{attr.name}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {attr.options.map((opt) => {
              const active = selection[attr.name] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => onChange(attr.name, opt)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: active ? "2px solid #2e7d32" : "1px solid #ddd",
                    background: active ? "#E8F5E9" : "#fff",
                    color: "#333",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
