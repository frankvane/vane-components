/**
 * D06 · 代码评审（左右并排）
 *
 * 真实痛点是「评审时要同时看改前和改后」：左右各一个高亮代码块，行号对齐，
 * 评论挂在行上。这一格用的是同一个 CodePreviewPlugin 的两个实例 ——
 * 插件本身无状态，两个实例互不干扰（语言按各自扩展名判，主题跟着系统走）。
 *
 * 不自己做 diff 算法：文本比对是另一件事（Myers / patience diff），
 * 预览层只负责「把两段代码都显示对」。混在一起会让这个包背上一份它不该有的复杂度。
 */
import React from "react";
import { FilePreviewCore, withPlugins, type FileInfo } from "vane-file-preview";
import { createCodePreviewPlugin } from "vane-file-preview/custom-plugins";
import { getSample } from "../data/samples";
import type { ScenarioMeta } from "./types";

const Preview = withPlugins(FilePreviewCore, { plugins: [createCodePreviewPlugin()] });

const BEFORE: FileInfo = getSample("sample.ts");
const AFTER: FileInfo = getSample("sample.js");

export const meta: ScenarioMeta = {
  code: "D06",
  title: "代码评审 · 左右并排",
  pain: "评审要同时看改前与改后：两栏高亮代码、行号对齐、评论挂在行上。插件无状态，两个实例各自判语言、各自滚。",
  plugs: [
    { fn: "createCodePreviewPlugin", why: "prism 按需加载语言包，ts 与 js 各自高亮，主题跟随系统" },
  ],
  note: "不自己做 diff 算法：文本比对是另一件事（Myers / patience diff）。预览层只负责「两段代码都显示对」，混进来会让包背上一份不该有的复杂度。",
};

const COMMENTS = [
  { line: 12, who: "reviewer.a", text: "这个类型断言能不能换成类型守卫？断言会掩盖真实的类型错误。" },
  { line: 28, who: "reviewer.b", text: "分支里 fallback 直接返回 null 会丢上下文，建议 throw 让上层拿到原因。" },
];

const ReviewScenario: React.FC = () => {
  const pane = (file: FileInfo, label: string, tone: string) => (
    <div style={{ minWidth: 0 }}>
      <div className="diff-head">
        <b style={{ fontWeight: 400, color: tone }}>{label}</b>
        <span>{file.name}</span>
      </div>
      <div className="stage-shell" style={{ height: 340 }}>
        <div className="stage-mount">
          <Preview file={file} containerStyle={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="diff-grid">
        {pane(BEFORE, "− 修改前", "#a92f24")}
        {pane(AFTER, "+ 修改后", "#186b39")}
      </div>

      <div className="demo-side-block" style={{ background: "var(--surface)" }}>
        <div className="side-head">
          行内评论
          <b>{COMMENTS.length}</b>
        </div>
        <ul className="demo-why-list" style={{ padding: "8px 10px" }}>
          {COMMENTS.map((c) => (
            <li key={c.line} style={{ gridTemplateColumns: "1fr", gap: 4 }}>
              <code style={{ fontSize: 11 }}>
                L{c.line} · {c.who}
              </code>
              <span style={{ fontSize: 12 }}>{c.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReviewScenario;
