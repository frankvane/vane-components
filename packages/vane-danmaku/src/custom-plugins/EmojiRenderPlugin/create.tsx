import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface EmojiRenderConfig {
  /** 短码 -> unicode 表情的映射；缺省用内置常用表 */
  map?: Record<string, string>;
}

const BUILTIN: Record<string, string> = {
  smile: "😄",
  heart: "❤️",
  fire: "🔥",
  rocket: "🚀",
  star: "⭐",
  clap: "👏",
  cry: "😭",
  laugh: "😂",
  gift: "🎁",
  thumbsup: "👍",
};

/**
 * EmojiRenderPlugin —— 表情短码转义（数据面）。
 * 把文本中的 `:shortcode:` 形式（如 `:rocket:`）替换为 unicode 表情，
 * 由内核按普通文字绘制（canvas 原生支持 emoji）。不改写已无短码的文本。
 */
export function createEmojiRenderPlugin(
  config: EmojiRenderConfig = {}
): DanmakuPlugin {
  const map = { ...BUILTIN, ...(config.map ?? {}) };
  const names = Object.keys(map);
  const re = names.length > 0 ? new RegExp(`:(${names.join("|")}):`, "g") : null;

  return {
    name: "emoji-render",
    version: "0.1.0",
    description: doc.description,
    priority: 19,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        if (!re) return data;
        const items = data.items.map((it) => {
          if (!re.test(it.text)) {
            re.lastIndex = 0;
            return it;
          }
          re.lastIndex = 0;
          const text = it.text.replace(re, (_m, k) => map[k] ?? `:${k}:`);
          re.lastIndex = 0;
          return { ...it, text };
        });
        return { ...data, items };
      },
    },
  };
}

createEmojiRenderPlugin.meta = doc as PluginDoc;
