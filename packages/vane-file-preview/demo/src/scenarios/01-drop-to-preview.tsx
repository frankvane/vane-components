/**
 * D01 · 上传即预览
 *
 * 真实痛点是「用户不知道该传什么」：拖进来一个 .docx、一个 .xlsx、一张截图，
 * 后台得自己决定谁去渲染。这一格把 17 个插件全装上，让路由**当着你面发生**：
 * 左边是拖拽区，右边直接显示「谁认领了它、还有谁也想认领、最后为什么是它」。
 *
 * 关键点：这一页不是「按扩展名写 if/else」，而是 `resolvePreview` 的完整规则 ——
 * priority 降序 → MIME 置信度 → 声明顺序。上传一个 .ogg 音频时能明显看到
 * VideoPreviewPlugin 被 AudioPreviewPlugin 压下去（MIME 压过扩展名）。
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FilePreviewCore,
  accepts,
  priorityOf,
  resolvePreview,
  withPlugins,
  type FileInfo,
} from "vane-file-preview";
import { createAllPlugins } from "vane-file-preview/custom-plugins";
import { formatBytes, shortMime } from "../lib/format";
import { pick } from "../data/samples";
import type { ScenarioMeta } from "./types";

const ALL = createAllPlugins();
const Preview = withPlugins(FilePreviewCore, { plugins: ALL });

const QUICK = pick("sample.docx", "sample.xlsx", "star.pdf", "sample.jpg", "sample-data.csv");

export const meta: ScenarioMeta = {
  code: "D01",
  title: "上传即预览",
  pain: "用户拖进来什么都有可能，后台不该用 if/else 猜类型：要按 MIME / 扩展名 / 插件优先级排出唯一赢家，还要能解释「为什么是它」。",
  plugs: [
    { fn: "createAllPlugins", why: "17 个插件全装上，路由在运行时决出赢家" },
    { fn: "resolvePreview", why: "纯函数，同一个文件无论在哪算结果都一样" },
    { fn: "accepts", why: "列出「还有谁想认领」，用来解释落选原因" },
  ],
  note: "这里是真的读你选择的文件（File → objectURL），不是预置样本。选一个 .ogg 会看到音频与视频插件抢同一个文件，最后 MIME 让音频赢。",
};

const DropScenario: React.FC = () => {
  const [file, setFile] = useState<FileInfo>(QUICK[0]);
  const [over, setOver] = useState(false);
  const createdUrl = useRef<string | null>(null);

  // 自己造的 objectURL 必须自己回收：不回收的话每换一个文件就泄漏一份完整字节
  useEffect(
    () => () => {
      if (createdUrl.current) URL.revokeObjectURL(createdUrl.current);
    },
    []
  );

  // 名字刻意不叫 useXxx：它是个普通函数，`use` 前缀会让 eslint 的 rules-of-hooks
  // 把它当成 Hook，然后在 onClick 里调用时报「Hook 不能写在回调里」。
  const adoptFile = (f: File) => {
    if (createdUrl.current) URL.revokeObjectURL(createdUrl.current);
    const url = URL.createObjectURL(f);
    createdUrl.current = url;
    const ext = f.name.includes(".") ? f.name.split(".").pop()!.toLowerCase() : "";
    setFile({
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
      extension: ext,
      url,
    });
  };

  const winner = useMemo(() => resolvePreview(ALL, file), [file]);
  const candidates = useMemo(
    () =>
      ALL.filter((p) => accepts(p, file))
        .map((p) => ({ name: p.name, priority: priorityOf(p, file) }))
        .sort((a, b) => b.priority - a.priority),
    [file]
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        className={`drop-zone${over ? " is-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) adoptFile(f);
        }}
      >
        <b>把文件拖到这里</b>
        <span>或者从下面挑一个样本</span>
        {/* label 包住隐藏的 input：原生 file input 在 Chromium 里是英文的
            「Choose File / No file chosen」，没法样式化，只能换掉壳 */}
        <label className="drop-pick">
          选择本地文件
          <input
            type="file"
            aria-label="选择一个本地文件"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) adoptFile(f);
            }}
          />
        </label>
      </div>

      <div className="filebar" role="group" aria-label="快捷样本">
        <span className="filebar-label">quick</span>
        {QUICK.map((s) => (
          <button
            key={s.name}
            type="button"
            className="filebar-btn"
            aria-pressed={s.name === file.name}
            onClick={() => {
              if (createdUrl.current) {
                URL.revokeObjectURL(createdUrl.current);
                createdUrl.current = null;
              }
              setFile(s);
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="stage-shell" style={{ height: 360 }}>
        <div className="stage-mount">
          <Preview file={file} containerStyle={{ width: "100%", height: "100%" }} />
        </div>
        <div className="stage-foot">
          <span className="dot is-loaded" aria-hidden="true" />
          <span>
            <b>{file.name}</b>
          </span>
          <span>{formatBytes(file.size)}</span>
          <span>{shortMime(file.type)}</span>
          <span style={{ marginLeft: "auto" }}>
            winner <b>{winner?.name ?? "unsupported"}</b>
          </span>
        </div>
      </div>

      <div className="demo-side-block">
        <div className="side-head">
          路由决策
          <b>{candidates.length} 个候选</b>
        </div>
        <table className="config-table">
          <thead>
            <tr>
              <th>插件</th>
              <th>priority</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.name}>
                <td>
                  <code>{c.name}</code>
                </td>
                <td className="default-cell">{c.priority}</td>
                <td style={{ color: c.name === winner?.name ? "var(--ok)" : undefined }}>
                  {c.name === winner?.name ? "赢家" : "候选（被压下去）"}
                </td>
              </tr>
            ))}
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={3}>没有插件认领 —— 正常情况下 DownloadPlugin 会兜住</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DropScenario;
