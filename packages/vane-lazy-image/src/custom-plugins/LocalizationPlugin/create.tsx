import type {
  LazyImagePlugin,
  LazyImageContext,
} from "../../components/LazyLoadImagePlugin/plugins/types";

export interface LocalizationPluginConfig {
  /** 语言 → 图片 URL 映射 */
  localeMap: Record<string, string>;
  defaultLocale?: string;
  /** 手动指定当前语言（优先级最高） */
  currentLocale?: string;
  autoDetect?: boolean;
  /** 自定义语言检测函数（优先级：currentLocale > detectLocale > 浏览器 > defaultLocale） */
  detectLocale?: () => string;
  /** 最终后备图片 URL */
  fallbackSrc?: string;
}

function detectBrowserLocale(): string {
  if (typeof navigator === "undefined") return "en";
  const lang =
    navigator.language || (navigator as any).userLanguage || "en";
  return lang.split("-")[0].toLowerCase();
}

export function createLocalizationPlugin(
  config: LocalizationPluginConfig
): LazyImagePlugin {
  const {
    localeMap,
    defaultLocale = "en",
    currentLocale,
    autoDetect = true,
    detectLocale,
    fallbackSrc,
  } = config;

  let uid = 0;

  return {
    name: `localization-${++uid}`,
    version: "1.0.0",
    config,
    hooks: {
      onLoad: (context: LazyImageContext): string => {
        const original = context.src;
        let locale = currentLocale;
        if (!locale && autoDetect) {
          locale = detectLocale ? detectLocale() : detectBrowserLocale();
        }
        locale = locale || defaultLocale;

        let src = localeMap[locale];
        if (!src && locale !== defaultLocale) src = localeMap[defaultLocale];
        src = src || fallbackSrc || original;
        return src;
      },
    },
  };
}
