import React, { useMemo } from "react";
import { createSkuSelector } from "vane-sku";
import { createKeyboardNavPlugin } from "vane-sku/custom-plugins/KeyboardNavPlugin";
import type { DemoMeta, DemoStageProps } from "./types";
import { KeyHint } from "./panels";
import { ATTRIBUTES, VARIANTS } from "../data/sample";

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 2,
  padding: 14,
  color: "#1f2328",
  width: "100%",
};

/**
 * 13 · 键盘漫游 KeyboardNav（插件功能）
 * 行为型插件：←→ 同行切换、↑↓ 跨行跳转（保持列位），自动跳过置灰项。
 * 预选「蓝」后 L 是死路——方向键会绕开它，这正是「跳过死路」的意义。
 */
export const meta: DemoMeta = {
  slug: "keyboard",
  title: "键盘漫游 KeyboardNav",
  group: "plugin",
  plugin: "KeyboardNav",
  intro: "点中任一规格按钮后，←→ 同行切换、↑↓ 跨行跳转，自动跳过置灰项（预选了「蓝」，方向键会绕开死路的 L）。",
  why: "键盘用户 / 电视端大屏选购的无障碍刚需；「跳过死路」让方向键永远落在有效选项上。",
  plugs: [
    { fn: "createKeyboardNavPlugin", cfg: "preventDefault: {{prevent}}", why: "挂 keydown 监听实现方向键漫游" },
  ],
  props: [
    "attributes={attributes}",
    "variants={variants}",
    "defaultSelection={{ 颜色: 'blue' }}",
  ],
  note: "实现走 DOM 查询（依赖 core 按钮的 data-testid 约定），不侵入渲染；onMount 返回清理函数，卸载自动摘监听。",
  controls: [{ key: "prevent", label: "阻止方向键滚动页面", kind: "switch", init: true }],
  stageHeight: 320,
};

export default function Stage({ cfg }: DemoStageProps) {
  const prevent = Boolean(cfg.prevent);

  const Sku = useMemo(
    () => createSkuSelector([createKeyboardNavPlugin({ preventDefault: prevent })]),
    [prevent]
  );

  return (
    <div style={CARD}>
      <p style={{ margin: "0 0 8px", fontSize: 12, color: "#4a5056" }}>
        先点（或 Tab 聚焦）任一规格按钮，再用方向键走两圈：
      </p>
      <KeyHint
        items={[
          ["←→", "同属性行内切换选项"],
          ["↑↓", "跨属性行跳转（保持列位）"],
        ]}
      />
      <div style={{ marginTop: 10 }}>
        <Sku attributes={ATTRIBUTES} variants={VARIANTS} defaultSelection={{ 颜色: "blue" }} />
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5b6064" }}>
        在尺码行按 →：S → M → 回到 S，L 因缺 blue-l 被置灰，直接被跳过。
      </p>
    </div>
  );
}
