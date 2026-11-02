import type {
  ModalSheetCoreProps,
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface KeepMountedPluginConfig {
  /** 预留 */
  _?: never;
}

/**
 * 关闭保活：关闭时记住内容区滚动位置，重新打开时恢复——重进弹层不再丢失
 * 阅读进度。priority 64（行为带）。
 */
export const createKeepMountedPlugin: ModalSheetPluginCreator<KeepMountedPluginConfig> = () => {
  const rememberedOf = (ctx: ModalSheetPluginContext) =>
    ctx.props.sheetState as { rememberedScrollTop?: number };

  return {
    name: "keep-mounted",
    version: "0.1.0",
    description: doc.description,
    config: {},
    priority: 64,
    hooks: {
      onClose: (ctx: ModalSheetPluginContext) => {
        const top = ctx
          .getPanel()
          ?.querySelector<HTMLElement>(".vc-ms-content")?.scrollTop;
        if (typeof top === "number") rememberedOf(ctx).rememberedScrollTop = top;
      },
      onPropsChange: (
        ctx: ModalSheetPluginContext,
        prev: ModalSheetCoreProps,
        next: ModalSheetCoreProps
      ) => {
        // 关闭 → 打开 的翻转，下一帧恢复滚动位置
        if (!prev.isOpen && next.isOpen) {
          const remembered = rememberedOf(ctx).rememberedScrollTop;
          if (remembered) {
            window.setTimeout(() => {
              const content = ctx
                .getPanel()
                ?.querySelector<HTMLElement>(".vc-ms-content");
              if (content) content.scrollTop = remembered;
            }, 50);
          }
        }
      },
    },
  };
};

createKeepMountedPlugin.meta = doc as import("vane-plugin-core").PluginDoc;
