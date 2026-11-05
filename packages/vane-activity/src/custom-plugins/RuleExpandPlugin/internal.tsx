/**
 * RuleExpandPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import { useState } from "react";
import type {
  ActivityData,
  ActivityPluginContext,
  ActivityRule,
} from "../../components/ActivityPlugin/plugins/types";

function normalizeRules(
  rules: string | ActivityRule[] | undefined
): ActivityRule[] {
  if (!rules) return [];
  if (typeof rules === "string") return [{ content: rules }];
  return rules;
}

/**
 * RuleExpandPlugin - 规则折叠：渲染「活动规则」可折叠面板，折叠态按 collapsedLines
 * 截断（line-clamp），展开/收起同步 aria-expanded。折叠状态为组件本地 state。
 */
export function RulePanel({
  context,
  collapsedLines,
}: {
  context: ActivityPluginContext;
  collapsedLines: number;
}) {
  const [open, setOpen] = useState(false);
  const rules = normalizeRules((context.data as ActivityData | undefined)?.rules);
  if (rules.length === 0) return null;

  return (
    <div style={{ borderTop: "1px solid rgba(128,128,128,0.18)", paddingTop: 10 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "#1f2328",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        活动规则
        <span
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .2s",
            color: "#5d636a",
          }}
        >
          ▾
        </span>
      </button>
      <div
        style={
          open
            ? { marginTop: 8 }
            : {
                marginTop: 8,
                display: "-webkit-box",
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {rules.map((r, i) => (
          <p
            key={i}
            style={{
              margin: "0 0 6px",
              fontSize: 12,
              lineHeight: 1.6,
              color: "#5d636a",
            }}
          >
            {r.title ? (
              <strong style={{ color: "#1f2328" }}>{r.title}：</strong>
            ) : null}
            {r.content}
          </p>
        ))}
      </div>
    </div>
  );
}
