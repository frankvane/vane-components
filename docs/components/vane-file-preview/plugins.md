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

## 四条能力边界（必读）

17 个插件里有些「不是你想的那个东西」，踩过的人最多。下面四条先读：

### 1. Office 在线预览需要公网 URL

`OfficePreviewPlugin` 的原理是「微软 / 谷歌的查看器服务器去拉你的 URL」，所以
**localhost 与内网地址一律不可用**，这是设计不是 bug。iframe 的 `onError` 对跨域加载失败
**不会触发**，无法自动探测「查看器挂了」并降级 —— 迁移前那段自动切 Google 的逻辑是死代码，
现已改成手动按钮。不想依赖公网时，改用本地解析插件（Mammoth / Docx / Xlsx / Pptx）。

### 2. PPTX 只出文本大纲，不是渲染器

`PptxPreviewPlugin` 解包 `ppt/slides/*.xml`，抽每页文字按页翻看。**没有版式、没有图片、没有动画**。
还原版式（drawingml）是另一个项目的体量，本插件只承诺「把文字按页抽出来」。标题判定是启发式的，
必然有误判，别指望它当排版校对工具。要保真请走 Office 在线预览。

### 3. EPUB 引入 200KB+ 的强制依赖

`EpubPreviewPlugin` 依赖 `react-reader`（含 epub.js），**本包最重的可选依赖**。所以它不在根入口、
也不在 `./plugins`，只能显式 `import { createEpubPreviewPlugin } from "vane-file-preview/custom-plugins/EpubPreviewPlugin"`。
阅读位置不持久化：关掉再打开回到起始位置，要记住进度由宿主监听 `locationChanged` 自己存，
再通过 `startLocation` 传回（组件自己写 localStorage 会让不同用户的进度互相覆盖）。

### 4. DOCX 两种模式二选一，默认走语义 HTML

DOCX 有两个实现，**靠 `file.docxMode` 互斥路由，不靠 priority 抢**：

- `MammothDocxPlugin`（默认，`docxMode` 未设置或为 `"mammoth"`）：标题 / 段落 / 列表 / 表格转成
  干净语义标签，**不还原版式**（无分页、页边距、字号、页眉页脚、颜色）。这是 mammoth 的设计取向。
- `DocxPreviewPlugin`（`docxMode === "docx-preview"`）：分页、页边距、字号、表格边框按 OOXML 还原，
  产物是带内联样式的 DOM 树，比 mammoth 大一个量级，长文档首屏可能几百毫秒。

要还原版式必须**显式**声明 `file.docxMode = "docx-preview"` 并装 `docx-preview`，否则只装了
`docx-preview` 也永远看不到它的结果（赢家仍是 mammoth）。

## 目录（自动生成）

<!-- AUTO-GENERATED:BEGIN priority -->
| 插件 | priority | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- | --- |
| [AudioPreviewPlugin](#audiopreviewplugin) | 10 | 音频预览：原生 &lt;audio&gt; + 渐变卡片（图标 + 文件名 + 控件），适合没有封面的纯音频。零依赖。 | `controls` = true<br/>`autoplay` = false<br/>`loop` = false<br/>`preload` = "metadata" | 2.0.0 | media, audio, 音视频 |
| [CodePreviewPlugin](#codepreviewplugin) | 4 | 代码预览：prism 语法高亮（100+ 语言）、两套主题 + 跟随系统、行号 / 换行、复制与下载。依赖 react-syntax-highlighter（optional peer）。 | `showLineNumbers` = true<br/>`wrapLongLines` = false<br/>`enableCopy` = true<br/>`enableLanguageSelection` = true<br/>`enableThemeSelection` = true<br/>`theme` = "auto"<br/>`storage` = true<br/>`maxBytes` = 2097152<br/>`maxFileSize` = 20971520 | 2.0.0 | code, syntax-highlight, 代码, text |
| [CsvPreviewPlugin](#csvpreviewplugin) | 8 | CSV / TSV 表格预览：分页、搜索、排序、列宽拖拽、导出当前结果。自动识别 GBK 编码与分隔符。依赖 papaparse（optional peer）。 | `pageSize` = 50<br/>`maxPreviewRows` = 1000<br/>`enableSearch` = true<br/>`enableExport` = true<br/>`maxFileSize` = 20971520 | 2.0.0 | csv, table, 表格, data |
| [DocxPreviewPlugin](#docxpreviewplugin) | 8 | DOCX 版式还原预览：分页、页边距、字号、表格边框按文档里的 OOXML 来。依赖 docx-preview（optional peer）。 | `enabled` = true<br/>`breakPages` = true<br/>`renderHeaders` = true | 2.0.0 | document, docx, word, office |
| [DownloadPlugin](#downloadplugin) | - | 兜底插件：认领所有文件（priority -1 排最后），给出「这种格式预览不了，但可以下载」的卡片。零依赖。 | `autoDownload` = false<br/>`showFileInfo` = true | 2.0.0 | other, fallback, 下载 |
| [EpubPreviewPlugin](#epubpreviewplugin) | 8 | EPUB 电子书预览，基于 react-reader（epub.js）：目录抽屉、翻页、进度记忆（由宿主控制）。依赖 react-reader（optional peer，约 200KB+）。 | `showToc` = true<br/>`swipeable` = false<br/>`startLocation` = - | 2.0.0 | epub, ebook, 电子书, document |
| [ImagePreviewPlugin](#imagepreviewplugin) | 10 | 图片预览：原生 &lt;img&gt; 承载，工具栏提供缩放（±20%）、旋转（+90°）、复位与下载；双击图片也可复位。零依赖。 | `enableZoom` = true<br/>`enableRotate` = true<br/>`maxZoom` = 5<br/>`minZoom` = 0.1 | 2.0.0 | media, image, 图片 |
| [JsonPreviewPlugin](#jsonpreviewplugin) | 6 | JSON 树视图：折叠 / 展开、关键字搜索 + 路径复制、导出格式化 JSON，跟随系统深浅色。依赖 @uiw/react-json-view（optional peer）。 | `maxFileSize` = 5242880<br/>`enableSearch` = true<br/>`enableCopy` = true<br/>`theme` = "auto"<br/>`collapsed` = 0 | 2.0.0 | data, json, 结构化数据 |
| [MammothDocxPlugin](#mammothdocxplugin) | 8 | DOCX 语义 HTML 预览（默认的 docx 实现）：标题 / 段落 / 列表 / 表格转成干净语义标签。依赖 mammoth（optional peer）。 | `withDefaultStyle` = true<br/>`enabled` = true | 2.0.0 | document, docx, word, office |
| [MarkdownPreviewPlugin](#markdownpreviewplugin) | 9 | Markdown 预览：GFM 表格 / 任务列表 / 删除线、行内换行、代码高亮，可切原文与主题。依赖 react-markdown（optional peer）。 | `showRaw` = true<br/>`enableGfm` = true<br/>`enableBreaks` = true<br/>`enableSyntaxHighlight` = true<br/>`allowHtml` = false<br/>`theme` = "auto"<br/>`remarkPlugins` = -<br/>`rehypePlugins` = - | 2.0.0 | markdown, document, 文档, text |
| [OfficePreviewPlugin](#officepreviewplugin) | 7 | Office 文档（doc/docx/xls/xlsx/ppt/pptx）在线预览：走 Microsoft Office Online 或 Google Docs Viewer。要求文件 URL 公网可达。零依赖。 | `viewer` = "auto"<br/>`showToolbar` = true<br/>`preferDocxOnline` = false<br/>`iframeSandbox` = "allow-scripts allow-same-origin allow-popups allow-forms"<br/>`iframeReferrerPolicy` = "no-referrer" | 2.0.0 | document, office, docx, xlsx, pptx, 文档 |
| [PdfPreviewPlugin](#pdfpreviewplugin) | 10 | PDF 预览：交给浏览器内置 PDF 查看器（带最小权限 sandbox 的 &lt;iframe&gt;），不引 pdfjs。零依赖。 | `useIframe` = true<br/>`enableToolbar` = true<br/>`sandbox` = "allow-scripts"<br/>`referrerPolicy` = "no-referrer" | 2.0.0 | document, pdf, 文档 |
| [PptxPreviewPlugin](#pptxpreviewplugin) | 8 | PPTX 文本大纲预览：解包 ppt/slides/*.xml，抽每页文字，按页翻看。无版式、无图片。依赖 jszip（optional peer）。 | `maxParagraphsPerSlide` = 40<br/>`maxFileSize` = 52428800 | 2.0.0 | document, pptx, slides, 幻灯片 |
| [VideoPreviewPlugin](#videopreviewplugin) | 10 | 视频预览：原生 &lt;video&gt;，支持控件/自动播放/循环/静音/预加载策略。零依赖。 | `controls` = true<br/>`autoplay` = false<br/>`loop` = false<br/>`muted` = false<br/>`preload` = "metadata" | 2.0.0 | media, video, 音视频 |
| [XlsxPreviewPlugin](#xlsxpreviewplugin) | 8 | XLSX / XLSM / XLS 离线解析成表格，多 Sheet 页签切换，超大表按行列上限截断。依赖 xlsx（SheetJS，optional peer）。 | `defaultSheetIndex` = 0<br/>`maxRows` = 200<br/>`maxCols` = 50<br/>`maxFileSize` = 20971520 | 2.0.0 | document, spreadsheet, excel, 表格 |
| [XmlPreviewPlugin](#xmlpreviewplugin) | 6 | XML / RSS / Atom / KML 源码树视图：可折叠、带行号、可复制全文。依赖 react-xml-viewer（optional peer）。 | `maxFileSize` = 10485760<br/>`enableSearch` = true<br/>`enableCopy` = true<br/>`theme` = "auto"<br/>`collapsedLevels` = 2 | 2.0.0 | data, xml, rss, 结构化数据 |
| [ZipPreviewPlugin](#zippreviewplugin) | 9 | 压缩包条目列表：解出 zip 内部结构，目录在前、文件在后，显示未压缩大小。依赖 jszip（optional peer）。 | `showFileSize` = true<br/>`maxFiles` = 200<br/>`maxFileSize` = 52428800 | 2.0.0 | archive, zip, 压缩包, data |

## 插件能力明细

### AudioPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `controls` | `boolean` | `true` | 显示浏览器原生播放控件 |
| `autoplay` | `boolean` | `false` | 自动播放；多数浏览器会拦下非静音自动播放 |
| `loop` | `boolean` | `false` | 循环播放 |
| `preload` | `"none" \| "metadata" \| "auto"` | `metadata` | 预加载策略 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `reportState` | `ctx.reportState(patch: PreviewStatePatch): void` | 上报预览状态（唯一写入路径，由内核转发给 Core） |

### CodePreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showLineNumbers` | `boolean` | `true` | 显示行号 |
| `wrapLongLines` | `boolean` | `false` | 长行自动换行（默认横滚，避免破坏缩进对齐） |
| `enableCopy` | `boolean` | `true` | 工具栏显示「复制」按钮。复制走 navigator.clipboard，失败时退到 execCommand |
| `enableLanguageSelection` | `boolean` | `true` | 工具栏显示语言下拉（100+ 种语言） |
| `enableThemeSelection` | `boolean` | `true` | 工具栏显示主题下拉（跟随系统 / One Light / VS Code Dark+） |
| `theme` | `"auto" \| "light" \| "dark"` | `auto` | 初始主题。auto 按 prefers-color-scheme 解析成亮 / 暗 |
| `storage` | `boolean` | `true` | 把主题 / 行号 / 语言偏好写进 localStorage（键前缀 vane-file-preview:）。false 时完全不碰存储 |
| `maxBytes` | `number` | `2097152` | 超过这个大小时不做高亮、退化成纯文本（prism 是同步 CPU 活，2MB 压缩代码能卡住主线程好几秒）。0 表示不限制 |
| `maxFileSize` | `number` | `20971520` | 超过这个字节数直接拒绝读取（fetch 之前按 file.size 拦截）。maxBytes 只是「不亮但仍显示」，这一项是读也读不完的硬闸门。0 表示不限制 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### CsvPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pageSize` | `number` | `50` | 每页行数 |
| `maxPreviewRows` | `number` | `1000` | 最多解析多少数据行（不含表头），超出在页脚提示。避免几万行的表一次性产出几十万个单元格 |
| `enableSearch` | `boolean` | `true` | 工具栏显示搜索框（全单元格包含匹配） |
| `enableExport` | `boolean` | `true` | 页脚显示「导出当前结果」（导出的是过滤 + 排序后的内容，与所见一致） |
| `maxFileSize` | `number` | `20971520` | 超过这个字节数直接拒绝读取（fetch 之前按 file.size 拦截），避免整表进内存。0 表示不限制 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DocxPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 整个插件开关；关掉后 .docx 交给 MammothDocxPlugin 或 OfficePreviewPlugin |
| `breakPages` | `boolean` | `true` | 分页显示（页与页之间留白），false 时连成一片连续内容 |
| `renderHeaders` | `boolean` | `true` | 同时渲染页眉与页脚 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `canHandle` | 内核询问「谁能预览这个文件」时（按优先级依次询问） | 返回 true 表示认领该文件；返回 false / undefined 表示不处理 |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### DownloadPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `autoDownload` | `boolean` | `false` | 打开文件后立即触发一次下载（按 URL 去重，换文件才重来） |
| `showFileInfo` | `boolean` | `true` | 卡片里显示文件名 / MIME / 大小 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `canHandle` | 内核询问「谁能预览这个文件」时（按优先级依次询问） | 返回 true 表示认领该文件；返回 false / undefined 表示不处理 |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### EpubPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showToc` | `boolean` | `true` | 显示目录抽屉（react-reader 左上角的 ☰） |
| `swipeable` | `boolean` | `false` | 允许左右滑动翻页。桌面端默认关闭：滚动阅读时很容易误触翻页 |
| `startLocation` | `string` | `-` | 起始位置（EPUB CFI）。配合宿主持久化的阅读进度使用 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ImagePreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enableZoom` | `boolean` | `true` | 显示缩放按钮；同时决定鼠标是否为 zoom-in 光标 |
| `enableRotate` | `boolean` | `true` | 显示旋转按钮（每次 +90°，到 360° 归零） |
| `maxZoom` | `number` | `5` | 缩放上限，同时用于禁用「+」按钮 |
| `minZoom` | `number` | `0.1` | 缩放下限，同时用于禁用「−」按钮 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `forceUpdate` | `ctx.forceUpdate(): void` | 主动触发宿主重渲染；改了闭包里的可变状态后必须调用，否则视图不刷新 |
| `reportState` | `ctx.reportState(patch: PreviewStatePatch): void` | 上报预览状态（唯一写入路径，由内核转发给 Core） |

### JsonPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxFileSize` | `number` | `5242880` | 超过这个字节数直接拒绝渲染（5MB）。在 fetch 之前按 file.size 拦，不等 JSON.parse |
| `enableSearch` | `boolean` | `true` | 顶部搜索框：同时匹配键名与字符串/数字值，命中项可一键复制 JS 访问路径 |
| `enableCopy` | `boolean` | `true` | 节点内的复制按钮（交给 JsonView 的 enableClipboard） |
| `theme` | `"auto" \| "light" \| "dark"` | `auto` | auto 跟随 prefers-color-scheme 并监听变化；只剩两套配色，不再提供 nord / monokai 等九选一 |
| `collapsed` | `number` | `0` | 初始折叠层级：0 = 全展开，1 = 只展开根，以此类推 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### MammothDocxPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `withDefaultStyle` | `boolean` | `true` | 附带 mammoth 的默认样式映射（标题、列表、表格、粗斜体）；关掉只保留最原始的段落 |
| `enabled` | `boolean` | `true` | 整个插件开关；关掉后 .docx 交给 DocxPreviewPlugin（需 docxMode）或 OfficePreviewPlugin |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `canHandle` | 内核询问「谁能预览这个文件」时（按优先级依次询问） | 返回 true 表示认领该文件；返回 false / undefined 表示不处理 |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### MarkdownPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showRaw` | `boolean` | `true` | 工具栏显示「原文 / 预览」切换 |
| `enableGfm` | `boolean` | `true` | 启用 remark-gfm：表格、任务列表、删除线、自动链接 |
| `enableBreaks` | `boolean` | `true` | 启用 remark-breaks：单个换行也渲染成 &lt;br&gt;（中文写作习惯） |
| `enableSyntaxHighlight` | `boolean` | `true` | 启用 rehype-highlight：围栏代码块按语言高亮 |
| `allowHtml` | `boolean` | `false` | 是否渲染 Markdown 里的原始 HTML（开启 rehype-raw）。默认关闭，这是 XSS 面 |
| `theme` | `"auto" \| "light" \| "dark"` | `auto` | 初始主题。auto 按 prefers-color-scheme 解析 |
| `remarkPlugins` | `unknown[]` | `-` | 追加 remark 插件（例如自己装 remark-math 做公式） |
| `rehypePlugins` | `unknown[]` | `-` | 追加 rehype 插件（例如自己装 rehype-katex 渲染公式） |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### OfficePreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `viewer` | `"microsoft" \| "google" \| "auto"` | `auto` | auto 默认微软查看器，右下角可手动切到 Google |
| `showToolbar` | `boolean` | `true` | 工具栏里显示下载按钮 |
| `preferDocxOnline` | `boolean` | `false` | true 时 docx 优先级提到 9，压过本地解析插件（8）；xlsx/pptx 不受影响 |
| `iframeSandbox` | `string` | `allow-scripts allow-same-origin allow-popups allow-forms` | 查看器 iframe 的 sandbox 策略。查看器是第三方跨源页面，allow-same-origin 只作用于它自己的源，不等同于放开宿主源；要收紧可删掉 allow-scripts |
| `iframeReferrerPolicy` | `"no-referrer" \| ...` | `no-referrer` | 查看器 iframe 的 referrerPolicy，默认不把宿主页面地址带给查看器 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `priorityOf` | 内核为该文件计算候选插件优先级时 | 按文件类型动态算优先级，覆盖声明式 priority（同一插件在不同类型间排序不同） |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PdfPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `useIframe` | `boolean` | `true` | 兼容保留。已不再渲染 &lt;embed&gt;（embed 不支持 sandbox，无法建立安全边界），两种取值都走同一个带 sandbox 的 &lt;iframe&gt; |
| `enableToolbar` | `boolean` | `true` | false 时给 URL 追加 #toolbar=0&amp;navpanes=0&amp;scrollbar=0 尽量隐藏查看器 UI（Chromium 系有效），并在插件工具栏补回缩放控件 |
| `sandbox` | `string \| false` | `allow-scripts` | iframe 的 sandbox 策略。默认不含 allow-same-origin（两者组合等于没有 sandbox）。只有文件来源完全可信时才传 false 或更宽的策略 |
| `referrerPolicy` | `"no-referrer" \| ...` | `no-referrer` | iframe 的 referrerPolicy，默认不把宿主页面地址带给文件源 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### PptxPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxParagraphsPerSlide` | `number` | `40` | 单页最多展示多少段，超出截断（防止一页塞了整个讲稿时把整块区域撑爆） |
| `maxFileSize` | `number` | `52428800` | 超过这个字节数直接拒绝读取（fetch 之前按 file.size 拦截）：jszip 解包需要把整个文件读进内存。0 表示不限制 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### VideoPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `controls` | `boolean` | `true` | 显示浏览器原生播放控件 |
| `autoplay` | `boolean` | `false` | 自动播放；未同时开 muted 时会被浏览器策略拦下 |
| `loop` | `boolean` | `false` | 循环播放 |
| `muted` | `boolean` | `false` | 静音；自动播放通常要求它为 true |
| `preload` | `"none" \| "metadata" \| "auto"` | `metadata` | 预加载策略；metadata 只取时长与首帧，省流量 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `reportState` | `ctx.reportState(patch: PreviewStatePatch): void` | 上报预览状态（唯一写入路径，由内核转发给 Core） |

### XlsxPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `defaultSheetIndex` | `number` | `0` | 默认打开第几个 sheet（从 0 开始），会按 sheet 数量夹紧 |
| `maxRows` | `number` | `200` | 最多渲染多少行；超出按 !ref 裁 range 并显示「只渲染了前 N 行」告警 |
| `maxCols` | `number` | `50` | 最多渲染多少列 |
| `maxFileSize` | `number` | `20971520` | 超过这个字节数直接拒绝读取（fetch 之前按 file.size 拦截）：SheetJS 解析会把整个工作簿放进内存。0 表示不限制 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `forceUpdate` | `ctx.forceUpdate(): void` | 主动触发宿主重渲染；改了闭包里的可变状态后必须调用，否则视图不刷新 |

### XmlPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxFileSize` | `number` | `10485760` | 超过这个字节数直接拒绝渲染（10MB） |
| `enableSearch` | `boolean` | `true` | 顶部搜索框：只统计命中行数，不做高亮（查看器不支持） |
| `enableCopy` | `boolean` | `true` | 顶部「复制全文」按钮 |
| `theme` | `"auto" \| "light" \| "dark"` | `auto` | auto 跟随系统 prefers-color-scheme 并监听变化 |
| `collapsedLevels` | `number` | `2` | 初始折叠层级，传给查看器的 initialCollapsedDepth |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

### ZipPreviewPlugin

**属性 Props**

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `showFileSize` | `boolean` | `true` | 每一项右侧显示未压缩大小。拿不到时显示「—」而不是 0 |
| `maxFiles` | `number` | `200` | 最多列出多少项，超出只提示总数（一个 5000 文件的包铺 5000 个节点会卡） |
| `maxFileSize` | `number` | `52428800` | 超过这个字节数直接拒绝读取（fetch 之前按 file.size 拦截）：jszip 解包需要把整个压缩包读进内存。0 表示不限制 |

**事件 Events**

| 事件 | 触发时机 | 说明 |
| --- | --- | --- |
| `render` | 本插件认领文件后，渲染预览主体 | 输出该文件类型的预览 UI（图片 / 视频 / PDF / Office / 文本等） |
| `renderToolbar` | 每次渲染，内容区顶部工具栏（内核侧桥接到 renderHeader） | 缩放、翻页、下载、全屏等预览操作 |

**方法 Methods**

只读取 context 字段（props / state / data），不调用上下文方法

<!-- AUTO-GENERATED:END -->
