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

import React, { useEffect, useMemo, useState } from "react";

import {
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import {
  FileMeta,
  ToolbarButton,
  ToolbarContainer,
  ToolbarSeparator,
} from "../../components/FilePreviewPlugin/shared/ToolbarComponents";
import {
  defaultOf,
  useDynamicModule,
} from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

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

/** `react-xml-viewer` 的 props 里没有 `style`，这里只用它的类型来约束传参 */
interface XmlViewerProps {
  xml: string;
  theme?: Record<string, string>;
  indentSize?: number;
  collapsible?: boolean;
  initialCollapsedDepth?: number;
  showLineNumbers?: boolean;
  invalidXml?: React.ReactElement;
}

const LIGHT_THEME: Record<string, string> = {
  tagColor: "#0969da",
  attributeKeyColor: "#d73a49",
  attributeValueColor: "#032f62",
  textColor: "#24292f",
  commentColor: "#6a737d",
  cdataColor: "#28a745",
  separatorColor: "#586069",
  lineNumberBackground: "#f6f8fa",
  lineNumberColor: "#6a737d",
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, Menlo, monospace",
};

const DARK_THEME: Record<string, string> = {
  tagColor: "#79c0ff",
  attributeKeyColor: "#ffa657",
  attributeValueColor: "#a5d6ff",
  textColor: "#e6edf3",
  commentColor: "#7d8590",
  cdataColor: "#7ee787",
  separatorColor: "#8b949e",
  lineNumberBackground: "#161b22",
  lineNumberColor: "#7d8590",
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, Menlo, monospace",
};

function useSystemScheme(): "light" | "dark" {
  const read = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const [scheme, setScheme] = useState<"light" | "dark">(read);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setScheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return scheme;
}

type XmlState =
  | { status: "loading" }
  | { status: "ready"; xml: string }
  | { status: "error"; error: string };

function XmlBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: Required<XmlPreviewPluginConfig>;
}) {
  const { file } = context;
  const viewer = useDynamicModule(loadXmlViewer);
  const systemScheme = useSystemScheme();
  const [state, setState] = useState<XmlState>({ status: "loading" });
  const [term, setTerm] = useState("");

  const dark =
    config.theme === "auto" ? systemScheme === "dark" : config.theme === "dark";

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        if (file.size > 0 && file.size > config.maxFileSize) {
          throw new Error(
            `文件 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过上限 ${(
              config.maxFileSize /
              1024 /
              1024
            ).toFixed(1)}MB`
          );
        }

        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const xml = await res.text();

        if (!alive) return;
        setState({ status: "ready", xml });
      } catch (err) {
        if (!alive) return;
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "加载失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [file.url, file.size, config.maxFileSize]);

  /** 命中行数：只做「有没有 / 有几处」的提示，不做高亮（组件不支持） */
  const hitLines = useMemo(() => {
    if (state.status !== "ready" || !term.trim()) return 0;
    const q = term.trim().toLowerCase();
    return state.xml
      .split("\n")
      .filter((line) => line.toLowerCase().includes(q)).length;
  }, [state, term]);

  if (viewer.status === "unavailable") {
    return (
      <MissingDependency
        pkg="react-xml-viewer"
        feature="渲染可折叠的 XML 树需要 react-xml-viewer"
        error={viewer.error.message}
      />
    );
  }

  if (viewer.status === "loading" || state.status === "loading") {
    return <LoadingPanel icon="🧩" label="正在解析 XML…" />;
  }

  if (state.status === "error") {
    return <ErrorPanel label="XML 加载失败" error={state.error} />;
  }

  const XmlViewer = defaultOf<React.ComponentType<XmlViewerProps>>(viewer.mod);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: dark ? "#0d1117" : "#ffffff",
        color: dark ? "#e6edf3" : "#24292f",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "10px 16px",
          borderBottom: `1px solid ${dark ? "#30363d" : "#d0d7de"}`,
          background: dark ? "#161b22" : "#f6f8fa",
          fontSize: 12,
        }}
      >
        {config.enableSearch && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="search"
              placeholder="搜索 XML 内容…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              style={{
                width: 200,
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: `1px solid ${dark ? "#30363d" : "#d0d7de"}`,
                background: dark ? "#0d1117" : "#fff",
                color: dark ? "#e6edf3" : "#24292f",
              }}
            />
            {term.trim() && (
              <span style={{ color: dark ? "#7d8590" : "#586069" }}>
                {hitLines > 0 ? `${hitLines} 行命中` : "无匹配"}
              </span>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {config.enableCopy && (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(state.xml);
            }}
            style={{
              padding: "5px 12px",
              fontSize: 12,
              borderRadius: 6,
              border: `1px solid ${dark ? "#30363d" : "#d0d7de"}`,
              background: dark ? "#21262d" : "#fff",
              color: dark ? "#e6edf3" : "#24292f",
              cursor: "pointer",
            }}
          >
            📋 复制全文
          </button>
        )}
      </div>

      {/* 这一层才是控制区：`react-xml-viewer` 不吃 `style` */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          fontSize: 13,
          lineHeight: 1.6,
          borderTop: "none",
        }}
      >
        {/*
         * 折叠指示符「...」的颜色是 react-xml-viewer 写死的内联 #777
         * （dist 里唯一一处 777），theme 里没有对应开关。
         * 深色主题下它压在 #0d1117 上只有 4.23:1，于是只能盖：
         * 内联样式改不动，只能用属性选择器 + !important；只匹配这一个色值，
         * 语法高亮（#79c0ff / #ffa657 / #a5d6ff）不会被波及。
         */}
        <style>{`
          .rxv-container span[style*="rgb(119, 119, 119)"],
          .rxv-container span[style*="#777"] {
            color: #8b93a1 !important;
          }
        `}</style>
        <XmlViewer
          xml={state.xml}
          collapsible
          indentSize={2}
          showLineNumbers
          initialCollapsedDepth={config.collapsedLevels}
          theme={dark ? DARK_THEME : LIGHT_THEME}
        />
      </div>
    </div>
  );
}

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
      render: (context) => <XmlBody context={context} config={resolved} />,

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
