import React, { useMemo, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createKeyboardAvoidPlugin } from "vane-modal-sheet/custom-plugins/KeyboardAvoidPlugin";
import { createFooterPlugin } from "vane-modal-sheet/custom-plugins/FooterPlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 04 · 键盘避让表单
 *
 * KeyboardAvoidPlugin 监听 VirtualKeyboard / visualViewport：输入框聚焦
 * 键盘弹出时自动 snap 到最高档并补视口内嵌，输入区始终可见。Footer 吸底
 * 不随内容滚动，提交按钮永远在手指旁边。
 */
export const meta: DemoMeta = {
  slug: "keyboard-form",
  title: "键盘避让表单",
  group: "advanced",
  intro: "键盘弹出自动顶到最高档 + 视口内嵌补偿；Footer 吸底放提交按钮。",
};

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        createHeaderPlugin({ title: "编辑资料" }),
        createKeyboardAvoidPlugin(),
        createFooterPlugin({
          primaryText: "保存",
          onPrimary: () => {
            setSaved(true);
            window.setTimeout(() => setOpen(false), 600);
          },
          secondaryText: "取消",
          onSecondary: () => setOpen(false),
        }),
      ]),
    [setOpen],
  );

  return (
    <div>
      <div className="ms-toolbar">
        <button type="button" className="ms-open-btn" onClick={() => setOpen(true)}>
          编辑资料
        </button>
        {saved ? <span className="ms-progress-readout">已保存 ✓</span> : null}
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setSaved(false);
        }}
        snapPoints={[0.55, 0.95]}
        initialSnap={0}
      >
        <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#5d636a" }}>
            昵称
            <input
              id="demo-nickname"
              name="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入后键盘弹出，弹层自动上移"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d7dce2",
                fontSize: 15,
                color: "#1f2329",
                background: "#fff",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#5d636a" }}>
            简介
            <textarea
              id="demo-bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="一句话介绍自己"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d7dce2",
                fontSize: 15,
                color: "#1f2329",
                background: "#fff",
                resize: "none",
              }}
            />
          </label>
        </div>
      </Enhanced>
    </div>
  );
}
