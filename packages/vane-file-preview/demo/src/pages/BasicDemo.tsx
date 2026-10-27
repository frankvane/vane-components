/**
 * P1 阶段的最小 demo：**只验一件事** —— demo 跑的是 `src/`，不是 `dist/`。
 *
 * 所以这里刻意不引任何官方插件（P3 才迁入），只用一个 30 行的本地插件。
 * 好处是它同时演示了「自己写插件」这条路径：
 *   canHandle 决定路由 → render 决定画什么 → Core 负责加载状态与容器。
 */
import { useEffect, useState } from "react";
import {
  FilePreviewCore,
  withPlugins,
  type FileInfo,
  type FilePreviewPlugin,
} from "vane-file-preview";

/** 用 data URL 当样本：P1 还没搬 demo/public 里那 37 个真实文件（P5.2 搬） */
const textUrl = (text: string) =>
  `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;

const FILES: FileInfo[] = [
  {
    name: "notes.txt",
    size: 186,
    type: "text/plain",
    extension: "txt",
    url: textUrl(
      [
        "vane-file-preview 迁移 · P1 验收点",
        "",
        "1. 这个页面 import 的是 vane-file-preview 包名，",
        "   vite alias 把它指回 src/index.ts —— 删掉 dist 也能构建。",
        "2. 迁移前这里解析到 dist/index.es.js，",
        "   所以「demo 跑通了」其实只证明「上次构建产物还在磁盘上」。",
        "3. Core 的加载状态机是唯一真源：",
        "   reset() 之后停住，onBeforeLoad 返回 false 只跑一次。",
      ].join("\n")
    ),
  },
  {
    name: "readme.md",
    size: 128,
    type: "text/markdown",
    extension: "md",
    url: textUrl(
      [
        "# 为什么先做 P1 再做插件",
        "",
        "插件系统替换（P2）会同时动类型、装配、路由三处；",
        "Core 状态机收敛也会动同一批代码路径。",
        "两件事一起改，出问题时分不清是谁造成的。",
      ].join("\n")
    ),
  },
];

/** 极简文本插件：只认 text/*，用 fetch 读 URL 后渲染 */
function TextBody({ url }: { url: string }) {
  const [text, setText] = useState("加载中…");

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => r.text())
      .then((t) => {
        if (alive) setText(t);
      })
      .catch((e: unknown) => {
        if (alive) setText(`读取失败：${String(e)}`);
      });
    return () => {
      alive = false;
    };
  }, [url]);

  return (
    <pre
      style={{
        margin: 0,
        padding: 16,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 13,
        lineHeight: 1.7,
        color: "#1f2329",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "auto",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {text}
    </pre>
  );
}

const createTextPreviewPlugin = (): FilePreviewPlugin => ({
  name: "TextPreviewPlugin",
  hooks: {
    canHandle: (file) => file.type.startsWith("text/"),
    render: (context) => <TextBody url={context.file.url} />,
  },
});

/**
 * 装配写成模块顶层常量。
 *
 * 迁移前 13 个示例页里有 11 个把 `withPlugins(...)` 写在函数体内 ——
 * 每次渲染都造一个新的组件类型，React 会把整棵子树卸载重建。
 * 这里从第一行就定死这个写法（P5 的逐项示例同样要求）。
 */
const plugins = [createTextPreviewPlugin()];
const Preview = withPlugins(FilePreviewCore, { plugins });

export function BasicDemo() {
  const [index, setIndex] = useState(0);
  const file = FILES[index];

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILES.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setIndex(i)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${i === index ? "#1f2329" : "#d8d8d8"}`,
              background: i === index ? "#1f2329" : "#fff",
              color: i === index ? "#fff" : "#1f2329",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div
        data-card-stage
        style={{
          height: 360,
          border: "1px solid #e6e6e6",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <Preview file={file} />
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#8a8a8a" }}>
        当前文件：{file.name} · {file.type} · 渲染它的插件：TextPreviewPlugin
        （本地定义，未使用任何官方插件）
      </p>
    </section>
  );
}
