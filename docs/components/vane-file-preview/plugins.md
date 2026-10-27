# 插件

17 个插件，五组。**每个目录下有一份 `doc.json` 作为文档真相** —— 下面的表由
`pnpm docs:plugins` 从 `doc.json` 与源码里的 `priority` 生成，改配置项时改 `doc.json`，
别手改表。

只出 6 个零重依赖插件的入口是 `vane-file-preview/plugins`（Image / Pdf / Video /
Audio / Download / Office）；根入口 `vane-file-preview` 已经包含它们，其余 11 个走子路径。

| 组 | 数量 | 一句话 | 成员 |
| --- | --- | --- | --- |
| media | 3 | 原生标签，零依赖 | Image / Video / Audio |
| document | 7 | 文档与排版，多数要装 peer | Pdf / Office / Docx / MammothDocx / Pptx / Markdown / Epub |
| data | 4 | 结构化数据，解析器是 peer | Json / Xml / Xlsx / Csv |
| archive | 1 | 只列条目，不解压 | Zip |
| other | 2 | 兜底的高亮与下载 | Code / Download |

## 路由：为什么 priority 必须留空档

`resolvePreview` 在「同 priority」时会退到**声明顺序**。这条规则不是理论问题 ——
迁移期间 `.docx` 因为 Office / Mammoth / DocxPreview 三个都是 7，把 Office 挪到数组
第一位就换了渲染器，而当时没有任何测试会红。现在：

- `.docx`：`canHandle` 互斥（`file.docxMode` 决定），且 DocxPreview 提到 8
- `.csv`：Csv 8 / Code 4 —— Code 认领 `text/plain` 与大量扩展名，必须压在下面
- `.md`：Markdown 9 / Code 4，且 Code **不再声明** `.md`
- `.rar` / `.7z`：没有任何插件认领，落到兜底下载（Zip 只认 `.zip`，jszip 解不开别的容器）
- `.txt`：归 Code。迁移前 Csv 声明了 `text/plain` + `.txt`，打开 README.txt 得到「表格是空的」

`test/routing-all.test.ts` 把 30 种真实文件 × 17 个插件跑了两遍（正序 + 反转），
赢家必须一致 —— 那条断言就是「别让隐式规则决定渲染器」的机器化版本。

## 依赖缺失的降级路径

重依赖全部 `import()` 动态加载。缺失时不是崩溃、不是白屏，而是
`shared/panels.tsx` 的 `MissingDependency`：包名、`npm i <pkg>`、备选方案
（例如 mammoth 缺失时提示改用 docx-preview）、折叠的错误原文。

对应约束：**`render` / `renderToolbar` 里不许有 hooks**。它们是普通函数，装配层直接
`winner.hooks.render(ctx)` 调用；在里面 `useState` 会把 hook 注册到 `withPlugins` 上，
赢家一换就抛 “Rendered fewer hooks than expected”。需要状态的正文/工具栏各自包成组件。

## 目录（自动生成）

<!-- AUTO-GENERATED:BEGIN priority -->
| 插件 | priority | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- | --- |
| [AudioPreviewPlugin](./AudioPreviewPlugin) | 10 | 音频预览：原生 <audio> + 渐变卡片（图标 + 文件名 + 控件），适合没有封面的纯音频。零依赖。 | `controls` = true<br/>`autoplay` = false<br/>`loop` = false<br/>`preload` = "metadata" | 2.0.0 | media, audio, 音视频 |
| [CodePreviewPlugin](./CodePreviewPlugin) | 4 | 代码预览：prism 语法高亮（100+ 语言）、两套主题 + 跟随系统、行号 / 换行、复制与下载。依赖 react-syntax-highlighter（optional peer）。 | `showLineNumbers` = true<br/>`wrapLongLines` = false<br/>`enableCopy` = true<br/>`enableLanguageSelection` = true<br/>`enableThemeSelection` = true<br/>`theme` = "auto"<br/>`storage` = true<br/>`maxBytes` = 2097152 | 2.0.0 | code, syntax-highlight, 代码, text |
| [CsvPreviewPlugin](./CsvPreviewPlugin) | 8 | CSV / TSV 表格预览：分页、搜索、排序、列宽拖拽、导出当前结果。自动识别 GBK 编码与分隔符。依赖 papaparse（optional peer）。 | `pageSize` = 50<br/>`maxPreviewRows` = 1000<br/>`enableSearch` = true<br/>`enableExport` = true | 2.0.0 | csv, table, 表格, data |
| [DocxPreviewPlugin](./DocxPreviewPlugin) | 8 | DOCX 版式还原预览：分页、页边距、字号、表格边框按文档里的 OOXML 来。依赖 docx-preview（optional peer）。 | `enabled` = true<br/>`breakPages` = true<br/>`renderHeaders` = true | 2.0.0 | document, docx, word, office |
| [DownloadPlugin](./DownloadPlugin) | - | 兜底插件：认领所有文件（priority -1 排最后），给出「这种格式预览不了，但可以下载」的卡片。零依赖。 | `autoDownload` = false<br/>`showFileInfo` = true | 2.0.0 | other, fallback, 下载 |
| [EpubPreviewPlugin](./EpubPreviewPlugin) | 8 | EPUB 电子书预览，基于 react-reader（epub.js）：目录抽屉、翻页、进度记忆（由宿主控制）。依赖 react-reader（optional peer，约 200KB+）。 | `showToc` = true<br/>`swipeable` = false<br/>`startLocation` = - | 2.0.0 | epub, ebook, 电子书, document |
| [ImagePreviewPlugin](./ImagePreviewPlugin) | 10 | 图片预览：原生 <img> 承载，工具栏提供缩放（±20%）、旋转（+90°）、复位与下载；双击图片也可复位。零依赖。 | `enableZoom` = true<br/>`enableRotate` = true<br/>`maxZoom` = 5<br/>`minZoom` = 0.1 | 2.0.0 | media, image, 图片 |
| [JsonPreviewPlugin](./JsonPreviewPlugin) | 6 | JSON 树视图：折叠 / 展开、关键字搜索 + 路径复制、导出格式化 JSON，跟随系统深浅色。依赖 @uiw/react-json-view（optional peer）。 | `maxFileSize` = 5242880<br/>`enableSearch` = true<br/>`enableCopy` = true<br/>`theme` = "auto"<br/>`collapsed` = 0 | 2.0.0 | data, json, 结构化数据 |
| [MammothDocxPlugin](./MammothDocxPlugin) | 8 | DOCX 语义 HTML 预览（默认的 docx 实现）：标题 / 段落 / 列表 / 表格转成干净语义标签。依赖 mammoth（optional peer）。 | `withDefaultStyle` = true<br/>`enabled` = true | 2.0.0 | document, docx, word, office |
| [MarkdownPreviewPlugin](./MarkdownPreviewPlugin) | 9 | Markdown 预览：GFM 表格 / 任务列表 / 删除线、行内换行、代码高亮，可切原文与主题。依赖 react-markdown（optional peer）。 | `showRaw` = true<br/>`enableGfm` = true<br/>`enableBreaks` = true<br/>`enableSyntaxHighlight` = true<br/>`allowHtml` = false<br/>`theme` = "auto"<br/>`remarkPlugins` = -<br/>`rehypePlugins` = - | 2.0.0 | markdown, document, 文档, text |
| [OfficePreviewPlugin](./OfficePreviewPlugin) | 7 | Office 文档（doc/docx/xls/xlsx/ppt/pptx）在线预览：走 Microsoft Office Online 或 Google Docs Viewer。要求文件 URL 公网可达。零依赖。 | `viewer` = "auto"<br/>`showToolbar` = true<br/>`preferDocxOnline` = false | 2.0.0 | document, office, docx, xlsx, pptx, 文档 |
| [PdfPreviewPlugin](./PdfPreviewPlugin) | 10 | PDF 预览：交给浏览器内置 PDF 查看器（<iframe> 或 <embed>），不引 pdfjs。零依赖。 | `useIframe` = true<br/>`enableToolbar` = true | 2.0.0 | document, pdf, 文档 |
| [PptxPreviewPlugin](./PptxPreviewPlugin) | 8 | PPTX 文本大纲预览：解包 ppt/slides/*.xml，抽每页文字，按页翻看。无版式、无图片。依赖 jszip（optional peer）。 | `maxParagraphsPerSlide` = 40 | 2.0.0 | document, pptx, slides, 幻灯片 |
| [VideoPreviewPlugin](./VideoPreviewPlugin) | 10 | 视频预览：原生 <video>，支持控件/自动播放/循环/静音/预加载策略。零依赖。 | `controls` = true<br/>`autoplay` = false<br/>`loop` = false<br/>`muted` = false<br/>`preload` = "metadata" | 2.0.0 | media, video, 音视频 |
| [XlsxPreviewPlugin](./XlsxPreviewPlugin) | 8 | XLSX / XLSM / XLS 离线解析成表格，多 Sheet 页签切换，超大表按行列上限截断。依赖 xlsx（SheetJS，optional peer）。 | `defaultSheetIndex` = 0<br/>`maxRows` = 200<br/>`maxCols` = 50 | 2.0.0 | document, spreadsheet, excel, 表格 |
| [XmlPreviewPlugin](./XmlPreviewPlugin) | 6 | XML / RSS / Atom / KML 源码树视图：可折叠、带行号、可复制全文。依赖 react-xml-viewer（optional peer）。 | `maxFileSize` = 10485760<br/>`enableSearch` = true<br/>`enableCopy` = true<br/>`theme` = "auto"<br/>`collapsedLevels` = 2 | 2.0.0 | data, xml, rss, 结构化数据 |
| [ZipPreviewPlugin](./ZipPreviewPlugin) | 9 | 压缩包条目列表：解出 zip 内部结构，目录在前、文件在后，显示未压缩大小。依赖 jszip（optional peer）。 | `showFileSize` = true<br/>`maxFiles` = 200 | 2.0.0 | archive, zip, 压缩包, data |
<!-- AUTO-GENERATED:END -->
