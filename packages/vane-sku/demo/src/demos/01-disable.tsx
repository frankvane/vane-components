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
 * 01 · 禁用推导（基础功能）
 * 内核内置能力：候选选项临时代入选择，查不到变体即置灰。样例矩阵故意缺 blue-l，
 * 选「蓝」后 L 自动变灰 —— 用户不用点了才发现没货。
 */
export const meta: DemoMeta = {
  slug: "disable",
  title: "禁用推导（内置）",
  group: "basic",
  capability: "disable-derivation",
  intro: "组合矩阵在内核：选「蓝」后 L 自动置灰（缺 blue-l 变体），死路提前画出来。",
  why: "用户不该点了才发现没货；把「选不出结果的组合」提前置灰，是规格选择器的体验底线。",
  plugs: [],
  props: [
    "attributes={attributes}",
    "variants={variants}",
    { text: "defaultSelection={{ 颜色: '{{preset}}' }}", when: (c) => c.preset !== "none" },
    "onChange={handleChange}",
  ],
  note: "推导是纯函数 buildAvailability(attributes, variants, selection)，不依赖 React，可直接单测。",
  controls: [
    {
      key: "preset",
      label: "预选颜色",
      kind: "select",
      init: "none",
      options: [
        { label: "不预选", value: "none" },
        { label: "红 red", value: "red" },
        { label: "蓝 blue", value: "blue" },
      ],
    },
  ],
  stageHeight: 300,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const preset = String(cfg.preset);

  // 无插件页：组件类型只建一次；预选切换用 key 重挂载（defaultSelection 是挂载期初值）
  const Sku = useMemo(() => createSkuSelector([]), []);

  return (
    <div style={CARD}>
      <Sku
        key={preset}
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        defaultSelection={preset === "none" ? undefined : { 颜色: preset }}
        onChange={(sel, v) =>
          log(
            v ? `命中变体 ${v.sku} · ${JSON.stringify(sel)}` : `未命中可售变体 · ${JSON.stringify(sel)}`,
            v ? "event" : "warn"
          )
        }
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        点「蓝」看主角戏：L 因缺 blue-l 被置灰；defaultSelection 只在挂载时生效一次，所以预选切换靠 key 重挂载。
      </p>
    </div>
  );
}
