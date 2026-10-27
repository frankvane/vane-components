<p align="center">
  <a href="https://www.npmjs.com/package/vane-file-preview"><img src="https://img.shields.io/npm/v/vane-file-preview.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/vane-file-preview"><img src="https://img.shields.io/npm/dm/vane-file-preview.svg" alt="npm downloads" /></a>
  <a href="https://chinavane.netlify.app/"><img src="https://img.shields.io/badge/demo-online-brightgreen.svg" alt="demo" /></a>
</p>
# 文件预览（vane-file-preview）

> 插件式文件预览：17 个插件按文件类型**单赢家路由**，重依赖全部 optional peer —— 不装不报错，只给安装提示。

## 卖点

- **一个组件预览所有文件类型**：图片、视频、音频、PDF、Office、Markdown、代码、JSON、XML、CSV、XLSX、DOCX、EPUB、PPTX、ZIP……共 17 种。
- **单赢家路由**：一个文件只由一个插件渲染正文，路由是纯函数 `resolvePreview(plugins, file)`，可单测，不靠隐式规则。
- **体积可控**：根入口只聚合 Core + 6 个零依赖插件；其余 11 个重依赖插件走子路径，未引入就被 tree-shaking，零成本。
- **重依赖不绑架消费方**：`dependencies: {}`，所有解析器都是 optional peer；没装只是渲染「安装提示」面板，绝不白屏。

## 安装

```bash
npm install vane-file-preview
# 按需装 peer（见下方「按文件类型装依赖」表）
npm install jszip xlsx mammoth papaparse react-markdown react-syntax-highlighter
```

`react` / `react-dom` 是 peer（≥16.8）。

## 30 秒上手

```tsx
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import {
  createImagePreviewPlugin,
  createPdfPreviewPlugin,
  createVideoPreviewPlugin,
  createAudioPreviewPlugin,
  createOfficePreviewPlugin,
  createDownloadPlugin,
} from "vane-file-preview/plugins";
import { createMarkdownPreviewPlugin } from "vane-file-preview/custom-plugins/MarkdownPreviewPlugin";

// 装配必须在「模块顶层」：写在组件函数体里会每次渲染生成新组件类型，
// 整棵子树被卸载重建（归档示例页 13 页里有 11 页踩过这个）。
const FilePreview = withPlugins(FilePreviewCore, {
  plugins: [
    createImagePreviewPlugin(),
    createPdfPreviewPlugin(),
    createVideoPreviewPlugin(),
    createAudioPreviewPlugin(),
    createOfficePreviewPlugin(),
    createMarkdownPreviewPlugin({ allowHtml: false }),
    createDownloadPlugin(), // 兜底：认领所有其它格式
  ],
});

export default function App() {
  return (
    <div style={{ height: 480 }}>
      <FilePreview
        file={{
          name: "a.md",
          extension: ".md",
          url: "/a.md",
          type: "text/markdown",
          size: 1024,
        }}
      />
    </div>
  );
}
```

`withPlugins` 的 `withPlugins(组件, { plugins })` 支持对象与数组两种写法；数组写法即 `withPlugins(组件, [插件…])`。

> 预览容器需要**有明确高度**（父级撑开或 `containerStyle={{ height }}`），否则 Core 没有滚动上下文，部分插件（PDF、EPUB）的翻页会失效。

## 按文件类型装依赖

这是本包最容易踩的坑：**插件已 import，但对应 peer 没装，渲染出来是「安装提示」而不是白屏**。下面这张表是「想预览 X → 装什么」的唯一真相。

| 想预览 | 需要装 | 不装会怎样 |
| --- | --- | --- |
| 图片 / 视频 / 音频 / PDF / Office 在线预览 | 什么都不用（原生标签 / 公网查看器） | — |
| Markdown | `react-markdown` `remark-gfm` `remark-breaks` `rehype-highlight` | 渲染安装提示面板 |
| 代码高亮 | `react-syntax-highlighter` | 同上 |
| JSON | `@uiw/react-json-view` | 同上 |
| XML / RSS / Atom | `react-xml-viewer` | 同上 |
| XLSX / XLSM / XLS | `xlsx`（SheetJS） | 同上 |
| CSV / TSV | `papaparse` | 同上 |
| DOCX 语义 HTML | `mammoth` | 同上 |
| DOCX 还原版式 | `docx-preview` | 同上 |
| PPTX 文本大纲 | `jszip` | 同上 |
| ZIP 条目列表 | `jszip` | 同上 |
| EPUB 电子书 | `react-reader`（含 epub.js，200KB+） | 同上 |

「不装」**不等于白屏**：每个重依赖都用动态 `import()` 拉取，失败时渲染 `MissingDependency` 面板（包名 + `npm i <pkg>` + 备选方案 + 折叠的错误原文）。

## 插件速览

| 组 | 插件 | 重依赖 |
| --- | --- | --- |
| 媒体 | Image / Video / Audio | 无（原生 `img` / `video` / `audio`） |
| 文档 | Pdf / Office / Docx / MammothDocx / Pptx / Markdown / Epub | 见上表 |
| 数据 | Json / Xml / Xlsx / Csv | 见上表 |
| 压缩包 | Zip | `jszip` |
| 其他 | Code / Download | `react-syntax-highlighter` / 无 |

17 个插件的完整配置表见 [plugins.md](./plugins.md)（由 `pnpm docs:plugins` 从各插件 `doc.json` 生成）。API 详见 [api.md](./api.md)，常见组合见 [recipes.md](./recipes.md)。

## 体积三口径

| 口径 | 预算 | 当前 |
| --- | --- | --- |
| 根入口（Core + 装配 + 6 个零重依赖插件） | 14KB | 12.9KB |
| `vane-file-preview/core` | 8KB | 6.5KB |
| 全量并集 | 90KB | 64.5KB |

重依赖一律 `external`，不计入以上数字。`test/dist-external.test.ts` 守这条线：`import("pkg")` 必须原样留在 dist 里，且 dist 不得出现各库的内部标识（`JSZip` / `SheetJS` / `--w-rjv-` / `docx-wrapper` / `Papa Parse` / `EpubView`）。

## 从归档实现迁移（1.x → 2.0.0）

2.0.0 是一次整体重写，内核换成 `@vane/plugin-core`，对外契约基本兼容，但有四处必须注意：

| 变更点 | 1.x（归档实现） | 2.0.0 | 影响 |
| --- | --- | --- | --- |
| 内核 | 自建 `PluginBus` / `PluginManager` + `withPlugins`（约 1600 行） | `@vane/plugin-core` 的 `usePluginRuntime` / `composeSlots` / `PluginErrorBoundary` | 内部 API 全部移除，自定义插件需按新契约重写 |
| 依赖 | `dependencies` 26 个，安装即拖入 15MB 解析器 | `dependencies: {}`，全部 optional peer | 装包更快；但**预览前要先装对应 peer**，否则看到安装提示面板 |
| 体积 | 单文件 985.97KB / gzip 196.33KB | 根入口 12.9KB（gzip） | 大幅瘦身，按需引入几乎零代价 |
| 钩子面 | 17 个钩子（10 个空转，从未被调用） | 11 个有真实执行点的钩子 | 旧插件里对着死钩子写的代码不再生效（那部分本来也没跑过） |
| 入口 | 改了要重打包整个仓库 | 多入口：根入口 + `/core` + `/plugins` + `/custom-plugins/*` 子路径 | 只用一个插件可走子路径省体积 |

依赖边界是最常踩的：1.x 装包即有全部能力，2.0.0 的 `MissingDependency` 面板是「正常状态」而不是故障 —— 它告诉你缺哪个 peer。
