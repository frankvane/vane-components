import React, { useState } from "react";
import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginContext,
  ActivityRule,
} from "../../components/ActivityPlugin/plugins/types";
import doc from "./doc.json";

export interface RuleModalPluginConfig {
  /** 触发按钮文案（默认「活动规则」） */
  triggerLabel?: string;
  /** 弹窗标题（默认「活动规则」） */
  title?: string;
  /** 弹窗最大宽度（px，默认 420） */
  maxWidth?: number;
}

function normalizeRules(
  rules: string | ActivityRule[] | undefined
): ActivityRule[] {
  if (!rules) return [];
  if (typeof rules === "string") return [{ content: rules }];
  return rules;
}

/** 模块级组件：身份稳定，开合状态自持（creator 调用时闭包传入文案配置） */
function RuleModalTrigger(props: {
  context: ActivityPluginContext<any>;
  triggerLabel: string;
  title: string;
  maxWidth: number;
}) {
  const { context, triggerLabel, title, maxWidth } = props;
  const [open, setOpen] = useState(false);
  const rules = normalizeRules(
    (context.data as { rules?: string | ActivityRule[] } | undefined)?.rules
  );
  if (rules.length === 0) return null;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        style={{
          border: "1px solid #d8dce0",
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 13,
          background: "#fff",
          color: "#1f2328",
          cursor: "pointer",
        }}
      >
        {triggerLabel} <span aria-hidden>›</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              maxWidth,
              width: "100%",
              maxHeight: "70vh",
              overflow: "auto",
              padding: "18px 20px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <strong style={{ fontSize: 15, color: "#1f2328" }}>{title}</strong>
              <button
                type="button"
                aria-label="关闭"
                onClick={() => setOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 18,
                  lineHeight: 1,
                  color: "#5d636a",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>
            {rules.map((rule, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                {rule.title && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2328" }}>
                    {rule.title}
                  </div>
                )}
                <div style={{ fontSize: 12, lineHeight: 1.7, color: "#5d636a" }}>
                  {rule.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * RuleModalPlugin - 弹窗版规则（RuleExpand 的变体渲染）：规则区只放一个触发按钮，
 * 点击弹出模态窗展示完整规则。与 RuleExpand 都声明独占 renderRules，同时挂载时
 * 只留 priority 高者（装配期去重，控制台有警告）。
 */
export const createRuleModalPlugin: PluginCreator<RuleModalPluginConfig> = (
  config = {}
) => {
  const { triggerLabel = "活动规则", title = "活动规则", maxWidth = 420 } = config;

  return {
    name: "RuleModalPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 39,
    exclusiveSlots: ["renderRules"],
    config,
    hooks: {
      renderRules: (context: ActivityPluginContext<any>) => (
        <RuleModalTrigger
          context={context}
          triggerLabel={triggerLabel}
          title={title}
          maxWidth={maxWidth}
        />
      ),
    },
  };
};

createRuleModalPlugin.meta = doc as PluginDoc;
