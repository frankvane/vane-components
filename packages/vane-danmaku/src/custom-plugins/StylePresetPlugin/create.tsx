import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface StylePresetConfig {
  /** 字体族（覆盖，渲染器优先采用），默认 "system-ui, sans-serif" */
  fontFamily?: string;
  /** 字重，默认 400 */
  fontWeight?: number;
  /** 基础字号（仅当单条未指定时生效），默认 22 */
  fontSize?: number;
}

/**
 * StylePresetPlugin —— 统一样式预设（数据面）。
 * 为未显式指定样式的弹幕补齐 fontFamily / fontWeight / fontSize 默认，
 * 让整场弹幕风格统一；已带 meta 样式的弹幕不被覆盖。
 */
export function createStylePresetPlugin(
  config: StylePresetConfig = {}
): DanmakuPlugin {
  const fontFamily =
    config.fontFamily ?? 'system-ui, -apple-system, "PingFang SC", sans-serif';
  const fontWeight = config.fontWeight ?? 400;
  const fontSize = config.fontSize ?? 22;

  return {
    name: "style-preset",
    version: "0.1.0",
    description: doc.description,
    priority: 24,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const items = data.items.map((it) => {
          const meta = { ...it.meta };
          if (!meta.fontFamily) meta.fontFamily = fontFamily;
          if (!meta.fontWeight) meta.fontWeight = fontWeight;
          if (!meta.fontSize) meta.fontSize = fontSize;
          return { ...it, meta };
        });
        return { ...data, items };
      },
    },
  };
}

createStylePresetPlugin.meta = doc as PluginDoc;
