import React, { useMemo, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createSnapDotsPlugin } from "vane-modal-sheet/custom-plugins/SnapDotsPlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { generateSheetSnippet } from "./codegen";
import { CodeBlock } from "../components/CodeBlock";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 01 · 多档吸附 + 档位指示
 *
 * snapPoints 三档，SnapDots 显示当前档并可点击直达。下方控件改一改，
 * 代码片段实时跟着变 —— 展示的就是正在跑的装配。
 */
export const meta: DemoMeta = {
  slug: "multi-snap",
  title: "多档吸附 + 档位指示",
  group: "basic",
  intro: "三档 snapPoints + SnapDots 点击直达；拖控件看代码实时变化。",
};

type PresetKey = "two" | "three" | "half-full";

const PRESETS: Record<PresetKey, number[]> = {
  two: [0.5, 0.9],
  three: [0.35, 0.65, 0.95],
  "half-full": [0.5, 1],
};

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [preset, setPreset] = useState<PresetKey>("three");
  const [snapDots, setSnapDots] = useState(true);
  const [tween, setTween] = useState(240);
  const [width, setWidth] = useState(0); // 0 = 全宽
  const [align, setAlign] = useState<"left" | "center" | "right">("center");

  const snaps = PRESETS[preset];

  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        ...(snapDots ? [createSnapDotsPlugin()] : []),
        createHeaderPlugin({ title: "多档弹层" }),
      ]),
    [snapDots],
  );

  const snippet = generateSheetSnippet({
    snaps,
    snapDots,
    backdrop: true,
    tween,
    ...(width > 0 ? { width, align } : {}),
  });

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开弹层
        </button>
        <label className="ms-field">
          档位组合
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as PresetKey)}
          >
            <option value="two">两档 0.5 / 0.9</option>
            <option value="three">三档 0.35 / 0.65 / 0.95</option>
            <option value="half-full">半屏 / 全屏 0.5 / 1</option>
          </select>
        </label>
        <label className="ms-field">
          <input
            type="checkbox"
            checked={snapDots}
            onChange={(e) => setSnapDots(e.target.checked)}
          />
          SnapDots 指示点
        </label>
        <label className="ms-field">
          补间 {tween}ms
          <input
            type="range"
            min={0}
            max={480}
            step={40}
            value={tween}
            onChange={(e) => setTween(Number(e.target.value))}
          />
        </label>
        <label className="ms-field">
          面板宽度
          <select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          >
            <option value={0}>全宽</option>
            <option value={420}>420px</option>
            <option value={320}>320px</option>
          </select>
        </label>
        {width > 0 ? (
          <label className="ms-field">
            停靠
            <select
              value={align}
              onChange={(e) =>
                setAlign(e.target.value as "left" | "center" | "right")
              }
            >
              <option value="center">居中</option>
              <option value="left">靠左</option>
              <option value="right">靠右</option>
            </select>
          </label>
        ) : null}
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={snaps}
        tweenDuration={tween}
        {...(width > 0 ? { width, horizontalAlign: align } : {})}
      >
        <div style={{ padding: "4px 16px 20px", color: "#1f2329", fontSize: 14, lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 8px" }}>
            松手去哪由内核纯函数 <code>resolveSnap</code> 裁决：快速下滑看速度、
            普通拖拽看拖出比例，否则回弹最近档。
          </p>
          <p style={{ margin: 0 }}>
            {snapDots
              ? "把手旁的档位点可以点击直达任意一档。"
              : "当前未挂 SnapDots，拖拽把手或内容切换档位。"}
          </p>
        </div>
      </Enhanced>

      <section className="ms-snippet">
        <CodeBlock code={snippet} title="codegen · 当前装配" collapseAfter={0} />
      </section>
    </div>
  );
}
