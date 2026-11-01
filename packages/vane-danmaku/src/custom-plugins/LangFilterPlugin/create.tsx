import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export type ScriptKind = "cjk" | "latin" | "symbol";

export interface LangFilterConfig {
  /** 允许的字符体系；弹幕须至少命中其一才保留，默认 ["cjk","latin"] */
  allow?: ScriptKind[];
  /** 纯符号/无字母数字（无命中任何 allow）是否直接丢弃，默认 true */
  blockUnknown?: boolean;
}

function detect(text: string): Set<ScriptKind> {
  const found = new Set<ScriptKind>();
  if (/[一-鿿]/.test(text)) found.add("cjk");
  if (/[a-zA-Z]/.test(text)) found.add("latin");
  if (/[^一-鿿a-zA-Z0-9\s]/.test(text)) found.add("symbol");
  return found;
}

/**
 * LangFilterPlugin —— 语种过滤（数据面）。
 * 按字符体系放行：弹幕须至少命中 allow 中的一种才保留；
 * blockUnknown=true 时无任何 allow 命中的纯符号刷屏直接丢弃。
 */
export function createLangFilterPlugin(
  config: LangFilterConfig = {}
): DanmakuPlugin {
  const allow = config.allow ?? ["cjk", "latin"];
  const blockUnknown = config.blockUnknown ?? true;

  return {
    name: "lang-filter",
    version: "0.1.0",
    description: doc.description,
    priority: 22,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const items = data.items.filter((it) => {
          const found = detect(it.text);
          const ok = allow.some((s) => found.has(s));
          if (ok) return true;
          return !blockUnknown;
        });
        return { ...data, items };
      },
    },
  };
}

createLangFilterPlugin.meta = doc as PluginDoc;
