import React from "react";
import { tokens } from "../../components/CandidatePlugin/plugins/tokens";

/** 面试安排浮层的字段分组（label + 按钮组），独立文件避免与插件工厂混导出 */
export function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div>
    </div>
  );
}
