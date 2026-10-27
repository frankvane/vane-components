# 组合配方

三个常见开箱场景。每个配方都是「装哪些插件 + 默认参数」的示范，你可以在此基础上增删。

> 所有配方都遵循同一条原则：**装配写在模块顶层**，`withPlugins` 的插件数组是「全量」的 ——
> 根入口的 6 个轻量插件不会自动注入，要么显式写出来，要么从一个汇总入口引入后列出。

---

## 1. 上传即预览

文件选择器拿到 `File` 后转成 `FileInfo`，交给预览组件即可。`URL.createObjectURL` 生成的 blob
URL 对原生标签（img / video / audio / pdf iframe）同源可用；解析类插件（xlsx / zip / docx）也能直接 fetch blob。

```tsx
import { useState } from "react";
import type { FileInfo } from "vane-file-preview";
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
import { createCsvPreviewPlugin } from "vane-file-preview/custom-plugins/CsvPreviewPlugin";
import { createJsonPreviewPlugin } from "vane-file-preview/custom-plugins/JsonPreviewPlugin";
import { createZipPreviewPlugin } from "vane-file-preview/custom-plugins/ZipPreviewPlugin";

// 装配在模块顶层
const FilePreview = withPlugins(FilePreviewCore, {
  plugins: [
    createImagePreviewPlugin(),
    createPdfPreviewPlugin(),
    createVideoPreviewPlugin(),
    createAudioPreviewPlugin(),
    createOfficePreviewPlugin(),
    createMarkdownPreviewPlugin(),
    createCsvPreviewPlugin(),
    createJsonPreviewPlugin(),
    createZipPreviewPlugin(),
    createDownloadPlugin(),
  ],
});

function fileToFileInfo(file: File): FileInfo {
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  return {
    name: file.name,
    extension,
    url: URL.createObjectURL(file),
    type: file.type || "application/octet-stream",
    size: file.size,
  };
}

export default function UploadPreview() {
  const [file, setFile] = useState<FileInfo | null>(null);

  return (
    <div style={{ height: 480 }}>
      <input
        type="file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setFile(fileToFileInfo(f));
        }}
      />
      {file && <FilePreview file={file} />}
    </div>
  );
}
```

> blob URL 在组件卸载时记得 `URL.revokeObjectURL(file.url)` 释放；Office 在线预览用不了 blob URL
> （查看器服务器拉不到 localhost 上的 blob），这种文件会落到 `DownloadPlugin` 给出下载项。

---

## 2. 附件列表

一列文件，每项内联一个小预览。做法是用 `Array.from` 生成列表，每一项都是同一个 `FilePreview`
组件实例（装配只建一次，组件实例可复用）。

```tsx
import type { FileInfo } from "vane-file-preview";
import { FilePreview } from "./FilePreview"; // 配方 1 里的装配结果

const attachments: FileInfo[] = [
  { name: "合同.pdf", extension: ".pdf", url: "/files/contract.pdf", type: "application/pdf", size: 1_200_000 },
  { name: "数据.csv", extension: ".csv", url: "/files/data.csv", type: "text/csv", size: 48_000 },
  { name: "说明.md", extension: ".md", url: "/files/readme.md", type: "text/markdown", size: 3_400 },
];

export default function AttachmentList() {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {attachments.map((file) => (
        <li key={file.url} style={{ height: 320, marginBottom: 12, border: "1px solid #eee" }}>
          <FilePreview file={file} />
        </li>
      ))}
    </ul>
  );
}
```

注意：列表里每个预览都要**有确定高度**（这里固定 320px）。插件靠容器尺寸布局，高度塌成 0 时
原生控件会被 flex 压扁（音频控件压到 ~2px 的细线，看起来像坏了）。矮容器里音频插件会自动收成
紧凑档（只留控件），详见 `AudioPreviewPlugin` 的 `doc.json` notes。

---

## 3. 多类型全量分流

覆盖 17 种文件类型的完整装配。重依赖插件全部走子路径引入，谁要谁装对应的 optional peer。

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
// 11 个重依赖插件：各自子路径
import { createCodePreviewPlugin } from "vane-file-preview/custom-plugins/CodePreviewPlugin";
import { createCsvPreviewPlugin } from "vane-file-preview/custom-plugins/CsvPreviewPlugin";
import { createDocxPreviewPlugin } from "vane-file-preview/custom-plugins/DocxPreviewPlugin";
import { createMammothDocxPlugin } from "vane-file-preview/custom-plugins/MammothDocxPlugin";
import { createPptxPreviewPlugin } from "vane-file-preview/custom-plugins/PptxPreviewPlugin";
import { createMarkdownPreviewPlugin } from "vane-file-preview/custom-plugins/MarkdownPreviewPlugin";
import { createEpubPreviewPlugin } from "vane-file-preview/custom-plugins/EpubPreviewPlugin";
import { createJsonPreviewPlugin } from "vane-file-preview/custom-plugins/JsonPreviewPlugin";
import { createXmlPreviewPlugin } from "vane-file-preview/custom-plugins/XmlPreviewPlugin";
import { createXlsxPreviewPlugin } from "vane-file-preview/custom-plugins/XlsxPreviewPlugin";
import { createZipPreviewPlugin } from "vane-file-preview/custom-plugins/ZipPreviewPlugin";

const UniversalPreview = withPlugins(FilePreviewCore, {
  plugins: [
    // 媒体
    createImagePreviewPlugin(),
    createVideoPreviewPlugin(),
    createAudioPreviewPlugin(),
    // 文档
    createPdfPreviewPlugin(),
    createOfficePreviewPlugin(),
    createMammothDocxPlugin(),   // 默认 docx 实现（语义 HTML）
    createDocxPreviewPlugin(),   // docxMode === "docx-preview" 时生效
    createPptxPreviewPlugin(),
    createMarkdownPreviewPlugin(),
    createEpubPreviewPlugin(),
    // 数据
    createJsonPreviewPlugin(),
    createXmlPreviewPlugin(),
    createXlsxPreviewPlugin(),
    createCsvPreviewPlugin(),
    createCodePreviewPlugin(),
    // 压缩包 + 兜底
    createZipPreviewPlugin(),
    createDownloadPlugin(),      // 认领所有其它格式
  ],
});

export default UniversalPreview;
```

> 不想手写 17 行 import，可走全量桶 `vane-file-preview/custom-plugins`（一次性引全，但 tree-shaking
> 不掉，仅适合「做文档站 / 插件工坊」这类确实需要全量的场景）。

### DOCX 双实现的取舍

两个 docx 插件**不是二选一装一个**，而是按 `file.docxMode` 路由：

```ts
// 走语义 HTML（轻，默认）
{ name: "说明.docx", docxMode: "mammoth", /* … */ }
// 走版式还原（重，需装 docx-preview）
{ name: "排版稿.docx", docxMode: "docx-preview", /* … */ }
```

两者都装进来，由文件的 `docxMode` 决定赢家；不设置则默认 mammoth。

---

## 自己裁剪：三条经验

**1. 只引用得到的插件。** 根入口的 6 个（`/plugins`）零重依赖，开箱即用；其余 11 个按需引子路径。
未引入的插件在对应文件类型上会落到 `DownloadPlugin`（兜底）或 `unsupported`，不会崩。

**2. 兜底插件决定「未认领」长什么样。** 装了 `DownloadPlugin`，任何文件都有赢家，`unsupported` 面板
不再出现；想看「没有插件认领」的提示就别装它。

**3. 重依赖缺失是状态，不是故障。** 引了 `createXlsxPreviewPlugin` 但没装 `xlsx`，渲染的是
`MissingDependency` 面板（带 `npm i xlsx` 与备选方案），不是白屏。先确认 peer 都装齐再排查别的。
