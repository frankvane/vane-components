/**
 * `vane-file-preview/custom-plugins/PptxPreviewPlugin`
 *
 * PPTX 预览 —— 准确说是**文本大纲预览**：用 jszip 解开 `ppt/slides/slideN.xml`，
 * 抽 `<a:p>` 段落里的 `<a:t>` 文本，按页展示。**没有版式、没有图片、没有主题色**。
 *
 * ## 为什么界面上必须写明「文本大纲」
 *
 * 迁移前这个插件在工具栏里写的是「PowerPoint 预览」，用户点开一个设计的 PPT
 * 看到一页一页纯文字，第一反应是「这个库坏了」。而实现上要复现版式，等于把
 * OOXML 的 drawingml 解析一遍（图片、形状、z-order、字体、母版），
 * 那是另一个项目的体量。所以这里：
 *   - 标题改成「PPTX 文本大纲」；
 *   - 正文顶部常驻一条说明，写明「只抽文本，版式与图片不渲染」；
 *   - `doc.json` 的 description / notes 同步这个口径。
 * 要真版式请装 `pptx-preview` 之类的完整渲染器，或走 Office 在线查看器。
 *
 * ## 迁移时改掉的其他问题
 *
 * 1. `jszip` 静态 import → 动态 import（没装依赖时给面板，不白屏）。
 * 2. 缩略图导航重写。迁移前那段 `slice(0,3) + slice(-3)` 加三处 `active` 判断，
 *    ≥4 页时会出现「当前页重复两次」和「点了不跳」的情况。现在只渲染一个窗口化的页码条。
 * 3. 段落抽取的两条分支（带命名空间 / 不带）合成一条：先用 `getElementsByTagName("a:p")`，
 *    为空再退到 `"p"`，逻辑一样但不再复制一遍 20 行。
 */

import React, { useEffect, useMemo, useState } from "react";

import {
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import {
  defaultOf,
  useDynamicModule,
} from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

export interface PptxPreviewPluginConfig {
  /** 单页最多展示多少段，超出截断。默认 40 */
  maxParagraphsPerSlide?: number;
}

interface SlideData {
  index: number;
  paragraphs: string[];
}

interface JSZipFileLike {
  async: (type: "text") => Promise<string>;
}

interface JSZipLike {
  files: Record<string, JSZipFileLike | undefined>;
  file: (path: string) => JSZipFileLike | null;
}

interface JSZipModule {
  loadAsync: (data: ArrayBuffer) => Promise<JSZipLike>;
}

/** 模块级常量，引用稳定 */
const loadJSZip = () => import("jszip");

/**
 * 从一张 slide 的 XML 里抽段落文本。
 *
 * OOXML 里段落是 `<a:p>`，文本片段是 `<a:t>`；但有些生成器（以及被 XSLT 洗过的文件）
 * 会丢掉命名空间前缀，所以两条路径都要试。`lvl` 属性表示大纲层级，0/1 视为标题。
 */
function extractParagraphs(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  let paragraphs = Array.from(doc.getElementsByTagName("a:p"));
  let textTag = "a:t";
  if (paragraphs.length === 0) {
    paragraphs = Array.from(doc.getElementsByTagName("p"));
    textTag = "t";
  }

  const out: string[] = [];
  for (const p of paragraphs) {
    const text = Array.from(p.getElementsByTagName(textTag))
      .map((n) => (n.textContent ?? "").trim())
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!text) continue;

    // 大纲层级挂在子节点 `<a:pPr lvl="…">` 上，**不是** `<a:p>` 自己身上。
    // 迁移前后都在这里踩过一次：直接读 `p.getAttribute("lvl")` 永远是 null，
    // 于是「每段都是标题」—— 真浏览器验收里一页 PPT 的三行字全被涂成了蓝色粗体。
    // 拿不到层级时退到「只有第一段算标题」，这是唯一不需要样式信息的合理猜测。
    const lvlAttr =
      p.getElementsByTagName("a:pPr")[0]?.getAttribute("lvl") ??
      p.getElementsByTagName("pPr")[0]?.getAttribute("lvl") ??
      null;
    const level = lvlAttr === null ? null : Number(lvlAttr);
    const looksTitle = level !== null ? level <= 1 : out.length === 0;

    out.push(looksTitle ? `§${text}` : `· ${text}`);
  }
  return out;
}

/** 页码窗口：≤9 页全显示，否则「前 2 … 当前±1 … 后 2」 */
function pageWindow(total: number, active: number): Array<number | "gap"> {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i);

  const keep = new Set<number>([0, 1, total - 2, total - 1]);
  for (let i = active - 1; i <= active + 1; i += 1) {
    if (i >= 0 && i < total) keep.add(i);
  }

  const sorted = Array.from(keep).sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - (sorted[i - 1] as number) > 1) out.push("gap");
    out.push(page);
  });
  return out;
}

type PptxState =
  | { status: "loading" }
  | { status: "ready"; slides: SlideData[] }
  | { status: "error"; error: string };

function PptxBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: Required<PptxPreviewPluginConfig>;
}) {
  const { file } = context;
  const jszipModule = useDynamicModule(loadJSZip);
  const [state, setState] = useState<PptxState>({ status: "loading" });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (jszipModule.status !== "ready") return;

    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const buf = await res.arrayBuffer();

        const JSZip = defaultOf<JSZipModule>(jszipModule.mod);
        const zip = await JSZip.loadAsync(buf);

        const slidePaths = Object.keys(zip.files)
          .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
          .sort((a, b) => {
            const ai = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
            const bi = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
            return ai - bi;
          });

        const slides: SlideData[] = [];
        for (let i = 0; i < slidePaths.length; i += 1) {
          const entry = zip.file(slidePaths[i] as string);
          if (!entry) continue;
          const xml = await entry.async("text");
          slides.push({
            index: i,
            paragraphs: extractParagraphs(xml).slice(
              0,
              config.maxParagraphsPerSlide
            ),
          });
        }

        if (!alive) return;
        setState({ status: "ready", slides });
        setActive(0);
      } catch (err) {
        if (!alive) return;
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "PPTX 解析失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [file.url, jszipModule, config.maxParagraphsPerSlide]);

  const current = useMemo(
    () => (state.status === "ready" ? state.slides[active] : undefined),
    [state, active]
  );

  if (jszipModule.status === "unavailable") {
    return (
      <MissingDependency
        pkg="jszip"
        feature="解包 pptx 需要 jszip"
        hint="想要完整版式渲染，请改用 OfficePreviewPlugin（需要公网可访问的 URL）。"
        error={jszipModule.error.message}
      />
    );
  }

  if (jszipModule.status === "loading" || state.status === "loading") {
    return <LoadingPanel icon="📽️" label="正在解析 PPTX…" />;
  }

  if (state.status === "error") {
    return <ErrorPanel label="PPTX 解析失败" error={state.error} />;
  }

  const total = state.slides.length;

  if (!current || total === 0) {
    return <ErrorPanel label="没有找到幻灯片" error="ppt/slides/*.xml 为空" />;
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f3f4f6",
      }}
    >
      {/* 口径声明：这条不是装饰，是防止「以为是渲染坏了」 */}
      <div
        data-vfp-pptx-outline
        style={{
          padding: "8px 16px",
          background: "#eef2ff",
          borderBottom: "1px solid #e0e7ff",
          color: "#4338ca",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <strong>文本大纲预览</strong>：只抽取每页的文字。
        版式、图片、图表与动画不渲染 —— 需要完整版式请下载原文件或改用 Office 在线预览。
      </div>

      {/* 翻页控制 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          fontSize: 12,
          color: "#4b5563",
        }}
      >
        <button
          type="button"
          onClick={() => setActive((i) => Math.max(0, i - 1))}
          disabled={active === 0}
          style={navButtonStyle(active === 0)}
        >
          ◀
        </button>
        <span style={{ minWidth: 64, textAlign: "center" }}>
          {active + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => setActive((i) => Math.min(total - 1, i + 1))}
          disabled={active >= total - 1}
          style={navButtonStyle(active >= total - 1)}
        >
          ▶
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {pageWindow(total, active).map((page, i) =>
            page === "gap" ? (
              <span key={`gap:${i}`} style={{ color: "#9ca3af" }}>
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => setActive(page)}
                style={{
                  minWidth: 26,
                  padding: "2px 6px",
                  fontSize: 11,
                  borderRadius: 4,
                  border: `1px solid ${page === active ? "#4f46e5" : "#d1d5db"}`,
                  background: page === active ? "#4f46e5" : "#fff",
                  color: page === active ? "#fff" : "#374151",
                  cursor: "pointer",
                }}
              >
                {page + 1}
              </button>
            )
          )}
        </div>
      </div>

      {/* 正文 */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 12px rgba(15, 23, 42, 0.08)",
            padding: "32px 40px",
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {current.paragraphs.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 17, fontStyle: "italic" }}>
              这一页没有文字内容（纯图表 / 图片页）。
            </div>
          ) : (
            current.paragraphs.map((text, i) => {
              const isTitle = text.startsWith("§");
              return (
                <div
                  key={`${current.index}:${i}`}
                  style={{
                    fontSize: isTitle ? 20 : 18,
                    fontWeight: isTitle ? 600 : 400,
                    color: isTitle ? "#111827" : "#374151",
                    lineHeight: 1.7,
                    borderLeft: isTitle ? "3px solid #4f46e5" : "none",
                    paddingLeft: isTitle ? 12 : 0,
                    marginTop: isTitle && i > 0 ? 8 : 0,
                  }}
                >
                  {isTitle ? text.slice(1) : text.replace(/^·\s*/, "")}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function navButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "3px 10px",
    fontSize: 12,
    borderRadius: 4,
    border: "1px solid #d1d5db",
    background: disabled ? "#f3f4f6" : "#fff",
    color: disabled ? "#9ca3af" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

export function createPptxPreviewPlugin(
  config: PptxPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<PptxPreviewPluginConfig> = {
    maxParagraphsPerSlide: config.maxParagraphsPerSlide ?? 40,
  };

  return {
    name: "PptxPreviewPlugin",
    version: "1.0.0",
    description: "PPTX 文本大纲预览（jszip，无版式）",
    supportedTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    supportedExtensions: [".pptx"],
    priority: 8,
    config: resolved,

    hooks: {
      render: (context) => <PptxBody context={context} config={resolved} />,

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="PPTX · 文本大纲"
            icon="📽️"
          />
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() =>
              triggerDownload(context.file.url, context.file.name)
            }
            icon="📥"
            title="下载原文件"
          >
            下载
          </ToolbarButton>
        </ToolbarContainer>
      ),
    },
  };
}

export default createPptxPreviewPlugin;
