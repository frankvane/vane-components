# Changelog

## 2.0.0

vane-file-preview 2.0.0：内核换成 `@vane/plugin-core`，依赖全部 optional peer，对外契约基本兼容。

### 破坏性变更

- **依赖结构重写**：`dependencies` 清空，16 个解析库全部改为 `peerDependenciesMeta.*.optional`。预览某类文件前必须自行安装对应 peer（如 `jszip` / `xlsx` / `mammoth` / `docx-preview` / `react-markdown` / `react-syntax-highlighter` / `papaparse` / `@uiw/react-json-view` / `react-xml-viewer` / `react-reader` …），否则渲染 `MissingDependency` 安装提示面板（不白屏）。
- **导出形态改多入口**：根入口 `vane-file-preview` 不再桶导出全部插件，只聚合 Core + 装配 + 6 个零重依赖插件（Image / Pdf / Video / Audio / Office / Download）。其余走 `vane-file-preview/core`、`/plugins`、`/custom-plugins/<Name>` 子路径。`1.x` 中 `import { createXxxPlugin } from "vane-file-preview"` 在 2.0.0 会解析失败，必须改子路径。
- **钩子面 17 → 11**：删除 6 个从未被调用的钩子（`onBeforeLoad` / `onLoadProgress` / `onDownload` / `onZoom` / `onRotate` / `onFullscreen`）；保留 11 个 = 领域 6（`canHandle` / `render` / `renderToolbar` / `onLoadStart` / `onLoadSuccess` / `onLoadError`）+ 内核 5（`onMount` / `onUnmount` / `renderOverlay` / `transformData` / `onError`）+ 逃生口 `priorityOf(file)`。
- **路由变成包内纯函数**：`resolvePreview(plugins, file)` 单赢家路由（priority 降序 → MIME 置信度降序 → 声明顺序），可单测。
- **主题收敛**：所有带主题的插件只暴露 `auto` / `light` / `dark`，跟随系统。

### 新增 / 修复

- 17 个插件全留（图片 / 视频 / 音频 / PDF / Office 在线 / 代码 / CSV / DOCX 双实现 / Markdown / JSON / XML / XLSX / PPTX 文本大纲 / EPUB / ZIP / 兜底下载）。
- 重依赖缺失时渲染 `MissingDependency` 面板而非白屏；`render` / `renderToolbar` 内禁止 hooks（由 `useDynamicModule` 承担加载副作用）。
- 根入口 gzip 约 13KB；全量并集约 69KB（预算 90KB）。

### 迁移提示

从 1.x 升级：(1) 按文件类型补装 optional peer；(2) 把 `import ... from "vane-file-preview"` 的插件引用改成 `vane-file-preview/custom-plugins/<Name>` 子路径；(3) 自定义插件按新 11 钩子契约重写。
