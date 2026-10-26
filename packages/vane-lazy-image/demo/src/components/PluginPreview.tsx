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
import { PluginObserver } from "./PluginObserver";

/**
 * 示例页预设：少数插件的关键参数在 doc.json 里没有可静态声明的默认值
 * （低清占位图地址、兜底图地址、CDN 基址、多语言映射……），不补一个具体值，
 * 页面就无法展示该插件的作用。这里只补「doc 未声明且用户未改」的字段，
 * 参数面板里仍以 doc.json 默认值为准。
 */
const DEMO_PRESETS: Record<string, Record<string, any>> = {
  caption: { text: "示例说明文字 · Caption" },
  lqip: {
    // 内联 data URL（base64，避免 url() 里出现未转义的尖括号/空格导致 CSS 被丢弃）：
    // 占位图本身也要「秒出」，否则慢网下它和被等待的主图一起挂起
    lqipSrc:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSczMCcgaGVpZ2h0PScyMCc+PHJlY3Qgd2lkdGg9JzMwJyBoZWlnaHQ9JzIwJyBmaWxsPScjOTRhM2I4Jy8+PGNpcmNsZSBjeD0nMTUnIGN5PScxMCcgcj0nNScgZmlsbD0nI2UyZThmMCcvPjwvc3ZnPg==",
  },
  localization: {
    localeMap: {
      "zh-CN": "https://picsum.photos/seed/loc-zh/600/400",
      en: "https://picsum.photos/seed/loc-en/600/400",
    },
    currentLocale: "zh-CN",
  },
  "fallback-image": { fallbackSrc: "https://picsum.photos/seed/fallback/600/400" },
  "cdn-fallback": { cdnBases: ["https://picsum.photos/seed/cdn"] },
  "error-tracking": { showBadge: true },
  // 结构型参数（数组 / 函数）无法在参数面板里手输，doc 默认又是空数组，
  // 不补一个示例区域的话打码插件在页面上什么都不做
  redaction: { boxes: [{ x: 0.4, y: 0.3, w: 0.2, h: 0.15, blur: 8 }] },
  // price 的 doc 默认是 undefined（真实业务由 fetchPrice 拉取），不补一个价格就什么都不显示
  "price-tag": { price: 199, originalPrice: 299, showSavings: true },
};

// 有的插件按扩展名改写地址（如 web-p 只处理 .jpg/.png），picsum 的 seed 路径没有扩展名，
// 给这些插件一个带扩展名的源，才能看到地址被改写。
const DEMO_SRC: Record<string, string> = {
  "web-p": "https://picsum.photos/seed/web-p/600/400.jpg",
  "image-optimization": "https://picsum.photos/seed/image-optimization/600/400.jpg",
  responsive: "https://picsum.photos/seed/responsive/600/400.jpg",
};

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
  // 每个插件用自己的 seed，切换路由时同步重置（此前用 useState 只初始化一次，
  // 导致切插件后图片 URL 仍是首个 seed，预览与插件语义对不上）
  const defaultSrc = React.useMemo(
    () => DEMO_SRC[pluginId] || `https://picsum.photos/seed/${pluginId}/600/400`,
    [pluginId]
  );
  const [src, setSrc] = React.useState(defaultSrc);
  const [useError, setUseError] = React.useState(false);
  // 补全类插件（alt-text / a11y / seo）只有在 alt 缺失时才起作用，
  // 给一个开关让验收人能看到「补全」这件事发生
  const [emptyAlt, setEmptyAlt] = React.useState(false);
  // 动画类插件（fade-in / reveal / morph / blur-up）效果是瞬态的，需要「重播」才能验收
  const [replay, setReplay] = React.useState(0);
  const stageRef = React.useRef<HTMLDivElement>(null);
  // 记录被用户手动改过的字段，示例预设不再覆盖它们
  const touchedRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (meta) setValues(defaultValuesFor(meta.config));
    touchedRef.current = new Set();
    setUseError(false);
    setSrc(defaultSrc);
    setEmptyAlt(false);
    setReplay(0);
  }, [pluginId, meta, defaultSrc]);

  const finalSrc = useError
    ? "https://invalid.example.com/not-found.jpg"
    : src;

  const preset = React.useMemo(() => DEMO_PRESETS[pluginId] || {}, [pluginId]);
  // 「示例预设」只受用户是否手改过影响：doc.json 声明的默认值常常把演示需要的开关
  // 关掉（如 error-tracking.showBadge 默认 false），若让 doc 默认压过预设，插件就永远
  // 不会出现在画面上。用户一旦动过该字段，则以用户输入为准。
  const presetKeys = React.useMemo(
    () => Object.keys(preset).filter((k) => !touchedRef.current.has(k)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, values, pluginId]
  );
  const effective = React.useMemo(() => {
    // 预设优先级高于 doc 默认值（否则 doc 里 showBadge:false 之类的默认值会把演示关掉），
    // 但低于用户手改值（手改后该字段已进 touched，不再出现在 presetKeys 里）
    const out: Record<string, any> = { ...values };
    for (const k of presetKeys) out[k] = preset[k];
    return out;
  }, [preset, presetKeys, values]);

  if (!meta || !factory) {
    return <div className="preview-error">未找到插件：{pluginId}</div>;
  }

  let LazyImage: any = null;
  let composeError = "";
  try {
    const cfgValues: Record<string, any> = {};
    for (const k of Object.keys(effective)) {
      if (effective[k] !== undefined && effective[k] !== "") cfgValues[k] = effective[k];
    }
    LazyImage = withPlugins(LazyLoadImageCore as any, [factory(cfgValues)]);
  } catch (e: any) {
    composeError = String(e?.message || e);
  }

  const onChange = (name: string, value: any) => {
    touchedRef.current.add(name);
    setValues((v) => ({ ...v, [name]: value }));
  };

  // 先切到另一张图再切回来，制造「同一 URL 的第二次请求」，用于观察缓存类插件是否命中
  const retryCache = () => {
    setUseError(false);
    setSrc(`${defaultSrc}?probe=1`);
    window.setTimeout(() => setSrc(defaultSrc), 900);
  };

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
        <label className="checkbox-line">
          <input
            type="checkbox"
            data-demo="empty-alt"
            checked={emptyAlt}
            onChange={(e) => setEmptyAlt(e.target.checked)}
          />
          清空 alt（演示补全类插件）
        </label>
        <button className="btn" data-demo="replay" onClick={() => setReplay((v) => v + 1)}>
          重播动画
        </button>
        <button
          className="btn"
          onClick={() => setValues(defaultValuesFor(meta.config))}
        >
          重置参数
        </button>
      </div>

      {presetKeys.length > 0 && (
        <div className="preset-hint">
          示例页预设：<code>{presetKeys.join("、")}</code>（doc.json 未声明默认值，仅示例页补足）
        </div>
      )}

      <div className="preview-stage" ref={stageRef}>
        {composeError ? (
          <div className="preview-error">组合出错：{composeError}</div>
        ) : (
          <EB>
            <div key={replay} style={{ width: 360, height: 240 }}>
              <LazyImage
                src={finalSrc}
                alt={emptyAlt ? "" : meta.title}
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

      <PluginObserver
        stageRef={stageRef}
        pluginId={pluginId}
        baselineAlt={emptyAlt ? "" : meta.title}
        expectSrc={finalSrc}
        onRetryCache={retryCache}
      />

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

  if (!meta || !factory) {
    return <div className="preview-error">未找到插件：{pluginId}</div>;
  }

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
