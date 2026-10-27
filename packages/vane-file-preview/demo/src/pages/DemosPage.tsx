import React from "react";
import { Link } from "react-router-dom";
import { GROUP_LABELS, GROUP_ORDER, PLUGINS_BY_GROUP } from "../data/plugin-catalog";
import { DEMOS } from "../demos/registry";

/**
 * 示例目录（/demos）
 *
 * 只做索引，不做预览：17 张卡同时挂预览器会让首屏重到没法看
 * （epub + docx + pptx + xlsx 各自要解一个 zip）。要真预览进详情页。
 */
export const DemosPage: React.FC = () => {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">逐项示例</h1>
        <p className="page-desc">
          {DEMOS.length} 个插件各一页，每页只装它自己：切真文件、换装配档位、看生命周期日志，
          下面是可复制的官方用法与该页源码。这一层的目的是把「一个插件能干什么」讲清楚，
          而不是证明它们能一起工作 —— 那件事在
          <Link to="/scenarios">场景示例</Link>里。
        </p>
      </div>

      {/* 每组一个网格，不做「单网格 + 通栏标题」——
          `.demos-index` 是 1px 隔线拼出的表格感网格，通栏标题要求网格跨行，
          而一张卡的分组会在同一行里留下 2 个**带边框的空格**，看起来像数据缺失。
          分组少一张卡的损失只是右侧留白，比空洞可接受。 */}
      {GROUP_ORDER.map((group, gi) => {
        const list = PLUGINS_BY_GROUP[group];
        if (!list.length) return null;
        return (
          <section key={group}>
            <h2 className="section-title">
              {String(gi + 1).padStart(2, "0")} · {GROUP_LABELS[group].label} · {list.length}
            </h2>
            <div className="demos-index">
              {list.map((p) => {
                // data-idx 而不是 data-plugin：`data-plugin` 的语义是「这块是一个
                // 预览舞台」，体检脚本靠它数块（验收门 40 = 17 逐项 + 17 工坊 + 6 场景）。
                // 索引卡只是链接，标成 data-plugin 会让它被当成「挂载点缺失」。
                return (
                  <Link key={p.id} to={`/demos/${p.id}`} className="idx-card" data-idx={p.id}>
                    <div className="idx-card-top">
                      <span className="idx-no">{p.id}</span>
                      <h3>{p.title}</h3>
                    </div>
                    <p>{p.oneLiner}</p>
                    <div className="idx-card-foot">
                      <span className="tag">{GROUP_LABELS[p.group].en}</span>
                      <span className="tag">{p.files.length} files</span>
                      <span className="tag">{p.variants.length} 档</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
