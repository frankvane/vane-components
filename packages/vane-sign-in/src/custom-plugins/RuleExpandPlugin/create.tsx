import type React from "react";
import { useId, useState } from "react";
import type {
  SignInPlugin,
  SignInPluginContext,
} from "../../components/SignInPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { TEXT_2, TEXT_3 } from "../tokens";

export interface RuleExpandConfig {
  /** 初始是否展开 */
  defaultOpen?: boolean;
}

function RuleBlock({
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

/**
 * RuleExpandPlugin - 规则折叠展开（底部区）。
 * 将 data.rules 折叠为可展开列表，避免长规则文案常驻占用空间。
 * 无 rules 数据时静默返回 null。
 */
export function createRuleExpandPlugin<T = any>(
  config: RuleExpandConfig = {}
): SignInPlugin<T> {
  const { defaultOpen = false } = config;
  return {
    name: "RuleExpand",
    version: "0.1.0",
    description: doc.description,
    priority: 50,
    enabled: true,
    hooks: {
      renderFooter: (ctx: SignInPluginContext<T>) => (
        <RuleBlock rules={ctx.data.rules} initialOpen={defaultOpen} />
      ),
    },
  };
}

createRuleExpandPlugin.meta = doc as PluginDoc;
