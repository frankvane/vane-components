import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type { ActivityPluginContext } from "../../components/ActivityPlugin/plugins/types";
import { RulePanel } from "./internal";
import doc from "./doc.json";

export interface RuleExpandPluginConfig {
  /** 折叠态最大展示行数（默认 3） */
  collapsedLines?: number;
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
      renderRules: (context: ActivityPluginContext) => (
        <RulePanel context={context} collapsedLines={collapsedLines} />
      ),
    },
  };
};

createRuleExpandPlugin.meta = doc as PluginDoc;
