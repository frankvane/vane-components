/**
 * vane-coupon 调色板（core 与插件共用，单一来源）。
 *
 * 对比度基调（白底组件，实测口径）：
 *   正文 #1f2328 / 次要 #57606a —— 白底 ≥ 6.4:1，粉底（#fff1f3）≥ 5.8:1
 *   面额/主按钮 #d03050 —— 白底 4.98:1，粉底 4.52:1；白字压 #d03050 4.98:1（正文 ≥ 4.5）
 *   禁用 #6f757b on #f2f3f5 ≈ 4.4:1（禁用态豁免线 3:1 之上）
 *   紧迫 #a54a00 on #fff7e6 ≈ 5.6:1；过期 #b32d08 on #fff1f0 ≈ 5.9:1
 *
 * ADR-13：凡是内联了 background 的元素必须成对内联 color；文字弱化不用 opacity，
 * 一律用这里的实色。换肤走根节点 containerStyle 覆盖或宿主自己的包裹层。
 */
import type React from "react";

/** 票券根（.vc-coupon） */
export const rootStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#1f2328",
  border: "1px solid #e8eaed",
  borderRadius: 12,
  padding: 16,
  fontFamily: "inherit",
};

/** 角标区（before 槽） */
export const badgesStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  marginBottom: 8,
};

export const badgeStackStyle: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.5,
  padding: "1px 8px",
  borderRadius: 4,
  background: "#fff1f3",
  color: "#d03050",
  border: "1px solid #f3c9d2",
};

export const badgeMutedStyle: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.5,
  padding: "1px 8px",
  borderRadius: 4,
  background: "#f2f3f5",
  color: "#5d636a",
  border: "1px solid #e8eaed",
}; // #6f757b on #f2f3f5 只有 4.2:1，非禁用文字要 ≥4.5

/** 票券本体 */
export const bodyStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "stretch",
};

export const faceStyle: React.CSSProperties = {
  flex: "none",
  minWidth: 104,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  textAlign: "center",
  padding: 12,
  borderRadius: 8,
  background: "#fff1f3",
  border: "1px solid #f3c9d2",
};

export const amountStyle: React.CSSProperties = {
  color: "#d03050",
  fontWeight: 700,
  lineHeight: 1.1,
  whiteSpace: "nowrap",
};

export const amountCurrencyStyle: React.CSSProperties = {
  fontSize: 16,
  marginRight: 2,
};

export const amountValueStyle: React.CSSProperties = {
  fontSize: 30,
};

export const amountUnitStyle: React.CSSProperties = {
  fontSize: 14,
  marginLeft: 2,
};

export const thresholdStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#57606a",
};

export const infoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 4,
};

export const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.4,
  // anywhere 参与最小内容宽度计算，长英文串/数字不会把票面撑出横向滚动
  overflowWrap: "anywhere",
};

/** 信息行（after 槽：有效期 / 规则） */
export const fieldLabelStyle: React.CSSProperties = {
  flex: "none",
  fontSize: 12,
  color: "#57606a",
};

export const validityStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 10,
  fontSize: 12,
  color: "#57606a",
};

export const validityTextStyle: React.CSSProperties = {
  overflowWrap: "anywhere",
};

export const chipBaseStyle: React.CSSProperties = {
  flex: "none",
  fontSize: 11,
  lineHeight: 1.6,
  padding: "0 6px",
  borderRadius: 4,
};

export const chipUrgentStyle: React.CSSProperties = {
  ...chipBaseStyle,
  background: "#fff7e6",
  color: "#a54a00",
  border: "1px solid #ffd591",
};

export const chipExpiredStyle: React.CSSProperties = {
  ...chipBaseStyle,
  background: "#fff1f0",
  color: "#b32d08",
  border: "1px solid #ffa39e",
};

export const chipMutedStyle: React.CSSProperties = {
  ...chipBaseStyle,
  background: "#f2f3f5",
  color: "#5d636a",
  border: "1px solid #e8eaed",
};

/** 规则展开 */
export const rulesStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 12,
};

export const rulesTitleStyle: React.CSSProperties = {
  color: "#57606a",
  marginBottom: 4,
};

export const rulesListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 2,
};

export const rulesItemStyle: React.CSSProperties = {
  color: "#1f2328",
  overflowWrap: "anywhere",
};

export const rulesToggleStyle: React.CSSProperties = {
  marginTop: 6,
  padding: 0,
  border: 0,
  background: "none",
  fontSize: 12,
  // 链接蓝用深一档：#2b7de9 白底只有 4.03:1，#1a66c2 5.6:1（正文 ≥ 4.5）
  color: "#1a66c2",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "inherit",
};

export const rulesCaretStyle: React.CSSProperties = {
  fontSize: 10,
};

/** 操作区（footer 槽） */
export const actionsStyle: React.CSSProperties = {
  marginTop: 12,
};

export const claimStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 16px",
  border: 0,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  background: "#d03050",
  color: "#ffffff",
};

export const claimMutedStyle: React.CSSProperties = {
  ...claimStyle,
  cursor: "not-allowed",
  background: "#f2f3f5",
  color: "#6f757b",
  border: "1px solid #e8eaed",
};
