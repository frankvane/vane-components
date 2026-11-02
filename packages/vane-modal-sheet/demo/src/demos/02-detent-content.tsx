import React, { useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 02 · detent: content —— 内容多高，弹层多高
 *
 * detent="content" 时最高档被内容实际高度封顶（且不超过视口），
 * 短内容不会撑出半屏空白，长内容自动贴到视口上限。
 */
export const meta: DemoMeta = {
  slug: "detent-content",
  title: "内容高度自适应",
  group: "advanced",
  intro: "detent: content 时最高档被内容高度封顶；切换内容量看弹层高度跟着变。",
};

const LONG_TEXT = Array.from(
  { length: 12 },
  (_, i) => `第 ${i + 1} 条：弹层高度跟随内容自适应，detent 模式下最高档被内容实际高度封顶。`,
);

const Enhanced = withModalSheetPlugins(ModalSheetCore, [
  createBackdropPlugin(),
  createDragHandlePlugin(),
  createHeaderPlugin({ title: "内容自适应" }),
]);

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [long, setLong] = useState(false);

  const items = long ? LONG_TEXT : LONG_TEXT.slice(0, 3);

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开弹层
        </button>
        <label className="ms-field">
          <input
            type="checkbox"
            checked={long}
            onChange={(e) => setLong(e.target.checked)}
          />
          塞入长内容（{items.length} 条）
        </label>
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={[1]}
        detent="content"
      >
        <ul style={{ margin: 0, padding: "4px 16px 20px", color: "#1f2329", fontSize: 14, lineHeight: 1.8 }}>
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Enhanced>
    </div>
  );
}
