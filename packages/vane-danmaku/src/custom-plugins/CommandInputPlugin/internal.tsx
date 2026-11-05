import { useState } from "react";
import type { DanmakuPluginContext } from "../../components/DanmakuPlugin/plugins/types";

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

const DEFAULT_PLACEHOLDER = "发条弹幕 / 指令（/clear）";

/**
 * 弹幕/指令输入框组件（内部实现，仅由 create.tsx 引用）。
 * 单独成文件：create.tsx 同时导出工厂函数与组件会触发 react-refresh 告警。
 */
export function CommandInput({
  context,
  onSend,
  placeholder = DEFAULT_PLACEHOLDER,
}: {
  context: DanmakuPluginContext;
  onSend?: (text: string) => void;
  placeholder?: string;
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
        aria-label="发送弹幕或指令"
        placeholder={placeholder}
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
