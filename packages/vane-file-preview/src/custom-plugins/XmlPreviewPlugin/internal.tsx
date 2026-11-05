/**
 * `XmlPreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

import { copyToClipboard } from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import {
  defaultOf,
  useDynamicModule,
} from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import type { XmlPreviewPluginConfig } from "./create";

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

export function XmlBody({
  context,
  config,
  loadXmlViewer,
}: {
  context: FilePreviewPluginContext;
  config: Required<XmlPreviewPluginConfig>;
  loadXmlViewer: () => Promise<unknown>;
}) {
  const { file } = context;
  const viewer = useDynamicModule(loadXmlViewer);
  const systemScheme = useSystemScheme();
  const [state, setState] = useState<XmlState>({ status: "loading" });
  const [term, setTerm] = useState("");
  // 原来直接 `navigator.clipboard?.writeText`：http 内网页面里 clipboard 是
  // undefined，按钮点了没反应也没有提示（P2-6）。
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    },
    []
  );

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
              void copyToClipboard(state.xml).then((ok) => {
                setCopied(ok);
                if (copyTimer.current !== null) clearTimeout(copyTimer.current);
                copyTimer.current = setTimeout(() => {
                  copyTimer.current = null;
                  setCopied(false);
                }, 2000);
              });
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
            {copied ? "✓ 已复制" : "📋 复制全文"}
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
