import type {
  ModalSheetCoreProps,
  ModalSheetPluginContext,
  ModalSheetPluginCreator,
} from "../../components/ModalSheetPlugin/plugins/types";
import doc from "./doc.json";

export interface ResponsivePluginConfig {
  /** 判定为桌面态的断点 px（默认 768） */
  breakpoint?: number;
  /** 桌面态面板最大宽度（默认 560） */
  desktopWidth?: number;
  /** 桌面态额外内边距（底部圆角 + 悬浮间距） */
  inset?: number;
}

/**
 * 断点策略：窄屏保持 bottom sheet，宽屏变「居中悬浮弹窗」——限宽 + 四角圆角
 * + 悬浮间距。onMount 里监听 resize，跨断点时 forceUpdate 触发 transformProps
 * 重算。priority 62（行为带）。
 */
export const createResponsivePlugin: ModalSheetPluginCreator<ResponsivePluginConfig> = (
  config = {}
) => {
  const { breakpoint = 768, desktopWidth = 560, inset = 24 } = config;
  let desktop = false;

  const isDesktop = () =>
    typeof window !== "undefined" && window.innerWidth >= breakpoint;

  return {
    name: "responsive",
    version: "0.1.0",
    description: doc.description,
    config,
    priority: 62,
    hooks: {
      transformProps: (props: ModalSheetCoreProps) => {
        desktop = isDesktop();
        if (!desktop) return props;
        return {
          ...props,
          panelStyle: {
            ...props.panelStyle,
            maxWidth: desktopWidth,
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: "var(--vane-modal-sheet-radius, 16px)",
            bottom: inset,
          },
          containerStyle: {
            ...props.containerStyle,
            paddingLeft: inset,
            paddingRight: inset,
          },
        };
      },
      onMount: (ctx: ModalSheetPluginContext) => {
        const onResize = () => {
          if (isDesktop() !== desktop) ctx.forceUpdate();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
      },
    },
  };
};

createResponsivePlugin.meta = doc as import("vane-plugin-core").PluginDoc;
