/**
 * URL 白名单工具（包内私有）。
 *
 * 主页资料里的社交链接 / 官网 / 头图 / 作品封面都是「用户可编辑内容」，
 * 直接交给 href 或 CSS url() 会把协议面暴露给消费方。这里统一收敛：
 *  - safeHref：仅放行 http / https / mailto / tel 与站内相对路径，其余返回 undefined；
 *  - safeImageUrl：仅放行 http / https 与站内相对路径（拒绝 data: 大体积 base64）；
 *  - cssImageUrl：在 safeImageUrl 之上再编码并加引号，避免 `)` 撑破 url() 声明。
 *
 * 返回 undefined 时由调用方降级为纯文本 / 默认占位，绝不把原串直出。
 */

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];
const IMAGE_PROTOCOLS = ["http:", "https:"];

/** 站内相对路径（/a、#a、?a）不涉及协议跳转，直接放行；协议相对 //evil.com 不放行 */
function isRelative(value: string): boolean {
  if (value.startsWith("//")) return false;
  return value.startsWith("/") || value.startsWith("#") || value.startsWith("?");
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * 校验可作为 href 的地址。
 * mailto: 只接受单个邮箱地址（拒绝 `?subject=&body=` 预置内容注入）；
 * tel: 只接受数字与常见分隔符。
 */
export function safeHref(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  if (isRelative(raw)) return raw;
  const url = parseUrl(raw);
  if (!url) return undefined;
  const protocol = url.protocol.toLowerCase();
  if (!ALLOWED_PROTOCOLS.includes(protocol)) return undefined;
  if (protocol === "mailto:") {
    const matched = /^mailto:([A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)$/.test(
      raw
    );
    if (!matched) return undefined;
  }
  if (protocol === "tel:") {
    if (!/^tel:\+?[0-9()\-\s.]{3,}$/.test(raw)) return undefined;
  }
  return raw;
}

/** 校验可作为图片 src 的地址 */
export function safeImageUrl(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  if (isRelative(raw)) return raw;
  const url = parseUrl(raw);
  if (!url) return undefined;
  return IMAGE_PROTOCOLS.includes(url.protocol.toLowerCase()) ? raw : undefined;
}

/** 把图片地址安全地嵌进 CSS：`url("…")`，并剔除能闭合 url() 的字符 */
export function cssImageUrl(value?: string | null): string | undefined {
  const url = safeImageUrl(value);
  if (!url) return undefined;
  // 注意：encodeURIComponent 不会转义 ! ' ( ) * ，这里统一按码点做百分号编码。
  const percent = (ch: string) =>
    `%${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
  const encoded = encodeURI(url).replace(/["'()\\\s]/g, percent);
  return `url("${encoded}")`;
}
