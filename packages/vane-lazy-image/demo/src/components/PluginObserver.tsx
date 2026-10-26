import React from "react";
import { getEnvState, setEnvState, subscribeEnv, type EnvState } from "./env-sim";

/**
 * 能力观察台（Inspector）
 * ------------------------------------------------------------------
 * 大量插件的能力并不落在「画面」上，而落在 DOM 属性、注入的 <link>、请求 URL、
 * 控制台事件、请求时序上（alt/srcset/loading/fetchpriority、preconnect/preload、
 * src 改写、事件日志、缓存命中……）。这类插件此前在示例页里「看着没效果」，
 * 验收必须开 DevTools。
 *
 * 本面板只读 DOM / Resource Timing / console，把插件作用后的真实取值摊开在页面上，
 * 并与「无插件时的基线」逐项对比，凡发生变化的项标为信号（●）。
 * 面板不注入、不改写任何插件行为，纯观测。
 */

type Row = { key: string; label: string; value: string; signal: boolean };

/**
 * 动画/过渡历史采样
 * morph / fade-in 这类插件的作用是「播放一段动画」，播完就结束（甚至自行清理），
 * 600ms 一次的常规快照很可能正好落在动画之外，看到的仍是空白。
 * 这里在插件切换后的 4 秒内做 80ms 高频采样，把出现过的 animation / transition 记下来。
 */
const ANIM_HIST: string[] = [];
function pushAnim(v: string) {
  if (!v) return;
  if (ANIM_HIST.indexOf(v) >= 0) return;
  ANIM_HIST.push(v);
  if (ANIM_HIST.length > 4) ANIM_HIST.shift();
}


// ---- LCP 采样（只有「性能收益」类结论需要，缺 API 时静默降级） ----
let LCP_MS = 0;
let LCP_TAG = "";
let lcpStarted = false;
function startLcpObserver() {
  if (lcpStarted || typeof window === "undefined") return;
  lcpStarted = true;
  try {
    const po = new PerformanceObserver((list) => {
      const es = list.getEntries();
      const e = es[es.length - 1] as any;
      if (e) {
        LCP_MS = Math.round(e.startTime);
        LCP_TAG = (e.url ? String(e.url).split("/").slice(-2).join("/") : e.element?.tagName || "").slice(0, 40);
      }
    });
    po.observe({ type: "largest-contentful-paint", buffered: true } as any);
  } catch {
    /* 浏览器不支持就留空 */
  }
}

// ---- 插件日志采集（只收带标签的日志，如 [LLI] / [ConcurrencyGate]） ----
const LOG_BUF: string[] = [];
let LOG_COUNT = 0;
let patched = false;

function patchConsole() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const origLog = console.log.bind(console);
  const origDebug = console.debug ? console.debug.bind(console) : origLog;
  const push = (args: any[]) => {
    try {
      const txt = args
        .map((a) => {
          if (typeof a === "string") return a;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(" ");
      if (!/^\[[\w.:-]+\]/.test(txt)) return;
      LOG_COUNT++;
      LOG_BUF.push(txt.slice(0, 120));
      if (LOG_BUF.length > 12) LOG_BUF.shift();
    } catch {
      /* ignore */
    }
  };
  console.log = (...a: any[]) => {
    push(a);
    origLog(...a);
  };
  console.debug = (...a: any[]) => {
    push(a);
    origDebug(...a);
  };
}

// 无插件时 LazyLoadImageCore 的基线取值（读自 core 渲染逻辑与浏览器默认值）
const BASE: Record<string, string> = {
  loading: "lazy",
  fetchpriority: "",
  decoding: "",
  crossorigin: "",
  referrerpolicy: "",
  srcset: "",
  sizes: "",
  role: "",
  aria: "",
  itemprop: "",
  objectposition: "50% 50%",
  imgfilter: "none",
  imgtransform: "none",
  imgclip: "none",
  imgblend: "normal",
  bg: "rgb(245, 245, 245)",
  ratio: "auto",
  shadow: "none",
  boxfilter: "none",
  boxtransform: "none",
  boxtransition: "all",
  boxanimation: "",
  imgradius: "0px",
  imgtransition: "opacity 0.18s",
  imganimation: "none",
  imgorientation: "",
  overlays: "0",
  links: "",
};

const BGS = ["rgba(0, 0, 0, 0)", "rgb(245, 245, 245)", "rgb(255, 238, 238)"];

function norm(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v).trim().replace(/\s+/g, " ").toLowerCase();
  if (s === "rgba(0, 0, 0, 0)" || s === "rgba(0,0,0,0)") return "transparent";
  if (s === "none none") return "none";
  return s;
}

function shortUrl(u: string): string {
  if (!u) return "-";
  try {
    const url = new URL(u, window.location.origin);
    const tail = url.pathname.split("/").filter(Boolean).slice(-3).join("/");
    return url.host + "/…/" + tail + (url.search || "");
  } catch {
    return u.slice(0, 60);
  }
}

/** 只看 role / aria-*（alt 单独一行） */
function ariaSummary(el: HTMLElement): string {
  const out: string[] = [];
  for (const a of Array.from(el.attributes)) {
    if (a.name === "role" || a.name.startsWith("aria-")) out.push(`${a.name}=${a.value}`);
  }
  return out.join(" ");
}

/** 插件注入的资源提示（排除打包器自己的 modulepreload 与同源 assets） */
function readLinks(): string[] {
  const rels = ["preconnect", "dns-prefetch", "preload", "prefetch"];
  return Array.from(document.querySelectorAll("link[rel]"))
    .filter((l) => {
      const rel = (l.getAttribute("rel") || "").toLowerCase();
      if (rels.indexOf(rel) === -1) return false;
      const href = (l as HTMLLinkElement).href || "";
      if (!href || /\/assets\//.test(href)) return false;
      if (rel === "preload" || rel === "prefetch") {
        const as = (l.getAttribute("as") || "").toLowerCase();
        if (as && as !== "image") return false;
      }
      return true;
    })
    .map((l) => `${l.getAttribute("rel")}:${shortUrl((l as HTMLLinkElement).href)}`)
    .filter((v, i, a) => a.indexOf(v) === i);
}

function readSnapshot(
  stage: HTMLElement | null,
  baselineAlt: string,
  expectSrc: string,
  logBase: number
) {
  const img = stage ? (stage.querySelector("img") as HTMLImageElement | null) : null;
  const box = img ? (img.parentElement as HTMLElement | null) : null;
  const cs = img ? getComputedStyle(img) : null;
  // 有的插件把样式加在外层包裹节点上（如 border-glow 为避免 overflow 裁剪，加在祖父节点）
  const boxes: HTMLElement[] = [];
  for (let el = box, i = 0; el && i < 3; el = el.parentElement, i++) boxes.push(el);
  const bcs = boxes.map((b) => getComputedStyle(b));
  const bs = bcs[0] || null;
  // 依次在 3 层里找第一个「非基线」取值
  const pick = (fn: (c: CSSStyleDeclaration) => string, baseline: string[]) => {
    for (const c of bcs) {
      const v = norm(fn(c));
      if (v && baseline.indexOf(v) === -1) return v;
    }
    return "";
  };


  const overlays = box
    ? (Array.from(box.children).filter((el) => {
        if (el.tagName === "IMG") return false;
        // core 在 loading 阶段会渲染一个 "Loading..." 占位，不算插件叠加层
        const t = (el as HTMLElement).innerText || "";
        return !(el.children.length <= 1 && /^\s*Loading\.{0,3}\s*$/.test(t));
      }) as HTMLElement[])
    : [];
  const overlayText = norm(overlays.map((el) => el.innerText || "").join(" ")).slice(0, 80);

  const links = readLinks();
  const metaTags = document.querySelectorAll(
    'meta[property^="og:"],meta[name="description"],script[type="application/ld+json"]'
  ).length;

  let timing = "-";
  let cacheHit = false;
  // 量化「这张图到底花了多少字节 / 多久」——性能收益类结论需要它，
  // 只有「行为是否发生」的证据不足以支撑优化收益
  let perf: { kb: string; decoded: string; duration: number } | null = null;
  const src = img?.currentSrc || img?.src || "";
  if (src) {
    try {
      const entries = performance.getEntriesByName(src, "resource") as PerformanceResourceTiming[];
      if (entries.length) {
        const e = entries[entries.length - 1];
        const kb = e.transferSize ? (e.transferSize / 1024).toFixed(1) + "KB" : "缓存/0KB";
        timing = `第${entries.length}次 · 起始${Math.round(e.startTime)}ms · 耗时${Math.round(
          e.duration
        )}ms · ${kb}`;
        cacheHit = entries.length >= 2 && (entries[entries.length - 1].transferSize || 0) === 0;
        perf = {
          kb: e.transferSize ? (e.transferSize / 1024).toFixed(1) + "KB" : "0KB（缓存）",
          decoded: e.decodedBodySize ? (e.decodedBodySize / 1024).toFixed(1) + "KB" : "—",
          duration: Math.round(e.duration),
        };
      }
    } catch {
      /* ignore */
    }
  }

  return {
    attrs: {
      loading: img?.getAttribute("loading") || "",
      fetchpriority: img?.getAttribute("fetchpriority") || "",
      decoding: img?.getAttribute("decoding") || "",
      crossorigin: img?.getAttribute("crossorigin") || "",
      referrerpolicy: img?.getAttribute("referrerpolicy") || "",
      srcset: img?.getAttribute("srcset") || "",
      sizes: img?.getAttribute("sizes") || "",
      role: img?.getAttribute("role") || "",
      aria: img ? ariaSummary(img) : "",
      itemprop: img?.getAttribute("itemprop") || "",
      alt: img?.getAttribute("alt") || "",
    },
    styles: {
      objectposition: cs ? norm(cs.objectPosition) : "",
      imgfilter: cs ? norm(cs.filter) : "",
      imgtransform: cs ? norm(cs.transform) : "",
      imgclip: cs ? norm((cs as any).clipPath) : "",
      imgblend: cs ? norm((cs as any).mixBlendMode) : "",
      imgtransition: cs ? norm(cs.transition) : "",
      imganimation: cs ? norm(cs.animationName) : "",
      imgradius: cs ? norm(cs.borderRadius) : "",
      // 只看「插件写进内联样式」的 image-orientation：from-image 本就是现代浏览器的计算默认值，
      // 用计算值无法区分是否由插件注入。
      imgorientation: img ? norm((img.style as any).imageOrientation) : "",
      bg: bs ? norm(bs.backgroundImage !== "none" ? bs.backgroundImage : bs.backgroundColor) : "",
      ratio: pick((c) => (c as any).aspectRatio, ["auto", ""]),
      shadow: pick((c) => c.boxShadow, ["none", ""]),
      boxfilter: pick((c) => c.filter, ["none", ""]),
      boxtransform: pick((c) => c.transform, ["none", ""]),
      boxtransition: pick((c) => c.transition, ["all", ""]),
      boxanimation: pick((c) => c.animationName, ["none", ""]),
    },
    overlays: { count: overlays.length, text: overlayText },
    links,
    metaTags,
    timing,
    perf,
    lcp: LCP_MS,
    lcpTag: LCP_TAG,
    cacheHit,
    baselineAlt,
    expectSrc,
    src,
    ok: !!img && img.naturalWidth > 0,
    failed: !!img && img.complete && img.naturalWidth === 0,
    logs: { count: Math.max(0, LOG_COUNT - logBase), last: LOG_BUF.slice(-2) },
  };
}

type Snap = ReturnType<typeof readSnapshot> | null;

function buildRows(s: Snap): Row[] {
  if (!s) return [];
  const rows: Row[] = [];
  const push = (key: string, label: string, value: string, signal?: boolean) =>
    rows.push({
      key,
      label,
      value: value || "—",
      signal: signal === undefined ? norm(value) !== norm(BASE[key]) && norm(value) !== "" : signal,
    });

  const srcChanged = !!s.src && norm(s.src) !== norm(s.expectSrc);
  push("src", "请求 URL", shortUrl(s.src), srcChanged);
  push("loading", "loading", s.attrs.loading);
  push("fetchpriority", "fetchpriority", s.attrs.fetchpriority);
  push("decoding", "decoding", s.attrs.decoding);
  push("crossorigin", "crossorigin", s.attrs.crossorigin);
  push("referrerpolicy", "referrerpolicy", s.attrs.referrerpolicy);
  push(
    "srcset",
    "srcset",
    s.attrs.srcset ? `${s.attrs.srcset.split(",").length} 个候选` : "",
    !!s.attrs.srcset
  );
  push("sizes", "sizes", s.attrs.sizes);
  push("role", "role", s.attrs.role);
  push("aria", "aria-*", s.attrs.aria);
  push("itemprop", "itemprop", s.attrs.itemprop);
  push(
    "alt",
    "alt",
    s.attrs.alt && s.attrs.alt !== s.baselineAlt ? `“${s.attrs.alt}”` : "",
    !!s.attrs.alt && s.attrs.alt !== s.baselineAlt
  );
  push("objectposition", "object-position", s.styles.objectposition === "50% 50%" ? "" : s.styles.objectposition);
  push("imgfilter", "img filter", s.styles.imgfilter === "none" ? "" : s.styles.imgfilter);
  push("imgtransform", "img transform", s.styles.imgtransform === "none" ? "" : s.styles.imgtransform);
  push("imgclip", "clip-path", s.styles.imgclip);
  push("imgblend", "blend-mode", s.styles.imgblend === "normal" ? "" : s.styles.imgblend);
  push("bg", "容器背景", s.styles.bg, !!s.styles.bg && BGS.indexOf(norm(s.styles.bg)) === -1);
  push("ratio", "容器 aspect-ratio", s.styles.ratio === "auto" ? "" : s.styles.ratio);
  push("shadow", "容器 box-shadow", s.styles.shadow);
  push("boxfilter", "容器 filter", s.styles.boxfilter);
  push("boxtransform", "容器 transform", s.styles.boxtransform);
  push("imgradius", "图片圆角", s.styles.imgradius === "0px" ? "" : s.styles.imgradius);
  push("boxtransition", "包裹层 transition", s.styles.boxtransition);
  push("boxanimation", "包裹层 animation", s.styles.boxanimation);
  push("imgtransition", "img transition", s.styles.imgtransition === norm(BASE.imgtransition) ? "" : s.styles.imgtransition);
  push("imganimation", "img animation", s.styles.imganimation === "none" ? "" : s.styles.imganimation);
  push("imgorientation", "image-orientation", s.styles.imgorientation);
  push("animhist", "动画/过渡历史", ANIM_HIST.slice().reverse().join(" | "), ANIM_HIST.length > 0);
  push(
    "overlays",
    "叠加层",
    s.overlays.count ? `${s.overlays.count} 个${s.overlays.text ? `：${s.overlays.text}` : ""}` : "",
    s.overlays.count > 0
  );
  push("links", "注入 <link>", s.links.join(" | "), s.links.length > 0);
  if (s.metaTags) push("meta", "注入 <meta>/JSON-LD", `${s.metaTags} 条`, true);
  push("logs", "插件日志", s.logs.count ? `${s.logs.count} 条：${s.logs.last[0] || ""}` : "", s.logs.count > 0);
  // 下面两行是「测量」而不是「插件作用」，永远不标 ●：用于把性能类收益量化到具体数字
  push(
    "transfer",
    "传输 / 解码",
    s.perf ? `${s.perf.kb} · 解码 ${s.perf.decoded} · 耗时 ${s.perf.duration}ms` : "",
    false
  );
  push("lcp", "LCP", s.lcp ? `${s.lcp}ms${s.lcpTag ? `（${s.lcpTag}）` : ""}` : "", false);
  return rows;
}

function cacheSignal(s: Snap): Row | null {
  if (!s || !s.src) return null;
  return {
    key: "cache",
    label: "重复请求",
    value: s.cacheHit ? "命中缓存（第二次 0 字节）" : s.timing !== "-" ? "未命中（回源）" : "无请求记录",
    signal: s.cacheHit,
  };
}

const ENV_HINTS: Record<string, string> = {
  auth: "需带鉴权头请求：观察「请求 URL」与 Network 的 Authorization",
  "anti-hotlink": "需外站 Referer / 不同域场景",
  "cdn-fallback": "需主域 404/超时：勾选「使用失效 URL」",
  "concurrency-control": "需多图并发：单图不会触发排队，可开 debug 看门控日志",
  "memory-pressure-abort": "需 deviceMemory≤4 或 saveData：面板「低电量/弱网」会一并降低内存档位",
  "network-analytics": "需 Network Information API：面板「弱网」",
  "data-saver": "需 saveData=true：面板「弱网」",
  "adaptive-quality": "需弱网/省流量：面板「弱网」",
  "battery-aware": "需低电量：面板「低电量」",
  offline: "需断网：面板「离线」",
  "scroll-idle": "需滚动空闲窗口，观察首图请求时机",
  "viewport-debounce": "需频繁滚动，观察请求次数",
  "viewport-dwell": "需在视口内驻留，观察请求时机",
  "hover-prefetch": "需鼠标悬停，观察是否提前发起请求",
  "event-logger": "事件写到控制台，面板「插件日志」行实时计数",
};

type EnvKey = keyof EnvState;

export const PluginObserver: React.FC<{
  stageRef: React.RefObject<HTMLDivElement>;
  pluginId: string;
  baselineAlt: string;
  expectSrc: string;
  onRetryCache?: () => void;
}> = ({ stageRef, pluginId, baselineAlt, expectSrc, onRetryCache }) => {
  const [snap, setSnap] = React.useState<Snap>(null);
  const [tick, setTick] = React.useState(0);
  // 环境状态放在模块级 store：预览区的「一键演示」按钮与这里的勾选框共用同一份，
  // 否则点了演示按钮勾选框不会同步，验收人以为没生效
  const env = React.useSyncExternalStore(subscribeEnv, getEnvState, getEnvState);
  const logBaseRef = React.useRef(LOG_COUNT);

  React.useEffect(() => {
    patchConsole();
    startLcpObserver();
  }, []);

  // 环境一变就立刻重采一次快照（不等 600ms 的轮询）
  React.useEffect(() => {
    setTick((v) => v + 1);
  }, [env]);

  React.useEffect(() => {
    logBaseRef.current = LOG_COUNT;
  }, [pluginId]);

  // 高频采样：插件切换后 4 秒内每 80ms 记一次 animation / transition
  React.useEffect(() => {
    ANIM_HIST.length = 0;
    let n = 0;
    const t = window.setInterval(() => {
      const img = stageRef.current?.querySelector("img") as HTMLImageElement | null;
      if (img) {
        const cs = getComputedStyle(img);
        const an = norm(cs.animationName);
        if (an && an !== "none") pushAnim(`animation:${an} ${norm(cs.animationDuration)}`);
        const tr = norm(cs.transition);
        if (tr && tr !== norm(BASE.imgtransition)) pushAnim(`transition:${tr}`);
        const orient = norm((img.style as any).imageOrientation);
        if (orient) pushAnim(`image-orientation:${orient}`);
      }
      if (++n > 50) window.clearInterval(t);
    }, 80);
    return () => window.clearInterval(t);
  }, [pluginId, stageRef]);

  React.useEffect(() => {
    let alive = true;
    const read = () => {
      if (!alive) return;
      try {
        setSnap(readSnapshot(stageRef.current, baselineAlt, expectSrc, logBaseRef.current));
      } catch {
        /* ignore */
      }
    };
    read();
    const t = window.setInterval(read, 600);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [stageRef, baselineAlt, expectSrc, tick]);

  // 环境模拟：立即生效 + 持久化（部分插件在挂载期读环境，刷新后仍保持）
  // 写入统一走 setEnvState，它会 apply 到 navigator 并通知订阅者

  const rows = React.useMemo(() => {
    const base = buildRows(snap);
    const cs = cacheSignal(snap);
    return cs ? [...base, cs] : base;
  }, [snap]);

  const signals = rows.filter((r) => r.signal);
  const envHint = ENV_HINTS[pluginId];
  const envOn = env.offline || env.slow || env.battery;

  return (
    <div
      className="observer-panel"
      data-signals={signals.length}
      data-summary={signals.map((s) => `${s.label}=${s.value}`).join(" ; ").slice(0, 300)}
    >
      <div className="observer-head">
        <span className="observer-title">能力观察台</span>
        <span className={`observer-badge ${signals.length ? "on" : "off"}`}>
          {signals.length ? `捕获 ${signals.length} 项插件作用` : "未捕获到插件作用"}
        </span>
        <span className="observer-meta">
          {snap?.failed ? "图片加载失败" : snap?.ok ? "图片已加载" : "图片加载中"}
          {snap?.timing && snap.timing !== "-" ? ` · ${snap.timing}` : ""}
        </span>
        <span className="observer-actions">
          <button className="btn btn-mini" onClick={() => setTick((v) => v + 1)}>
            刷新
          </button>
          {onRetryCache && (
            <button className="btn btn-mini" onClick={onRetryCache}>
              二次加载测缓存
            </button>
          )}
        </span>
      </div>

      <div className="observer-rows">
        {rows.map((r) => (
          <div className={`observer-row ${r.signal ? "signal" : ""}`} key={r.key}>
            <span className="observer-key">
              <i className="observer-dot" />
              {r.label}
            </span>
            <span className="observer-val" title={r.value}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <div className="observer-foot">
        <span className="observer-note">
          基线＝无插件时 <code>LazyLoadImageCore</code> 的取值；<b>●</b> 表示该行被插件改写。
        </span>
        <span className="observer-env" data-env={envOn ? "on" : "off"}>
          环境模拟：
          {(
            [
              ["offline", "离线"],
              ["slow", "弱网/省流量"],
              ["battery", "低电量"],
            ] as Array<[EnvKey, string]>
          ).map(([k, label]) => (
            <label className="observer-env-item" key={k}>
              <input
                type="checkbox"
                data-env={k}
                checked={!!env[k]}
                onChange={(e) =>
                  setEnvState({ ...env, [k]: e.target.checked } as EnvState)
                }
              />
              {label}
            </label>
          ))}
          <button
            className="btn btn-mini"
            onClick={() => setEnvState({ offline: false, slow: false, battery: false })}
          >
            还原
          </button>
        </span>
      </div>
      {envHint && <div className="observer-hint">验收条件：{envHint}</div>}
    </div>
  );
};
