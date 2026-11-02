import React, { useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createResponsivePlugin } from "vane-modal-sheet/custom-plugins/ResponsivePlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 07 · PC 响应式浮窗
 *
 * ResponsivePlugin 在宽屏把 bottom sheet 变成居中悬浮窗：限宽、四角圆角、
 * 上下留白。面板宽度由 width prop 直接控制，560 / 720 / 全宽三档切换即时生效，
 * maxHeight 640 让高视口下也不铺满整屏。
 */
export const meta: DemoMeta = {
  slug: "responsive-pc",
  title: "PC 居中浮窗与宽度切换",
  group: "plugin",
  intro: "宽屏下 ResponsivePlugin 把弹层收成居中浮窗；560/720/全宽三档宽度即时生效。",
};

type WidthMode = "560" | "720" | "full";

const Enhanced = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "PC 浮窗" }),
  // 桌面态上限放宽，具体宽度交给 width prop，切换时无需重建组件类型
  createResponsivePlugin({ desktopWidth: 2000 }),
]);

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [mode, setMode] = useState<WidthMode>("560");

  const panelWidth = mode === "full" ? "100%" : Number(mode);

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开弹层
        </button>
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={[0.85]}
        width={panelWidth}
        maxHeight={640}
      >
        <div style={{ padding: "8px 20px 24px", fontSize: 14, lineHeight: 1.8, color: "#1f2329" }}>
          {/* 宽度切换必须放在面板内：弹层打开后页面工具栏会被遮罩挡住 */}
          <div className="ms-sheet-bar" style={{ marginBottom: 14 }}>
            <label className="ms-sheet-field">
              面板宽度
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as WidthMode)}
              >
                <option value="560">560px</option>
                <option value="720">720px</option>
                <option value="full">全宽</option>
              </select>
            </label>
            <span className="ms-sheet-readout">
              width={mode === "full" ? "100%" : `${mode}px`} · maxHeight=640
            </span>
          </div>

          <p style={{ margin: "0 0 10px", fontWeight: 600 }}>
            PC 端不再永远全屏宽
          </p>
          <p style={{ margin: "0 0 10px" }}>
            当前视口宽度 ≥ 768px 时，ResponsivePlugin 给面板叠加
            <code> maxWidth / 四角圆角 / 底部悬浮间距</code>；低于断点时自动回到底部弹层。
          </p>
          <p style={{ margin: 0 }}>
            把上方宽度切到 560 / 720 / 全宽，面板会立刻改变宽度；maxHeight 640
            保证高视口下弹层上方仍有留白，不会顶满整屏。
          </p>
        </div>
      </Enhanced>
    </div>
  );
}
