import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import { cssImageUrl, safeImageUrl } from "../../components/ProfilePlugin/plugins/safe-url";
import { Avatar } from "./internal";

export interface BannerSlotConfig {
  /** 封面图 URL（与 gradient 二者至少其一；都无 / 非法则回退默认渐变） */
  cover?: string;
  /** 渐变起止色 [from, to]，无 cover 时用作背景 */
  gradient?: [string, string];
  /** 头像 URL（浮层在底部，与头图下缘重叠；非法协议视为无头像） */
  avatar?: string;
  /** 头像无障碍描述，默认「头像」 */
  avatarAlt?: string;
  /** 头像加载失败 / 未提供时的兜底内容，默认人形占位 */
  avatarFallback?: React.ReactNode;
  /** 头像直径（px），默认 64 */
  avatarSize?: number;
  /** 头像是否圆形，默认 true */
  avatarRound?: boolean;
  /** 头图区高度（px），默认 160 */
  height?: number;
  /** 叠加在头图上的自定义内容（昵称 / 标语等）；缺省时渲染 context.banner */
  overlay?: React.ReactNode;
}

/**
 * BannerSlot - 头图区：封面图 / 渐变背景 + 头像浮层 + 可选文案。
 *
 * 走领域槽 `renderBannerArea`（由 ProfileCore 的 `vp-banner-area` 消费）。
 * 头像以负 bottom 浮出头图下缘、与数据行区重叠，形成经典个人主页观感。
 * `overlay` 优先于 `context.banner`；两者皆无则不渲染叠加文案。
 * 头图 / 头像 URL 都来自用户可编辑资料，统一走协议白名单（http/https）。
 */
// 泛型默认值 unknown：T 仅出现在入参位（逆变安全），不写 T 的调用方不受影响。
export function createBannerSlotPlugin<T = unknown>(
  config: BannerSlotConfig = {}
): ProfilePlugin<T> {
  const {
    cover,
    gradient = ["#6a11cb", "#1a5fd0"],
    avatar,
    avatarAlt = "头像",
    avatarFallback,
    avatarSize = 64,
    avatarRound = true,
    height = 160,
    overlay,
  } = config;

  const coverUrl = cssImageUrl(cover);
  const avatarUrl = safeImageUrl(avatar);
  const background = coverUrl
    ? `${coverUrl} center/cover no-repeat`
    : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;

  return {
    name: "BannerSlot",
    version: "0.1.0",
    description:
      "头图区：封面图 / 渐变背景 + 头像浮层 + 昵称标语叠加。",
    priority: 10,
    enabled: true,
    hooks: {
      renderBannerArea: (context: ProfilePluginContext<T>) => (
        <div
          className="vp-banner"
          style={{
            position: "relative",
            height,
            background,
            backgroundSize: "cover",
            // 头像以负 bottom 浮出头图下缘，这里用等量 marginBottom 把下方数据行
            // 往下推，避免头像压住「关注/粉丝」等指标（经典主页观感但互不遮挡）。
            // 没有头像时不预留这段空白。
            marginBottom: avatarUrl ? avatarSize / 2 : 0,
          }}
        >
          {avatar?.trim() ? (
            <Avatar
              key={avatarUrl ?? "fallback"}
              src={avatarUrl}
              size={avatarSize}
              round={avatarRound}
              alt={avatarAlt}
              fallback={avatarFallback}
            />
          ) : null}
          {(overlay ?? context.banner) && (
            <div
              className="vp-banner-overlay"
              style={{
                position: "absolute",
                left: avatar ? 16 + avatarSize + 12 : 16,
                bottom: 16,
                color: "#fff",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {overlay ?? context.banner}
            </div>
          )}
        </div>
      ),
    },
  };
}
