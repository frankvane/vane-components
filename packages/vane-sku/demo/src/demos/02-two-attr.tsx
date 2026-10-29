import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import type { SkuAttribute } from "vane-sku";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 2,
  padding: 14,
  color: "#1f2328",
  width: "100%",
};

const COLOR = ATTRIBUTES[0];
const SIZE = ATTRIBUTES[1];
/** 去掉绿色系的小矩阵（学 scenarios/specs/two-attr：红/蓝 × S/M/L） */
const BASE_VARIANTS = VARIANTS.filter((v) => v.attrValues["颜色"] !== "green");

/**
 * 02 · 双属性小矩阵（基础功能）
 * attributes / variants 是受控数据：拖开关删掉「红」，数组热更新，
 * 禁用推导随 props 变化即时重算 —— 选择器组件不重建，选择也保留着。
 */
export const meta: DemoMeta = {
  slug: "two-attr",
  title: "双属性小矩阵",
  group: "basic",
  capability: "matrix",
  intro: "颜色 × 尺码的小矩阵：拖开关删掉「红」，attributes 数组热更新，禁用推导随之重算。",
  why: "后台改规格、运营下架某选项，前端改的只是数据；矩阵怎么变是内核的事。",
  plugs: [],
  props: ["attributes={attributes}", "variants={variants}"],
  note: "buildAvailability / matchVariant / isSelectionComplete 都是纯函数，服务端下发同一份结构也能直接算。",
  controls: [{ key: "dropRed", label: "删掉红色选项", kind: "switch", init: false }],
  stageHeight: 300,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  const dropRed = Boolean(cfg.dropRed);

  const Sku = useMemo(() => createSkuSelector([]), []);

  // 拖开关 = 改 attributes / variants 数组；withPlugins 按新 props 重跑禁用推导（热更新）
  const attributes: SkuAttribute[] = useMemo(
    () => [
      {
        ...COLOR,
        options: dropRed ? COLOR.options.filter((o) => o.id !== "red") : COLOR.options.slice(0, 2),
      },
      SIZE,
    ],
    [dropRed]
  );
  const variants = useMemo(
    () => (dropRed ? BASE_VARIANTS.filter((v) => v.attrValues["颜色"] !== "red") : BASE_VARIANTS),
    [dropRed]
  );

  return (
    <div style={CARD}>
      <Sku
        attributes={attributes}
        variants={variants}
        onChange={(sel, v) =>
          log(v ? `命中 ${v.sku}` : `未命中 · ${JSON.stringify(sel)}`, v ? "event" : "warn")
        }
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        先选「蓝」再拖开关：红消失、选择保留，L 依旧置灰 —— blue-l 本就不存在，小矩阵下它成了永久死路。
      </p>
    </div>
  );
}
