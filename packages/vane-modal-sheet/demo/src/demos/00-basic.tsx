import React, { useMemo, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createSearchBarPlugin } from "vane-modal-sheet/custom-plugins/SearchBarPlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 00 · 基础联系人选择
 *
 * 经典 bottom sheet 场景：遮罩 + 把手 + 标题栏 + 搜索框 + 头像列表。
 * 加插件就是往 withModalSheetPlugins 数组里加一项；搜索过滤逻辑留在业务侧
 * （onSearch 回调），弹层只负责「壳」。
 */
export const meta: DemoMeta = {
  slug: "basic",
  title: "基础联系人选择",
  group: "basic",
  intro: "遮罩 / 把手 / 标题 / 搜索四插件装配；过滤逻辑留在业务侧，弹层只管壳。",
};

const ALL_CONTACTS = [
  { id: "c1", name: "Connor Smith", role: "前端工程师" },
  { id: "c2", name: "Daniel Smith", role: "产品经理" },
  { id: "c3", name: "Greg Smith", role: "设计师" },
  { id: "c4", name: "Helena Yu", role: "测试工程师" },
  { id: "c5", name: "Ivy Chen", role: "算法工程师" },
  { id: "c6", name: "Zoey Smith", role: "运维工程师" },
];

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        createHeaderPlugin({ title: "选择联系人" }),
        createSearchBarPlugin({
          placeholder: "搜索姓名…",
          onSearch: (v: string) => setKeyword(v),
        }),
      ]),
    [],
  );

  const list = ALL_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(keyword.trim().toLowerCase()),
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          打开弹层
        </button>
        <span className="ms-field">已选 {selected.length} 人</span>
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={[0.55, 0.85]}
      >
        <div style={{ padding: "4px 16px 12px" }}>
          {list.length === 0 ? (
            <p style={{ padding: "24px 0", textAlign: "center", color: "#5d636a", fontSize: 14 }}>
              没有匹配「{keyword}」的联系人
            </p>
          ) : (
            list.map((c) => {
              const active = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={active}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "10px 12px",
                    marginBottom: 6,
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    background: active ? "#4fd1c5" : "#f3f4f6",
                    color: "#1f2329",
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: active ? "#0b3b37" : "#d7dce2",
                      color: active ? "#4fd1c5" : "#1f2329",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {c.name[0]}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 500 }}>
                      {c.name}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "#5d636a" }}>
                      {c.role}
                    </span>
                  </span>
                  {active ? (
                    <span style={{ fontSize: 13, color: "#0b3b37", fontWeight: 600 }}>已选</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </Enhanced>
    </div>
  );
}
