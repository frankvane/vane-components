import React from "react";
import type { PluginDoc } from "../data/plugin-catalog";

/**
 * doc.json 的配置项表
 *
 * 只显示三列（参数 / 默认值 / 说明）。类型放在 `title` 而不是单独一列：
 * 右栏只有 300px，四列会把说明挤成两三个字换一行的竖条。要类型把鼠标停在参数上。
 */
export const ConfigTable: React.FC<{
  config?: PluginDoc["config"];
  /** 最多显示几条（工坊卡里用 3；示例页不传 = 全量） */
  limit?: number;
}> = ({ config, limit }) => {
  const rows = config ?? [];
  if (!rows.length) return <p className="muted" style={{ padding: "10px 12px" }}>该插件没有可配置项。</p>;

  const shown = limit ? rows.slice(0, limit) : rows;

  return (
    <table className="config-table">
      <thead>
        <tr>
          <th>参数</th>
          <th>默认</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        {shown.map((c) => (
          <tr key={c.name}>
            <td>
              <code title={`${c.name}: ${c.type}`}>{c.name}</code>
            </td>
            <td className="default-cell">{c.default ?? "—"}</td>
            <td>{c.description ?? "—"}</td>
          </tr>
        ))}
        {limit && rows.length > limit ? (
          <tr>
            <td colSpan={3} className="muted" style={{ fontSize: 11 }}>
              还有 {rows.length - limit} 项，见该插件页
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
};
