import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
  DanmakuRenderHint,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface AtMentionConfig {
  /** @提及的着色，默认 "#4ea1ff" */
  color?: string;
  /** 自定义提及正则（需捕获整段被提及文本），默认匹配 @ + 中文/英文/数字 */
  pattern?: string;
}

const DEFAULT_PATTERN = "@[\\w\\u4e00-\\u9fa5]+";

/** 把 @提及 段着色（其余段沿用整条配色） */
function buildRich(
  text: string,
  re: RegExp,
  color: string
): DanmakuRenderHint {
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
 * AtMentionPlugin —— @提及高亮（数据面）。
 * 识别 `@用户名` 写入 renderHint.rich（带 color），内核按段着色；
 * 与 KeywordHighlight 共用分段着色机制，互不覆盖。
 */
export function createAtMentionPlugin(
  config: AtMentionConfig = {}
): DanmakuPlugin {
  const color = config.color ?? "#4ea1ff";
  const re = new RegExp(`(${config.pattern ?? DEFAULT_PATTERN})`, "g");

  return {
    name: "at-mention",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const items = data.items.map((it) => {
          if (it.renderHint?.rich) return it;
          const hint = buildRich(it.text, re, color);
          return hint.rich ? { ...it, renderHint: { ...it.renderHint, ...hint } } : it;
        });
        return { ...data, items };
      },
    },
  };
}

createAtMentionPlugin.meta = doc as PluginDoc;
