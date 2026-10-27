import React from "react";

export type ReturnPolicyProps = {
  className?: string;
  style?: React.CSSProperties;
  windowDays?: number; // 退换货窗口期（天）
  allowReturn?: boolean;
  allowExchange?: boolean;
  freeReturnWithinDays?: number; // 指定天数内免运费退货
  restockingFeePercent?: number; // 补货/整新费百分比
  conditions?: string[]; // 条款简述列表
  contact?: string; // 售后联系方式
  policyLink?: string; // 完整政策链接
  compact?: boolean; // 紧凑模式
  theme?: "default" | "success" | "warning" | "danger";
  onViewPolicy?: () => void; // 查看详情回调
};

export const ReturnPolicy: React.FC<ReturnPolicyProps> = ({
  className = "",
  style,
  windowDays = 7,
  allowReturn = true,
  allowExchange = true,
  freeReturnWithinDays,
  restockingFeePercent,
  conditions = [],
  contact,
  policyLink,
  compact = false,
  theme = "default",
  onViewPolicy,
}) => {
  const themeColors: Record<string, string> = {
    default: "#eef2ff",
    success: "#e8f7e8",
    warning: "#fff7e6",
    danger: "#ffecec",
  };

  const accentColors: Record<string, string> = {
    default: "#4663d9",
    success: "#2f9d53",
    warning: "#d98c26",
    danger: "#d64545",
  };

  // theme 是用户可传的，颜色因此是动态值 → CSS 变量下发；形状/间距回 class
  const rootStyle = {
    "--vc-return-bg": themeColors[theme],
    "--vc-return-accent": accentColors[theme],
    ...style,
  } as React.CSSProperties;

  const pill = (text: string) => (
    <span className="vc-return__pill">
      <span className="vc-return__dot" />
      {text}
    </span>
  );

  return (
    <div
      className={`vc-return ${compact ? "vc-return--compact" : ""} ${className}`.replace(/\s+/g, " ").trim()}
      style={rootStyle}
    >
      <div className="vc-return__head">
        <div className="vc-return__title">
          <strong>退换政策</strong>
          <div className="vc-return__badges">
            {pill(`${windowDays}天窗口期`)}
            {allowReturn && pill("支持退货")}
            {allowExchange && pill("支持换货")}
            {typeof freeReturnWithinDays === "number" && pill(`${freeReturnWithinDays}天内免邮退货`)}
            {typeof restockingFeePercent === "number" && pill(`整新费 ${restockingFeePercent}%`)}
          </div>
        </div>
        {(policyLink || onViewPolicy) && (
          <button
            type="button"
            className="vc-return__link"
            onClick={() => {
              if (onViewPolicy) onViewPolicy();
              if (policyLink) window.open(policyLink, "_blank");
            }}
          >
            查看详情
          </button>
        )}
      </div>

      {!!conditions.length && (
        <div className="vc-return__body">
          <div className="vc-return__label">简要条款</div>
          <ul className="vc-return__list">
            {conditions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {contact && <div className="vc-return__contact">售后支持：{contact}</div>}
    </div>
  );
};