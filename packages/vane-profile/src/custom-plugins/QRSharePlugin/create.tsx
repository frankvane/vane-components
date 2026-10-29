import React, { useState } from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import doc from "./doc.json";

export interface QRShareConfig {
  /** 要分享的主页地址；缺省读 props.data?.homeUrl 或占位文本 */
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
  const [copied, setCopied] = useState(false);
  const grid = dots(url);
  return (
    <div className="vp-qrshare" style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
            onClick={() => {
              navigator.clipboard?.writeText(url).then(
                () => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                },
                () => {}
              );
            }}
            style={{
              width: "100%",
              padding: "4px 0",
              borderRadius: 6,
              border: "none",
              background: "#1a5fd0",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {copied ? "已复制" : "复制链接"}
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
 */
export function createQRSharePlugin<T = any>(
  config: QRShareConfig = {}
): ProfilePlugin<T> {
  const { url = "https://vane.dev/u/frankvane", buttonLabel = "分享", size = 96 } = config;
  return {
    name: "QRShare",
    version: "0.1.0",
    description: "主页二维码分享：浮于头图右上的分享按钮，点击展开二维码与复制链接。",
    priority: 30,
    enabled: true,
    hooks: {
      renderBadgeArea: (_context: ProfilePluginContext<T>) => (
        <QRSharePanel url={url} buttonLabel={buttonLabel} size={size} />
      ),
    },
  };
}
