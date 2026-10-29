import React from "react";
import { useParams } from "react-router-dom";
import { demosOf, findDemo } from "../demos/registry";
import type { ComboMeta } from "../data/plugin-catalog";
import { CodeBlock } from "../components/CodeBlock";
import { ComboPanel } from "../components/ComboPanel";

const combos = demosOf("combo");

const ComboDetail: React.FC<{ id: string }> = ({ id }) => {
  const entry = findDemo(id);
  if (!entry || entry.meta.group !== "combo") {
    return <div className="page">未找到组合示例：{id}</div>;
  }
  const Comp = entry.Stage;
  const combo: ComboMeta = {
    id: entry.meta.slug,
    title: entry.meta.title,
    description: entry.meta.description ?? "",
    component: "",
    plugins: entry.meta.plugins ?? [],
    code: entry.meta.code ?? "",
  };
  return (
    <div className="page combo-detail">
      <h1 className="sr-only">{combo.title}</h1>
      <React.Suspense fallback={<div className="loading">加载中…</div>}>
        <Comp />
      </React.Suspense>
      <ComboPanel key={combo.id} combo={combo} />
    </div>
  );
};

export const CombosPage: React.FC = () => {
  const { id } = useParams();
  if (id) return <ComboDetail id={id} />;
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">组合示例</h1>
        <p className="page-desc">
          多个插件协同的真实业务组合，展示端到端能力。
        </p>
      </div>
      <div className="index-grid">
        {combos.map((c) => (
          <a key={c.meta.slug} href={`#/combo/${c.meta.slug}`} className="chip chip-lg">
            {c.meta.title}
            <span className="chip-desc">{c.meta.description}</span>
          </a>
        ))}
      </div>
      <h4 className="block-title">组合示例源码（以错误韧性为例）</h4>
      <CodeBlock
        code={`// 组合示例：错误韧性\nimport {\n  LazyLoadImageCore,\n  createErrorOverlayPlugin,\n  createErrorBadgePlugin,\n  createFallbackImagePlugin,\n  createRetryOnErrorPlugin,\n  createEventLoggerPlugin,\n  withPlugins,\n} from "vane-lazy-image";\n\nconst LazyImage = withPlugins(LazyLoadImageCore, [\n  createErrorOverlayPlugin({ retryText: "重试" }),\n  createErrorBadgePlugin({}),\n  createFallbackImagePlugin({ fallbackSrc: "/404.jpg" }),\n  createRetryOnErrorPlugin({ maxRetries: 1 }),\n  createEventLoggerPlugin({ enabled: true }),\n]);`}
      />
    </div>
  );
};
