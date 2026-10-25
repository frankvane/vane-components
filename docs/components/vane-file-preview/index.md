# 文件预览

> 插件式文件预览：PDF / Office / 代码 / 数据 / 媒体 / 压缩包，按格式插件化渲染。

## 状态

**迁移中** —— 源码仍在 `archive-plugins/vane-file-preview`，尚未按新结构迁入。

## 特性

- `FilePreviewCore` + `withPlugins` + `canHandle(file)` 格式分发
- 15+ 预览插件：PDF、DOCX、XLSX、PPTX、Markdown（数学/流程图）、EPUB、180+ 语言代码、JSON、CSV/TSV、图片、视频、音频、ZIP
- 主题切换、虚拟滚动、内存缓存、流式加载
- 错误边界、格式自动检测、降级策略

## 安装

```bash
npm install vane-file-preview
```

## 30 秒上手

```tsx
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createPdfPreviewPlugin } from "vane-file-preview/custom-plugins/PdfPreviewPlugin";

const FilePreview = withPlugins(FilePreviewCore, [
  createPdfPreviewPlugin({ enableSearch: true }),
]);

<FilePreview file={{ name: "a.pdf", url: "/a.pdf", type: "application/pdf" }} />;
```

## 迁移待办（重点）

- [ ] 插件系统切换为 `@vane/plugin-core`
- [ ] **重依赖策略**：`pdfjs-dist` / `docx-preview` / `xlsx` / `mammoth` / `jszip` 等改为**可选 peerDependencies**，由使用方按需安装，避免装一个预览组件拖入十几 MB 依赖
- [ ] `react` / `react-dom` / demo 依赖从 `dependencies` 移出
- [ ] 补 `doc.json` 与 `presets/`（文档预览 / 媒体预览 / 数据预览）
