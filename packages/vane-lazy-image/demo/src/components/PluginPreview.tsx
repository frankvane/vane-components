import React from "react";
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import {
  getPluginById,
  getPluginFactory,
  PluginExample,
} from "../data/plugin-catalog";
import {
  ConfigControls,
  defaultValuesFor,
} from "./ConfigControls";

class EB extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; msg: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, msg: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, msg: String(error?.message || error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="preview-error">
          插件渲染出错（请调整参数）：{this.state.msg}
        </div>
      );
    }
    return this.props.children;
  }
}

export const PluginPreview: React.FC<{ pluginId: string }> = ({ pluginId }) => {
  const meta = getPluginById(pluginId);
  const factory = getPluginFactory(pluginId);
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [src, setSrc] = React.useState(
    `https://picsum.photos/seed/${pluginId}/600/400`
  );
  const [useError, setUseError] = React.useState(false);

  React.useEffect(() => {
    if (meta) setValues(defaultValuesFor(meta.config));
    setUseError(false);
  }, [pluginId, meta]);

  if (!meta || !factory) {
    return <div className="preview-error">未找到插件：{pluginId}</div>;
  }

  const finalSrc = useError
    ? "https://invalid.example.com/not-found.jpg"
    : src;

  let LazyImage: any = null;
  let composeError = "";
  try {
    const cfgValues: Record<string, any> = {};
    for (const k of Object.keys(values)) {
      if (values[k] !== undefined && values[k] !== "") cfgValues[k] = values[k];
    }
    LazyImage = withPlugins(LazyLoadImageCore as any, [factory(cfgValues)]);
  } catch (e: any) {
    composeError = String(e?.message || e);
  }

  const onChange = (name: string, value: any) =>
    setValues((v) => ({ ...v, [name]: value }));

  return (
    <div className="preview-wrap">
      <div className="preview-toolbar">
        <div className="field">
          <span className="field-label">图片 URL</span>
          <input
            className="control-input"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
          />
        </div>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={useError}
            onChange={(e) => setUseError(e.target.checked)}
          />
          使用失效 URL（演示错误态）
        </label>
        <button
          className="btn"
          onClick={() => setValues(defaultValuesFor(meta.config))}
        >
          重置参数
        </button>
      </div>

      <div className="preview-stage">
        {composeError ? (
          <div className="preview-error">组合出错：{composeError}</div>
        ) : (
          <EB>
            <div style={{ width: 360, height: 240 }}>
              <LazyImage
                src={finalSrc}
                alt={meta.title}
                loading="lazy"
                containerStyle={{ width: "100%", height: "100%" }}
                imageStyle={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </EB>
        )}
      </div>

      <div className="preview-controls">
        <h4 className="block-title">参数设置（实时预览）</h4>
        <ConfigControls fields={meta.config} values={values} onChange={onChange} />
      </div>
    </div>
  );
};

// 按固定 config（或 configs 多实例）渲染一个静态实时预览，无表单，用于「场景示例」画廊。
export const StaticPreview: React.FC<{
  pluginId: string;
  example: PluginExample;
}> = ({ pluginId, example }) => {
  const meta = getPluginById(pluginId);
  const factory = getPluginFactory(pluginId);
  const [src] = React.useState<string>(
    example.src || `https://picsum.photos/seed/${pluginId}/600/400`
  );

  if (!meta || !factory) {
    return <div className="preview-error">未找到插件：{pluginId}</div>;
  }

  const normalize = (c: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const k of Object.keys(c || {})) {
      if (c[k] !== undefined && c[k] !== "") out[k] = c[k];
    }
    return out;
  };

  const configs: Record<string, any>[] = example.configs?.length
    ? example.configs.map(normalize)
    : [normalize(example.config || {})];

  let LazyImage: any = null;
  let composeError = "";
  try {
    LazyImage = withPlugins(
      LazyLoadImageCore as any,
      configs.map((cfg) => factory(cfg))
    );
  } catch (e: any) {
    composeError = String(e?.message || e);
  }

  return (
    <div className="example-stage">
      {composeError ? (
        <div className="preview-error">组合出错：{composeError}</div>
      ) : (
        <EB>
          <div style={{ width: 360, height: 240 }}>
            <LazyImage
              src={src}
              alt={meta.title}
              loading="lazy"
              containerStyle={{ width: "100%", height: "100%" }}
              imageStyle={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </EB>
      )}
    </div>
  );
};
