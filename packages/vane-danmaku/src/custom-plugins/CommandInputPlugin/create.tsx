import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";
import { CommandInput } from "./internal";

export interface CommandInputConfig {
  /** 占位符，默认 "发条弹幕 / 指令（/clear）" */
  placeholder?: string;
  /** 发送回调（消费方可据此向弹幕流追加一条弹幕）；与 bus 广播并存 */
  onSend?: (text: string) => void;
}

/**
 * CommandInputPlugin —— 弹幕/指令输入框（UI 面，renderFooter）。
 * 输入框提交经 bus 广播 "danmaku:send" {text}；消费方（demo）据此向弹幕流
 * 追加一条滚动弹幕，或交给 CmdParsePlugin 解析为指令（如 /clear）。
 */
export function createCommandInputPlugin(
  config: CommandInputConfig = {}
): DanmakuPlugin {
  return {
    name: "command-input",
    version: "0.1.0",
    description: doc.description,
    priority: 32,
    enabled: true,
    hooks: {
      renderFooter: (context: DanmakuPluginContext) => (
        <CommandInput
          context={context}
          onSend={config.onSend}
          placeholder={config.placeholder}
        />
      ),
    },
  };
}

createCommandInputPlugin.meta = doc as PluginDoc;
