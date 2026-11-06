import type React from "react";
import type {
  ProfilePlugin,
  ProfilePluginContext,
} from "../../components/ProfilePlugin/plugins/types";
import { safeHref } from "../../components/ProfilePlugin/plugins/safe-url";

export interface ContactCardConfig {
  /** 邮箱（渲染为 mailto: 链接） */
  email?: string;
  /** 电话（渲染为 tel: 链接） */
  phone?: string;
  /** 官网（渲染为 http(s) 外链，带 rel 防钓鱼） */
  site?: string;
  /** 地址（纯文本，不渲染为链接） */
  address?: string;
  /** 是否显示左侧图标字 */
  showIcon?: boolean;
}

interface Row {
  glyph: string;
  text: string;
  href?: string;
  external?: boolean;
}

/**
 * ContactCard - 联系信息卡：邮箱 / 电话 / 官网 / 地址。
 *
 * 走领域槽 `renderBioArea`（与 BioSlot / SocialLinks / TagList 同区，按 priority 串联）。
 * 全部为空时不渲染。外链一律带 `rel="noreferrer noopener"`，电话 / 邮箱走 tel:/mailto:。
 */
// 泛型默认值 unknown：T 仅出现在入参位（逆变安全），不写 T 的调用方不受影响。
export function createContactCardPlugin<T = unknown>(
  config: ContactCardConfig = {}
): ProfilePlugin<T> {
  const { email, phone, site, address, showIcon = true } = config;
  const rows: Row[] = [];
  // href 一律过协议白名单；不合法（javascript: / data: / 裸域名等）时降级为纯文本
  if (email) rows.push({ glyph: "@", text: email, href: safeHref(`mailto:${email}`) });
  if (phone) rows.push({ glyph: "☎", text: phone, href: safeHref(`tel:${phone}`) });
  if (site) {
    const siteHref = safeHref(site);
    rows.push({
      glyph: "网",
      text: site.replace(/^https?:\/\//, ""),
      href: siteHref,
      external: !!siteHref,
    });
  }
  if (address) rows.push({ glyph: "📍", text: address });

  return {
    name: "ContactCard",
    version: "0.1.0",
    description: "联系信息卡：邮箱 / 电话 / 官网 / 地址，安全链接。",
    priority: 12,
    enabled: true,
    hooks: {
      renderBioArea: (_context: ProfilePluginContext<T>) => {
        if (!rows.length) return null;
        return (
          <div
            className="vp-contact"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 16px",
              fontSize: 13,
              color: "inherit",
            }}
          >
            {rows.map((r, i) => {
              const inner = (
                <>
                  {showIcon && (
                    <span aria-hidden style={{ opacity: 0.7, marginRight: 4 }}>
                      {r.glyph}
                    </span>
                  )}
                  <span>{r.text}</span>
                </>
              );
              return r.href ? (
                <a
                  key={i}
                  href={r.href}
                  {...(r.external
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {inner}
                </a>
              ) : (
                <span key={i}>{inner}</span>
              );
            })}
          </div>
        );
      },
    },
  };
}
