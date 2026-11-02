import React, { useEffect, useMemo, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createSafeAreaPlugin } from "vane-modal-sheet/custom-plugins/SafeAreaPlugin";
import { createKeepMountedPlugin } from "vane-modal-sheet/custom-plugins/KeepMountedPlugin";
import { createLoadingStatePlugin } from "vane-modal-sheet/custom-plugins/LoadingStatePlugin";
import { createEmptyStatePlugin } from "vane-modal-sheet/custom-plugins/EmptyStatePlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 09 · 加载 / 空态 / 保活 / 安全区
 *
 * 首次打开先跑 1.2s 骨架（LoadingState）→ 空态（EmptyState）→ 点「加载内容」
 * 出 12 条长列表。加载完成后滚到中部关闭再打开，KeepMounted 会把内容区
 * 滚动位置恢复到关闭前的位置；SafeArea 给面板底部补安全区内边距。
 */
export const meta: DemoMeta = {
  slug: "states",
  title: "加载 / 空态 / 保活恢复",
  group: "plugin",
  intro: "首次打开 1.2s 骨架 → 空态 → 加载 12 条；滚到中部关闭再开，滚动位置由 KeepMounted 恢复。",
};

const ITEMS = Array.from(
  { length: 12 },
  (_, i) =>
    `第 ${i + 1} 条 · 长列表用于验证 KeepMounted：滚到中部关闭再重开，阅读位置会被恢复。`,
);

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [hasItems, setHasItems] = useState(false);

  useEffect(() => {
    if (!open || hasItems) return;
    setLoading(true);
    setEmpty(false);
    const timer = window.setTimeout(() => {
      setLoading(false);
      setEmpty(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [open, hasItems]);

  const loadItems = () => {
    setLoading(false);
    setEmpty(false);
    setHasItems(true);
  };

  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        createHeaderPlugin({ title: "加载与状态" }),
        createSafeAreaPlugin({ extraBottom: 8 }),
        createKeepMountedPlugin(),
        createLoadingStatePlugin({ loading, rows: 4 }),
        createEmptyStatePlugin({
          empty,
          text: "还没有任何内容",
          actionText: "加载内容",
          onAction: loadItems,
        }),
      ]),
    [loading, empty],
  );

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开弹层
        </button>
        <button
          type="button"
          className="ms-open-btn ms-open-btn--ghost"
          disabled={loading || hasItems}
          onClick={loadItems}
        >
          加载内容
        </button>
        <span className="ms-progress-readout">
          {loading ? "loading…" : hasItems ? `${ITEMS.length} 条` : "空态"}
        </span>
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={[0.85]}
      >
        {hasItems ? (
          <ul style={{ margin: 0, padding: "4px 16px 20px", listStyle: "none" }}>
            {ITEMS.map((text) => (
              <li
                key={text}
                style={{
                  padding: "12px 4px",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#1f2329",
                  borderBottom: "1px solid #eef1f4",
                }}
              >
                {text}
              </li>
            ))}
          </ul>
        ) : null}
      </Enhanced>

      <p className="ms-field" style={{ display: "block", marginTop: 12 }}>
        验证方式：先点「加载内容」出长列表，把内容滚到中部，点标题栏 ✕ 关闭，
        再点「打开弹层」——内容区应回到关闭前的阅读位置，而不是顶部。
      </p>
    </div>
  );
}
