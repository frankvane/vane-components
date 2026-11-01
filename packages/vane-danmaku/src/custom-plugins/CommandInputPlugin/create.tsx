import { useState } from "react";
import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface CommandInputConfig {
  /** 占位符，默认 "发条弹幕 / 指令（/clear）" */
  placeholder?: string;
  /** 发送回调（消费方可据此向弹幕流追加一条弹幕）；与 bus 广播并存 */
  onSend?: (text: string) => void;
}

const WRAP: React.CSSProperties = {
  display: "flex",
  gap: 6,
  width: "100%",
  pointerEvents: "auto",
};
const INPUT: React.CSSProperties = {
  flex: 1,
  pointerEvents: "auto",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 8,
  color: "#fff",
  padding: "6px 10px",
  font: "13px system-ui, sans-serif",
  outline: "none",
};
const SEND: React.CSSProperties = {
  pointerEvents: "auto",
  cursor: "pointer",
  border: "none",
  borderRadius: 8,
  padding: "6px 14px",
  font: "13px system-ui, sans-serif",
  color: "#fff",
  background: "rgba(255,122,41,0.95)",
};

function CommandInput({
  context,
  onSend,
}: {
  context: DanmakuPluginContext;
  onSend?: CommandInputConfig["onSend"];
}) {
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    context.bus.emit("danmaku:send", { text: t });
    onSend?.(t);
    setText("");
  };

  return (
    <div style={WRAP}>
      <input
        style={INPUT}
        value={text}
        placeholder="发条弹幕 / 指令（/clear）"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
        }}
      />
      <button type="button" style={SEND} onClick={send}>
        发送
      </button>
    </div>
  );
}

/**
 * CommandInputPlugin —— 弹幕/指令输入框（UI 面，renderFooter）。
 * 输入框提交经 bus 广播 "danmaku:send" {text}；消费方（demo）据此向弹幕流
 * 追加一条滚动弹幕，或交给 CmdParsePlugin 解析为指令（如 /clear）。
 */
export function createCommandInputPlugin(
  _config: CommandInputConfig = {}
): DanmakuPlugin {
  return {
    name: "command-input",
    version: "0.1.0",
    description: doc.description,
    priority: 32,
    enabled: true,
    hooks: {
      renderFooter: (context: DanmakuPluginContext) => (
        <CommandInput context={context} onSend={_config.onSend} />
      ),
    },
  };
}

createCommandInputPlugin.meta = doc as PluginDoc;
