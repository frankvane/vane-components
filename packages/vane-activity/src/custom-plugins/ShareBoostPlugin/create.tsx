import type { PluginCreator, PluginDoc } from "vane-plugin-core";
import type {
  ActivityPluginConfigBase,
  ActivityPluginContext,
} from "../../components/ActivityPlugin/plugins/types";
import { ShareBoostBar } from "./internal";
import doc from "./doc.json";

export interface ShareBoostPluginConfig extends ActivityPluginConfigBase {
  /** 标题（默认「邀请好友助力」） */
  title?: string;
  /** 未传 data.share 时的默认总次数（默认 3） */
  total?: number;
  /** 未传 data.share 时的默认已用次数（默认 0） */
  used?: number;
  /** 点「邀请助力」回调；传了则由业务侧回写 data.share.used，不传则组件内乐观自增 */
  onInvite?: () => void;
  /** 头像最多显示几个（默认 5），超出折叠为 +N */
  maxAvatars?: number;
}

/**
 * ShareBoostPlugin - 好友助力：分段名额 + 助力头像堆 + 「还差 N 人」+ 邀请按钮。
 *
 * 数据来自 data.share（total / used / helpers）；不传时回退 config 的 total / used，
 * 便于单独演示。传入 onInvite 时由业务侧回写 data.share.used 驱动，不传则组件内
 * 乐观自增（无后端场景）。
 */
export const createShareBoostPlugin: PluginCreator<ShareBoostPluginConfig> = (
  config = {}
) => {
  const {
    title = "邀请好友助力",
    total = 3,
    used = 0,
    onInvite,
    maxAvatars = 5,
  } = config;

  return {
    name: "ShareBoostPlugin",
    version: "0.1.0",
    description: doc.description,
    priority: 20,
    config,
    hooks: {
      renderFooter: (context: ActivityPluginContext) => (
        <ShareBoostBar
          ctx={context}
          title={title}
          total={total}
          used={used}
          onInvite={onInvite}
          maxAvatars={maxAvatars}
        />
      ),
    },
  };
};

createShareBoostPlugin.meta = doc as PluginDoc;
