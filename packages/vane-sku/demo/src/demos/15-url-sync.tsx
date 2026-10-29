import React, { useCallback, useMemo, useState } from "react";
import { createSkuSelector } from "vane-sku";
import { createUrlSyncPlugin } from "vane-sku/custom-plugins/UrlSyncPlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 2,
  padding: 14,
  color: "#1f2328",
  width: "100%",
};

const CODE: React.CSSProperties = {
  display: "block",
  padding: "6px 10px",
  borderRadius: 2,
  background: "#f4f5f7",
  border: "1px solid #e5e7eb",
  color: "#b45309",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 11,
  overflowX: "auto",
  whiteSpace: "nowrap",
};

/**
 * 15 · URL 同步 UrlSync（插件功能）
 * 行为型插件：选择写进查询串（?sku_颜色=red&sku_尺码=s），挂载时反向解析还原。
 * 下方展示当前查询串的只读快照；变化也记进右栏日志。
 */
export const meta: DemoMeta = {
  slug: "url-sync",
  title: "URL 同步 UrlSync",
  group: "plugin",
  plugin: "UrlSync",
  intro: "选择写进查询串（?sku_颜色=red&sku_尺码=s），挂载时反向还原；刷新 / 分享都能保持选择。",
  why: "「把这个链接发给客服，他看到的就是我选的规格」——客服带规格链接、分享商品页的刚需。",
  plugs: [
    { fn: "createUrlSyncPlugin", cfg: "useReplace: {{replace}}", why: "选择 ↔ 查询串双向同步" },
  ],
  props: ["attributes={attributes}", "variants={variants}", "onChange={handleChange}"],
  note: "默认 replaceState 不把每次点击塞进历史栈；查询键带 sku_ 前缀，不覆盖页面其它参数。",
  controls: [{ key: "replace", label: "replaceState（不进历史栈）", kind: "switch", init: true }],
  stageHeight: 300,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const replace = Boolean(cfg.replace);
  const [q, setQ] = useState(() => window.location.search || "（空）");

  const Sku = useMemo(() => createSkuSelector([createUrlSyncPlugin({ useReplace: replace })]), [replace]);

  const sync = useCallback(() => {
    const next = window.location.search || "（已清空）";
    setQ(next);
    log(`查询串 → ${next}`);
  }, [log]);

  return (
    <div style={{ ...CARD, display: "grid", gap: 10 }}>
      <Sku attributes={ATTRIBUTES} variants={VARIANTS} onChange={sync} />
      <code style={CODE}>{q}</code>
      <p style={{ margin: 0, fontSize: 11, opacity: 0.6 }}>
        上方是实时查询串（只读快照）。关掉开关改用 pushState：每次选择都进历史栈，后退键能撤销选择。
      </p>
    </div>
  );
}
