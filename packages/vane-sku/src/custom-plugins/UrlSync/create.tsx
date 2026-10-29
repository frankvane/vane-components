import type {
  SkuPlugin,
  SkuPluginContext,
  SkuSelection,
} from "../../components/SkuPlugin/plugins/types";

/**
 * UrlSyncPlugin — 选择同步到 URL。
 *
 * 「把这个链接发给客服，他看到的就是我选的规格」——把选择写进查询串。
 * 挂载时反向解析回选择，刷新/分享都能还原。
 *
 * 查询键用前缀（默认 sku_）避免和页面其它参数打架：
 *   ?sku_颜色=red&sku_尺码=s
 *
 * meta 在同目录 index.ts 挂载。
 */
export interface UrlSyncConfig {
  /** 查询参数前缀，默认 "sku_" */
  paramPrefix?: string;
  /** true=replaceState（不污染前进后退），false=pushState */
  useReplace?: boolean;
}

export function createUrlSyncPlugin(config: UrlSyncConfig = {}): SkuPlugin {
  const prefix = config.paramPrefix ?? "sku_";
  const useReplace = config.useReplace ?? true;

  const readSelection = (): SkuSelection => {
    if (typeof window === "undefined") return {};
    const q = new URLSearchParams(window.location.search);
    const sel: SkuSelection = {};
    for (const [k, v] of q.entries()) {
      if (k.startsWith(prefix)) sel[k.slice(prefix.length)] = v;
    }
    return sel;
  };

  const writeSelection = (selection: SkuSelection) => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    for (const k of Array.from(q.keys())) {
      if (k.startsWith(prefix)) q.delete(k);
    }
    for (const [k, v] of Object.entries(selection)) q.set(prefix + k, v);
    const search = q.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    if (useReplace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  };

  return {
    name: "UrlSync",
    version: "0.1.0",
    description: "URL 同步：把规格选择写进查询串，并可从 URL 还原",
    priority: 28,
    config,
    hooks: {
      onMount: (context: SkuPluginContext) => {
        const sel = readSelection();
        if (Object.keys(sel).length) context.setState({ selection: sel });
      },
      onSkuChange: (
        _context: SkuPluginContext,
        selection: SkuSelection
      ) => {
        writeSelection(selection);
      },
    },
  };
}
