import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type { ActivityPluginContext } from "../../components/ActivityPlugin/plugins/types";
import { RuleModalTrigger } from "./internal";
import doc from "./doc.json";

export interface RuleModalPluginConfig {
  /** 触发按钮文案（默认「活动规则」） */
  triggerLabel?: string;
  /** 弹窗标题（默认「活动规则」） */
  title?: string;
  /** 弹窗最大宽度（px，默认 420） */
  maxWidth?: number;
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
      renderRules: (context: ActivityPluginContext) => (
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
