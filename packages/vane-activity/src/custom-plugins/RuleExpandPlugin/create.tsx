import React, { useState } from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginContext,
  ActivityData,
  ActivityRule,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface RuleExpandPluginConfig {
  /** 折叠态最大展示行数（默认 3） */
  collapsedLines?: number;
}

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
function RulePanel({
  context,
  collapsedLines,
}: {
  context: ActivityPluginContext<any>;
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

export const createRuleExpandPlugin: PluginCreator<RuleExpandPluginConfig> = (
  config = {}
) => {
  const { collapsedLines = 3 } = config;

  return {
    name: "RuleExpandPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 40,
    exclusiveSlots: ["renderRules"],
    config,
    hooks: {
      renderRules: (context: ActivityPluginContext<any>) => (
        <RulePanel context={context} collapsedLines={collapsedLines} />
      ),
    },
  };
};

createRuleExpandPlugin.meta = doc as PluginDoc;
