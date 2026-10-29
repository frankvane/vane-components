import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 2,
  padding: 14,
  color: "#1f2328",
  width: "100%",
};

/**
 * 03 · 缺货是否参与推导（基础功能）
 * green-l 库存 0：默认 ignoreOutOfStock=true 把它当不存在（选「绿」后 L 置灰）；
 * 关掉开关后 green-l 变为可选 —— 置灰与否是运营策略，内核只给开关。
 */
export const meta: DemoMeta = {
  slug: "ignore-stock",
  title: "缺货是否参与推导",
  group: "basic",
  capability: "ignore-out-of-stock",
  intro: "green-l 库存 0：默认把它当不存在（通往它的选项置灰）；关掉开关后变为可选。",
  why: "「缺货直接置灰」还是「可点但不让下单」是两种运营策略；两种都常见，内核不该替你拍板。",
  plugs: [],
  props: ["attributes={attributes}", "variants={variants}", "ignoreOutOfStock={{{ignore}}}"],
  note: "关掉后 green-l 可选且仍会命中变体（stock=0）——加购拦截交给 Quota 或宿主，推导不管下单。",
  controls: [{ key: "ignore", label: "缺货视为不存在", kind: "switch", init: true }],
  stageHeight: 300,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const ignore = Boolean(cfg.ignore);

  // 无插件页：组件类型只建一次；ignoreOutOfStock 是受控 prop，切换即热更新
  const Sku = useMemo(() => createSkuSelector([]), []);

  return (
    <div style={CARD}>
      <Sku
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        ignoreOutOfStock={ignore}
        onChange={(sel, v) =>
          v
            ? log(`命中 ${v.sku} · 库存 ${v.stock ?? "—"}`, "event")
            : log(`未命中 · ${JSON.stringify(sel)}`, "warn")
        }
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        先选「绿」：L 置灰（缺货默认视为不存在）。关掉开关后 L 可选，点它会命中 stock=0 的 TEE-GREEN-L。
      </p>
    </div>
  );
}
