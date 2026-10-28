import React from "react";
import { createSkuSelector } from "../../../src";
import type { SkuAttribute, SkuVariant } from "../../../src";
import { createPriceLinkPlugin } from "../../../src/custom-plugins/PriceLink";
import { createQuotaPlugin } from "../../../src/custom-plugins/Quota";
import { createImageLinkPlugin } from "../../../src/custom-plugins/ImageLink";
import { auditSku } from "../lib/audit-sku";

/**
 * 工坊：左侧实时选择器，右侧看状态（选择 / 禁用集 / 命中变体 / 事件 / 几何体检）。
 *
 * 插件开关用「同一批插件实例改 enabled」而不是重建组件 —— 重建会让组件类型变化、
 * React 重挂载，用户刚选的规格会被清空。
 */
const attributes: SkuAttribute[] = [
  {
    name: "颜色",
    options: [
      { id: "red", label: "红" },
      { id: "blue", label: "蓝" },
      { id: "green", label: "绿" },
    ],
  },
  {
    name: "尺码",
    options: [
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
  },
];

// 故意缺 blue-l / green-s：选蓝后 L 置灰，选绿后 S 置灰
const variants: SkuVariant[] = [
  { sku: "red-s", attrValues: { 颜色: "red", 尺码: "s" }, price: 199, originalPrice: 299, stock: 5, quota: 2, image: "https://picsum.photos/seed/red/80/80" },
  { sku: "red-m", attrValues: { 颜色: "red", 尺码: "m" }, price: 219, originalPrice: 299, stock: 3, quota: 2 },
  { sku: "red-l", attrValues: { 颜色: "red", 尺码: "l" }, price: 239, stock: 4 },
  { sku: "blue-s", attrValues: { 颜色: "blue", 尺码: "s" }, price: 209, stock: 8 },
  { sku: "blue-m", attrValues: { 颜色: "blue", 尺码: "m" }, price: 229, stock: 6 },
  { sku: "green-m", attrValues: { 颜色: "green", 尺码: "m" }, price: 249, stock: 2 },
  { sku: "green-l", attrValues: { 颜色: "green", 尺码: "l" }, price: 269, stock: 0 },
];

const plugins = [
  createPriceLinkPlugin({ discountText: "限时8折" }),
  createQuotaPlugin({ purchasedCount: 1 }),
  createImageLinkPlugin({ onImageChange: (img) => console.log("[sku] 主图 →", img) }),
];

// 组件类型只创建一次（模块级），开关靠 plugin.enabled
const Sku = createSkuSelector(plugins);

const TOGGLES = [
  { key: 0, label: "价格联动 PriceLink" },
  { key: 1, label: "限购校验 Quota" },
  { key: 2, label: "规格切主图 ImageLink" },
] as const;

export function Workshop() {
  const [on, setOn] = React.useState<boolean[]>([true, true, true]);
  const [selection, setSelection] = React.useState<Record<string, string>>({});
  const [variant, setVariant] = React.useState<SkuVariant | null>(null);
  const [log, setLog] = React.useState<string[]>([]);
  const [audit, setAudit] = React.useState<string[]>([]);
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  // 开关 → 改 enabled（不重建组件）
  React.useEffect(() => {
    plugins.forEach((p, i) => {
      p.enabled = on[i];
    });
  }, [on]);

  // 渲染后跑几何体检
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const res = auditSku(hostRef.current);
      setAudit(res.problems);
    }, 60);
    return () => window.clearTimeout(id);
  }, [on, selection]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 1fr) 320px", gap: 16 }}>
      <div
        ref={hostRef}
        data-testid="workshop-host"
        style={{ padding: 16, border: "1px solid #e3e6eb", borderRadius: 10, background: "#fff" }}
      >
        <Sku
          attributes={attributes}
          variants={variants}
          onChange={(sel, v) => {
            setSelection(sel);
            setVariant(v);
            setLog((l) => [...l.slice(-5), `${JSON.stringify(sel)} → ${v ? v.sku : "未命中"}`]);
          }}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={panel}>
          <b style={panelTitle}>插件开关</b>
          {TOGGLES.map((t) => (
            <label key={t.key} style={{ display: "block", fontSize: 12, marginTop: 4 }}>
              <input
                type="checkbox"
                checked={on[t.key]}
                onChange={(e) =>
                  setOn((prev) => prev.map((v, i) => (i === t.key ? e.target.checked : v)))
                }
              />{" "}
              {t.label}
            </label>
          ))}
        </div>

        <div style={panel}>
          <b style={panelTitle}>几何体检</b>
          {audit.length === 0 ? (
            <div style={{ fontSize: 12, color: "#389e0d" }}>全部通过（无越界 / 负坐标 / 零尺寸 / 重叠）</div>
          ) : (
            <ul style={{ fontSize: 12, color: "#d4380d", margin: 0, paddingLeft: 16 }}>
              {audit.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </div>

        <div style={panel}>
          <b style={panelTitle}>当前选择</b>
          <pre style={pre}>{JSON.stringify(selection, null, 2)}</pre>
        </div>

        <div style={panel}>
          <b style={panelTitle}>命中变体</b>
          <pre style={pre}>{variant ? JSON.stringify(variant, null, 2) : "（未命中）"}</pre>
        </div>

        <div style={panel}>
          <b style={panelTitle}>事件日志</b>
          <ul style={{ fontSize: 11, margin: 0, paddingLeft: 16 }}>
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const panel: React.CSSProperties = {
  padding: 10,
  border: "1px dashed #d3d8df",
  borderRadius: 8,
  fontSize: 12,
};
const panelTitle: React.CSSProperties = { display: "block", marginBottom: 4, fontSize: 12 };
const pre: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  background: "#f6f7f9",
  padding: 6,
  borderRadius: 4,
};
