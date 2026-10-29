import React from "react";
import { useParams } from "react-router-dom";
import { demosOf, findDemo } from "../demos/registry";

const advanced = demosOf("advanced");

const AdvancedDetail: React.FC<{ id: string }> = ({ id }) => {
  const entry = findDemo(id);
  if (!entry || entry.meta.group !== "advanced") {
    return <div className="page">未找到高级示例：{id}</div>;
  }
  const Comp = entry.Stage;
  return (
    <div className="page">
      {/* 各高级 demo 自带标题，这里补一个屏幕阅读器可见的页面主标题 */}
      <h1 className="sr-only">{entry.meta.title}</h1>
      <React.Suspense fallback={<div className="loading">加载中…</div>}>
        <Comp />
      </React.Suspense>
    </div>
  );
};

export const AdvancedPage: React.FC = () => {
  const { id } = useParams();
  if (id) return <AdvancedDetail id={id} />;
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">高级功能</h1>
        <p className="page-desc">
          插件沙箱、性能监控、热更新、依赖解析等底层能力演示。
        </p>
      </div>
      <div className="index-grid">
        {advanced.map((a) => (
          <a key={a.meta.slug} href={`#/advanced/${a.meta.slug}`} className="chip chip-lg">
            {a.meta.title}
            <span className="chip-desc">{a.meta.description}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
