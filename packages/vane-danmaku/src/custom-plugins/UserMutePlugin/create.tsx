import type {
  DanmakuData,
  DanmakuPlugin,
  DanmakuPluginContext,
} from "../../components/DanmakuPlugin/plugins/types";
import type { PluginDoc } from "vane-plugin-core";
import doc from "./doc.json";

export interface UserMuteConfig {
  /** 被禁言（静音）的用户 id 列表 */
  users?: string[];
  /** 管理员即便在列表中也不静音，默认 true */
  allowAdmins?: boolean;
}

/**
 * UserMutePlugin —— 用户静音（数据面）。
 * users 中的用户弹幕被删除（其粉丝牌 / 高赞置顶等后续插件也不再处理）。
 * allowAdmins=true 时管理员豁免，避免误伤房管。
 */
export function createUserMutePlugin(
  config: UserMuteConfig = {}
): DanmakuPlugin {
  const set = new Set(config.users ?? []);
  const allowAdmins = config.allowAdmins ?? true;

  return {
    name: "user-mute",
    version: "0.1.0",
    description: doc.description,
    priority: 18,
    enabled: true,
    hooks: {
      transformData: (
        _context: DanmakuPluginContext,
        data: DanmakuData
      ): DanmakuData => {
        if (set.size === 0) return data;
        const items = data.items.filter((it) => {
          const uid = it.meta.userId;
          if (!uid || !set.has(uid)) return true;
          if (allowAdmins && it.meta.isAdmin) return true;
          return false;
        });
        return { ...data, items };
      },
    },
  };
}

createUserMutePlugin.meta = doc as PluginDoc;
