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

  const containerStyles: React.CSSProperties = {
    display: "grid",
    gap: compact ? 8 : 12,
    border: "1px solid #eee",
    borderRadius: 8,
    padding: compact ? 10 : 12,
    background: themeColors[theme],
    ...style,
  };

  const badgeStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: "4px 8px",
    background: "#fff",
    border: "1px solid #eee",
    color: accentColors[theme],
    fontSize: 12,
    fontWeight: 600,
  };

  const pill = (text: string) => (
    <span style={badgeStyles}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: accentColors[theme] }} />
      {text}
    </span>
  );

  return (
    <div className={`return-policy ${className}`} style={containerStyles}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <strong>退换政策</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
            onClick={() => {
              if (onViewPolicy) onViewPolicy();
              if (policyLink) window.open(policyLink, "_blank");
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#fff",
              color: accentColors[theme],
              cursor: "pointer",
            }}
          >
            查看详情
          </button>
        )}
      </div>

      {!!conditions.length && (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ color: "#666" }}>简要条款</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {conditions.map((c, i) => (
              <li key={i} style={{ color: "#333", fontSize: compact ? 12 : 14 }}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {contact && (
        <div style={{ color: "#666" }}>售后支持：{contact}</div>
      )}
    </div>
  );
};