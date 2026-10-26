import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface WebPPluginConfig {
  enabled?: boolean;
  /** 自定义重写函数：返回 webp 链接 */
  rewrite?: (src: string, ctx: LazyImageContext) => string | undefined;
  /** 需要替换为 .webp 的扩展名 */
  replaceExtensions?: string[];
  /** 追加的查询参数，例如 "format=webp" */
  appendQueryParam?: string;
  /** 限定域名（空则不限制） */
  onDomains?: string[];
  /** 在运行前检测浏览器是否支持 webp */
  testSupport?: boolean;
}

let webpSupportPromise: Promise<boolean> | null = null;
/**
 * 检测浏览器是否支持 WebP。
 *
 * 此前用一个手抄的「极小 webp」base64 做 Image 嗅探，但那串 base64 是截断的
 * （RIFF 声明长度 34，实际只有 33 字节），浏览器解码必然失败，
 * detectWebPSupport() 恒为 false —— web-p 插件因此从来没生效过。
 * 改为 canvas 嗅探：同步、无需魔法字符串，也不会因数据损坏而误判。
 */
function detectWebPSupport(): Promise<boolean> {
  if (webpSupportPromise) return webpSupportPromise;
  webpSupportPromise = new Promise<boolean>((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const dataUrl = canvas.toDataURL("image/webp");
      resolve(typeof dataUrl === "string" && dataUrl.indexOf("data:image/webp") === 0);
    } catch {
      resolve(false);
    }
  });
  return webpSupportPromise;
}

function shouldRewriteForDomain(url: string, domains?: string[]): boolean {
  if (!domains || domains.length === 0) return true;
  try {
    const u = new URL(url);
    return domains.some((d) => u.hostname.includes(d));
  } catch {
    return false;
  }
}

function appendQuery(url: string, param?: string): string {
  if (!param) return url;
  try {
    const u = new URL(url);
    const [key, value] = param.split("=");
    if (key) u.searchParams.set(key, value ?? "");
    return u.toString();
  } catch {
    // 退化处理：简单拼接
    return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
  }
}

function replaceExtToWebP(url: string, exts: string[]): string {
  const idx = url.lastIndexOf(".");
  if (idx < 0) return url;
  const ext = url.substring(idx + 1).toLowerCase();
  if (!exts.includes(ext)) return url;
  return `${url.substring(0, idx)}.webp`;
}

export function createWebPPlugin(config: WebPPluginConfig = {}): LazyImagePlugin {
  const {
    enabled = true,
    rewrite,
    replaceExtensions = ["jpg", "jpeg", "png"],
    appendQueryParam,
    onDomains,
    testSupport = true,
  } = config;

  return {
    name: "webp",
    version: "1.0.0",
    config,
    hooks: {
      onLoad: async (context: LazyImageContext) => {
        if (!enabled) return undefined;
        const original = context.src;
        if (!shouldRewriteForDomain(original, onDomains)) return undefined;

        // 检测支持性
        if (testSupport) {
          const supported = await detectWebPSupport();
          if (!supported) return undefined;
        }

        // 生成 webp 链接
        let candidate: string | undefined = undefined;
        if (rewrite) {
          candidate = rewrite(original, context);
        } else {
          const replaced = replaceExtToWebP(original, replaceExtensions);
          candidate = appendQuery(replaced, appendQueryParam);
        }

        if (!candidate || candidate === original) return undefined;
        // 记录以便错误时回退
        try {
          context.sharedData?.set("webp:original", original);
          context.sharedData?.set("webp:rewritten", candidate);
        } catch {}
        return candidate;
      },

      onLoadError: (context: LazyImageContext) => {
        // 如果是 webp 链接失败，回退到原始链接
        const orig = context.sharedData?.get("webp:original");
        const rewritten = context.sharedData?.get("webp:rewritten");
        const img = context.imageRef?.current;
        if (img && orig && rewritten && img.src === rewritten) {
          try {
            img.src = orig;
          } catch {}
          // 返回 true 以表明已处理错误（核心仍会更新状态，但成功后会恢复）
          return true;
        }
        return false;
      },
    },
  };
}