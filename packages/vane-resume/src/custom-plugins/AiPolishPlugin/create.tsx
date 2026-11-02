import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn, cloneData } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface AiPolishConfig {
  fields?: ("summary" | "work" | "projects")[];
  tone?: string;
  /** 可插拔润色服务：传入文本与字段名，返回润色后文本（不硬编码密钥） */
  polish?: (text: string, field: string) => Promise<string>;
}

/**
 * 润色缓存只存「本轮润色产出的文本片段」，并带上语言标记。
 * 不缓存整份 data：源数据可能已被脱敏 / 隐私插件改写，整份回放会把旧的掩码结果带回来。
 */
interface PolishCache {
  lang: string;
  summary?: string;
  work?: string[][];
  projects?: string[];
}

const CACHE_KEY = "aipolish:polished";

export const createAiPolishPlugin: ResumePluginCreator<AiPolishConfig> = (config = {}) => {
  const fields = config.fields ?? ["summary", "work", "projects"];
  const polish = config.polish;

  const langOf = (ctx: ResumePluginContext<ResumeData>) =>
    String(ctx.state.lang ?? "default");
  const readCache = (ctx: ResumePluginContext<ResumeData>) =>
    ctx.shared.get(CACHE_KEY) as PolishCache | undefined;

  return {
    name: "ai-polish",
    version: "0.1.0",
    description: doc.description,
    priority: 16,
    config: { order: 16 },
    // 依赖 multi-lang：确保润色在「已本地化」数据之上执行
    dependencies: ["multi-lang"],
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        if (ctx.state.aiPolishEnabled === undefined) ctx.setState({ aiPolishEnabled: false });
      },
      // 管道语义末位之一：在 MultiLang 之后润色。
      // 缓存按 lang 隔离：切换语言后不再复用上一语言的润色结果；
      // 只把润色文本片段叠加到当前数据上，联系人等字段由后续脱敏 / 隐私插件重新处理。
      transformData: (ctx, data) => {
        if (!ctx.state.aiPolishEnabled) return data;
        const cache = readCache(ctx);
        if (!cache || cache.lang !== langOf(ctx)) return data;
        const out = cloneData(data as ResumeData);
        if (fields.includes("summary") && cache.summary && out.basics) {
          out.basics.summary = cache.summary;
        }
        if (fields.includes("work") && cache.work) {
          (out.work ?? []).forEach((w, i) => {
            const highlights = cache.work?.[i];
            if (Array.isArray(highlights) && highlights.length === w.highlights.length) {
              w.highlights = [...highlights];
            }
          });
        }
        if (fields.includes("projects") && cache.projects) {
          (out.projects ?? []).forEach((p, i) => {
            const desc = cache.projects?.[i];
            if (typeof desc === "string") p.desc = desc;
          });
        }
        return out;
      },
      renderToolbar: (ctx) => {
        const cached = readCache(ctx);
        // 「已润色」必须以当前语言有缓存为准，否则切换语言后按钮仍显示激活态
        const enabled = !!ctx.state.aiPolishEnabled && cached?.lang === langOf(ctx);
        const busy = !!ctx.state.aiPolishing;
        const run = async () => {
          if (!polish) {
            ctx.logger.warn("[AiPolish] 未配置 config.polish，跳过润色");
            return;
          }
          const lang = langOf(ctx);
          const source = cloneData(ctx.data as ResumeData);
          ctx.setState({ aiPolishing: true });
          try {
            const cache: PolishCache = { lang };
            if (fields.includes("summary") && source.basics?.summary) {
              cache.summary = await polish(source.basics.summary, "summary");
            }
            if (fields.includes("work")) {
              cache.work = await Promise.all(
                (source.work ?? []).map((w) =>
                  Promise.all((w.highlights ?? []).map((h) => polish(h, "work")))
                )
              );
            }
            if (fields.includes("projects")) {
              cache.projects = await Promise.all(
                (source.projects ?? []).map((p) => polish(p.desc, "projects"))
              );
            }
            ctx.shared.set(CACHE_KEY, cache);
            ctx.setState({ aiPolishEnabled: true });
          } catch (e) {
            ctx.logger.error("[AiPolish] 润色失败", e);
          } finally {
            ctx.setState({ aiPolishing: false });
          }
        };
        return (
          <div key="ai-polish" style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              type="button"
              disabled={busy || !polish}
              onClick={() => void run()}
              style={toolbarBtn(enabled)}
            >
              {busy ? "润色中…" : "AI 润色"}
            </button>
            {enabled && (
              <button
                type="button"
                onClick={() => {
                  ctx.shared.delete(CACHE_KEY);
                  ctx.setState({ aiPolishEnabled: false });
                }}
                style={toolbarBtn(false)}
              >
                还原
              </button>
            )}
          </div>
        );
      },
    },
  };
};

createAiPolishPlugin.meta = doc as PluginDoc;
