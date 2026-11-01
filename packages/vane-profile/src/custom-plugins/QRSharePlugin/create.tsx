import React, { useEffect, useRef, useState } from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import { safeHref } from "../../components/ProfilePlugin/plugins/safe-url";
import doc from "./doc.json";

export interface QRShareConfig {
  /** 要分享的主页地址；缺省读 props.data?.homeUrl。两者都没有时不渲染按钮 */
  url?: string;
  /** 按钮文案，默认「分享」 */
  buttonLabel?: React.ReactNode;
  /** 二维码占位区边长（px），默认 96 */
  size?: number;
}

/** 由 url 派生一个确定性的装饰性点阵（非真实可扫码 QR，仅作视觉占位） */
function dots(url: string, n = 11): boolean[][] {
  const grid: boolean[][] = [];
  let seed = 0;
  for (let i = 0; i < url.length; i++) seed = (seed * 31 + url.charCodeAt(i)) >>> 0;
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      row.push((seed >> 16) % 100 < 48);
    }
    grid.push(row);
  }
  return grid;
}

type CopyState = "idle" | "ok" | "fail";
const COPY_LABEL: Record<CopyState, string> = {
  idle: "复制链接",
  ok: "已复制",
  fail: "复制失败",
};

/** 内部组件：持有展开 / 复制状态，确保 useState 处于 React 渲染上下文 */
function QRSharePanel({
  url,
  buttonLabel,
  size,
}: {
  url: string;
  buttonLabel: React.ReactNode;
  size: number;
}) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grid = dots(url);

  // 定时器清理：卸载时不留悬挂 setTimeout
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  // 浮层打开时：Esc 关闭 + 点击外部关闭，关闭即清理监听
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = event.target as Node | null;
      if (target && !root.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const copy = async () => {
    let next: CopyState;
    try {
      // 非安全上下文（http）下 navigator.clipboard 不存在，必须显式判失败并提示，
      // 不能让用户以为复制成功。
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(url);
      next = "ok";
    } catch {
      next = "fail";
    }
    setCopyState(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopyState("idle"), 1500);
  };

  return (
    <div className="vp-qrshare" ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 10px",
          borderRadius: 999,
          fontSize: 12,
          border: "1px solid rgba(255,255,255,0.7)",
          /* 0.35 压在白底上只有 #a6a6a6（白字 2.44:1）—— 提到 0.55 才有 4.6:1 */
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          cursor: "pointer",
          lineHeight: 1.6,
        }}
      >
        <span aria-hidden>⤴</span>
        {buttonLabel}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="分享二维码"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: size + 24,
            padding: 12,
            borderRadius: 10,
            background: "#fff",
            color: "#222",
            boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: size,
              height: size,
              display: "grid",
              gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
              gap: 1,
              margin: "0 auto 8px",
            }}
          >
            {grid.flatMap((row, r) =>
              row.map((on, c) => (
                <span
                  key={`${r}-${c}`}
                  style={{ background: on ? "#222" : "#fff" }}
                />
              ))
            )}
          </div>
          <div style={{ fontSize: 11, wordBreak: "break-all", marginBottom: 8 }}>
            {url}
          </div>
          <button
            type="button"
            onClick={() => void copy()}
            aria-live="polite"
            style={{
              width: "100%",
              padding: "4px 0",
              borderRadius: 6,
              border: "none",
              background: copyState === "fail" ? "#c62828" : "#1a5fd0",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {COPY_LABEL[copyState]}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * QRShare - 主页二维码分享：浮于头图右上的「分享」按钮，点击展开二维码占位面板。
 *
 * 走领域槽 `renderBadgeArea`（与 VerifyBadge / MembershipBadge 同区横向并排）。
 * 二维码为装饰性点阵占位（不引第三方库），面板提供「复制链接」。
 * 分享地址取自 config.url ?? props.data.homeUrl，二者都无则不渲染——
 * 不再回退到示例站点默认值（避免接入方忘传 url 时把用户指向 vane.dev）。
 */
export function createQRSharePlugin<T = any>(
  config: QRShareConfig = {}
): ProfilePlugin<T> {
  const { url, buttonLabel = "分享", size = 96 } = config;
  return {
    name: "QRShare",
    version: "0.1.0",
    description: "主页二维码分享：浮于头图右上的分享按钮，点击展开二维码与复制链接。",
    priority: 30,
    enabled: true,
    hooks: {
      renderBadgeArea: (context: ProfilePluginContext<T>) => {
        const homeUrl = (context.data as unknown as { homeUrl?: string } | undefined)
          ?.homeUrl;
        const resolved = safeHref(url ?? homeUrl);
        if (!resolved) return null;
        return <QRSharePanel url={resolved} buttonLabel={buttonLabel} size={size} />;
      },
    },
  };
}
