import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import { safeHref } from "../../components/ProfilePlugin/plugins/safe-url";
import { QRSharePanel } from "./internal";

export interface QRShareConfig {
  /** 要分享的主页地址；缺省读 props.data?.homeUrl。两者都没有时不渲染按钮 */
  url?: string;
  /** 按钮文案，默认「分享」 */
  buttonLabel?: React.ReactNode;
  /** 二维码占位区边长（px），默认 96 */
  size?: number;
}

/**
 * QRShare - 主页二维码分享：浮于头图右上的「分享」按钮，点击展开二维码占位面板。
 *
 * 走领域槽 `renderBadgeArea`（与 VerifyBadge / MembershipBadge 同区横向并排）。
 * 二维码为装饰性点阵占位（不引第三方库），面板提供「复制链接」。
 * 分享地址取自 config.url ?? props.data.homeUrl，二者都无则不渲染——
 * 不再回退到示例站点默认值（避免接入方忘传 url 时把用户指向 vane.dev）。
 */
// 泛型默认值 unknown：T 仅出现在入参位（逆变安全），不写 T 的调用方不受影响。
export function createQRSharePlugin<T = unknown>(
  config: QRShareConfig = {}
): ProfilePlugin<T> {
  const { url, buttonLabel = "分享", size = 96 } = config;
  return {
    name: "QRShare",
    version: "0.1.0",
    description: "主页二维码分享：浮于头图右上的分享按钮，点击展开二维码与复制链接。",
    priority: 30,
    enabled: true,
    hooks: {
      renderBadgeArea: (context: ProfilePluginContext<T>) => {
        const homeUrl = (context.data as unknown as { homeUrl?: string } | undefined)
          ?.homeUrl;
        const resolved = safeHref(url ?? homeUrl);
        if (!resolved) return null;
        return <QRSharePanel url={resolved} buttonLabel={buttonLabel} size={size} />;
      },
    },
  };
}
