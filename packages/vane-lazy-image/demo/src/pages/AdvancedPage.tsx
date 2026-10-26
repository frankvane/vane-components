import React from "react";
import { useParams } from "react-router-dom";
import { ADVANCED } from "../data/plugin-catalog";

interface IdProps {
  id: string;
}

const LOADERS: Record<string, () => Promise<{ default: React.FC }>> = {
  "plugin-sandbox": () => import("../advanced/PluginSandboxDemo"),
  "performance-monitoring": () =>
    import("../advanced/PerformanceMonitoringDemo"),
  "plugin-hot-reload": () => import("../advanced/PluginHotReloadDemo"),
  "dependency-resolver": () => import("../advanced/DependencyResolverDemo"),
};

const AdvancedDetail: React.FC<IdProps> = ({ id }) => {
  const loader = LOADERS[id];
  if (!loader) return <div className="page">未找到高级示例：{id}</div>;
  const Comp = React.lazy(loader);
  return (
    <React.Suspense fallback={<div className="loading">加载中…</div>}>
      <Comp />
    </React.Suspense>
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
      <div className="group-card-items">
        {ADVANCED.map((a) => (
          <a key={a.id} href={`#/advanced/${a.id}`} className="chip chip-lg">
            {a.title}
            <span className="chip-desc">{a.description}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
