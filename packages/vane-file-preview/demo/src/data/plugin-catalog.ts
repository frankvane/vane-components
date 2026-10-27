/**
 * 插件目录（演示站的数据层）
 * ----------------------------------------------------------------------------
 * 展示名、分组、一句话定位、该页用哪几个样本 —— 这些是**叙事**，写在下面的 META 里；
 * 参数表、特性、坑位 —— 这些是**事实**，来自各插件目录的 `doc.json`（eager glob）。
 *
 * 两边刻意分开：doc.json 是随包发布的契约（改它要发版），META 只服务演示站的
 * 编排（加一页示例不该动到包）。校验靠 `PLUGINS` 的 17 条断言 —— doc.json 少一个
 * 就在开发时报错，而不是页面上悄悄少一张卡。
 */
import * as BUCKET from "vane-file-preview/custom-plugins";
import type { FileInfo } from "vane-file-preview";

export type PluginGroup = "media" | "document" | "data" | "archive" | "code" | "fallback";

export const GROUP_ORDER: PluginGroup[] = [
  "media",
  "document",
  "data",
  "archive",
  "code",
  "fallback",
];

export const GROUP_LABELS: Record<PluginGroup, { label: string; en: string; hint: string }> = {
  media: { label: "图片与音视频", en: "MEDIA", hint: "原生标签承载，零依赖" },
  document: { label: "文档", en: "DOCUMENT", hint: "PDF / Office / Markdown / EPUB" },
  data: { label: "结构化数据", en: "DATA", hint: "JSON / XML / 表格" },
  archive: { label: "压缩包", en: "ARCHIVE", hint: "不下载也能看目录" },
  code: { label: "代码", en: "CODE", hint: "prism 高亮 + 行号" },
  fallback: { label: "兜底", en: "FALLBACK", hint: "谁都认不了时仍可下载" },
};

/** doc.json 的形状（与 `docs:plugins` 生成器读的是同一份） */
export interface PluginDoc {
  name: string;
  description: string;
  since?: string;
  tags?: string[];
  config?: Array<{ name: string; type: string; default?: string; description?: string }>;
  example?: string;
  features?: string[];
  useCases?: string[];
  notes?: string[];
}

export interface PluginVariant {
  /** `PREVIEWS` 里的键，一档 = 一套装配 */
  key: string;
  label: string;
  /** 这一档和默认档的差别，一句话 */
  hint?: string;
}

export interface PluginMeta {
  /**
   * 路由 slug（`/demos/<id>`）与 `data-demo` / `data-plugin` 锚点。
   *
   * **不要拿它去索引 `PREVIEWS`** —— 两者多数时候同名，但 `mammoth-docx` 是
   * `mammoth`，靠「多数时候同名」写代码就是给未来埋一个 undefined。
   * 要默认档请用 `PluginEntry.defaultKey`。
   */
  id: string;
  /** 目录名 = doc.name */
  dir: string;
  title: string;
  /** 英文小标，放在标题旁的 tag 里 */
  en: string;
  group: PluginGroup;
  /** 「拿手的活」：一句话说清它替你解决什么 */
  oneLiner: string;
  /** 什么时候该选它（而不是另一个插件） */
  why: string;
  /** 本页可切的样本，第一个是默认值 */
  files: string[];
  /** 可切档位，第一个必须是默认归档（`PREVIEWS` 的键） */
  variants: PluginVariant[];
  /**
   * 喂给这个插件的文件要补的字段。
   *
   * 唯一的用处是 `docxMode` —— docx 的两个渲染器（DocxPreview / Mammoth）由
   * `file.docxMode` **互斥**决定，不设就走 mammoth。所以「版式还原」那一页如果不显式
   * 声明 `docxMode: "docx-preview"`，插件的 canHandle 直接返回 false，页面上会是
   * Core 的「没有插件能预览这个文件」——**而几何体检完全看不出来**（一块、非零尺寸、
   * 无溢出，全绿）。这就是当初那批假绿之一。
   */
  filePatch?: Partial<FileInfo>;
  /** 舞台高度，默认 440 */
  stageHeight?: number;
  /** 坑位提醒 */
  note?: string;
}

/** 17 条编排信息（顺序 = 展示顺序 = 编号 01…17） */
const META: PluginMeta[] = [
  {
    id: "image",
    dir: "ImagePreviewPlugin",
    title: "图片预览",
    en: "IMAGE",
    group: "media",
    oneLiner: "一张图放大看细节：缩放、旋转、复位，不重排页面。",
    why: "用户上传头像、证件照、商品图，需要看清像素级细节时。用 transform 而不是改宽高，所以缩放时周围布局不会跳。",
    files: ["sample.jpg", "sample.png", "sample.gif", "sample.webp", "sample.svg"],
    variants: [
      { key: "image", label: "默认（maxZoom 5×）" },
      { key: "image:max", label: "放大到 12×", hint: "maxZoom 调大，按钮与双击复位的上限同步变" },
    ],
  },
  {
    id: "video",
    dir: "VideoPreviewPlugin",
    title: "视频预览",
    en: "VIDEO",
    group: "media",
    oneLiner: "浏览器能解的容器直接播；播不了的说清是格式还是编码。",
    why: "附件里带一段录屏、客服工单带手机拍的视频。它不转码 —— 能不能播完全取决于内核，所以失败文案必须给出可执行的下一步。",
    files: ["sample.mp4", "sample.webm", "sample.flv", "sample.avi"],
    variants: [
      { key: "video", label: "默认" },
      {
        key: "video:auto",
        label: "自动播放 + 静音 + 循环",
        hint: "Chrome/Safari 只在 muted 时允许 autoplay",
      },
    ],
    note: "容器 ≠ 编码：这份 sample.flv 里是 H.264，Chromium 实测能播；而 sample.avi 是 DivX，必然播不了。两条路径都能在这页看到。",
  },
  {
    id: "audio",
    dir: "AudioPreviewPlugin",
    title: "音频预览",
    en: "AUDIO",
    group: "media",
    oneLiner: "没有封面的纯音频，也有一张能看的卡片。",
    why: "语音留言、会议录音、客服通话回放。原生 <audio> 的默认控件在各浏览器长得都不一样，所以外面套一层卡片给它一个稳定的落点。",
    files: ["sample.mp3", "sample.ogg", "sample.wav"],
    variants: [
      { key: "audio", label: "默认" },
      { key: "audio:loop", label: "循环播放", hint: "loop: true" },
    ],
    stageHeight: 300,
  },
  {
    id: "pdf",
    dir: "PdfPreviewPlugin",
    title: "PDF 预览",
    en: "PDF",
    group: "document",
    oneLiner: "不引 pdfjs —— 把 PDF 交给浏览器自己的查看器。",
    why: "合同、发票、扫描件。内置查看器自带缩放/翻页/搜索/打印，而且不会为了一个 PDF 往包里塞 300KB 的 pdfjs（以及它的 worker 与字体包）。",
    files: ["star.pdf", "danmu.pdf", "white-screen.pdf"],
    variants: [
      { key: "pdf", label: "默认（iframe）" },
      { key: "pdf:embed", label: "改用 <embed>", hint: "个别内嵌场景 iframe 被 CSP 拦，换 embed 可能过" },
    ],
    stageHeight: 520,
    note: "浏览器对 blob:/data: URL 的 PDF 处理与 http(s) 不一致（部分内核直接下载而不是渲染），所以插件优先用 iframe 指向真实 URL。",
  },
  {
    id: "office",
    dir: "OfficePreviewPlugin",
    title: "Office 在线预览",
    en: "OFFICE",
    group: "document",
    oneLiner: "公网可达的 office 文档，甩给 Office Online / Google Docs。",
    why: "后台里预览供应商发来的报价单，文件已经存在自己的 CDN 上。零依赖、零解析，代价是文件 URL 必须公网可达 —— 内网或 blob: 会被在线查看器拒绝。",
    files: ["sample.docx", "sample.xlsx", "sample.pptx"],
    variants: [
      { key: "office", label: "默认（auto）" },
      { key: "office:google", label: "强制 Google Docs", hint: "viewer: 'google'" },
    ],
    note: "本页三个样本都是本地路径，所以会稳定落到「这个地址无法用在线查看器打开」说明面板 —— 那正是这条路径的真实形态，不是坏了。",
  },
  {
    id: "docx",
    dir: "DocxPreviewPlugin",
    title: "DOCX · 版式还原",
    en: "DOCX / LAYOUT",
    group: "document",
    oneLiner: "要版式就用它：分页、页边距、字号、表格边框照 OOXML 还原。",
    why: "看合同、公文、简历这类「排版本身有信息量」的文档。它渲染的是带分页的 DOM，和 Word 里看到的样子接近。",
    files: ["sample.docx"],
    // 见 `filePatch` 的注释：不写这行，这一页会静默变成「没有插件能预览」
    // （已用体检反向验证：删掉它 `no-plugin` 立刻命中，mammoth 页仍绿）
    filePatch: { docxMode: "docx-preview" },
    variants: [
      { key: "docx", label: "默认（分页）" },
      { key: "docx:stream", label: "不分页（连续流）", hint: "breakPages: false，适合塞进窄侧栏" },
    ],
    stageHeight: 520,
  },
  {
    id: "mammoth-docx",
    dir: "MammothDocxPlugin",
    title: "DOCX · 语义 HTML",
    en: "DOCX / SEMANTIC",
    group: "document",
    oneLiner: "要语义就用它：标题/段落/列表/表格转成干净的 HTML。",
    why: "文档内容要参与站内排版（比如把简历正文塞进详情页），需要的是 <h2>/<ul>/<table> 而不是一堆绝对定位的 div。代价是丢失原版式。",
    files: ["sample.docx"],
    variants: [
      { key: "mammoth", label: "默认（带默认样式）" },
      { key: "mammoth:plain", label: "不带样式", hint: "withDefaultStyle: false，完全交给宿主 CSS" },
    ],
    stageHeight: 520,
    note: "同一个 sample.docx，这一页和上一页长得完全不一样 —— 这就是「版式还原」与「语义提取」的分工，不是谁对谁错。",
  },
  {
    id: "pptx",
    dir: "PptxPreviewPlugin",
    title: "PPTX 大纲",
    en: "PPTX",
    group: "document",
    oneLiner: "没有版式也要能翻：抽出每页文字大纲。",
    why: "会议材料、培训课件。真要做版式还原得引完整的 OOXML 渲染器（体积不现实），而多数场景只需要「这页讲了什么」。",
    files: ["sample.pptx"],
    variants: [{ key: "pptx", label: "默认" }],
    stageHeight: 480,
    note: "只抽文字，不渲染图片与形状 —— 所以 sample.pptx 里的大图在这页看不到，这是设计取舍。",
  },
  {
    id: "markdown",
    dir: "MarkdownPreviewPlugin",
    title: "Markdown 预览",
    en: "MARKDOWN",
    group: "document",
    oneLiner: "GFM 全套；HTML 默认关 —— 上传的文件不能直接当 HTML 执行。",
    why: "README、需求文档、知识库条目。用户上传的 .md 里可以塞 <img onerror> 或 <script>，所以 rehype-raw 默认关闭，要开必须显式 allowHtml。",
    files: ["sample.md", "xss-demo.md"],
    variants: [
      { key: "markdown", label: "默认（HTML 关闭）" },
      { key: "markdown:raw", label: "allowHtml: true", hint: "不可信 HTML 会进 DOM；on* 事件属性仍被剥掉" },
    ],
    stageHeight: 520,
    note: "拿 xss-demo.md 切两档：默认档里标签是纯文本，allowHtml 档里图片真的被插进 DOM。onerror 会被剥掉（否则 React 直接抛错把预览打崩），但「不可信 HTML 进了 DOM」这件事本身就是存储型 XSS 的入口。",
  },
  {
    id: "epub",
    dir: "EpubPreviewPlugin",
    title: "EPUB 电子书",
    en: "EPUB",
    group: "document",
    oneLiner: "能翻页的电子书，章节隔离在 iframe 里。",
    why: "阅读类产品里的试读、内部资料。epub.js 把每章渲染进 iframe，所以站内 CSS 与浏览器插件都不会污染正文排版。",
    files: ["sample.epub", "fake-book.epub"],
    variants: [
      { key: "epub", label: "默认" },
      { key: "epub:swipe", label: "允许滑动翻页", hint: "swipeable: true" },
    ],
    stageHeight: 560,
    note: "react-reader + epubjs 合起来 200KB+，是全包最重的可选依赖 —— 所以它只能走子路径引入，不会跟着根入口进来。fake-book.epub 是 zip 改名：插件有两道闸门（magic 是不是 zip + 包里有没有 META-INF/container.xml），认出它不是电子书后不会甩一句 Error loading book，而是把压缩包里**实际有哪些条目**列出来。",
  },
  {
    id: "json",
    dir: "JsonPreviewPlugin",
    title: "JSON 树",
    en: "JSON",
    group: "data",
    oneLiner: "大 JSON 不靠折叠猜结构：可搜、可复制路径、可导出。",
    why: "排查接口响应、看配置文件。纯文本预览要人肉对齐括号，树视图能直接点到某个字段并复制它的路径。",
    files: ["sample.json", "package.json"],
    variants: [
      { key: "json", label: "默认（跟随系统）" },
      { key: "json:dark", label: "强制深色", hint: "theme: 'dark'" },
      { key: "json:expand", label: "默认展开两层", hint: "collapsed: 2" },
    ],
    stageHeight: 480,
  },
  {
    id: "xml",
    dir: "XmlPreviewPlugin",
    title: "XML / RSS 树",
    en: "XML",
    group: "data",
    oneLiner: "XML / RSS / Atom / KML 共用一套树视图。",
    why: "对接老系统、订阅源调试、地图数据。带行号与折叠，比在记事本里数尖括号快得多。",
    files: ["sample.xml", "sample.rss"],
    variants: [
      { key: "xml", label: "默认（展开 2 层）" },
      { key: "xml:flat", label: "全部展开", hint: "collapsedLevels: 0" },
    ],
    stageHeight: 480,
  },
  {
    id: "xlsx",
    dir: "XlsxPreviewPlugin",
    title: "XLSX 表格",
    en: "XLSX",
    group: "data",
    oneLiner: "多 Sheet 离线解析，不用装 Excel 也不上传到第三方。",
    why: "对账、导入前的数据核对。SheetJS 在浏览器里直接解 OOXML，文件不出内网 —— 这一点比「上传到在线预览服务」重要得多。",
    files: ["sample.xlsx"],
    variants: [
      { key: "xlsx", label: "默认（首个 Sheet）" },
      { key: "xlsx:rows", label: "只渲染前 20 行", hint: "maxRows: 20，超大表的截断策略" },
    ],
    stageHeight: 480,
  },
  {
    id: "csv",
    dir: "CsvPreviewPlugin",
    title: "CSV / TSV 表格",
    en: "CSV",
    group: "data",
    oneLiner: "分隔符和编码自动认，GBK 的表打开不是乱码。",
    why: "财务导出的表常年是 GBK + 分号；Excel 另存的 TSV 是 Tab。认错了就是「整张表只有一列」或者满屏乱码，用户会以为文件坏了。",
    files: [
      "sample-data.csv",
      "sample-data-semicolon.csv",
      "sample-data-pipe.csv",
      "sales-data.tsv",
      "gbk-data.csv",
      "mixed-data.csv",
    ],
    variants: [
      { key: "csv", label: "默认（每页 50 行）" },
      { key: "csv:page10", label: "每页 10 行", hint: "pageSize: 10，分页器立刻有得点" },
    ],
    stageHeight: 480,
    note: "页脚会写「分隔符 |」这类识别结果；工具栏的分隔符下拉在自动模式下显示「自动」。查问题时两处都要看。",
  },
  {
    id: "zip",
    dir: "ZipPreviewPlugin",
    title: "ZIP 目录",
    en: "ZIP",
    group: "archive",
    oneLiner: "不下载也能看见压缩包里有什么。",
    why: "用户上传的交付包、日志打包、素材包。先看目录再决定要不要下 —— 尤其是几 GB 的包。",
    files: ["sample.zip"],
    variants: [
      { key: "zip", label: "默认" },
      { key: "zip:slim", label: "不显示大小", hint: "showFileSize: false" },
    ],
    stageHeight: 480,
  },
  {
    id: "code",
    dir: "CodePreviewPlugin",
    title: "代码高亮",
    en: "CODE",
    group: "code",
    oneLiner: "100+ 语言、两套主题 —— 41 套主题的桶曾拖出 792KB。",
    why: "代码评审、工单里贴的脚本、配置文件。语言按扩展名判，主题跟随系统，偏好存 localStorage（可关）。",
    files: ["sample.ts", "sample.js", "sample.tsx", "sample.vue", "sample.css", "sample.html"],
    variants: [
      { key: "code", label: "默认（跟随系统）" },
      { key: "code:dark", label: "强制深色", hint: "theme: 'dark'" },
      { key: "code:noline", label: "不要行号", hint: "showLineNumbers: false" },
    ],
    stageHeight: 480,
    note: "迁移前把 41 套 prism 主题全打进包，单主题桶就有 792KB。现在只留 one-light + vsc-dark-plus，用 auto 跟随 prefers-color-scheme。",
  },
  {
    id: "download",
    dir: "DownloadPlugin",
    title: "兜底下载",
    en: "FALLBACK",
    group: "fallback",
    oneLiner: "谁都认不了的时候，至少让文件下得下来。",
    why: "priority 排最后、认领一切。没有它，未声明支持的格式会落到一片空白 —— 用户连文件名都看不到。",
    files: ["sample.docx", "sample.xlsx", "sample.pptx"],
    variants: [
      { key: "download", label: "默认" },
      { key: "download:nosize", label: "不显示文件信息", hint: "showFileInfo: false" },
    ],
    stageHeight: 320,
    note: "这一页只装 DownloadPlugin 一个插件，所以连 .docx 也会落到它手里 —— 这正是兜底的意义。想看正常的 docx 渲染请去「DOCX · 版式」那页。",
  },
];

// ============ doc.json（eager，构建期就固定） ============

const docs = import.meta.glob("../../../src/custom-plugins/*/doc.json", {
  eager: true,
  import: "default",
}) as Record<string, PluginDoc>;

const docOf = (dir: string): PluginDoc | undefined => {
  const key = Object.keys(docs).find((k) => k.endsWith(`/${dir}/doc.json`));
  return key ? docs[key] : undefined;
};

export interface PluginEntry extends PluginMeta {
  doc: PluginDoc;
  /** 工厂名，如 createImagePreviewPlugin */
  factoryName: string;
  factory: (config?: Record<string, unknown>) => unknown;
  /**
   * 默认档在 `PREVIEWS` 里的键 —— 取 `variants[0].key`，**不是 `id`**。
   * 工坊卡与覆盖率检查都走这个字段。
   */
  defaultKey: string;
}

/**
 * 17 个插件。
 * `doc.json` 缺一个就直接抛 —— 演示站少一张卡是「静默降级」，很难在截图里发现。
 */
export const PLUGINS: PluginEntry[] = META.map((meta) => {
  const doc = docOf(meta.dir);
  if (!doc) {
    throw new Error(
      `[demo] 找不到 ${meta.dir}/doc.json —— doc.json 是演示站的唯一事实来源，不允许缺失`
    );
  }
  const factoryName = `create${doc.name}`;
  const factory = (BUCKET as Record<string, unknown>)[factoryName];
  if (typeof factory !== "function") {
    throw new Error(`[demo] vane-file-preview/custom-plugins 没有导出 ${factoryName}`);
  }
  return {
    ...meta,
    doc,
    factoryName,
    factory: factory as PluginEntry["factory"],
    defaultKey: meta.variants[0].key,
  };
});

export const PLUGINS_BY_GROUP: Record<PluginGroup, PluginEntry[]> = {
  media: [],
  document: [],
  data: [],
  archive: [],
  code: [],
  fallback: [],
};
for (const p of PLUGINS) PLUGINS_BY_GROUP[p.group].push(p);

export function getPlugin(id: string): PluginEntry | undefined {
  return PLUGINS.find((p) => p.id === id);
}

/** 编号：01…17，跟着 META 顺序，不跟分组 */
export function folioOf(id: string): string {
  const i = PLUGINS.findIndex((p) => p.id === id);
  return i < 0 ? "??" : String(i + 1).padStart(2, "0");
}

/** 覆盖率闸门用：断言「17 个插件都被 META 覆盖」 */
export const PLUGIN_COUNT = PLUGINS.length;
