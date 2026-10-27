import React from "react";
import { Link } from "react-router-dom";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  PLUGINS,
  PLUGINS_BY_GROUP,
  PLUGIN_COUNT,
} from "../data/plugin-catalog";
import { SAMPLE_COUNT } from "../data/samples";

const FEATURES = [
  {
    k: "01",
    t: "单赢家路由",
    d: "17 个插件同时注册，一个文件只有一个赢家：canHandle 互斥 → 类型/扩展名 → priority → MIME 置信度 → 声明顺序。平手没有概率，只有确定的顺序。",
  },
  {
    k: "02",
    t: "重依赖按需",
    d: "mammoth / xlsx / jszip / epubjs / prism 全部动态 import + optional peer。没装就渲染「缺依赖」面板，而不是白屏或一句 Failed to fetch。",
  },
  {
    k: "03",
    t: "用真文件验",
    d: `${SAMPLE_COUNT} 份真样本：PDF 多页、DOCX 带表格、xlsx 多 Sheet、EPUB 16 章、GBK 编码的 CSV。这些格式骗不过占位字符串 —— data URL 能骗过 <img>，骗不过解码器。`,
  },
  {
    k: "04",
    t: "失败态给出路",
    d: "每个失败面板都能继续：下载原文件、说出它其实是 PNG 还是 HTML 404 页、普通 zip 还列出实际条目。失败不等于死路。",
  },
];

export const HomePage: React.FC = () => {
  const groupCount = GROUP_ORDER.filter((g) => PLUGINS_BY_GROUP[g].length > 0).length;

  return (
    <div className="page">
      <section className="hero">
        <span className="hero-mark" aria-hidden="true">
          FILE
        </span>
        <div>
          <span className="hero-eyebrow">
            <i aria-hidden="true" />
            plugin index · react file preview
          </span>
          <h1 className="hero-title">
            <span className="line">文件丢进来，</span>
            <span className="line">
              按类型<em>路由</em>给插件。
            </span>
          </h1>
          <p className="hero-lede">
            插件化 React 文件预览组件库的实时演示台：<b>{PLUGIN_COUNT} 个插件</b>
            覆盖图片与音视频、文档、结构化数据、压缩包、代码与兜底下载。
            每个插件都能在这里<b>切真文件、换装配档位、看生命周期日志、读可复制的源码</b>。
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/scenarios">
              浏览场景示例
            </Link>
            <Link className="btn btn-ghost" to="/workshop">
              打开插件工坊
            </Link>
            <Link className="btn btn-ghost" to="/demos">
              逐项示例 →
            </Link>
          </div>
        </div>

        <div className="hero-stats" role="list" aria-label="内容规模统计">
          <div className="stat" role="listitem">
            <span className="stat-value">{PLUGIN_COUNT}</span>
            <span className="stat-label">插件模块</span>
          </div>
          <div className="stat" role="listitem">
            <span className="stat-value">{groupCount}</span>
            <span className="stat-label">功能分组</span>
          </div>
          <div className="stat" role="listitem">
            <span className="stat-value">{SAMPLE_COUNT}</span>
            <span className="stat-label">真实样本</span>
          </div>
          <div className="stat" role="listitem">
            <span className="stat-value">6</span>
            <span className="stat-label">业务场景</span>
          </div>
        </div>
      </section>

      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.k}>
            <div className="feature-icon" aria-hidden="true">
              {f.k}
            </div>
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">按分组浏览 · {PLUGIN_COUNT}</h2>
      <div className="group-grid">
        {GROUP_ORDER.map((group, gi) => {
          const list = PLUGINS_BY_GROUP[group];
          if (!list.length) return null;
          return (
            <div className="group-card" key={group}>
              <h3>
                <span className="idx">{String(gi + 1).padStart(2, "0")}</span>
                {GROUP_LABELS[group].label}
                <span className="count">{list.length}</span>
              </h3>
              <div className="group-card-items">
                {list.map((p) => (
                  <Link key={p.id} to={`/demos/${p.id}`} className="chip">
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <div className="group-card">
          <h3>
            三个视角
            <span className="count">3</span>
          </h3>
          <div className="group-card-items">
            <Link to="/workshop" className="chip">
              工坊 · 17 张卡并排
            </Link>
            <Link to="/demos" className="chip">
              逐项 · 一插件一页
            </Link>
            <Link to="/scenarios" className="chip">
              场景 · 真实版式
            </Link>
          </div>
        </div>
      </div>

      <h2 className="section-title">插件清单</h2>
      <div className="demos-index">
        {PLUGINS.map((p, i) => (
          <Link key={p.id} to={`/demos/${p.id}`} className="idx-card">
            <div className="idx-card-top">
              <span className="idx-no">{String(i + 1).padStart(2, "0")}</span>
              <h3>{p.title}</h3>
            </div>
            <p>{p.oneLiner}</p>
            <div className="idx-card-foot">
              <span className="tag">{GROUP_LABELS[p.group].en}</span>
              <span className="tag">{p.files.length} files</span>
              <span className="tag">{p.doc.config?.length ?? 0} params</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
