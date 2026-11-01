import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
  DanmakuRenderHint,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface KeywordHighlightConfig {
  /** 要高亮的词（命中处用 color 着色，其余保持原色） */
  keywords?: string[];
  /** 高亮色，默认 "#ff7a29" */
  color?: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 把命中词拆成彩色分段（其余段无 color，沿用整条配色） */
function buildRich(
  text: string,
  keywords: string[],
  color: string
): DanmakuRenderHint {
  if (keywords.length === 0) return {};
  const re = new RegExp(`(${keywords.map(escapeRegExp).join("|")})`, "gi");
  const segments: { text: string; color?: string }[] = [];
  let last = 0;
  let matched = false;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) segments.push({ text: text.slice(last, start) });
    segments.push({ text: m[0], color });
    last = start + m[0].length;
    matched = true;
  }
  if (!matched) return {};
  if (last < text.length) segments.push({ text: text.slice(last) });
  return { rich: segments };
}

/**
 * KeywordHighlightPlugin —— 关键词高亮（数据面）。
 * 命中 keywords 的片段写入 renderHint.rich（带 color），由内核按段着色；
 * 未命中的弹幕不改写。数据面只写数据，绝不直绘 canvas。
 */
export function createKeywordHighlightPlugin(
  config: KeywordHighlightConfig = {}
): DanmakuPlugin {
  const keywords = config.keywords ?? [];
  const color = config.color ?? "#ff7a29";

  return {
    name: "keyword-highlight",
    version: "0.1.0",
    description: doc.description,
    priority: 16,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        if (keywords.length === 0) return data;
        const items = data.items.map((it) => {
          if (it.renderHint?.rich) return it;
          const hint = buildRich(it.text, keywords, color);
          return hint.rich ? { ...it, renderHint: { ...it.renderHint, ...hint } } : it;
        });
        return { ...data, items };
      },
    },
  };
}

createKeywordHighlightPlugin.meta = doc as PluginDoc;
