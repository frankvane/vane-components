/**
 * 场景示例：真跑真装配的组合场景板。
 *
 * 与「逐项示例」的区别：这里按产品场景组织（联系人选人 / 分步表单），
 * 一块场景板 = 完整可交互的最小产品切片。
 */
import React, { useMemo, useRef, useState } from "react";
import { ModalSheetCore, withModalSheetPlugins } from "vane-modal-sheet";
import { createBackdropPlugin } from "vane-modal-sheet/custom-plugins/BackdropPlugin";
import { createDragHandlePlugin } from "vane-modal-sheet/custom-plugins/DragHandlePlugin";
import { createHeaderPlugin } from "vane-modal-sheet/custom-plugins/HeaderPlugin";
import { createSearchBarPlugin } from "vane-modal-sheet/custom-plugins/SearchBarPlugin";
import { createFooterPlugin } from "vane-modal-sheet/custom-plugins/FooterPlugin";
import { createStepFlowPlugin } from "vane-modal-sheet/custom-plugins/StepFlowPlugin";
import { ScenarioCard } from "../components/ScenarioCard";

const MEMBERS = [
  { id: "m1", name: "Connor Smith", role: "前端" },
  { id: "m2", name: "Daniel Smith", role: "产品" },
  { id: "m3", name: "Helena Yu", role: "测试" },
  { id: "m4", name: "Ivy Chen", role: "算法" },
  { id: "m5", name: "Zoey Smith", role: "运维" },
];

/** 场景一：任务指派（搜索 + 多选 + 吸底确认） */
function AssignScene() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  // 动态主按钮文案走 ref：HOC 类型必须稳定，否则选中变化会重建组件类型，
  // 整个弹层被卸载重挂（表现为点列表项时闪一下、sheet 重新弹出）
  const pickedCountRef = useRef(picked.length);
  pickedCountRef.current = picked.length;

  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        createHeaderPlugin({ title: "指派给" }),
        createSearchBarPlugin({
          placeholder: "搜索成员…",
          onSearch: (v: string) => setKeyword(v),
        }),
        createFooterPlugin({
          primaryText: () =>
            pickedCountRef.current > 0
              ? `确认指派（${pickedCountRef.current}）`
              : "确认指派",
          onPrimary: () => setOpen(false),
          secondaryText: "取消",
          onSecondary: () => setOpen(false),
        }),
      ]),
    [],
  );

  const list = MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(keyword.trim().toLowerCase()),
  );

  return (
    <>
      <button
        type="button"
        className="ms-open-btn"
        onClick={() => setOpen(true)}
      >
        指派任务
      </button>
      <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--dim)" }}>
        已指派：{picked.length ? picked.map((id) => MEMBERS.find((m) => m.id === id)?.name).join("、") : "无人"}
      </p>
      <Enhanced isOpen={open} onClose={() => setOpen(false)} snapPoints={[0.6, 0.9]}>
        <div style={{ padding: "4px 16px 12px" }}>
          {list.map((m) => {
            const active = picked.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setPicked((prev) =>
                    prev.includes(m.id)
                      ? prev.filter((x) => x !== m.id)
                      : [...prev, m.id],
                  )
                }
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
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
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: active ? "#0b3b37" : "#d7dce2",
                    color: active ? "#4fd1c5" : "#1f2329",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {m.name[0]}
                </span>
                <span style={{ fontSize: 15, fontWeight: 500 }}>
                  {m.name}
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#5d636a" }}>
                    {m.role}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Enhanced>
    </>
  );
}

/** 场景二：发布分步表单（StepFlow + Footer） */
function PublishScene() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  const Enhanced = useMemo(
    () =>
      withModalSheetPlugins(ModalSheetCore, [
        createBackdropPlugin(),
        createDragHandlePlugin(),
        // StepFlow 自己就在头部槽画步骤条、底部槽画上一步/下一步；
        // 再加一个 FooterPlugin 会出现两排导航按钮
        createStepFlowPlugin({
          steps: ["填写信息", "预览确认", "完成"],
          onFinish: () => {
            setDone(true);
            window.setTimeout(() => setOpen(false), 500);
          },
        }),
      ]),
    [],
  );

  return (
    <>
      <button
        type="button"
        className="ms-open-btn"
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
      >
        开始发布
      </button>
      {done ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--accent)" }}>
          发布完成 ✓
        </p>
      ) : null}
      <Enhanced isOpen={open} onClose={() => setOpen(false)} snapPoints={[0.5, 0.9]}>
        <div style={{ padding: "4px 16px 20px", color: "#1f2329", fontSize: 14, lineHeight: 1.8 }}>
          一个 StepFlow 插件同时占两个槽：头部槽是步骤条，底部槽是上一步/下一步，
          弹层本体只提供拖拽与吸附。点「下一步」走到最后一步触发 onFinish。
        </div>
      </Enhanced>
    </>
  );
}

export function ScenariosPage() {
  return (
    <article>
      <header className="page-head">
        <div>
          <p className="eyebrow">plates · 场景示例</p>
          <h1 className="page-title">场景板</h1>
        </div>
        <div className="page-facts">
          <div>
            <b>2</b>
            <span>plates</span>
          </div>
        </div>
      </header>

      <p className="page-sub">
        按产品场景组织的完整切片：插件数组就是功能清单，拔掉一项 = 拔掉一个能力。
      </p>

      <ScenarioCard
        title="任务指派"
        en="assign"
        desc="搜索过滤 + 多选高亮 + 吸底确认按钮；Footer 主按钮文案随选中数实时变化。"
      >
        <AssignScene />
      </ScenarioCard>
      <ScenarioCard
        title="分步发布"
        en="publish"
        desc="StepFlow 头部步骤条 + 底部上一步/下一步；分步表单的弹层原生形态。"
      >
        <PublishScene />
      </ScenarioCard>
    </article>
  );
}
