/**
 * 插件工坊（/workshop）
 *
 * 与「逐项示例」的分工：
 *  - 逐项示例：一页一个插件，讲透（档位、日志、参数表、源码）。
 *  - 工坊：17 张卡并排，一眼扫过「每个插件拿到它的默认文件时长什么样」。
 *
 * 每张卡都是一个**真的预览器**（不是截图），所以能切样本、能看到自己那套工具栏。
 * 为了首屏不炸，预览器由 `LazyMount` 延迟到快滚到时才实例化 ——
 * epub/docx/pptx/xlsx 各要解一个 zip，17 个一起挂会卡住主线程。
 *
 * ## 为什么是「一个网格 + 通栏分组标题」而不是「每组一个网格」
 *
 * 分组是 3/7/4/1/1/1 条。每组各开一个网格时，三个单卡分组各占一整行 —— 这部分
 * 是**改不掉的**（标题必须换行，单卡只能自己占一行）。换成单网格 + 通栏标题得到的
 * 是另外两件事：
 *  1. 列宽统一。多网格时每组的列数都按自己那组的卡片数摊，同一页会出现好几种列宽；
 *     现在 17 张卡永远同一套列，视觉才成一条竖线。
 *  2. 组间距只由 `gap` 决定。`.section-title` 自带 sp-7 上边距，套在网格里会和外层
 *     margin 叠加成一段说不清多高的空白；现在统一由 `.ws-group-head` 的 margin 控制。
 *
 * 单卡分组右侧的留白**是已知的**，不是漏改：真要让那行填满，得给单卡分组做一套
 * 「宽卡」（左舞台右信息）的横排布局。评估下来不值得 —— 留白读起来像段间距，
 * 而横排布局要为 4 张卡写一整套并行的排版规则。
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LazyMount } from "../components/LazyMount";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  PLUGINS_BY_GROUP,
  folioOf,
  type PluginEntry,
} from "../data/plugin-catalog";
import { pick } from "../data/samples";
import { formatBytes } from "../lib/format";
import { previewOf } from "../lib/previews";

const WorkshopCard: React.FC<{ plugin: PluginEntry }> = ({ plugin }) => {
  const files = pick(...plugin.files);
  const [fileName, setFileName] = useState(files[0].name);
  const base = files.find((f) => f.name === fileName) ?? files[0];
  // 同 DemoDetailPage：docx 的渲染器由 file.docxMode 互斥决定，必须在数据层合并
  const file = plugin.filePatch ? { ...base, ...plugin.filePatch } : base;
  // 用 defaultKey 而不是 id：两者多数时候同名，mammoth-docx 就是个反例
  const { Comp } = previewOf(plugin.defaultKey);

  return (
    <article className="ws-card" data-plugin={plugin.id}>
      <header className="ws-card-head">
        <span className="ws-badge" aria-hidden="true">
          {folioOf(plugin.id)}
        </span>
        <div className="ws-title">
          <h3>{plugin.title}</h3>
          <code>{plugin.factoryName}</code>
        </div>
        <span className="tag" style={{ marginLeft: "auto" }}>
          {GROUP_LABELS[plugin.group].en}
        </span>
      </header>

      <p className="ws-one">{plugin.oneLiner}</p>

      <div className="ws-stage">
        <div className="stage-shell">
          {/* 复用 .stage-mount 而不是自造一个 .ws-mount：
              体检判据（scripts/audit-pages.mjs / lib/audit.ts）只认这个类名，
              17 张卡和 17 个逐项页走同一套「非零尺寸 + 无横向溢出」检查 */}
          <div className="stage-mount">
            <LazyMount>
              <Comp file={file} />
            </LazyMount>
          </div>
          <div className="ws-tagline">
            <span>{file.name}</span>
            <span>{formatBytes(file.size)}</span>
          </div>
        </div>
      </div>

      <div className="ws-files" role="group" aria-label={`${plugin.title} 样本`}>
        {files.map((f) => (
          <button
            key={f.name}
            type="button"
            className="filebar-btn"
            aria-pressed={f.name === file.name}
            title={f.note ?? f.name}
            onClick={() => setFileName(f.name)}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="ws-config">
        <dl>
          {(plugin.doc.config ?? []).slice(0, 3).map((c) => (
            <React.Fragment key={c.name}>
              <dt title={c.description}>{c.name}</dt>
              <dd>{c.default ?? "—"}</dd>
            </React.Fragment>
          ))}
          {(plugin.doc.config?.length ?? 0) > 3 ? (
            <>
              <dt>…</dt>
              <dd>共 {plugin.doc.config?.length} 项</dd>
            </>
          ) : null}
        </dl>
      </div>

      <div className="ws-foot">
        <span>{plugin.id}</span>
        <span>·</span>
        <span>{plugin.files.length} files</span>
        <Link to={`/demos/${plugin.id}`}>打开示例 →</Link>
      </div>
    </article>
  );
};

export const WorkshopPage: React.FC = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">插件工坊</h1>
        <p className="page-desc">
          17 张卡，每张都在跑真的预览器（不是截图）：卡里那份文件就是它最擅长的活，
          可以直接切样本。预览器滚动到视口才装载 —— epub / docx / pptx / xlsx 各自要解一个
          zip，17 个同时挂会把主线程堵住。
        </p>
      </div>

      {/* 单个网格 + 整行分组标题，见文件头「为什么是一个网格」 */}
      <div className="ws-grid">
        {GROUP_ORDER.map((group, gi) => {
          const list = PLUGINS_BY_GROUP[group];
          if (!list.length) return null;
          return (
            <React.Fragment key={group}>
              <h2 className="section-title ws-group-head">
                {String(gi + 1).padStart(2, "0")} · {GROUP_LABELS[group].label} · {list.length}
              </h2>
              {list.map((p) => (
                <WorkshopCard key={p.id} plugin={p} />
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
