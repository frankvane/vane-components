import type {
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface StatsBarConfig {
  /** 是否显示各模式计数，默认 true */
  showModes?: boolean;
}

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

function StatsBar({
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

/**
 * StatsBarPlugin —— 弹幕统计条（UI 面，renderHeader）。
 * 读取领域上下文的 data 展示弹幕总数 / 置顶数 / 各模式计数（来自 transformData 后的数据集）。
 * 纯展示，不修改弹幕流；实时性取决于消费方传入的 items 更新频率。
 */
export function createStatsBarPlugin(
  config: StatsBarConfig = {}
): DanmakuPlugin {
  const showModes = config.showModes ?? true;
  return {
    name: "stats-bar",
    version: "0.1.0",
    description: doc.description,
    priority: 33,
    enabled: true,
    hooks: {
      renderHeader: (context: DanmakuPluginContext) => (
        <StatsBar context={context} showModes={showModes} />
      ),
    },
  };
}

createStatsBarPlugin.meta = doc as PluginDoc;
