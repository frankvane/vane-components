import type {
  PluginDoc,
} from "vane-plugin-core";
import type { ResumePluginCreator, ResumePluginContext, ResumeData } from "../../components/ResumePlugin/plugins/types";
import { toolbarBtn } from "../../components/ResumePlugin/plugins/tokens";
import doc from "./doc.json";

export interface ExportPdfConfig {
  /** print=浏览器打印（配合 PrintOptimize）；canvas=html2canvas+jsPDF 拼页 */
  method?: "print" | "canvas";
  fileName?: string;
  onBeforeExport?: () => void;
}

/** 等所有图片加载完成（含失败兜底），避免导出时图片缺口 */
const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const finish = () => {
          img.removeEventListener("load", finish);
          img.removeEventListener("error", finish);
          resolve();
        };
        img.addEventListener("load", finish);
        img.addEventListener("error", finish);
        setTimeout(finish, 1500);
      });
    })
  );
};

export const createExportPdfPlugin: ResumePluginCreator<ExportPdfConfig> = (config = {}) => {
  const method = config.method ?? "print";
  const fileName = config.fileName ?? "resume.pdf";

  const exportCanvas = async (
    ctx: ResumePluginContext<ResumeData>,
    container: HTMLElement | null
  ) => {
    if (!container) {
      ctx.setState({ exportError: "未找到简历容器，无法导出" });
      return;
    }

    // 等一帧，让 onBeforeExport 里的 setState（如收起隐私遮罩）先提交到 DOM
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (container.querySelector("[data-vr-privacy-mask]")) {
      ctx.setState({
        exportError: "隐私遮罩开启时无法可靠导出（html2canvas 不支持 backdrop-filter），请先关闭隐私模式",
      });
      return;
    }

    // 导出时隐藏工具栏与各类弹层，避免把操作 UI 拍进 PDF
    const hidden: Array<{ el: HTMLElement; display: string }> = [];
    container
      .querySelectorAll<HTMLElement>(".vr-toolbar, [data-vr-overlay]")
      .forEach((el) => {
        hidden.push({ el, display: el.style.display });
        el.style.display = "none";
      });

    try {
      await waitForImages(container);
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 1500,
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, pageW, imgH);
      let left = imgH - pageH;
      while (left > 0) {
        pdf.addPage();
        pdf.addImage(img, "PNG", 0, -left, pageW, imgH);
        left -= pageH;
      }
      pdf.save(fileName);
      ctx.setState({ exportError: null });
    } catch (e) {
      ctx.logger.error("[ExportPdf] canvas 导出失败", e);
      const detail = e instanceof Error ? e.message : String(e);
      ctx.setState({ exportError: `导出失败：${detail}。可改用“打印”通道或检查图片跨域配置。` });
    } finally {
      hidden.forEach(({ el, display }) => {
        el.style.display = display;
      });
    }
  };

  return {
    name: "export-pdf",
    version: "0.1.0",
    description: doc.description,
    priority: 16,
    config: { order: 16 },
    hooks: {
      renderToolbar: (ctx: ResumePluginContext<ResumeData>) => (
        <button
          key="export-pdf"
          type="button"
          onClick={() => {
            config.onBeforeExport?.();
            ctx.bus.emit("resume:export", { method });
            if (method === "canvas") {
              void exportCanvas(ctx, ctx.refs.getContainer?.() ?? null);
            } else if (typeof window !== "undefined") {
              window.print();
            }
          }}
          style={toolbarBtn(false)}
        >
          导出 PDF
        </button>
      ),
      renderOverlay: (ctx) => {
        const message = ctx.state.exportError as string | undefined;
        if (!message) return null;
        return (
          <div
            key="export-error"
            role="alert"
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              bottom: 16,
              zIndex: 70,
              background: "#fff4f2",
              color: "#8a1f11",
              border: "1px solid #f3c2b8",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ flex: 1 }}>{message}</span>
            <button
              type="button"
              onClick={() => ctx.setState({ exportError: null })}
              style={toolbarBtn(false)}
            >
              关闭
            </button>
          </div>
        );
      },
    },
  };
};

createExportPdfPlugin.meta = doc as PluginDoc;
