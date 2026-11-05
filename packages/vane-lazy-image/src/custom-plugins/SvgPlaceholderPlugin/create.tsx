import type React from "react";

import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

import { SvgOverlay } from "./internal";

export interface SvgPlaceholderConfig {
  /**
   * SVG 内容：
   * - `string`：会被当作 SVG 标记清洗（剥离 script / on* / javascript: 等）后，
   *   以 `data:image/svg+xml` 交给 `<img>` 渲染，不再走 HTML 注入；
   * - 函数：返回上述字符串；
   * - ReactNode：直接作为受信任节点渲染（调用方自行保证可信）。
   */
  svgContent?: string | ((context: LazyImageContext) => string) | React.ReactNode;
  /** 叠加层背景（可用于增强对比度） */
  background?: string;
  /** 叠加层透明度 */
  opacity?: number; // 0..1
  /** 叠加层层级 */
  zIndex?: number;
  /** 显示条件 */
  showWhen?: "always" | "idle" | "loading" | "loaded" | "error";
  /** 是否在加载成功后淡出 */
  fadeOutOnLoaded?: boolean;
}

// P0-4：SVG 清洗白名单式实现 —— 不依赖 DOMPurify，避免新增依赖。
const FORBIDDEN_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "foreignobject",
  "base",
  "meta",
  "link",
  "style",
]);

/** 需要校验协议的 URL 属性 */
const URI_ATTRS = new Set([
  "href",
  "xlink:href",
  "src",
  "action",
  "formaction",
  "poster",
  "background",
  "cite",
  "data",
  "codebase",
  "longdesc",
  "usemap",
]);

/** 允许的协议前缀（相对地址 / 锚点视为安全） */
const SAFE_URI_PREFIXES = ["http:", "https:", "blob:", "mailto:", "tel:", "data:image/"];

function isSafeUri(raw: string): boolean {
  // 去掉空白与控制字符，规避 `java\tscript:` 一类绕过（先 trim 再过滤 C0 控制符）
  const value = Array.from(raw.trim().toLowerCase())
    .filter((ch) => ch.charCodeAt(0) > 0x20)
    .join("");
  if (!value) return true;
  if (value.startsWith("#") || value.startsWith("./") || value.startsWith("../") || value.startsWith("/")) {
    return true;
  }
  if (value.startsWith("data:")) {
    return value.startsWith("data:image/");
  }
  if (/^(javascript|vbscript|file):/.test(value)) return false;
  return SAFE_URI_PREFIXES.some((prefix) => value.startsWith(prefix)) || !value.includes(":");
}

/**
 * P0-4：清洗 SVG 标记。
 * 返回清洗后的序列化字符串；输入无效（无 DOM / 解析失败）时返回空串。
 */
export function sanitizeSvg(content: string): string {
  if (!content || typeof DOMParser === "undefined") return "";
  try {
    const parser = new DOMParser();
    // 优先走 XML 解析（保留命名空间）；部分环境（happy-dom 等）不支持
    // image/svg+xml，退化为 HTML 解析后取 <svg> 根节点。
    const xmlDoc = parser.parseFromString(content, "image/svg+xml");
    let root: Element | null = xmlDoc.documentElement;
    if (!root || root.nodeName.toLowerCase() === "parsererror") {
      const htmlDoc = parser.parseFromString(content, "text/html");
      root = htmlDoc?.body?.querySelector("svg") ?? null;
    }
    if (!root) return "";

    const walk = (node: Element) => {
      if (FORBIDDEN_TAGS.has(node.tagName.toLowerCase())) {
        node.remove();
        return;
      }

      Array.from(node.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          node.removeAttribute(attr.name);
          return;
        }
        if (name === "style") {
          if (/expression|javascript:|vbscript:|url\s*\(\s*['"]?(javascript|vbscript)/i.test(attr.value)) {
            node.removeAttribute(attr.name);
          }
          return;
        }
        if (URI_ATTRS.has(name) && !isSafeUri(attr.value)) {
          node.removeAttribute(attr.name);
        }
      });

      Array.from(node.children).forEach(walk);
    };

    walk(root);

    const serializer =
      typeof XMLSerializer !== "undefined" ? new XMLSerializer() : null;
    return serializer ? serializer.serializeToString(root) : root.outerHTML || "";
  } catch {
    return "";
  }
}

export function createSvgPlaceholderPlugin(
  config: SvgPlaceholderConfig = {}
): LazyImagePlugin {
  return {
    name: "svg-placeholder",
    version: "1.1.0",
    description: "SVG 占位覆盖层（字符串经白名单清洗后以 data URL 渲染，移除 HTML 注入点）",
    config,
    hooks: {
      renderOverlay: (context) => (
        <SvgOverlay context={context} config={config} sanitizeSvg={sanitizeSvg} />
      ),
    },
  };
}

export default createSvgPlaceholderPlugin;
