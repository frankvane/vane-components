import React, { useMemo, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createFocusTrapPlugin } from "vane-modal-sheet/custom-plugins/FocusTrapPlugin";
import { createAnnouncerPlugin } from "vane-modal-sheet/custom-plugins/AnnouncerPlugin";
import { createHapticsPlugin } from "vane-modal-sheet/custom-plugins/HapticsPlugin";
import { createModalEffectPlugin } from "vane-modal-sheet/custom-plugins/ModalEffectPlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 08 · 无障碍与反馈
 *
 * FocusTrap 始终启用：打开后焦点进面板，Tab / Shift+Tab 在面板内循环。
 * 播报 / 震动 / 背景缩放三个开关分别装配 Announcer / Haptics / ModalEffect，
 * 用 useMemo 依赖开关，勾选变化即时重建装配。
 */
export const meta: DemoMeta = {
  slug: "a11y-feedback",
  title: "焦点圈定与反馈开关",
  group: "plugin",
  intro: "FocusTrap 圈定 Tab；播报 / 震动 / 背景缩放三个开关按需装配反馈插件。",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "#1f2329",
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [announce, setAnnounce] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [effect, setEffect] = useState(true);
  const [action, setAction] = useState("");

  // open 也进依赖：ModalEffect 的 rAF 在 onMount 时绑定面板根节点，
  // 关闭态挂载会拿不到容器；开合时重建一次装配确保它在打开态挂载。
  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        createHeaderPlugin({ title: "无障碍与反馈" }),
        createFocusTrapPlugin(),
        ...(announce
          ? [createAnnouncerPlugin({ labels: ["半屏", "全屏"] })]
          : []),
        ...(vibrate ? [createHapticsPlugin()] : []),
        ...(effect ? [createModalEffectPlugin()] : []),
      ]),
    [announce, vibrate, effect],
  );

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开弹层
        </button>
        <label className="ms-field">
          <input
            type="checkbox"
            checked={announce}
            onChange={(e) => setAnnounce(e.target.checked)}
          />
          播报
        </label>
        <label className="ms-field">
          <input
            type="checkbox"
            checked={vibrate}
            onChange={(e) => setVibrate(e.target.checked)}
          />
          震动
        </label>
        <label className="ms-field">
          <input
            type="checkbox"
            checked={effect}
            onChange={(e) => setEffect(e.target.checked)}
          />
          背景缩放
        </label>
        {action ? <span className="ms-progress-readout">{action}</span> : null}
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={[0.55, 0.9]}
        initialSnap={0}
      >
        <div style={{ padding: "8px 16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75 }}>
            打开后焦点进入面板（优先 <code>[data-autofocus]</code>）。按 Tab
            在两个按钮与关闭按钮之间循环，不会跑回页面；关闭后焦点归还给「打开弹层」。
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              data-autofocus
              style={buttonStyle}
              onClick={() => {
                setAction("已确认");
                setOpen(false);
              }}
            >
              确认
            </button>
            <button
              type="button"
              style={{ ...buttonStyle, background: "#f1f3f5", color: "#1f2329" }}
              onClick={() => {
                setAction("稍后处理");
                setOpen(false);
              }}
            >
              稍后
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "#5d636a" }}>
            点「确认」或「稍后」都会把结果写回页面并关闭弹层。播报：吸附时 aria-live
            播报「半屏 / 全屏」；震动：吸附与关闭时 navigator.vibrate 短震（桌面浏览器通常无声）；
            背景缩放：拖拽时 #root 随进度轻微放大。
          </p>
        </div>
      </Enhanced>
    </div>
  );
}
