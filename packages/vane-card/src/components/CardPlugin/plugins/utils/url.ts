/**
 * 外链安全校验（P2-6）。
 *
 * 插件与复合组件里有若干 `window.open(url)`（画廊缩放、退换政策链接）。url 来自
 * props / data，属于外部输入，直接开放会让 `javascript:` / `data:` 协议执行脚本。
 * 这里统一只放行 http / https / blob 与相对路径。
 */

const SAFE_PROTOCOLS = ["http:", "https:", "blob:"];

export function isSafeUrl(url?: string | null): boolean {
  if (!url) return false;
  const value = String(url).trim();
  if (!value) return false;

  // 相对路径 / 锚点 / 查询串：不会执行脚本
  if (/^(#|\/|\.|\?)/.test(value)) return true;

  try {
    // 用固定 base 解析，相对路径（images/a.jpg）会落到 https:
    const parsed = new URL(value, "https://example.invalid");
    return SAFE_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** 校验通过才打开外链；返回是否真的打开 */
export function openExternal(url?: string | null): boolean {
  if (!isSafeUrl(url)) return false;
  if (typeof window === "undefined" || typeof window.open !== "function") {
    return false;
  }
  window.open(String(url), "_blank", "noopener,noreferrer");
  return true;
}
