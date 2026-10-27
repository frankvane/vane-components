import React from "react";
import { useProductCard } from "../ProductCard";

export type SpecsTableProps = {
  specs?: Record<string, React.ReactNode> | Array<{ key: string; value: React.ReactNode }>;
  className?: string;
  style?: React.CSSProperties;
};

function normalize(
  specs?: Record<string, React.ReactNode> | Array<{ key: string; value: React.ReactNode }>
): Array<{ key: string; value: React.ReactNode }> {
  if (!specs) return [];
  if (Array.isArray(specs)) return specs;
  return Object.entries(specs).map(([key, value]) => ({ key, value }));
}

export const SpecsTable: React.FC<SpecsTableProps> = ({ specs, className, style }) => {
  const { data } = useProductCard();
  const rows = normalize(specs ?? data?.specs);
  if (!rows.length) return null;
  return (
    <div className={className} style={style}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ width: "30%", padding: "6px 8px", color: "#666" }}>{r.key}</td>
              <td style={{ padding: "6px 8px", color: "#333" }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};