import type { DanmakuPluginContext } from "../../components/DanmakuPlugin/plugins/types";

const WRAP: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  pointerEvents: "auto",
  background: "rgba(20,20,24,0.55)",
  borderRadius: 8,
  padding: "4px 10px",
  font: "12px/1.4 system-ui, sans-serif",
  color: "#fff",
};
const ITEM: React.CSSProperties = { whiteSpace: "nowrap" };

/**
 * 弹幕统计条组件（内部实现，仅由 create.tsx 引用）。
 * 单独成文件：create.tsx 同时导出工厂函数与组件会触发 react-refresh 告警。
 */
export function StatsBar({
  context,
  showModes,
}: {
  context: DanmakuPluginContext;
  showModes: boolean;
}) {
  const items = context.data.items;
  const total = items.length;
  const byMode: Record<string, number> = {};
  let pinned = 0;
  for (const it of items) {
    byMode[it.mode] = (byMode[it.mode] ?? 0) + 1;
    if (it.renderHint?.pinned) pinned++;
  }

  return (
    <div style={WRAP}>
      <span style={ITEM}>弹幕总数 <b>{total}</b></span>
      <span style={ITEM}>置顶 <b>{pinned}</b></span>
      {showModes &&
        Object.entries(byMode).map(([m, n]) => (
          <span key={m} style={ITEM}>
            {m} <b>{n}</b>
          </span>
        ))}
    </div>
  );
}
