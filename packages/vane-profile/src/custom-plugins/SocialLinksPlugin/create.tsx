import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import { safeHref } from "../../components/ProfilePlugin/plugins/safe-url";

export interface SocialLink {
  /** 平台标识（决定默认文案与图标字），如 weibo / github / email / site */
  platform: string;
  /** 跳转地址 */
  href: string;
  /** 覆盖默认展示文案 */
  label?: string;
  /** 覆盖默认图标字（单字/双字，无图片资源时用作占位） */
  glyph?: string;
}

export interface SocialLinksConfig {
  /** 外链列表 */
  links: SocialLink[];
  /** 是否显示文案（仅图标字时为 false） */
  showLabel?: boolean;
  /** 整组对齐，默认左对齐 */
  align?: "left" | "center" | "right";
}

/** 常见平台的默认图标字与文案（不依赖任何图片资源，离线可用） */
const PRESET: Record<string, { glyph: string; label: string }> = {
  weibo: { glyph: "微", label: "微博" },
  zhihu: { glyph: "知", label: "知乎" },
  github: { glyph: "GH", label: "GitHub" },
  email: { glyph: "@", label: "邮箱" },
  site: { glyph: "网", label: "官网" },
  youtube: { glyph: "YT", label: "YouTube" },
  bilibili: { glyph: "B", label: "B 站" },
  twitter: { glyph: "X", label: "X" },
  douyin: { glyph: "抖", label: "抖音" },
  wechat: { glyph: "微", label: "微信" },
};

/**
 * SocialLinks - 社交外链行：一排可点击的平台入口。
 *
 * 走领域槽 `renderBioArea`（与 BioSlot / TagList 同区，按 priority 串联）。
 * 图标用单/双字占位（无图片资源），链接新窗口打开并带 rel 防钓鱼。
 */
// 泛型默认值 unknown：T 仅出现在入参位（逆变安全），不写 T 的调用方不受影响。
export function createSocialLinksPlugin<T = unknown>(
  config: SocialLinksConfig = { links: [] }
): ProfilePlugin<T> {
  const { links, showLabel = true, align = "left" } = config;
  return {
    name: "SocialLinks",
    version: "0.1.0",
    description: "社交外链行：一排可点击的平台入口（微博 / 知乎 / GitHub …）。",
    priority: 12,
    enabled: true,
    hooks: {
      renderBioArea: (_context: ProfilePluginContext<T>) => {
        if (!links.length) return null;
        return (
          <div
            className="vp-social"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent:
                align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
            }}
          >
            {links.map((link, i) => {
              const preset = PRESET[link.platform] ?? { glyph: "·", label: link.platform };
              const glyph = link.glyph ?? preset.glyph;
              const label = link.label ?? preset.label;
              const href = safeHref(link.href);
              const style: React.CSSProperties = {
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(125,130,140,0.35)",
                color: "inherit",
                textDecoration: "none",
                fontSize: 13,
              };
              const inner = (
                <>
                  <span
                    aria-hidden
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#1a5fd0",
                      color: "#fff",
                      fontSize: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 auto",
                    }}
                  >
                    {glyph}
                  </span>
                  {showLabel ? <span>{label}</span> : null}
                </>
              );
              // 协议不在白名单（javascript: / data: / 自定义 scheme）时降级为纯文本，
              // 绝不把用户可编辑的字符串直接交给 href。
              return href ? (
                <a
                  key={i}
                  className="vp-social-item"
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={style}
                >
                  {inner}
                </a>
              ) : (
                <span key={i} className="vp-social-item" style={{ ...style, cursor: "default" }}>
                  {inner}
                </span>
              );
            })}
          </div>
        );
      },
    },
  };
}
