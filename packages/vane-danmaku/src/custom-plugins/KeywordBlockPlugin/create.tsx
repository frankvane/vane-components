import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface KeywordBlockConfig {
  /** 硬屏蔽词：命中即从渲染流删除（区别于 SensitiveFilter 的打码保留） */
  words?: string[];
  /** contains=包含即删；equals=整句相等才删，默认 "contains" */
  mode?: "contains" | "equals";
}

/**
 * KeywordBlockPlugin —— 关键词硬屏蔽（数据面）。
 * 与 SensitiveFilter 的「打码保留」不同，这里直接从弹幕流删除命中词，
 * 用于完全不想展示的违禁词 / 竞品词。命中判定：contains=子串，equals=整句。
 */
export function createKeywordBlockPlugin(
  config: KeywordBlockConfig = {}
): DanmakuPlugin {
  const words = config.words ?? [];
  const mode = config.mode ?? "contains";

  return {
    name: "keyword-block",
    version: "0.1.0",
    description: doc.description,
    priority: 17,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        if (words.length === 0) return data;
        const items = data.items.filter((it) => {
          if (mode === "equals") {
            return !words.some((w) => it.text.trim() === w);
          }
          return !words.some((w) => it.text.includes(w));
        });
        return { ...data, items };
      },
    },
  };
}

createKeywordBlockPlugin.meta = doc as PluginDoc;
