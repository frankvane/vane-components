import React, { useEffect, useRef } from "react";
import { tokens, toolbarBtn } from "./tokens";

/**
 * Overlay - 官方插件共用的弹层基础组件（移植自 vane-resume）。
 *
 * 统一负责可访问性语义与键盘行为：
 *  - role="dialog" + aria-modal + aria-label
 *  - Escape 关闭
 *  - 打开时把焦点移入弹层，关闭后归还给触发元素
 *  - Tab / Shift+Tab 在弹层内循环
 *
 * 插件渲染钩子本身不运行 hooks，但返回的 Overlay 是普通 React 组件，可以安全使用。
 */
export interface OverlayProps {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  zIndex?: number;
  closeLabel?: string;
  /** 标题栏右侧、关闭按钮之前的自定义内容 */
  headerExtra?: React.ReactNode;
  /** 居中弹窗 / 底部抽屉 */
  align?: "center" | "end";
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 已打开弹层栈（模块级）：多弹层并存时 Escape / Tab 拦截只作用于最上层，
 * 避免按一次 Escape 所有弹层同时关闭。
 */
const overlayStack: number[] = [];
let overlaySeq = 0;

export function Overlay({
  title,
  onClose,
  children,
  width = 360,
  zIndex = 55,
  closeLabel = "关闭",
  headerExtra,
  align = "center",
}: OverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof document === "undefined") return;

    const stackId = ++overlaySeq;
    overlayStack.push(stackId);
    const isTopmost = () => overlayStack[overlayStack.length - 1] === stackId;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled")
      );
    const first = focusables()[0];
    (first ?? dialog).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      // 非顶层弹层不响应（下层弹层保持打开）
      if (!isTopmost()) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const idx = overlayStack.indexOf(stackId);
      if (idx >= 0) overlayStack.splice(idx, 1);
      try {
        previouslyFocused?.focus();
      } catch {
        /* 触发元素可能已卸载 */
      }
    };
  }, []);

  return (
    <div
      data-vcd-overlay=""
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: align === "end" ? "flex-end" : "center",
        justifyContent: "center",
        zIndex,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        style={{
          background: "#fff",
          color: tokens.text,
          borderRadius: align === "end" ? "10px 10px 0 0" : 10,
          padding: 18,
          width,
          maxWidth: "92%",
          maxHeight: "86%",
          overflow: "auto",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          outline: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <strong style={{ color: tokens.text, flex: 1, minWidth: 0 }}>{title}</strong>
          {headerExtra}
          <button type="button" onClick={onClose} style={toolbarBtn(false)}>
            {closeLabel}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
