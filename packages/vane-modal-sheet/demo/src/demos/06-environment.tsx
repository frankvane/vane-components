import React, { useMemo, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createScrollLockPlugin } from "vane-modal-sheet/custom-plugins/ScrollLockPlugin";
import { createEscClosePlugin } from "vane-modal-sheet/custom-plugins/EscClosePlugin";
import { createStepFlowPlugin } from "vane-modal-sheet/custom-plugins/StepFlowPlugin";
import { createHistoryPlugin } from "vane-modal-sheet/custom-plugins/HistoryPlugin";
import type { DemoMeta } from "./types";
import { useAutoOpen } from "../lib/autopen";

/**
 * 06 · 运行环境：滚动锁 / Esc / 返回键 / 分步表单
 *
 * ScrollLock 锁 body 滚动，EscClose 负责 Esc 关闭，StepFlow 提供两步表单
 * 的步骤条与上一步/下一步。HistoryPlugin 会改写浏览器历史，默认不装，
 * 只有用户明确打开「启用返回键关闭」时才进入插件数组。
 */
export const meta: DemoMeta = {
  slug: "environment",
  title: "运行环境：滚动锁 / Esc / 返回键",
  group: "plugin",
  intro: "打开后页面锁滚、Esc 关闭；返回键关闭需手动开启；StepFlow 跑两步表单。",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d7dce2",
  fontSize: 15,
  color: "#1f2329",
  background: "#fff",
};

export default function Stage() {
  const [open, setOpen] = useAutoOpen();
  const [historyOn, setHistoryOn] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [finished, setFinished] = useState(false);

  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        createScrollLockPlugin(),
        createEscClosePlugin(),
        createStepFlowPlugin({
          steps: ["填写信息", "确认提交"],
          onFinish: () => setFinished(true),
        }),
        ...(historyOn ? [createHistoryPlugin()] : []),
      ]),
    [historyOn],
  );

  return (
    <div>
      <div className="ms-toolbar">
        <button
          type="button"
          className="ms-open-btn"
          onClick={() => {
            setFinished(false);
            setOpen(true);
          }}
        >
          打开弹层
        </button>
        <label className="ms-field">
          <input
            type="checkbox"
            checked={historyOn}
            onChange={(e) => setHistoryOn(e.target.checked)}
          />
          启用返回键关闭
        </label>
        {finished ? <span className="ms-progress-readout">已完成 ✓</span> : null}
      </div>

      <Enhanced
        isOpen={open}
        onClose={() => setOpen(false)}
        snapPoints={[0.7]}
      >
        <div style={{ padding: "8px 16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#5d636a" }}>
            底部按钮由 StepFlow 插件渲染：第一步「下一步」进入确认步，第二步「完成」
            标记已提交。弹层打开期间 body 滚动被 ScrollLock 锁住，按 Esc 直接关闭。
          </p>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#5d636a" }}>
            昵称
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="第 1 步填写"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#5d636a" }}>
            手机号
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="第 2 步确认时检查"
              style={inputStyle}
            />
          </label>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#5d636a" }}>
            {historyOn
              ? "已装配 HistoryPlugin：浏览器后退 / Android 返回手势会关闭弹层。"
              : "HistoryPlugin 未装配：返回键不会关闭弹层，浏览器历史也不被改写。"}
          </p>
          {finished ? (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f766e" }}>
              已完成：StepFlow 的最后一步触发了 onFinish。
            </p>
          ) : null}
        </div>
      </Enhanced>
    </div>
  );
}
