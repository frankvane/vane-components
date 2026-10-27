/**
 * 重依赖插件的三种「非正常态」面板：加载中 / 解析失败 / 依赖缺失。
 *
 * ## 为什么要有「依赖缺失」这一种
 *
 * 迁移前 7 个重依赖插件都是**顶层静态 import**（`import JSZip from "jszip"`）。
 * 消费方只装了 `vane-file-preview`、没装 `jszip` 时，模块图在加载阶段就炸了：
 * 整页白屏 + 控制台一句 "Failed to fetch dynamically imported module"，
 * 用户看不出是「少装了一个包」，也看不出该装哪个。
 *
 * optional peer 的意义就在这里 —— 依赖是**可选**的，那么「没装」就必须是一种
 * **可渲染的状态**，而不是一个崩溃。所以 7 个插件全部改成动态 import，
 * 失败时落到这个面板：写明包名 + 一行安装命令 + 一句「装完就能用」。
 *
 * 面板不吞错误原文：折叠在最后一行，排查时不用再去翻控制台。
 */

import React, { useState } from "react";

// ============ 加载中 ============

export interface LoadingPanelProps {
  icon: string;
  label: string;
}

export const LoadingPanel: React.FC<LoadingPanelProps> = ({ icon, label }) => (
  <div
    data-vfp-panel="loading"
    style={{
      height: "100%",
      minHeight: 180,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 12,
      color: "#6b7280",
      background: "#fafafa",
      fontSize: 13,
    }}
  >
    <div style={{ fontSize: 24, lineHeight: 1 }}>{icon}</div>
    <div>{label}</div>
  </div>
);

// ============ 解析失败 ============

export interface ErrorPanelProps {
  /** 一句话说明「什么没成」，例如「DOCX 解析失败」 */
  label: string;
  error: string;
  icon?: string;
  /**
   * 可选的出路按钮。
   *
   * 加这个参数是因为：解析失败的面板原本是**死路** —— 用户看着一句
   * 「打不开」，既不能重试也不能拿到文件。而这类失败十有八九是「浏览器
   * 不解这个格式」，此时最该给的按钮是「下载」。按钮文案由调用方定，
   * 面板不猜。
   */
  action?: { label: string; onClick: () => void };
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({
  label,
  error,
  icon = "⚠️",
  action,
}) => (
  <div
    data-vfp-panel="error"
    style={{
      height: "100%",
      minHeight: 180,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 10,
      padding: 24,
      boxSizing: "border-box",
      color: "#b91c1c",
      background: "#fef2f2",
      fontSize: 13,
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 24, lineHeight: 1 }}>{icon}</div>
    <div style={{ fontWeight: 500 }}>{label}</div>
    <div
      style={{
        color: "#7f1d1d",
        opacity: 0.8,
        maxWidth: 520,
        overflowWrap: "anywhere",
        lineHeight: 1.6,
      }}
    >
      {error}
    </div>
    {action ? (
      <button
        type="button"
        data-vfp-error-action
        onClick={action.onClick}
        style={{
          marginTop: 2,
          padding: "6px 14px",
          border: "1px solid #fecaca",
          borderRadius: 6,
          background: "#fff",
          color: "#b91c1c",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {action.label}
      </button>
    ) : null}
  </div>
);

// ============ 依赖缺失 ============

export interface MissingDependencyProps {
  /** npm 包名，例如 `jszip` */
  pkg: string;
  /** 这个插件是干什么的，用来解释「装上之后会得到什么」 */
  feature?: string;
  /** 备选方案提示，例如「也可以改用 DocxPreviewPlugin」 */
  hint?: React.ReactNode;
  /** 原始错误，折叠展示 */
  error?: string;
}

export const MissingDependency: React.FC<MissingDependencyProps> = ({
  pkg,
  feature,
  hint,
  error,
}) => {
  const [showError, setShowError] = useState(false);
  const command = `npm i ${pkg}`;

  return (
    <div
      data-vfp-panel="missing-dependency"
      // 断言用：测试与浏览器验收都靠它确认「走的是降级路径」
      data-vfp-missing={pkg}
      style={{
        height: "100%",
        minHeight: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
        background: "#f8fafc",
        color: "#334155",
        fontSize: 13,
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: "20px 22px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          lineHeight: 1.7,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>📦</span>
          <strong style={{ fontSize: 14 }}>缺少可选依赖 {pkg}</strong>
        </div>

        <div style={{ color: "#475569" }}>
          {feature ? `${feature}。` : null}这个插件把渲染交给 <code>{pkg}</code>
          ，它没有随本包装进来（optional peer，默认不装）。
        </div>

        <pre
          style={{
            margin: 0,
            padding: "10px 12px",
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: 6,
            fontSize: 12,
            fontFamily:
              "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, Menlo, monospace",
            overflowX: "auto",
          }}
        >
          <code>{command}</code>
        </pre>

        {hint ? <div style={{ color: "#475569" }}>{hint}</div> : null}

        {error ? (
          <div>
            <button
              type="button"
              onClick={() => setShowError((v) => !v)}
              style={{
                padding: 0,
                border: "none",
                background: "none",
                color: "#64748b",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {showError ? "隐藏错误详情" : "查看错误详情"}
            </button>
            {showError ? (
              <div
                style={{
                  marginTop: 6,
                  color: "#94a3b8",
                  fontSize: 11,
                  overflowWrap: "anywhere",
                }}
              >
                {error}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
