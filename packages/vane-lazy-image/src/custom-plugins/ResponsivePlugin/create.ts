import type { LazyImagePlugin, LazyImageContext } from "../../components/LazyLoadImagePlugin/plugins/types";

export interface ResponsiveVariant {
  width: number; // 宽度（像素）
  src?: string; // 可选：直接提供该宽度的 URL
}

export interface ResponsivePluginConfig {
  enabled?: boolean;
  /** 生成不同宽度的图片链接 */
  variants?: ResponsiveVariant[];
  /** 自定义生成函数：从基础 src 生成指定宽度的链接 */
  buildSrc?: (baseSrc: string, width: number) => string;
  /** sizes 属性（例如 "(max-width: 640px) 100vw, 800px"） */
  sizes?: string;
}

function defaultBuildSrc(base: string, width: number): string {
  // 默认方案：追加查询参数 ?w=width（常见图床兼容）
  try {
    const u = new URL(base);
    u.searchParams.set("w", String(width));
    return u.toString();
  } catch {
    return base.includes("?") ? `${base}&w=${width}` : `${base}?w=${width}`;
  }
}

export function createResponsivePlugin(config: ResponsivePluginConfig = {}): LazyImagePlugin {
  const { enabled = true, variants = [
    { width: 400 },
    { width: 800 },
    { width: 1200 },
  ], buildSrc = defaultBuildSrc, sizes = "(max-width: 800px) 100vw, 800px" } = config;

  return {
    name: "responsive",
    version: "1.0.0",
    config,
    hooks: {
      // P2-4：在 transformProps 阶段就写入 srcset/sizes，首帧即可让浏览器选择合适资源，
      // 也避免「成功后补 srcset 触发第二次下载」。
      transformProps: (props) => {
        if (!enabled || !props.src) return props;
        const parts = variants.map((v) => {
          const url = v.src ?? buildSrc(props.src, v.width);
          return `${url} ${v.width}w`;
        });
        return {
          ...props,
          srcSet: props.srcSet ?? parts.join(", "),
          sizes: props.sizes ?? sizes,
        } as typeof props;
      },
      // 兜底：宿主绕过 transformProps 时，成功后补一次 srcset；
      // displaySrc 已是 blob:/data: 时跳过，避免把省流量变成多下载（P2-4）。
      onLoadSuccess: (context: LazyImageContext, displaySrc: string) => {
        if (!enabled) return;
        if (displaySrc.startsWith("blob:") || displaySrc.startsWith("data:")) return;
        const img = context.imageRef?.current;
        if (!img) return;

        const base = context.src;
        const parts = variants.map((v) => {
          const url = v.src ?? buildSrc(base, v.width);
          return `${url} ${v.width}w`;
        });
        try {
          if (!img.getAttribute("srcset")) {
            img.setAttribute("srcset", parts.join(", "));
          }
          if (!img.getAttribute("sizes")) {
            img.setAttribute("sizes", sizes);
          }
        } catch {}
      },
    },
  };
}