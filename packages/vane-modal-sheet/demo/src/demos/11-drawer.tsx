import React, { useState } from "react";
import {
  ModalSheetCore,
  withModalSheetPlugins,
  type SheetPlacement,
} from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createEscClosePlugin } from "vane-modal-sheet/custom-plugins/EscClosePlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 11 · 四向抽伸抽屉
 *
 * placement 一行切换 bottom / top / left / right：
 * - 纵向（bottom/top）：沿视口高抽伸，snapPoints 按高度折算，width/horizontalAlign 生效；
 * - 横向（left/right）：沿视口宽抽伸，snapPoints（像素）就是抽屉宽度，
 *   maxHeight 变成高度上限并垂直居中，把手自动转成竖条。
 * 拖拽轴随方位切换，松手仍按同一套吸附/关闭裁决。
 */
export const meta: DemoMeta = {
  slug: "drawer-placement",
  title: "四向抽伸抽屉",
  group: "advanced",
  intro: "placement 切换底部/顶部/左侧/右侧，几何、拖拽轴与把手方向随方位自适应。",
};

const PLACEMENTS: { value: SheetPlacement; label: string }[] = [
  { value: "bottom", label: "底部 bottom" },
  { value: "top", label: "顶部 top" },
  { value: "left", label: "左侧 left" },
  { value: "right", label: "右侧 right" },
];

const Enhanced = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "四向抽屉" }),
  createEscClosePlugin(),
]);

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [placement, setPlacement] = useState<SheetPlacement>("bottom");

  const horizontal = placement === "left" || placement === "right";
  const snapPoints = horizontal ? [360] : [0.4, 0.8];
  const current = PLACEMENTS.find((p) => p.value === placement)!;

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开抽屉
        </button>
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        placement={placement}
        snapPoints={snapPoints}
        maxHeight={horizontal ? 520 : undefined}
      >
        <div style={{ padding: "8px 20px 24px", fontSize: 14, lineHeight: 1.8, color: "#1f2329" }}>
          {/* 方位切换必须放在面板内：抽屉打开后页面工具栏会被遮罩挡住 */}
          <div className="ms-sheet-bar" style={{ marginBottom: 14 }}>
            <label className="ms-sheet-field">
              抽伸方位
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as SheetPlacement)}
              >
                {PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="ms-sheet-readout">
              {horizontal ? "宽 360px · 高度上限 520px" : "snapPoints 40% / 80%"}
            </span>
          </div>

          <p style={{ margin: "0 0 10px", fontWeight: 600 }}>当前：{current.label}</p>
          <p style={{ margin: "0 0 10px" }}>
            {horizontal
              ? "横向方位沿视口宽抽伸：snapPoints 的像素值就是抽屉宽度，maxHeight 变为高度上限并垂直居中。"
              : "纵向方位沿视口高抽伸：snapPoints 比例按视口高折算；顶部方位从上方滑出。"}
          </p>
          <p style={{ margin: 0 }}>
            把手贴住面板内边缘并可沿抽伸轴拖拽（左右方位是竖条），松手吸附最近档或关闭；
            切换方位时弹层保持打开并即时重算几何。
          </p>
        </div>
      </Enhanced>
    </div>
  );
}
