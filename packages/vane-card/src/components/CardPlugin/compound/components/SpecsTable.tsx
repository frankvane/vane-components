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
    <div className={`vc-specs ${className ?? ""}`.trim()} style={style}>
      <table className="vc-specs__table">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th className="vc-specs__key" scope="row">
                {r.key}
              </th>
              <td className="vc-specs__value">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};