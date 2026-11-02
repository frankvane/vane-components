import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export type LocaleTranslations = Record<string, Partial<ResumeData>>;
export interface MultiLangConfig {
  locales: { code: string; label: string }[];
  default?: string;
  detect?: () => string;
  translations: LocaleTranslations;
}

export const createMultiLangPlugin: ResumePluginCreator<MultiLangConfig> = (config) => {
  if (
    !config ||
    !Array.isArray(config.locales) ||
    config.locales.length === 0 ||
    !config.translations
  ) {
    throw new Error("[MultiLang] 需要非空的 locales 与 translations");
  }
  const { locales, translations } = config;
  const defaultLang = config.default ?? config.detect?.() ?? locales[0].code;

  /** 顶层替换 + basics 深合并：翻译通常只覆盖姓名/职位，联系方式等原有字段必须保留 */
  const applyLocale = (data: ResumeData, t: Partial<ResumeData>): ResumeData => {
    const mergedBasics = t.basics
      ? ({ ...(data.basics ?? {}), ...t.basics } as ResumeData["basics"])
      : data.basics;
    return { ...data, ...t, basics: mergedBasics };
  };

  return {
    name: "multi-lang",
    version: "0.1.0",
    description: doc.description,
    priority: 14,
    config: { order: 14 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.lang === undefined) ctx.setState({ lang: defaultLang });
      },
      // priority 52：管道首位，先产出目标语言数据，后续 AiPolish / 脱敏基于它处理
      transformData: (ctx, data) => {
        const lang = (ctx.state.lang as string) ?? defaultLang;
        const t = translations[lang];
        if (!t) return data;
        return applyLocale(data, t);
      },
      renderToolbar: (ctx) => {
        const active = (ctx.state.lang as string) ?? defaultLang;
        return (
          <div key="multi-lang" style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--vr-faint, #8a9099)" }}>语言</span>
            {locales.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  ctx.setState({ lang: l.code });
                  ctx.bus.emit("resume:lang-change", l.code);
                }}
                style={toolbarBtn(active === l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
        );
      },
    },
  };
};

createMultiLangPlugin.meta = doc as PluginDoc;
