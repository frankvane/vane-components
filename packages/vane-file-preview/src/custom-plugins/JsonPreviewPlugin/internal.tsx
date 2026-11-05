/**
 * `JsonPreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  copyToClipboard,
  triggerDownload,
} from "../../components/FilePreviewPlugin/shared/fileHelpers";
import {
  ErrorPanel,
  LoadingPanel,
  MissingDependency,
} from "../../components/FilePreviewPlugin/shared/panels";
import { useDynamicModule } from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import type {
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import type { JsonPreviewPluginConfig } from "./create";

interface SearchHit {
  path: string;
  value: string;
  type: "string" | "number" | "key";
}

/** 递归找关键字。命中「键名」与「值」两类，路径保持 JS 访问写法便于复制 */
function searchInJson(data: unknown, term: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const q = term.toLowerCase();

  const walk = (node: unknown, path: string) => {
    if (typeof node === "string") {
      if (node.toLowerCase().includes(q)) {
        hits.push({ path, value: node, type: "string" });
      }
      return;
    }
    if (typeof node === "number") {
      if (String(node).includes(term)) {
        hits.push({ path, value: String(node), type: "number" });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        const childPath = path ? `${path}.${key}` : key;
        if (key.toLowerCase().includes(q)) {
          hits.push({ path: childPath, value: key, type: "key" });
        }
        walk(value, childPath);
      }
    }
  };

  walk(data, "");
  return hits;
}

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

type JsonState =
  | { status: "loading" }
  | { status: "ready"; value: unknown }
  | { status: "error"; error: string };

export function JsonBody({
  context,
  config,
  loadJsonView,
}: {
  context: FilePreviewPluginContext;
  config: Required<JsonPreviewPluginConfig>;
  loadJsonView: () => Promise<unknown>;
}) {
  const { file } = context;
  const jsonView = useDynamicModule(loadJsonView);
  const systemScheme = useSystemScheme();
  const [state, setState] = useState<JsonState>({ status: "loading" });
  const [term, setTerm] = useState("");
  // 复制路径的反馈。原来直接 `navigator.clipboard?.writeText`，
  // 在 http 内网页面里 clipboard 是 undefined，点了完全没反应（P2-6）。
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    },
    []
  );

  const resolvedTheme: "light" | "dark" =
    config.theme === "auto" ? systemScheme : config.theme;

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        // 先用 size 拦，不要等 parse 完再说 —— 见文件头注释
        if (file.size > 0 && file.size > config.maxFileSize) {
          throw new Error(
            `文件 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过上限 ${(
              config.maxFileSize /
              1024 /
              1024
            ).toFixed(1)}MB`
          );
        }

        const res = await fetch(file.url, {
          headers: { Accept: "application/json,text/plain,*/*" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const text = await res.text();

        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch (parseError) {
          throw new Error(
            `JSON 格式错误：${
              parseError instanceof Error ? parseError.message : String(parseError)
            }`
          );
        }

        if (!alive) return;
        setState({ status: "ready", value: parsed });
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

  const hits = useMemo(
    () =>
      state.status === "ready" && term.trim()
        ? searchInJson(state.value, term.trim())
        : [],
    [state, term]
  );

  const summary = useMemo(() => {
    if (state.status !== "ready") return "";
    const v = state.value;
    if (Array.isArray(v)) return `数组 · ${v.length} 项`;
    if (v && typeof v === "object") {
      return `对象 · ${Object.keys(v as object).length} 个属性`;
    }
    return typeof v;
  }, [state]);

  if (jsonView.status === "unavailable") {
    return (
      <MissingDependency
        pkg="@uiw/react-json-view"
        feature="渲染可折叠的 JSON 树需要 @uiw/react-json-view"
        error={jsonView.error.message}
      />
    );
  }

  if (jsonView.status === "loading" || state.status === "loading") {
    return <LoadingPanel icon="🧾" label="正在解析 JSON…" />;
  }

  if (state.status === "error") {
    return <ErrorPanel label="JSON 加载失败" error={state.error} />;
  }

  const dark = resolvedTheme === "dark";
  const { JsonView, themes } = jsonView.mod as {
    JsonView: React.ComponentType<Record<string, unknown>>;
    themes: Record<"light" | "dark", React.CSSProperties>;
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: dark ? "#1a202c" : "#fff",
        color: dark ? "#e2e8f0" : "#1f2937",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "10px 16px",
          borderBottom: `1px solid ${dark ? "#4a5568" : "#e5e7eb"}`,
          background: dark ? "#2d3748" : "#f8f9fa",
          fontSize: 12,
        }}
      >
        {config.enableSearch && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="search"
              placeholder="搜索键名或值…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              style={{
                width: 200,
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 4,
                border: `1px solid ${dark ? "#4a5568" : "#d1d5db"}`,
                background: dark ? "#4a5568" : "#fff",
                color: dark ? "#fff" : "#111827",
              }}
            />
            {term.trim() && (
              <span style={{ color: dark ? "#a0aec0" : "#6b7280" }}>
                {hits.length} 个结果
              </span>
            )}
          </div>
        )}

        <span style={{ color: dark ? "#a0aec0" : "#6b7280" }}>{summary}</span>
        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={() => {
            // 用 Blob 而不是 data: URL —— data URL 要把整个 JSON 编进字符串，
            // 5MB 的文件会拼出十几 MB 的 href，部分浏览器直接拒绝。
            const blob = new Blob([JSON.stringify(state.value, null, 2)], {
              type: "application/json;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            triggerDownload(url, file.name.replace(/\.[^/.]+$/, ".json"));
            // 立刻 revoke 会让下载中断，缓一拍
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          }}
          style={{
            padding: "5px 12px",
            fontSize: 12,
            border: "none",
            borderRadius: 4,
            background: "#007acc",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          📥 导出 JSON
        </button>
      </div>

      {hits.length > 0 && (
        <div
          style={{
            maxHeight: 180,
            overflowY: "auto",
            padding: "8px 16px",
            borderBottom: `1px solid ${dark ? "#4a5568" : "#e5e7eb"}`,
            background: dark ? "#2d3748" : "#eff6ff",
            fontSize: 12,
          }}
        >
          {hits.slice(0, 20).map((hit) => (
            <div
              key={`${hit.type}:${hit.path}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "3px 0",
              }}
            >
              <span
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                  wordBreak: "break-all",
                }}
              >
                {hit.path || "(根)"}
              </span>
              <span style={{ color: dark ? "#a0aec0" : "#6b7280" }}>
                {hit.type === "key" ? "键名" : hit.value.slice(0, 40)}
              </span>
              {config.enableCopy && (
                <button
                  type="button"
                  onClick={() => {
                    void copyToClipboard(hit.path).then((ok) => {
                      setCopiedPath(ok ? hit.path : null);
                      if (copyTimer.current !== null) {
                        clearTimeout(copyTimer.current);
                      }
                      copyTimer.current = setTimeout(() => {
                        copyTimer.current = null;
                        setCopiedPath(null);
                      }, 2000);
                    });
                  }}
                  style={{
                    marginLeft: "auto",
                    padding: "1px 6px",
                    fontSize: 11,
                    border: `1px solid ${dark ? "#4a5568" : "#d1d5db"}`,
                    borderRadius: 3,
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {copiedPath === hit.path ? "已复制" : "复制路径"}
                </button>
              )}
            </div>
          ))}
          {hits.length > 20 && (
            <div style={{ color: dark ? "#a0aec0" : "#6b7280", marginTop: 4 }}>
              只显示前 20 条，共 {hits.length} 条
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {state.value !== null && typeof state.value === "object" ? (
          <JsonView
            value={state.value as object}
            style={themes[resolvedTheme]}
            displayDataTypes={false}
            displayObjectSize
            enableClipboard={config.enableCopy}
            // 0 表示全展开；>0 时按层级折叠（@uiw 的 collapsed 数字即「折叠深度」）
            collapsed={config.collapsed > 0 ? config.collapsed : false}
          />
        ) : (
          // 合法 JSON 不必是对象：`123` / `"str"` / `true` 都能通过 JSON.parse，
          // 而树视图只接对象，直接丢进去会渲染成空白。
          <pre
            style={{
              margin: 0,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              fontSize: 13,
            }}
          >
            {JSON.stringify(state.value)}
          </pre>
        )}
      </div>
    </div>
  );
}
