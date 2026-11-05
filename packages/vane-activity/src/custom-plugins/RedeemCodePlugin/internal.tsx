/**
 * RedeemCodePlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import React, { useEffect, useRef, useState } from "react";

export function RedeemForm({
  title,
  prefix,
  minLength,
  placeholder,
  successText,
  onRedeem,
}: {
  title: string;
  prefix?: string;
  minLength: number;
  placeholder: string;
  successText: string;
  onRedeem?: (code: string) => boolean | void | Promise<boolean | void>;
}) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const value = code.trim().toUpperCase();

    if (!value) {
      setMsg({ type: "error", text: "请输入兑换码" });
      return;
    }
    if (value.length < minLength) {
      setMsg({ type: "error", text: `兑换码至少 ${minLength} 位` });
      return;
    }
    if (prefix && !value.startsWith(prefix.toUpperCase())) {
      setMsg({ type: "error", text: `兑换码应以 ${prefix.toUpperCase()} 开头` });
      return;
    }

    // P2-13：支持 Promise；等待期间禁用提交，卸载后丢弃回包。
    setPending(true);
    try {
      const ok = await onRedeem?.(value);
      if (!alive.current) return;
      if (ok === false) {
        setMsg({ type: "error", text: "兑换码无效或已被使用" });
        return;
      }
      setMsg({ type: "ok", text: successText });
      setCode("");
    } catch {
      if (alive.current) {
        setMsg({ type: "error", text: "兑换失败，请稍后重试" });
      }
    } finally {
      if (alive.current) setPending(false);
    }
  };

  const invalid = msg?.type === "error";

  return (
    <section
      aria-label={title}
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(128,128,128,0.18)",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1f2328" }}>
          {title}
        </span>
        <span style={{ fontSize: 12, color: "#5d636a" }}>
          {prefix ? `前缀 ${prefix.toUpperCase()} · 至少 ${minLength} 位` : `至少 ${minLength} 位`}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: 8, marginTop: 10 }}
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (msg) setMsg(null);
          }}
          placeholder={placeholder}
          aria-label="兑换码"
          aria-invalid={invalid || undefined}
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            minWidth: 0,
            boxSizing: "border-box",
            height: 34,
            padding: "0 10px",
            borderRadius: 8,
            /* 错误态边框加深，但不靠边框单独传达错误（另有 aria-live 文案） */
            border: `1px solid ${invalid ? "#b42318" : "rgba(128,128,128,0.28)"}`,
            background: "#fff",
            color: "#1f2328",
            fontSize: 13,
            fontFamily: "inherit",
            letterSpacing: "0.04em",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            flex: "none",
            border: "none",
            borderRadius: 8,
            padding: "0 16px",
            height: 34,
            fontSize: 13,
            fontWeight: 600,
            background: pending ? "#a33a06" : "#cf4407",
            color: "#fff",
            cursor: pending ? "default" : "pointer",
          }}
        >
          {pending ? "兑换中" : "兑换"}
        </button>
      </form>

      <p
        aria-live="polite"
        style={{
          margin: "8px 0 0",
          minHeight: 18,
          fontSize: 12,
          lineHeight: 1.6,
          /* 成功 #15803d 5.0:1；失败 #b42318 5.9:1；无消息用 muted #5d636a 6.0:1 */
          color: msg ? (msg.type === "ok" ? "#15803d" : "#b42318") : "#5d636a",
          fontWeight: msg ? 600 : 400,
        }}
      >
        {msg ? msg.text : "输入活动发放的兑换码，奖励实时入账"}
      </p>
    </section>
  );
}
