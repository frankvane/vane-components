/**
 * `vane-file-preview/custom-plugins/XmlPreviewPlugin`
 *
 * XML / RSS / Atom / SVG 源码树视图（`react-xml-viewer`）。
 *
 * ## 迁移时修掉的迁移前真 bug
 *
 * 1. **`hooks.toolbar` 这个钩子根本不存在** —— 迁移前的工具栏用的是 `toolbar:` 键，
 *    而装配层读的是 `renderToolbar:`，所以那个「Download」工具栏代码从来没被调用过。
 *    同时 `name` 写的是 kebab 的 `"xml-preview"`，全库唯一一个不跟着 PascalCase 走的。
 * 2. **`from "../../plugins/types"` 少了一级** —— 迁移前 `tsc -b` 报 TS2307，
 *    因为 `vite build` 用 esbuild 抹掉类型导入所以「构建能过」，错误被藏住了。
 * 3. **`style` 不是 `XMLViewerProps` 的字段** —— 迁移前传给组件的 `style` 被静默丢弃
 *    （字号、边框、圆角、背景全都没生效）。这里改成外层容器控制。
 * 4. **四个配置项从来没生效**：`enableValidation` / `showAttributes` / `showComments` /
 *    `showProcessingInstructions`。`react-xml-viewer` 只接受
 *    `xml / theme / indentSize / collapsible / initialCollapsedDepth / showLineNumbers / invalidXml`。
 *    声明了却传不进去的配置比没有更糟：文档写着「能关掉属性显示」，用户关不掉。
 *    现在把这些删掉，只留真正能生效的。
 * 5. `collapsedLevels` 终于接上了 —— 迁移前算出来传的是 `initialCollapsedDepth={undefined}`。
 *
 * ## 「格式化」按钮被删了
 *
 * 原实现是 `xml.replace(/></g, ">\n<")` 再按行补缩进。`></` 这个切分点不区分
 * 「标签边界」和「文本内容」：`<a>1 &gt; 0</a>` 里没有 `><` 还好，但 CDATA 里的
 * `]]></x>`、属性值里的 `>` 都会被切开，输出可能变成非法 XML。
 * 而 `react-xml-viewer` 本身已经按层级缩进渲染，这个按钮只会让内容「看起来变整齐」
 * 却可能改坏数据。要格式化请用 `enableFormat` 之外的方案（比如装 prettier 插件）。
 */

import {
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { XmlBody } from "./internal";

export interface XmlPreviewPluginConfig {
  /** 超过这个字节数直接拒绝渲染。默认 10MB */
  maxFileSize?: number;
  /** 顶部搜索框（只统计命中行数，不做高亮）。默认 true */
  enableSearch?: boolean;
  /** 复制全文按钮。默认 true */
  enableCopy?: boolean;
  /** 配色。默认 "auto" */
  theme?: "light" | "dark" | "auto";
  /** 初始折叠层级：不传则全展开。默认 2 */
  collapsedLevels?: number;
}

/** 模块级常量，引用稳定 */
const loadXmlViewer = () => import("react-xml-viewer");

export function createXmlPreviewPlugin(
  config: XmlPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: Required<XmlPreviewPluginConfig> = {
    maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024,
    enableSearch: config.enableSearch ?? true,
    enableCopy: config.enableCopy ?? true,
    theme: config.theme ?? "auto",
    collapsedLevels: config.collapsedLevels ?? 2,
  };

  return {
    name: "XmlPreviewPlugin",
    version: "1.0.0",
    description: "XML / RSS / Atom / SVG 源码树视图",
    supportedTypes: ["text/xml", "application/xml", "application/rss+xml", "application/atom+xml"],
    // `.svg` 刻意不在这里：图片插件（priority 10 + image/*）才是 SVG 的正解，
    // 这里再声明一次只会让「按扩展名」路径有机会抢走它（见 resolve.ts 的置信度规则）。
    supportedExtensions: [".xml", ".rss", ".atom", ".kml", ".gpx", ".plist"],
    priority: 6,
    config: resolved,

    hooks: {
      render: (context) => (
        <XmlBody
          context={context}
          config={resolved}
          loadXmlViewer={loadXmlViewer}
        />
      ),

      renderToolbar: (context) => (
        <ToolbarContainer>
          <FileMeta
            name={context.file.name}
            size={context.file.size}
            type="XML"
            icon="🧩"
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

export default createXmlPreviewPlugin;
