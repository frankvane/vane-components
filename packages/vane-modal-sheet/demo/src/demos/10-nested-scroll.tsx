import React, { useEffect, useMemo, useRef, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import type { ModalSheetCoreRef } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createNestedScrollPlugin } from "vane-modal-sheet/custom-plugins/NestedScrollPlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 10 · 嵌套滚动的拖拽锁
 *
 * NestedScroll 监听内容区 scroll，只要内容没滚回顶部就写 dragLock，
 * 内核 handlePointerDown 读到锁会直接忽略拖拽。因此长列表滚到中部时
 * 把手拖不动，回到顶部后拖拽立即恢复 —— 避免读长文时误滑关闭。
 */
export const meta: DemoMeta = {
  slug: "nested-scroll",
  title: "嵌套滚动与拖拽锁",
  group: "plugin",
  intro: "内容滚离顶部时把手拖拽被 locked；滚回顶部后拖拽恢复，避免读长文误滑关闭。",
};

const ITEMS = Array.from(
  { length: 14 },
  (_, i) =>
    `第 ${i + 1} 条 · 内容区滚离顶部后 NestedScroll 会锁住拖拽把手，滚回顶部才恢复。`,
);

const MIDDLE_TOP = 280;

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [scrollTop, setScrollTop] = useState(0);
  const ref = useRef<ModalSheetCoreRef>(null);

  // open 进依赖：NestedScroll 在 onMount 里给内容区绑 scroll 监听，
  // 关闭态挂载时面板还不存在；开合时重建装配，保证监听绑在真面板上。
  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        createHeaderPlugin({ title: "嵌套滚动" }),
        createNestedScrollPlugin(),
      ]),
    // open 变化时重建装配，确保 NestedScroll 的 onMount 在面板已挂载后执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  const content = () =>
    ref.current?.getPanel()?.querySelector<HTMLElement>(".vc-ms-content") ?? null;

  useEffect(() => {
    if (!open) {
      setScrollTop(0);
      return;
    }
    let node: HTMLElement | null = null;
    let timer = 0;
    const read = () => setScrollTop(node?.scrollTop ?? 0);
    const attach = () => {
      node = content();
      if (!node) return false;
      node.addEventListener("scroll", read, { passive: true });
      read();
      return true;
    };
    if (!attach()) timer = window.setTimeout(attach, 60);
    return () => {
      window.clearTimeout(timer);
      node?.removeEventListener("scroll", read);
    };
  }, [open]);

  const scrollTo = (top: number) => {
    const node = content();
    if (!node) return;
    node.scrollTop = top;
    setScrollTop(node.scrollTop);
    // NestedScroll 的 scroll 监听是异步派发；这里同步补一次，让锁状态立即刷新
    node.dispatchEvent(new Event("scroll"));
  };

  const closeSheet = () => {
    const node = content();
    if (node) {
      node.scrollTop = 0;
      node.dispatchEvent(new Event("scroll"));
    }
    setOpen(false);
  };

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开弹层
        </button>
      </div>

      <Enhanced
        ref={ref}
        isOpen={open}
        onClose={closeSheet}
        snapPoints={[0.9]}
      >
        {/* 控制条吸在内容区顶部：滚到中部后仍然够得着「回到顶部」 */}
        <div className="ms-sheet-sticky">
          <div className="ms-sheet-bar">
            <button
              type="button"
              className="ms-sheet-btn"
              onClick={() => scrollTo(MIDDLE_TOP)}
            >
              滚到中部
            </button>
            <button
              type="button"
              className="ms-sheet-btn is-primary"
              onClick={() => scrollTo(0)}
            >
              回到顶部
            </button>
            <span className="ms-sheet-readout">
              scrollTop={scrollTop} · {scrollTop > 0 ? "dragLock 已锁" : "拖拽可用"}
            </span>
          </div>
        </div>
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
      </Enhanced>
    </div>
  );
}
