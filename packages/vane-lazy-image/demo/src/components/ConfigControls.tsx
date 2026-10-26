import React from "react";

export interface ConfigField {
  name: string;
  type: string;
  description: string;
}

function isEnum(type: string): boolean {
  return /^"[^"]+"(\s*\|\s*"[^"]+")+$/.test(type.trim());
}
function enumOptions(type: string): string[] {
  return (type.match(/"([^"]+)"/g) || []).map((s) => s.slice(1, -1));
}
function baseType(type: string): "enum" | "number" | "boolean" | "string" {
  const t = type.trim().toLowerCase();
  if (isEnum(type)) return "enum";
  if (t === "boolean") return "boolean";
  if (t === "number") return "number";
  return "string";
}

// 基于 doc.json config 启发式生成参数控件（实时预览）。
export const ConfigControls: React.FC<{
  fields: ConfigField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
}> = ({ fields, values, onChange }) => {
  if (!fields || fields.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 13 }}>
        该插件暂无可调参数（使用内置默认值即可）。
      </p>
    );
  }
  return (
    <div className="config-controls">
      {fields.map((f) => {
        const kind = baseType(f.type);
        const val = values[f.name];
        return (
          <div className="control-row" key={f.name}>
            <label className="control-label">
              <code>{f.name}</code>
              <span className="control-type">{f.type}</span>
            </label>
            {kind === "enum" && (
              <select
                className="control-input"
                value={val ?? ""}
                onChange={(e) => onChange(f.name, e.target.value)}
              >
                <option value="">（默认）</option>
                {enumOptions(f.type).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}
            {kind === "boolean" && (
              <input
                type="checkbox"
                className="control-check"
                checked={!!val}
                onChange={(e) => onChange(f.name, e.target.checked)}
              />
            )}
            {kind === "number" && (
              <input
                type="number"
                className="control-input"
                value={val ?? ""}
                onChange={(e) =>
                  onChange(f.name, e.target.value === "" ? undefined : Number(e.target.value))
                }
              />
            )}
            {kind === "string" && (
              <input
                type="text"
                className="control-input"
                value={val ?? ""}
                placeholder="（默认）"
                onChange={(e) =>
                  onChange(f.name, e.target.value === "" ? undefined : e.target.value)
                }
              />
            )}
            {f.description && (
              <div className="control-desc">{f.description}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// 根据字段类型推导初始值（仅用于「重置」）。
export function defaultValuesFor(fields: ConfigField[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fields) {
    const kind = baseType(f.type);
    if (kind === "enum") out[f.name] = enumOptions(f.type)[0];
    else if (kind === "boolean") out[f.name] = false;
    else if (kind === "number") out[f.name] = 0;
    else out[f.name] = "";
  }
  return out;
}
