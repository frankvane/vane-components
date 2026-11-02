import React, { useCallback, useEffect, useRef, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import type { ModalSheetCoreRef } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 05 · 命令式 snapTo + progress 联动
 *
 * ref 拿 ModalSheetCoreRef：snapTo(i) 直达任意档、getProgress() 轮询
 * 打开进度（拖拽中逐帧变化）。顶部进度读数就是用 0.2s 间隔轮询渲染的，
 * 拖拽把手能看到数字实时跳动 —— 与 --vane-ms-progress CSS 变量同源。
 */
export const meta: DemoMeta = {
  slug: "imperative",
  title: "命令式控制 + 进度联动",
  group: "advanced",
  intro: "ref.snapTo 直达任意档；getProgress 轮询打开进度，拖拽时数字实时跳动。",
};

const SNAPS = [0.35, 0.65, 0.95];
/**
 * 引擎会把 snapPoints 升序排列，snapYs 同步升序 → 索引 0 是最高档。
 * 按钮标签按「高度降序」对齐索引，避免把 snapTo(0) 写成 35%。
 */
const SNAP_HEIGHTS = [...SNAPS].sort((a, b) => b - a);

const Enhanced = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "命令式控制" }),
]);

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [progress, setProgress] = useState(0);
  const ref = useRef<ModalSheetCoreRef>(null);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }
    const timer = window.setInterval(() => {
      setProgress(ref.current?.getProgress() ?? 0);
    }, 100);
    return () => window.clearInterval(timer);
  }, [open]);

  const snapTo = useCallback((i: number) => {
    ref.current?.snapTo(i);
  }, []);

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen((v) => !v)}>
          {open ? "关闭弹层" : "打开弹层"}
        </button>
      </div>

      <Enhanced ref={ref} isOpen={open} onClose={() => setOpen(false)} snapPoints={SNAPS}>
        <div style={{ padding: "12px 16px 20px", color: "#1f2329", fontSize: 14 }}>
          {/* 控制条放在面板内部：弹层打开后会把页面工具栏盖住，放外面就点不到了 */}
          <div className="ms-sheet-bar">
            {SNAP_HEIGHTS.map((h, i) => (
              <button
                key={i}
                type="button"
                className={`ms-sheet-btn${i === 0 ? " is-primary" : ""}`}
                onClick={() => snapTo(i)}
              >
                snapTo({i}) · {Math.round(h * 100)}%
              </button>
            ))}
            <span className="ms-sheet-readout" aria-live="off">
              progress = {progress.toFixed(2)}
            </span>
          </div>
          <p style={{ margin: "14px 0 0", lineHeight: 1.7 }}>
            三个按钮分别命令式跳到高 / 中 / 低档（索引 0 = 最高档）；拖拽把手时上方
            <code> progress </code>读数逐帧变化 —— 内核每次几何更新都会同步写
            <code> --vane-ms-progress </code>CSS 变量，遮罩透明度就是用它联动的，
            业务侧的进度条也可以直接消费同一个变量。
          </p>
        </div>
      </Enhanced>
    </div>
  );
}
