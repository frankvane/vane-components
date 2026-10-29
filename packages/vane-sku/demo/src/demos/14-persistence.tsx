import React, { useEffect, useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createStatePersistencePlugin } from "vane-sku/custom-plugins/StatePersistencePlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 2,
  padding: 14,
  color: "#1f2328",
  width: "100%",
};

/** 独立存储键：避免和场景卡 / 全量装配页的持久化互相踩 */
const KEY = "vane-sku:demo:demos-persistence";

/**
 * 14 · 选择持久化 StatePersistence（插件功能）
 * 行为型插件：挂载读回 / 变化写入 / 清空删键。拖「重挂载」开关销毁重建组件，
 * 上次的选择从 localStorage 原样还原——还原与写入都记进右栏日志。
 */
export const meta: DemoMeta = {
  slug: "persistence",
  title: "选择持久化 StatePersistence",
  group: "plugin",
  plugin: "StatePersistence",
  intro: "把上次选的规格写进 localStorage，挂载时读回；拖「重挂载」开关销毁重建，选择原样还原。",
  why: "用户逛一圈回来还停在上次的规格；多步下单流程中途返回，也不用从头重选。",
  plugs: [
    { fn: "createStatePersistencePlugin", cfg: "key: 'vane-sku:demo:selection'", why: "挂载读回 / 变化写入 / 清空删键" },
  ],
  props: ["attributes={attributes}", "variants={variants}"],
  note: "隐私模式、存储禁用、配额超限、脏数据一律静默降级，不影响主流程；与 UrlSync 可共存。",
  controls: [
    { key: "remount", label: "重挂载（模拟刷新）", kind: "switch", init: false, nonLayout: true },
  ],
  stageHeight: 300,
};

export default function Stage({ cfg, log }: DemoStageProps) {
  // 开关每翻转一次 = 重挂载一次（false→true 一次，true→false 又一次）
  const toggle = Boolean(cfg.remount);

  const Sku = useMemo(() => createSkuSelector([createStatePersistencePlugin({ key: KEY })]), []);

  // 重挂载后读一次存储：把「还原自 localStorage」摊进日志
  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    log(`挂载 · localStorage ${raw ? `读回 ${raw}` : "为空（首次进入）"}`, "info");
  }, [toggle, log]);

  return (
    <div style={CARD}>
      <Sku
        key={String(toggle)}
        attributes={ATTRIBUTES}
        variants={VARIANTS}
        onChange={(sel, v) =>
          log(
            v ? `写入 localStorage：${JSON.stringify(sel)}（命中 ${v.sku}）` : `写入 localStorage：${JSON.stringify(sel)}`,
            v ? "event" : "warn"
          )
        }
      />
      <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.6 }}>
        选好规格 → 拖「重挂载」：按钮组销毁重建，选择自动还原；把选择清空（再点同值取消）会删键。
      </p>
    </div>
  );
}
