/**
 * RuleModalPlugin 的组件层。
 *
 * 组件与插件工厂分文件：create.tsx 只导出工厂（非组件），这里只导出组件，
 * 以满足 react-refresh/only-export-components。
 */

import { useEffect, useRef, useState } from "react";
import type {
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

/** 模块级组件：身份稳定，开合状态自持（creator 调用时闭包传入文案配置） */
export function RuleModalTrigger(props: {
  context: ActivityPluginContext;
  triggerLabel: string;
  title: string;
  maxWidth: number;
}) {
  const { context, triggerLabel, title, maxWidth } = props;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // P1-6：Esc 关闭、初始焦点、Tab 焦点环、滚动锁、关闭后焦点还原。
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // 关闭后回到触发按钮；若触发按钮已卸载则退回先前焦点元素
      if (trigger?.isConnected) trigger.focus();
      else prevFocus?.focus?.();
    };
  }, [open]);

  const rules = normalizeRules(
    (context.data as { rules?: string | ActivityRule[] } | undefined)?.rules
  );
  if (rules.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
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
          ref={dialogRef}
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
                ref={closeRef}
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
