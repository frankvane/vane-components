import React from "react";
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import {
  PLUGINS_BY_CATEGORY,
  PLUGINS,
  CATEGORY_LABELS,
  getPluginFactory,
  Category,
} from "../data/plugin-catalog";
import { CodeBlock } from "../components/CodeBlock";

const GROUP_ORDER: Category[] = [
  "ecommerce",
  "interaction",
  "visual",
  "perf",
  "robust",
  "viewport",
  "a11y",
  "other",
];

export const WorkshopPage: React.FC = () => {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [src, setSrc] = React.useState("https://picsum.photos/seed/work/600/400");

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const factories = selected
    .map((id) => ({ id, fn: getPluginFactory(id) }))
    .filter((x) => x.fn);

  let LazyImage: any = null;
  let composeError = "";
  try {
    LazyImage = withPlugins(
      LazyLoadImageCore as any,
      factories.map((x) => (x.fn as any)({}))
    );
  } catch (e: any) {
    composeError = String(e?.message || e);
  }

  const selectedMetas = PLUGINS.filter((p) => selected.includes(p.id));
  const code = selectedMetas.length
    ? `import { LazyLoadImageCore, withPlugins,\n${selectedMetas
        .map((m) => "  " + m.factoryName)
        .join(",\n")} } from "vane-lazy-image";\n\nconst LazyImage = withPlugins(LazyLoadImageCore, [\n${selectedMetas
        .map((m) => "  " + m.factoryName + "()")
        .join(",\n")}\n]);`
    : `import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";\n\n// 勾选左侧插件以生成组合代码`;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">插件工坊</h1>
        <p className="page-desc">
          勾选多个插件实时装配，右侧即时预览并生成组合代码。
        </p>
      </div>

      <div className="workshop-grid">
        <div className="workshop-picker">
          {GROUP_ORDER.map((cat) => {
            const list = PLUGINS_BY_CATEGORY[cat];
            if (!list || !list.length) return null;
            return (
              <div className="nav-group" key={cat}>
                <h3 className="nav-group-title">{CATEGORY_LABELS[cat]}</h3>
                <div className="nav-group-items">
                  {list.map((p) => (
                    <label key={p.id} className="ws-check">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                      {p.title}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="workshop-stage">
          <div className="preview-toolbar">
            <div className="field">
              <span className="field-label">图片 URL</span>
              <input
                className="control-input"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
              />
            </div>
          </div>
          <div className="preview-stage">
            {composeError ? (
              <div className="preview-error">组合出错：{composeError}</div>
            ) : (
              <div style={{ width: 360, height: 240 }}>
                <LazyImage
                  src={src}
                  alt="preview"
                  loading="lazy"
                  containerStyle={{ width: "100%", height: "100%" }}
                  imageStyle={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </div>
          <h4 className="block-title">生成代码</h4>
          <CodeBlock code={code} />
        </div>
      </div>
    </div>
  );
};
