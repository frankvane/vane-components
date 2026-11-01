import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
  DanmakuItem,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface SensitiveFilterConfig {
  /** 敏感词列表（子串匹配） */
  words?: string[];
  /** 打码字符，默认 "*" */
  mask?: string;
  /** mask=打码保留该条；hide=直接删除整条 */
  mode?: "mask" | "hide";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * SensitiveFilterPlugin —— 敏感词过滤（数据面）。
 * transformData 阶段处理：命中词按 mode 打码或删除；打码条标记 renderHint.masked，
 * 由 canvas 内核照常绘制（保留弹幕流连续性，避免闪烁）。
 */
export function createSensitiveFilterPlugin(
  config: SensitiveFilterConfig = {}
): DanmakuPlugin {
  const words = config.words ?? [];
  const mask = config.mask ?? "*";
  const mode = config.mode ?? "mask";
  const regex =
    words.length > 0
      ? new RegExp(`(${words.map(escapeRegExp).join("|")})`, "g")
      : null;

  return {
    name: "sensitive-filter",
    version: "0.1.0",
    description: doc.description,
    priority: 10,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        if (!regex) return data;
        const items: DanmakuItem[] = [];
        for (const it of data.items) {
          if (mode === "hide" && regex.test(it.text)) {
            regex.lastIndex = 0;
            continue;
          }
          const newText = it.text.replace(regex, (m) => mask.repeat(m.length));
          regex.lastIndex = 0;
          const masked = newText !== it.text;
          items.push(
            masked
              ? {
                  ...it,
                  text: newText,
                  renderHint: { ...it.renderHint, masked: true },
                }
              : it
          );
        }
        return { ...data, items };
      },
    },
  };
}

createSensitiveFilterPlugin.meta = doc as PluginDoc;
