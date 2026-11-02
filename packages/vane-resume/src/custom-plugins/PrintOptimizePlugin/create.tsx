import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import doc from "./doc.json";

export interface PrintOptimizeConfig {
  pageSize?: "A4" | "A3" | "letter";
  margin?: string;
  hideOnPrint?: string[];
}

export const createPrintOptimizePlugin: ResumePluginCreator<PrintOptimizeConfig> = (config = {}) => {
  const pageSize = config.pageSize ?? "A4";
  const margin = config.margin ?? "14mm";
  const hide = (
    config.hideOnPrint ?? ["[data-vr-no-print]", ".vr-toolbar", "[data-vr-overlay]"]
  ).join(", ");

  return {
    name: "print-optimize",
    version: "0.1.0",
    description: doc.description,
    priority: 22,
    config: { order: 22 },
    hooks: {
      onMount: (ctx: ResumePluginContext<ResumeData>) => {
        const el = ctx.refs.getContainer?.();
        if (!el || typeof document === "undefined") return;
        const style = document.createElement("style");
        style.setAttribute("media", "print");
        style.dataset.vaneResumePrint = "1";
        style.textContent = `
          ${hide} { display: none !important; }
          .vr-root { box-shadow: none !important; max-width: none !important; margin: 0 !important; }
          .vr-section { page-break-inside: avoid; }
          @page { size: ${pageSize}; margin: ${margin}; }
        `;
        el.appendChild(style);
        const onExport = (e: unknown) => {
          const method =
            e && typeof e === "object" ? (e as { method?: string }).method : undefined;
          if (method === "print" && typeof window !== "undefined") window.print();
        };
        ctx.bus.on("resume:export", onExport);
        return () => {
          style.remove();
          ctx.bus.off("resume:export", onExport);
        };
      },
    },
  };
};

createPrintOptimizePlugin.meta = doc as PluginDoc;
