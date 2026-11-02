import type {
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface NestedScrollPluginConfig {
  /** 预留 */
  _?: never;
}

/**
 * 内容滚动联动拖拽：内容没滚回顶部时锁定拖拽（对齐 react-modal-sheet 的
 * disableDrag 函数式场景）。原理：监听内容区 scroll，写引擎共享态
 * sheetState.dragLock，内核 handlePointerDown 检查该锁。
 * priority 58（行为带）。
 */
export const createNestedScrollPlugin: ModalSheetPluginCreator<NestedScrollPluginConfig> = () => {
  return {
    name: "nested-scroll",
    version: "0.1.0",
    description: doc.description,
    config: {},
    priority: 58,
    hooks: {
      onMount: (ctx: ModalSheetPluginContext) => {
        const attach = () => {
          const panel = ctx.getPanel();
          const content = panel?.querySelector<HTMLElement>(".vc-ms-content");
          if (!content) return false;
          const onScroll = () => {
            if (ctx.props.sheetState) ctx.props.sheetState.dragLock = content.scrollTop > 0;
          };
          content.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
          return true;
        };
        // 面板首帧可能还没挂内容，下一帧再试一次
        if (!attach()) {
          const t = window.setTimeout(attach, 50);
          return () => window.clearTimeout(t);
        }
        return () => {
          if (ctx.props.sheetState) ctx.props.sheetState.dragLock = false;
        };
      },
    },
  };
};

createNestedScrollPlugin.meta = doc as import("vane-plugin-core").PluginDoc;
