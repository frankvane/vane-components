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
import { getEnvState, setEnvState, type EnvState } from "./env-sim";

/**
 * 一键演示：把「需要知道改哪个参数、改成什么值才能看见」的插件收敛成一个按钮。
 *
 * 测评里有一批插件的能力默认参数下不体现差异（filter 的 filter=none、
 * priority-loading 的 priority=medium、viewport-aware 不显示标记……），
 * 也有一批依赖环境（低电量 / 省流量 / 低内存）。这些插件此前只能靠测评脚本
 * 逐个改值去验证，人工验收基本无从下手。这里为每个插件给出一个语义化的演示动作：
 * 设参数、开环境模拟、或切到多图并发，点一下即可在画面上/观察台看到效果。
 */
type DemoAction = {
  label: string;
  hint: string;
  patch?: Record<string, any>;
  env?: Partial<EnvState>;
  emptyAlt?: boolean;
  multi?: boolean;
  scroll?: boolean;
};

const DEMO_ACTIONS: Record<string, DemoAction[]> = {
  "alt-text": [
    {
      label: "清空 alt 后自动补全",
      hint: "补全类插件只在 alt 缺失时起作用，点击后会清空 alt 并按 prefix 生成",
      emptyAlt: true,
      patch: { prefix: "示例图片" },
    },
  ],
  "anti-hotlink": [
    {
      label: "开启 Referer 校验",
      hint: "无 referrer 时给 URL 追加 ref=direct，看观察台「请求 URL」",
      patch: { checkReferer: true },
    },
  ],
  auth: [
    {
      label: "注入访问凭证",
      hint: "请求 URL 追加 access_token=demo-token，看观察台「请求 URL」",
      patch: { token: "demo-token-1f2e3d", tokenParam: "access_token", crossOrigin: "anonymous" },
    },
  ],
  "cache-memory": [
    {
      label: "多图并发 + 二次加载",
      hint: "4 张图同时请求，再点观察台「二次加载测缓存」看是否命中",
      multi: true,
    },
  ],
  "concurrency-control": [
    {
      label: "4 张图排队（max=1）",
      hint: "maxConcurrent=1 + debug，观察台「插件日志」会打印 acquire/release 排队过程",
      multi: true,
      patch: { maxConcurrent: 1, debug: true },
    },
  ],
  "custom-effects": [
    {
      label: "套一组自定义效果",
      hint: "imageStyle 是对象，参数面板里输不了，这里直接注入一组样式",
      patch: {
        imageStyle: {
          filter: "sepia(0.9) contrast(1.1)",
          transform: "scale(1.04)",
          borderRadius: "14px",
        },
      },
    },
  ],
  filter: [
    {
      label: "灰度 + 悬停恢复",
      hint: "filter=none 时没有任何效果，这里切成 grayscale 且悬停还原",
      patch: { filter: "grayscale", amount: 1, hover: true },
    },
  ],
  "priority-loading": [
    {
      label: "提到最高优先级",
      hint: "priority=high → 观察台 fetchpriority=high、loading=eager",
      patch: { priority: "high" },
    },
  ],
  "scroll-idle": [
    {
      label: "滚动后空闲再加载",
      hint: "idleMs 拉长并开 debug，点击后自动滚一次，看请求时机与日志",
      patch: { idleMs: 800, debug: true },
      scroll: true,
    },
  ],
  "viewport-aware": [
    {
      label: "显示视口标记",
      hint: "rootMargin=200px + showDot，预览区右下角出现一个可视标记",
      patch: { rootMargin: "200px", showDot: true },
    },
  ],
  "viewport-debounce": [
    {
      label: "防抖 800ms + 滚动",
      hint: "进入视口后要稳定停留才加载，点击后自动滚一次",
      patch: { debounceMs: 800, debug: true },
      scroll: true,
    },
  ],
  "viewport-dwell": [
    {
      label: "驻留 1200ms + 滚动",
      hint: "要求停留足够久才发起加载，点击后自动滚一次",
      patch: { dwellMs: 1200, debug: true },
      scroll: true,
    },
  ],
  "battery-aware": [
    {
      label: "模拟低电量",
      hint: "电量 8% → 请求宽度降级到 640，看观察台「请求 URL」",
      env: { battery: true },
      patch: { downgradeWidth: 640 },
    },
  ],
  "data-saver": [
    {
      label: "模拟省流量模式",
      hint: "saveData=true → URL 追加 quality 参数",
      env: { slow: true },
    },
  ],
  "memory-pressure-abort": [
    {
      label: "模拟低内存设备",
      hint: "deviceMemory 降到 1GB → 降级宽度到 640",
      env: { battery: true },
      patch: { lowWidth: 640 },
    },
  ],
  "network-analytics": [
    {
      label: "模拟弱网",
      hint: "Network Information API 走 2g/900ms，日志里会带上网络档位",
      env: { slow: true },
    },
  ],
};


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
  // 多图并发：并发控制 / 视口调度 / 缓存类插件的价值只在多图下体现，
  // 单图示例页天然看不出来
  const [multi, setMulti] = React.useState(false);
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
    setMulti(false);
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

  const actions = DEMO_ACTIONS[pluginId] || [];

  const runAction = (a: DemoAction) => {
    if (a.patch) {
      // 演示写入的参数同样进 touched：否则会被示例预设覆盖回去
      Object.keys(a.patch).forEach((k) => touchedRef.current.add(k));
      setValues((v) => ({ ...v, ...a.patch }));
    }
    if (a.env) setEnvState({ ...getEnvState(), ...a.env });
    if (a.emptyAlt) setEmptyAlt(true);
    if (a.multi) setMulti(true);
    // 门控 / 视口类插件要「有一次滚动」才会走完整流程
    if (a.scroll) {
      window.setTimeout(() => {
        window.scrollTo(0, 260);
        window.dispatchEvent(new Event("scroll"));
        window.setTimeout(() => {
          window.scrollTo(0, 0);
          window.dispatchEvent(new Event("scroll"));
        }, 700);
      }, 250);
    }
    // 重挂载一次，让动画 / 门控类插件按新参数重新走一遍
    setReplay((v) => v + 1);
  };

  // 多图模式用不同 seed，避免 4 张图命中同一个缓存条目、看不出并发
  const multiSrc = (i: number) => {
    const m = defaultSrc.match(/^https:\/\/picsum\.photos\/seed\/([^/]+)\/(.+)$/);
    if (m) return `https://picsum.photos/seed/${m[1]}-m${i}/${m[2]}`;
    return `${defaultSrc}${defaultSrc.includes("?") ? "&" : "?"}m=${i}`;
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
        <label className="checkbox-line">
          <input
            type="checkbox"
            data-demo="multi"
            checked={multi}
            onChange={(e) => setMulti(e.target.checked)}
          />
          多图（4 张并发）
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

      {actions.length > 0 && (
        <div className="demo-actions">
          <span className="demo-actions-label">一键演示</span>
          {actions.map((a, i) => (
            <button
              key={i}
              className="btn btn-mini"
              data-action={`${pluginId}#${i}`}
              title={a.hint}
              onClick={() => runAction(a)}
            >
              {a.label}
            </button>
          ))}
          <span className="demo-actions-hint">{actions.map((a) => a.hint).join("；")}</span>
        </div>
      )}

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
            {multi ? (
              <div className="preview-grid" data-multi="1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={`${replay}-${i}`} style={{ width: 160, height: 110 }}>
                    <LazyImage
                      src={multiSrc(i)}
                      alt={emptyAlt ? "" : `${meta.title} ${i + 1}`}
                      loading="lazy"
                      containerStyle={{ width: "100%", height: "100%" }}
                      imageStyle={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
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
            )}
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
  // 场景卡片同样需要「重播」：揭示动画 / 形变 / 淡入的效果播完就没了，
  // 静态卡片一旦加载完就再也看不到过程
  const [replay, setReplay] = React.useState(0);

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
      <button
        className="btn btn-mini example-replay"
        data-demo="replay-static"
        onClick={() => setReplay((v) => v + 1)}
      >
        重播
      </button>
      {composeError ? (
        <div className="preview-error">组合出错：{composeError}</div>
      ) : (
        <EB>
          <div key={replay} style={{ width: 360, height: 240 }}>
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
