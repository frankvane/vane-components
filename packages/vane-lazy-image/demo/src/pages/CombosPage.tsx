import React from "react";
import { useParams } from "react-router-dom";
import { COMBOS, ComboMeta } from "../data/plugin-catalog";
import { CodeBlock } from "../components/CodeBlock";
import { ComboPanel } from "../components/ComboPanel";

const LOADERS: Record<string, () => Promise<{ default: React.FC }>> = {
  "error-resilience": () =>
    import("../combos/ComboErrorResilienceDemo"),
  performance: () => import("../combos/ComboPerformanceDemo"),
  "visual-effects": () => import("../combos/ComboVisualEffectsDemo"),
  "cache-storage": () => import("../combos/ComboCacheDemo"),
  "viewport-interaction": () =>
    import("../combos/ComboViewportInteractionDemo"),
  "a11y-seo": () => import("../combos/ComboA11ySeoDemo"),
  "visual-effects-plus": () =>
    import("../combos/ComboVisualEffectsPlusDemo"),
  "responsive-seo-webp": () =>
    import("../combos/ComboResponsiveSeoWebPDemo"),
  "interaction-overlay": () =>
    import("../combos/ComboInteractionOverlayDemo"),
  "engine-perf": () => import("../combos/ComboEnginePerfDemo"),
};

interface IdProps {
  id: string;
}

const ComboDetail: React.FC<IdProps> = ({ id }) => {
  const combo: ComboMeta | undefined = COMBOS.find((c) => c.id === id);
  const loader = LOADERS[id];
  if (!loader || !combo) {
    return <div className="page">未找到组合示例：{id}</div>;
  }
  const Comp = React.lazy(loader);
  return (
      <div className="combo-detail">
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
      <div className="group-card-items">
        {COMBOS.map((c) => (
          <a key={c.id} href={`#/combo/${c.id}`} className="chip chip-lg">
            {c.title}
            <span className="chip-desc">{c.description}</span>
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
