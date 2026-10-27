/**
 * 预装配层 —— **全站所有 `withPlugins` 调用只出现在这个文件的模块顶层**
 * ----------------------------------------------------------------------------
 * 为什么不允许页面里装配：迁移前 13 个示例页里 11 个写在函数体内，于是每次
 * 渲染都新建一个组件类型，React 只能整棵卸载重挂 —— 缩放归零、滚动位置丢失、
 * iframe 重新加载（PDF 白闪一下就是这么来的）。这类问题在单页里几乎看不出来，
 * 但用户拖一下控件就全暴露了。
 *
 * 现在的规则：
 *   1. 每套装配是一个 `PreviewEntry`，在模块加载时就创建好组件类型；
 *   2. 需要「配置档位」的页面，档位也是顶层常量（`image:max` / `markdown:raw` …），
 *      切换档位 = 换一个已经存在的组件，而不是现场造一个；
 *   3. 页面只许 `PREVIEWS[key].Comp`，永远不 import `withPlugins`。
 *
 * `PREVIEW_KEYS` 与 `data/plugin-catalog.ts` 的 `variants` 由下面的断言保持一致：
 * 少配一档时开发期就抛错，而不是等用户点到那个下拉项才发现是空白。
 */
import React, { useEffect, useRef } from "react";
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import type { FileInfo, FilePreviewPlugin, PreviewStateInfo } from "vane-file-preview";
import {
  createAudioPreviewPlugin,
  createCodePreviewPlugin,
  createCsvPreviewPlugin,
  createDocxPreviewPlugin,
  createDownloadPlugin,
  createEpubPreviewPlugin,
  createImagePreviewPlugin,
  createJsonPreviewPlugin,
  createMammothDocxPlugin,
  createMarkdownPreviewPlugin,
  createOfficePreviewPlugin,
  createPdfPreviewPlugin,
  createPptxPreviewPlugin,
  createVideoPreviewPlugin,
  createXlsxPreviewPlugin,
  createXmlPreviewPlugin,
  createZipPreviewPlugin,
} from "vane-file-preview/custom-plugins";
import { PLUGINS } from "../data/plugin-catalog";

export type LogKind = "info" | "event" | "warn" | "error";
export type LogFn = (text: string, kind?: LogKind) => void;

export interface SurfaceProps {
  file: FileInfo;
  onLog?: LogFn;
  onState?: (state: PreviewStateInfo) => void;
}

export type SurfaceComponent = React.FC<SurfaceProps>;

export interface PreviewEntry {
  key: string;
  /** 这一档装了哪些插件（顺序即声明顺序）；`resolvePreview` 与工坊都用它 */
  plugins: FilePreviewPlugin[];
  Comp: SurfaceComponent;
}

/**
 * 带日志的预览器包装
 *
 * demo 文件里的装配是**模块顶层常量**（可复制的那份源码），但每个文件都写一遍
 * 「loadStart 记时间 → success 算耗时 → 推给日志」会淹掉真正想展示的三行装配。
 * 所以生命周期只在 `lib/` 这一处实现，页面用 `<PreviewSurface Comp={Comp} … />` 包一层。
 *
 * 日志只做一件事：把 Core 的生命周期摊开给人看。`onLoadSuccess` 的耗时是
 * **从 loadStart 起算**，不是从挂载起算 —— 否则第一次渲染的 React 提交开销
 * 会被算进「文件加载时间」，数字看着很大但和文件无关。
 */
export const PreviewSurface: React.FC<{
  /** withPlugins 的结果；用 ElementType 而不是 ComponentType，因为它是个 forwardRef 组件 */
  Comp: React.ElementType;
  file: FileInfo;
  onLog?: LogFn;
  onState?: (state: PreviewStateInfo) => void;
}> = ({ Comp, file, onLog, onState }) => {
  const startedAt = useRef(0);
  const firstMount = useRef(true);

  useEffect(() => {
    if (!firstMount.current) return;
    firstMount.current = false;
    onLog?.(`挂载 · ${file.name}`, "info");
  }, [file.name, onLog]);

  return (
    <Comp
      file={file}
      containerStyle={{ width: "100%", height: "100%" }}
      onLoadStart={() => {
        startedAt.current = performance.now();
        onLog?.("loadStart", "info");
      }}
      onLoadSuccess={() => {
        const ms = Math.round(performance.now() - startedAt.current);
        onLog?.(`loadSuccess · ${ms}ms`, "event");
      }}
      onLoadError={(err: Error) => {
        onLog?.(`loadError · ${err.message}`, "error");
      }}
      onStateChange={(info: PreviewStateInfo) => onState?.(info)}
    />
  );
};

function makeSurface(plugins: FilePreviewPlugin[]): SurfaceComponent {
  const Composed = withPlugins(FilePreviewCore, { plugins });

  const Surface: SurfaceComponent = ({ file, onLog, onState }) => (
    <PreviewSurface Comp={Composed} file={file} onLog={onLog} onState={onState} />
  );

  Surface.displayName = `Surface(${plugins.map((p) => p.name).join("+")})`;
  return Surface;
}

function entry(key: string, plugins: FilePreviewPlugin[]): PreviewEntry {
  return { key, plugins, Comp: makeSurface(plugins) };
}

/**
 * 全站装配表。
 * 键的命名规则：`<插件 id>` 是默认档，`<插件 id>:<变体>` 是档位。
 */
export const PREVIEWS: Record<string, PreviewEntry> = {
  // ---- 媒体 ----
  image: entry("image", [createImagePreviewPlugin()]),
  "image:max": entry("image:max", [createImagePreviewPlugin({ maxZoom: 12 })]),
  video: entry("video", [createVideoPreviewPlugin()]),
  "video:auto": entry("video:auto", [
    createVideoPreviewPlugin({ autoplay: true, muted: true, loop: true }),
  ]),
  audio: entry("audio", [createAudioPreviewPlugin()]),
  "audio:loop": entry("audio:loop", [createAudioPreviewPlugin({ loop: true })]),

  // ---- 文档 ----
  pdf: entry("pdf", [createPdfPreviewPlugin()]),
  "pdf:embed": entry("pdf:embed", [createPdfPreviewPlugin({ useIframe: false })]),
  office: entry("office", [createOfficePreviewPlugin()]),
  "office:google": entry("office:google", [createOfficePreviewPlugin({ viewer: "google" })]),
  docx: entry("docx", [createDocxPreviewPlugin()]),
  "docx:stream": entry("docx:stream", [createDocxPreviewPlugin({ breakPages: false })]),
  mammoth: entry("mammoth", [createMammothDocxPlugin()]),
  "mammoth:plain": entry("mammoth:plain", [createMammothDocxPlugin({ withDefaultStyle: false })]),
  pptx: entry("pptx", [createPptxPreviewPlugin()]),
  markdown: entry("markdown", [createMarkdownPreviewPlugin()]),
  "markdown:raw": entry("markdown:raw", [createMarkdownPreviewPlugin({ allowHtml: true })]),
  epub: entry("epub", [createEpubPreviewPlugin()]),
  "epub:swipe": entry("epub:swipe", [createEpubPreviewPlugin({ swipeable: true })]),

  // ---- 数据 ----
  json: entry("json", [createJsonPreviewPlugin()]),
  "json:dark": entry("json:dark", [createJsonPreviewPlugin({ theme: "dark" })]),
  "json:expand": entry("json:expand", [createJsonPreviewPlugin({ collapsed: 2 })]),
  xml: entry("xml", [createXmlPreviewPlugin()]),
  "xml:flat": entry("xml:flat", [createXmlPreviewPlugin({ collapsedLevels: 0 })]),
  xlsx: entry("xlsx", [createXlsxPreviewPlugin()]),
  "xlsx:rows": entry("xlsx:rows", [createXlsxPreviewPlugin({ maxRows: 20 })]),
  csv: entry("csv", [createCsvPreviewPlugin()]),
  "csv:page10": entry("csv:page10", [createCsvPreviewPlugin({ pageSize: 10 })]),

  // ---- 压缩包 ----
  zip: entry("zip", [createZipPreviewPlugin()]),
  "zip:slim": entry("zip:slim", [createZipPreviewPlugin({ showFileSize: false })]),

  // ---- 代码 ----
  code: entry("code", [createCodePreviewPlugin()]),
  "code:dark": entry("code:dark", [createCodePreviewPlugin({ theme: "dark" })]),
  "code:noline": entry("code:noline", [createCodePreviewPlugin({ showLineNumbers: false })]),

  // ---- 兜底 ----
  download: entry("download", [createDownloadPlugin()]),
  "download:nosize": entry("download:nosize", [createDownloadPlugin({ showFileInfo: false })]),
};

export type PreviewKey = keyof typeof PREVIEWS;

/** 取一档，找不到就抛（比渲染空白好排查） */
export function previewOf(key: string): PreviewEntry {
  const found = PREVIEWS[key];
  if (!found) throw new Error(`[demo] PREVIEWS 里没有 "${key}"`);
  return found;
}

/** 浅比较：只用来判断「这一档和默认档的参数是否相同」 */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") return JSON.stringify(a) === JSON.stringify(b);
  return false;
}

/**
 * 把一档装配**反推**成代码，只保留与默认档不同的参数。
 *
 * 为什么反推而不是在 catalog 里写一份代码字符串：写一份就等于有了两份事实，
 * 改插件参数时忘了改文案，页面就会拿一段跑不起来的代码骗人。
 * 这里的输入是真正被 `withPlugins` 装配过的插件对象（`name` = 目录名，
 * `config` = 工厂闭包里的那份配置），所以永远和右侧灯箱里跑的完全一致。
 *
 * 为什么要传 `base`（默认档）来做差：工厂返回的 `config` 是**合并过默认值**的
 * 完整对象 —— 直接把 markdown 那一份打出来是 8 个键、20 多行，真正的信息
 * （这一档把 allowHtml 打开了）被埋在里面。官方文档里的示例也从来只写差异。
 */
export function assemblyCode(entry: PreviewEntry, base?: PreviewEntry): string {
  const args = entry.plugins.map((p) => {
    const cfg = (p as { config?: Record<string, unknown> }).config ?? {};
    const baseCfg =
      (base?.plugins.find((x) => x.name === p.name) as { config?: Record<string, unknown> })
        ?.config ?? {};
    const diff: Record<string, unknown> = {};
    for (const key of Object.keys(cfg)) {
      if (!(key in baseCfg) || !sameValue(cfg[key], baseCfg[key])) diff[key] = cfg[key];
    }
    const arg = Object.keys(diff).length ? ` ${JSON.stringify(diff)} ` : "";
    return `  create${p.name}(${arg}),`;
  });
  return ["withPlugins(FilePreviewCore, [", ...args, "]);"].join("\n");
}

// ============ 一致性闸门（开发期） ============

/**
 * catalog 的 `variants` 与 PREVIEWS 必须一一对应。
 *
 * 两个方向都要查：
 *  - catalog 声明了但没装配 → 用户点到下拉项就是空白；
 *  - 装配了但没声明 → 那一档永远不会被用到（死代码，通常意味着改了键名忘了改一处）。
 */
const declared = new Set(PLUGINS.flatMap((p) => p.variants.map((v) => v.key)));
const built = new Set(Object.keys(PREVIEWS));
const missing = [...declared].filter((k) => !built.has(k));
const orphan = [...built].filter((k) => !declared.has(k));
if (missing.length || orphan.length) {
  throw new Error(
    `[demo] PREVIEWS 与 catalog.variants 不一致：缺 ${missing.join(",") || "-"}；多 ${orphan.join(",") || "-"}`
  );
}

/**
 * 默认档必须真的存在，且里面确实装着这个插件。
 *
 * 这条是被真 bug 换来的：`mammoth-docx` 的 id 与 PREVIEWS 键 `mammoth` 不同名，
 * 而 `variants` 的双向比对只查**键集合**，两边都自洽，于是闸门放行；
 * 工坊页 `PREVIEWS[plugin.id]` 拿到 undefined，整页白屏。
 * 教训：键集合一致 ≠ 每个插件都能被索引到，得逐条按 `defaultKey` 再查一遍。
 */
for (const p of PLUGINS) {
  const dflt = PREVIEWS[p.defaultKey];
  if (!dflt) {
    throw new Error(
      `[demo] 插件 ${p.id} 的默认档 "${p.defaultKey}" 不在 PREVIEWS 里（键名打错了？）`
    );
  }
  if (!dflt.plugins.some((pl) => pl.name === p.dir)) {
    throw new Error(
      `[demo] 插件 ${p.id} 的默认档 "${p.defaultKey}" 里没有 ${p.dir} —— 档位装错了插件`
    );
  }
}

/** 17 个插件是否都至少有一套装配（P5 验收门之一） */
export const COVERED_PLUGINS = new Set(
  PLUGINS.filter((p) => PREVIEWS[p.defaultKey]?.plugins.some((pl) => pl.name === p.dir)).map(
    (p) => p.dir
  )
);
