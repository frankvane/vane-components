# 文件预览

> 插件式文件预览：17 个插件按文件类型**单赢家路由**，重依赖全部 optional peer —— 不装不报错，只给安装提示。

## 状态

**P3 完成**：17 个插件已按「目录 + `doc.json`」迁入 `packages/vane-file-preview`。
归档实现（`archive-plugins/`，单文件 986KB / 26 个 dependencies / 10 个空转钩子）不再使用。

## 核心模型：单赢家路由

一个文件**只能由一个插件渲染正文** —— 这跟 vane-card 的「多插件合成」是两套模型：

```ts
resolvePreview(plugins, file); // → 唯一的赢家，或 null（落到 unsupported 面板）
```

判定顺序（`src/components/FilePreviewPlugin/plugins/resolve.ts`）：

1. `canHandle(file)` 优先且**互斥**（声明了它就完全由它决定，不再看类型/扩展名）
2. `supportedTypes` / `supportedExtensions` 匹配
3. `priority` 降序
4. 同 priority 时，**MIME 命中压过「只有扩展名像」**（`.ogg` 既是音频也是视频容器）
5. 再平手才看声明顺序 —— 所以 priority 必须留空档，别让两个插件撞在同一个数字上

## 17 个插件

| 组 | 插件 | 重依赖 |
| --- | --- | --- |
| 媒体 | Image / Video / Audio | 无（原生 `img` / `video` / `audio`） |
| 文档 | Pdf / Office / Docx / MammothDocx / Pptx / Markdown / Epub | 见下表 |
| 数据 | Json / Xml / Xlsx / Csv | 见下表 |
| 压缩包 | Zip | `jszip` |
| 其他 | Code / Download | `react-syntax-highlighter` / 无 |

### 文件类型 → 需要装什么

| 想预览 | 装这个 | 不装会怎样 |
| --- | --- | --- |
| 图片 / 视频 / 音频 / PDF / Office 在线 | 什么都不用 | — |
| Markdown | `react-markdown` `remark-gfm` `remark-breaks` `rehype-highlight` | 渲染安装提示面板 |
| 代码高亮 | `react-syntax-highlighter` | 同上 |
| JSON | `@uiw/react-json-view` | 同上 |
| XML | `react-xml-viewer` | 同上 |
| XLSX | `xlsx` | 同上 |
| CSV / TSV | `papaparse` | 同上 |
| DOCX（语义 HTML） | `mammoth` | 同上 |
| DOCX（还原版式） | `docx-preview` | 同上 |
| PPTX / ZIP | `jszip` | 同上 |
| EPUB | `react-reader`（含 epub.js，200KB+） | 同上 |

「不装」不等于白屏：每个重依赖都用动态 `import()` 拉，失败时渲染 `MissingDependency`
面板（包名 + `npm i <pkg>` + 备选方案 + 折叠的错误原文）。

## 安装

```bash
npm install vane-file-preview
# 按需
npm install jszip xlsx mammoth papaparse react-markdown react-syntax-highlighter
```

## 30 秒上手

```tsx
import { FilePreviewCore, withPlugins } from "vane-file-preview";
import { createMarkdownPreviewPlugin } from "vane-file-preview/custom-plugins/MarkdownPreviewPlugin";

// 根入口自带 6 个零重依赖插件（Image / Pdf / Video / Audio / Download / Office），
// 这里只补一个 Markdown —— 不依赖的插件不写进来就不会被加载
const FilePreview = withPlugins(FilePreviewCore, {
  plugins: [createMarkdownPreviewPlugin({ allowHtml: false })],
});

<FilePreview
  file={{ name: "a.md", url: "/a.md", type: "text/markdown", size: 1024 }}
/>;
```

`withPlugins` 的插件数组请**在模块顶层**装配。写在组件函数体里会每次渲染生成新的组件类型，
整棵子树被卸载重建（归档示例页 13 页里有 11 页踩了这个）。

## 体积三口径

| 口径 | 预算 | 当前 |
| --- | --- | --- |
| 根入口（Core + 装配 + 6 个零重依赖插件） | 14KB | 12.9KB |
| `vane-file-preview/core` | 8KB | 6.5KB |
| 全量并集 | 90KB | 64.5KB |

重依赖一律 `external`（正则形式，见 `vite.config.ts`），不计入以上数字。
`test/dist-external.test.ts` 守这条线：`import("pkg")` 必须原样留在 dist 里，
且 dist 不得出现各库的内部标识（`JSZip` / `SheetJS` / `--w-rjv-` / `docx-wrapper` /
`Papa Parse` / `EpubView`）。

## 插件文档

[plugins.md](./plugins.md) —— 17 行配置表由 `pnpm docs:plugins` 从 `doc.json` 与源码的
`priority` 生成，**别手改表**。
