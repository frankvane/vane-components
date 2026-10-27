/**
 * 灯箱（预览舞台）
 * ----------------------------------------------------------------------------
 * 一整块「仪器面板」：顶部文件条 → 中间挂载点 → 底部读数。预览器由页面传进来
 * （`children`），因为「装哪些插件」是页面自己的事，外壳不该知道。
 *
 * 三个实现细节都是被真实问题逼出来的：
 *
 * 1. **高度给 shell，不给挂载点**。`stage-shell` 固定 `height`，`stage-mount` 用
 *    `flex:1; min-height:0`。少任何一层，PDF / EPUB 的 iframe 都会塌成 0 高
 *    （`height:100%` 在 auto 高度的父级里没有任何意义）。
 * 2. **文件条不滚走**。切样本要一直能点，所以只有挂载点滚动。
 * 3. **读数行显示「谁认领了它」**。同一页切到别的样本时插件名会变 —— 这是
 *    「单赢家路由」最直观的证据，比讲十句规则有用。
 */
import React from "react";
import type { PreviewStateInfo } from "vane-file-preview";
import { formatBytes, shortMime } from "../lib/format";
import type { Sample } from "../data/samples";

export interface StageProps {
  files: Sample[];
  value: string;
  onChange: (name: string) => void;
  /** 当前文件被哪个插件认领（目录名）；不确定就传 "—" */
  pluginName: string;
  state: PreviewStateInfo;
  height?: number;
  label?: string;
  children: React.ReactNode;
}

const STATE_LABEL: Record<string, string> = {
  idle: "idle",
  loading: "loading",
  loaded: "loaded",
  error: "error",
};

export const Stage: React.FC<StageProps> = ({
  files,
  value,
  onChange,
  pluginName,
  state,
  height = 440,
  label = "file",
  children,
}) => {
  const file = files.find((f) => f.name === value) ?? files[0];

  return (
    <figure className="plate">
      <figcaption className="plate-cap">
        <b>stage</b>
        <span>live preview</span>
        <em>{STATE_LABEL[state.state] ?? state.state}</em>
      </figcaption>
      <div className="plate-ruler" aria-hidden="true" />
      <div className="plate-body">
        <div className="stage-shell" style={{ height }}>
          <div className="filebar" role="group" aria-label="切换样本文件">
            <span className="filebar-label">{label}</span>
            {files.map((f) => (
              <button
                key={f.name}
                type="button"
                className="filebar-btn"
                aria-pressed={f.name === file.name}
                title={f.note ?? f.name}
                onClick={() => onChange(f.name)}
              >
                {f.name}
                <span className="filebar-ext">{f.extension}</span>
              </button>
            ))}
          </div>

          <div className="stage-mount">{children}</div>

          <div className="stage-foot">
            <span className={`dot is-${state.state}`} aria-hidden="true" />
            <span className="foot-name">
              <b>{file.name}</b>
            </span>
            <span>{formatBytes(file.size)}</span>
            {/* MIME 再短也是个不可断的 token，窄舞台下会顶到右栏：交给 CSS 省略 */}
            <span className="foot-mime" title={file.type}>
              {shortMime(file.type)}
            </span>
            <span style={{ marginLeft: "auto" }}>
              plugin <b>{pluginName}</b>
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
};
