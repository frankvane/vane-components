/**
 * D03 · 文档审批（左右对比）
 *
 * 真实痛点是「法务/采购要对着两版看差异」：左右各一个 PDF，同一屏内滚动，
 * 而不是来回切标签页。两个 `<iframe>` 各自独立 —— 这正是 PdfPreviewPlugin 的
 * 设计（不引 pdfjs，交给浏览器查看器），所以两个实例互不影响滚动与缩放。
 *
 * 版式上有一个细节：两个预览必须**等高**，否则左右边缘对不齐、眼睛无法横向扫。
 * 高度靠 `.stage-shell` 固定，而不是让内容撑开。
 */
import React from "react";
import { FilePreviewCore, withPlugins, type FileInfo } from "vane-file-preview";
import { createPdfPreviewPlugin } from "vane-file-preview/custom-plugins";
import { formatBytes } from "../lib/format";
import { getSample } from "../data/samples";
import type { ScenarioMeta } from "./types";

const Preview = withPlugins(FilePreviewCore, { plugins: [createPdfPreviewPlugin()] });

const OLD = getSample("star.pdf");
const NEW = getSample("danmu.pdf");

export const meta: ScenarioMeta = {
  code: "D03",
  title: "文档审批 · 左右对比",
  pain: "法务与采购要对着两版看：左右同屏、各自独立滚动与缩放，而不是来回切标签页对页码。",
  plugs: [
    { fn: "createPdfPreviewPlugin", why: "两个实例各自持有一个 iframe，滚动/缩放互不干扰" },
  ],
  note: "两份 PDF 页数不同（旧版单页、新版多页）。插件不负责比对内容 —— 差异摘要这一层是业务写的，预览只解决「看得见」。",
};

const DIFFS = [
  { kind: "改", text: "第 2 条付款周期：30 天 → 45 天" },
  { kind: "增", text: "第 7 条新增「逾期按日 0.05% 计息」" },
  { kind: "删", text: "附件二《验收单模板》移除" },
];

const ApprovalScenario: React.FC = () => {
  const [verdict, setVerdict] = React.useState<"none" | "ok" | "no">("none");

  const pane = (file: FileInfo, label: string) => (
    <div style={{ minWidth: 0 }}>
      <div className="diff-head">
        <b style={{ fontWeight: 400, color: "var(--paper-ink)" }}>{label}</b>
        <span>{file.name}</span>
        <span style={{ marginLeft: "auto" }}>{formatBytes(file.size)}</span>
      </div>
      <div className="stage-shell" style={{ height: 300 }}>
        <div className="stage-mount">
          <Preview file={file} containerStyle={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="diff-grid">
        {pane(OLD, "v1 · 2026-10-21")}
        {pane(NEW, "v2 · 2026-10-26")}
      </div>

      <div className="demo-side-block" style={{ background: "var(--surface)" }}>
        <div className="side-head">
          差异摘要
          <b>{DIFFS.length} 处</b>
        </div>
        <ul className="demo-why-list" style={{ padding: "8px 10px" }}>
          {DIFFS.map((d) => (
            <li key={d.text} style={{ gridTemplateColumns: "22px 1fr" }}>
              <code style={{ fontSize: 11 }}>{d.kind}</code>
              <span style={{ fontSize: 12 }}>{d.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="version-row" aria-pressed={verdict === "ok"}>
        <b>{verdict === "none" ? "待审批" : verdict === "ok" ? "已通过" : "已驳回"}</b>
        <span>审批人：当前登录用户</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button type="button" className="btn btn-mini" onClick={() => setVerdict("ok")}>
            通过
          </button>
          <button type="button" className="btn btn-mini" onClick={() => setVerdict("no")}>
            驳回
          </button>
        </span>
      </div>
    </div>
  );
};

export default ApprovalScenario;
