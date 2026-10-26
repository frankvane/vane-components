import React from "react";

export interface ConfigField {
  name: string;
  type: string;
  description: string;
  /** doc.json 中声明的默认值（JS 字面量文本，如 `"\"bottom-right\""`、`"0.8"`、`"true"`） */
  default?: string;
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

/**
 * 把 doc.json 里声明的默认值文本还原成运行时值。
 *
 * doc.json 的 `default` 是「源码字面量文本」，形态很杂：
 *   "\"bottom-right\"" | "0.8" | "true" | "4/3" | "rgba(0, 153, 255, 0.6)" | "undefined"
 * 这里只做**静态可判定**的还原；函数 / 数组 / 对象 / 含变量的表达式一律返回 undefined，
 * 由插件工厂自身的默认值兜底（宁可不下发，也不要下发作废的零值）。
 */
export function parseDefault(raw?: string): any {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  if (s === "undefined" || s === "null") return undefined;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith('"') || s.startsWith("'")) {
    try {
      return s.startsWith('"') ? JSON.parse(s) : s.slice(1, -1);
    } catch {
      return undefined;
    }
  }
  // 纯算术表达式（如 ratio: 4/3），只允许数字与四则运算符，避免执行任意代码
  if (/^[\d\s+\-*/.()]+$/.test(s)) {
    try {
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict";return (${s})`)();
      if (typeof v === "number" && Number.isFinite(v)) return v;
    } catch {
      return undefined;
    }
  }
  // 常见颜色字面量在 doc.json 里常常不写引号
  if (/^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(s)) return s;
  return undefined;
}

/** 该字段在 doc.json 中声明了可静态还原的默认值 */
export function declaredDefault(f: ConfigField): any {
  return parseDefault(f.default);
}

/** 该字段没有声明可用的默认值时，控件的占位提示 */
function placeholderFor(f: ConfigField, kind: string): string {
  const d = declaredDefault(f);
  if (d !== undefined) return String(d);
  if (kind === "enum") return "（默认）";
  return "（默认）";
}

// 基于 doc.json config 生成参数控件（实时预览）。
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
        const dft = declaredDefault(f);
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
                onChange={(e) =>
                  onChange(f.name, e.target.value === "" ? undefined : e.target.value)
                }
              >
                <option value="">{placeholderFor(f, kind)}</option>
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
                checked={val === true}
                onChange={(e) => onChange(f.name, e.target.checked)}
              />
            )}
            {kind === "number" && (
              <input
                type="number"
                className="control-input"
                step="any"
                value={val ?? ""}
                placeholder={placeholderFor(f, kind)}
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
                placeholder={placeholderFor(f, kind)}
                onChange={(e) =>
                  onChange(f.name, e.target.value === "" ? undefined : e.target.value)
                }
              />
            )}
            {f.description && (
              <div className="control-desc">
                {f.description}
                {dft !== undefined && (
                  <span className="control-default"> · doc 默认 {String(dft)}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * 初始参数 = doc.json 声明的默认值。
 *
 * 早先的实现在这里按「类型零值」初始化（number→0、boolean→false、string→""），
 * 而 boolean / number 会原样下发给插件工厂，直接覆盖掉 `enabled=true`、`opacity=0.8`
 * 这类出厂默认，导致实时预览大面积看不出效果。现在只下发 doc.json 真正声明过的默认值，
 * 未声明的字段直接省略，交给工厂自带默认兜底。
 */
export function defaultValuesFor(fields: ConfigField[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fields) {
    const v = declaredDefault(f);
    if (v !== undefined) out[f.name] = v;
  }
  return out;
}
