import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface ColorPolicyConfig {
  /** 管理员弹幕色，默认 "#ff4d4f"（红） */
  adminColor?: string;
  /** 高等级（>=vipLevel）弹幕色，默认 "#ffd54a"（金） */
  vipColor?: string;
  /** 触发 vip 着色的等级阈值，默认 18 */
  vipLevel?: number;
}

/**
 * ColorPolicyPlugin —— 角色配色策略（数据面，写 meta.color）。
 * 仅当单条未显式指定 color 时按角色着色：管理员红、高等级金，普通弹幕保持白。
 * 放在流水线靠后，避免覆盖业务插件的显式配色意图。
 */
export function createColorPolicyPlugin(
  config: ColorPolicyConfig = {}
): DanmakuPlugin {
  const adminColor = config.adminColor ?? "#ff4d4f";
  const vipColor = config.vipColor ?? "#ffd54a";
  const vipLevel = config.vipLevel ?? 18;

  return {
    name: "color-policy",
    version: "0.1.0",
    description: doc.description,
    priority: 27,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        const items = data.items.map((it) => {
          if (it.meta.color) return it;
          let color: string | undefined;
          if (it.meta.isAdmin) color = adminColor;
          else if ((it.meta.level ?? 0) >= vipLevel) color = vipColor;
          if (!color) return it;
          return { ...it, meta: { ...it.meta, color } };
        });
        return { ...data, items };
      },
    },
  };
}

createColorPolicyPlugin.meta = doc as PluginDoc;
