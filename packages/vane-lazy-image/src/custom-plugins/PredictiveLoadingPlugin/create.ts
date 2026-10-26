import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface PredictiveLoadingPluginConfig {
  /**
   * 预测模型：
   * - "heuristic"（默认）：内置启发式，按 URL 末尾的数字段派生「下一张」候选并预取；
   * - "ml"：当前同样走启发式（真正的模型需由宿主传入 predict 提供）。
   */
  model?: "heuristic" | "ml";
  /** 递增还是递减派生（默认 increment） */
  strategy?: "increment" | "decrement";
  /** 自定义预测：返回需要预加载的链接列表，优先级高于内置启发式 */
  predict?: (context: LazyImageContext) => string[] | Promise<string[]>;
  /** 单次最多预取数量 */
  maxPreload?: number;
  as?: "image" | "fetch";
  crossOrigin?: "anonymous" | "use-credentials" | null;
}

function addPreload(
  href: string,
  as: "image" | "fetch",
  crossOrigin: "anonymous" | "use-credentials" | null = "anonymous"
) {
  if (typeof document === "undefined") return;
  try {
    const id = `lli-preload-${as}-${href}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "preload";
    link.setAttribute("as", as);
    link.href = href;
    if (crossOrigin) {
      link.setAttribute("crossorigin", crossOrigin);
    }
    document.head.appendChild(link);
  } catch {
    // 忽略 DOM 错误
  }
}

/** 内置启发式：找到 URL 中最后一个连续数字段，按 strategy 增减派生候选 */
function heuristicNext(src: string, strategy: "increment" | "decrement", count: number): string[] {
  const out: string[] = [];
  const m = src.match(/(\d+)(?=[^\d]*$)/) || src.match(/(\d+)(?=[^\d]*[)\s]?$)/);
  if (!m) return out;
  const full = m[0];
  let n = parseInt(full, 10);
  if (Number.isNaN(n)) return out;
  const pad = full.length;
  for (let i = 1; i <= count; i++) {
    n = strategy === "increment" ? n + i : n - i;
    if (n < 0) break;
    const next = src.replace(full, String(n).padStart(pad, "0"));
    if (next !== src) out.push(next);
  }
  return out;
}

export function createPredictiveLoadingPlugin(
  config: PredictiveLoadingPluginConfig = {}
): LazyImagePlugin {
  const {
    model = "heuristic",
    strategy = "increment",
    predict,
    maxPreload = 3,
    as = "image",
    crossOrigin = "anonymous",
  } = config;

  return {
    name: "predictive-loading",
    version: "2.0.0",
    config,
    hooks: {
      onMount: (context: LazyImageContext) => {
        try {
          const runPredict = predict
            ? Promise.resolve(predict(context))
            : Promise.resolve(
                heuristicNext(context.src, strategy, maxPreload)
              );
          runPredict
            .then((candidates) => {
              const list = Array.isArray(candidates) ? candidates.slice(0, maxPreload) : [];
              list.forEach((href) => addPreload(href, as, crossOrigin));
            })
            .catch(() => {
              // 忽略预测错误
            });
        } catch {
          // 忽略预测错误
        }
      },
    },
  };
}
