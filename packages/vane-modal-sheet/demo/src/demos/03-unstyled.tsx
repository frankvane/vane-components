import React from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 03 · 无遮罩（unstyled 用法）
 *
 * 不挂 BackdropPlugin：弹层behind 没有遮罩层，页面照常可交互，
 * 适合「常驻工具面板 / 伴读卡片」这类非模态场景。插件式的直接好处：
 * 去掉一个能力 = 数组里少一项，而不是找 prop 开关。
 */
export const meta: DemoMeta = {
  slug: "unstyled",
  title: "无遮罩非模态",
  group: "advanced",
  intro: "不挂 BackdropPlugin 就是无遮罩模式；页面照常可点，适合常驻面板。",
};

const Enhanced = withModalSheetPlugins(ModalSheetCore, [
  createDragHandlePlugin({ color: "#4fd1c5" }),
  createHeaderPlugin({ title: "非模态面板" }),
]);

export default function Stage() {
  const [open, setOpen] = useAutoOpen();

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开面板
        </button>
        <span className="ms-field">弹层打开后下面的按钮仍可点击</span>
        <button
          type="button"
          className="ms-open-btn ms-open-btn--ghost"
          onClick={() => window.alert("页面交互未被阻断")}
        >
          试试点我
        </button>
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={[0.45]}
        panelStyle={{ boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.25)" }}
      >
        <div style={{ padding: "4px 16px 20px", color: "#1f2329", fontSize: 14, lineHeight: 1.7 }}>
          没有遮罩层，页面其余部分保持可交互。上滑拖出、下滑收起，行为与模态完全一致 ——
          差别只是插件数组里没有 <code>createBackdropPlugin()</code>。
        </div>
      </Enhanced>
    </div>
  );
}
