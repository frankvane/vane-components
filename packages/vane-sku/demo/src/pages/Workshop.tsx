import React from "react";
import { createSkuSelector } from "../../../src";
import type { SkuVariant } from "../../../src";
import { createPriceLinkPlugin } from "../../../src/custom-plugins/PriceLink";
import { createPriceRangePlugin } from "../../../src/custom-plugins/PriceRange";
import { createStockStatusPlugin } from "../../../src/custom-plugins/StockStatus";
import { createQuotaPlugin } from "../../../src/custom-plugins/Quota";
import { createQuantityPlugin } from "../../../src/custom-plugins/Quantity";
import { createImageLinkPlugin } from "../../../src/custom-plugins/ImageLink";
import { createSkuCodePlugin } from "../../../src/custom-plugins/SkuCode";
import { createResetBarPlugin } from "../../../src/custom-plugins/ResetBar";
import { createKeyboardNavPlugin } from "../../../src/custom-plugins/KeyboardNav";
import { createStatePersistencePlugin } from "../../../src/custom-plugins/StatePersistence";
import { createUrlSyncPlugin } from "../../../src/custom-plugins/UrlSync";
import { createAnalyticsPlugin } from "../../../src/custom-plugins/Analytics";
import { ATTRIBUTES, VARIANTS } from "../data/sample";
import { auditSku } from "../lib/audit-sku";

/**
 * 工坊：左侧勾选插件，中间实时选择器，右侧读数面板（选择 / 变体 / 事件 / 几何体检）。
 *
 * 插件开关用「同一批插件实例改 enabled」而不是重建组件 —— 重建会让组件类型变化、
 * React 重挂载，用户刚选的规格会被清空。
 */
const DEFS = [
  { id: "PriceRange", label: "价格区间", on: true, make: () => createPriceRangePlugin() },
  { id: "PriceLink", label: "价格联动", on: true, make: () => createPriceLinkPlugin({ discountText: "限时8折" }) },
  { id: "StockStatus", label: "库存状态", on: true, make: () => createStockStatusPlugin() },
  { id: "Quota", label: "限购校验", on: true, make: () => createQuotaPlugin({ purchasedCount: 1 }) },
  { id: "Quantity", label: "数量步进", on: true, make: () => createQuantityPlugin() },
  { id: "SkuCode", label: "货号展示", on: true, make: () => createSkuCodePlugin() },
  { id: "ResetBar", label: "清空重选", on: true, make: () => createResetBarPlugin() },
  { id: "ImageLink", label: "切主图（事件型）", on: false, make: () => createImageLinkPlugin({ onImageChange: (i) => console.log("[sku] 主图 →", i) }) },
  { id: "KeyboardNav", label: "键盘漫游（事件型）", on: true, make: () => createKeyboardNavPlugin() },
  { id: "StatePersistence", label: "本地记忆（事件型）", on: false, make: () => createStatePersistencePlugin({ key: "vane-sku:demo" }) },
  { id: "UrlSync", label: "URL 同步（事件型）", on: false, make: () => createUrlSyncPlugin() },
  { id: "Analytics", label: "埋点上报（事件型）", on: false, make: () => createAnalyticsPlugin({ onEvent: (e) => console.log("[sku] 埋点", e.name) }) },
];

const PLUGINS = DEFS.map((d) => {
  const p = d.make();
  p.enabled = d.on;
  return p;
});

// 组件类型只创建一次（模块级）
const Sku = createSkuSelector(PLUGINS);

export function Workshop() {
  const [on, setOn] = React.useState<boolean[]>(DEFS.map((d) => d.on));
  const [selection, setSelection] = React.useState<Record<string, string>>({});
  const [variant, setVariant] = React.useState<SkuVariant | null>(null);
  const [log, setLog] = React.useState<string[]>([]);
  const [audit, setAudit] = React.useState<string[]>([]);
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    PLUGINS.forEach((p, i) => {
      p.enabled = on[i];
    });
  }, [on]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      setAudit(auditSku(hostRef.current).problems);
    }, 60);
    return () => window.clearTimeout(id);
  }, [on, selection]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">插件工坊</h1>
        <p className="page-desc">
          勾选插件即时生效（改的是 plugin.enabled，不重建组件，选择态不会被清空）。
          右侧读数面板显示当前选择、命中变体、事件日志与几何体检结果。
        </p>
      </div>

      <div className="workshop-grid">
        <div className="workshop-picker">
          {DEFS.map((d, i) => (
            <label className="ws-check" key={d.id}>
              <input
                type="checkbox"
                checked={on[i]}
                onChange={(e) =>
                  setOn((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                }
              />
              <span>{d.label}</span>
            </label>
          ))}
          <div className="nav-empty">共 {DEFS.length} 个</div>
        </div>

        <div>
          <div className="workshop-stage" ref={hostRef} data-testid="workshop-host">
            <div style={{ background: "#fff", borderRadius: 2, padding: 14, color: "#1f2328" }}>
              <Sku
                attributes={ATTRIBUTES}
                variants={VARIANTS}
                onChange={(sel, v) => {
                  setSelection(sel);
                  setVariant(v);
                  setLog((l) => [...l.slice(-5), `${JSON.stringify(sel)} → ${v ? v.sku : "未命中"}`]);
                }}
              />
            </div>
          </div>

          <div className="observer-panel">
            <div className="observer-head">
              <span className="observer-title">几何体检</span>
              <span className={`observer-badge ${audit.length ? "off" : "on"}`}>
                {audit.length ? `${audit.length} 项异常` : "全部通过"}
              </span>
            </div>
            {audit.length ? (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "#e8cfa0" }}>
                {audit.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            ) : (
              <div className="observer-note">无越界 / 负坐标 / 零尺寸 / 重叠</div>
            )}
          </div>

          <div className="observer-panel">
            <div className="observer-head">
              <span className="observer-title">当前选择</span>
            </div>
            <pre className="src-pre" style={{ marginTop: 8 }}>
              <code>{JSON.stringify(selection, null, 2)}</code>
            </pre>
          </div>

          <div className="observer-panel">
            <div className="observer-head">
              <span className="observer-title">命中变体</span>
            </div>
            <pre className="src-pre" style={{ marginTop: 8 }}>
              <code>{variant ? JSON.stringify(variant, null, 2) : "（未命中）"}</code>
            </pre>
          </div>

          <div className="observer-panel">
            <div className="observer-head">
              <span className="observer-title">事件日志</span>
            </div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 11.5, color: "var(--text-2)" }}>
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
