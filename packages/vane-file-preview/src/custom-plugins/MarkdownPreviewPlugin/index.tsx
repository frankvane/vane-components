/**
 * `vane-file-preview/custom-plugins/MarkdownPreviewPlugin`
 *
 * Markdown 预览：react-markdown + remark-gfm + 行内换行 + 代码高亮，
 * 可切 Raw / Preview，可切亮 / 暗 / 跟随系统。
 *
 * ## 迁移时改掉的四处（第一处是安全问题）
 *
 * 1. **`rehype-raw` 从「永远开着」改成「`allowHtml: true` 才加载」。**
 *    迁移前它无条件 push 进 `rehypePlugins`，于是被预览的 `.md` 里任何
 *    `<img onerror=…>` / `<script>` 都会真的进 DOM（react-markdown 只在
 *    **没有** rehype-raw 时才会转义原始 HTML）。文件预览的输入基本来自
 *    「用户上传」或「别人发来的文件」—— 这是标准的存储型 XSS 面。
 *    默认关闭；需要渲染 HTML 的人显式开，并且自己承担清洗责任。
 *
 * 2. **`remark-math` / `rehype-katex` 删掉。** 它们渲染出来的公式没有 katex 的
 *    样式表就是一坨裸 HTML，而 katex CSS 有 200KB+，为一个「可能有公式」的场景
 *    给每个用 Markdown 的人加 200KB 不划算。留了 `remarkPlugins` / `rehypePlugins`
 *    两个扩展点，需要的人自己传（doc.json 里给了例子）。
 *
 * 3. **主题切换不再改 `config` 对象。** 迁移前 `handleThemeToggle` 直接
 *    `config.theme = newTheme` 再去 bus 上 emit —— 修改入参、绕过 React 状态、
 *    还依赖一个 bus 监听；而且 `config` 是工厂闭包里的对象，**所有实例共享同一份**。
 *    现在走 `sharedData` + `forceUpdate`（见 useSharedValue）。
 *
 * 4. **相对路径的图片 / 链接按文件位置解析。** 迁移前 `![](images/a.png)` 会被
 *    浏览器按**当前页面**的地址解析，指向宿主的 `/images/a.png` —— 一张都显示不出来。
 *    现在按 `file.url` 的目录解析（见 resolveMarkdownUrl）。
 *
 * 5. **`allowHtml` 档还会剥掉 `on*` 属性与 `javascript:` 链接。** 不加这一道，
 *    文件里一个 `<img onerror="…">` 就足以让 React 抛
 *    「Expected `onError` listener to be a function」把整棵预览树打崩 ——
 *    用户从网页复制一段 Markdown 过来就会带上这种东西，崩了比不渲染更糟。
 *    见下方 `stripDangerousAttrs`。
 */

import React, { useEffect, useMemo, useState } from "react";

import { triggerDownload } from "../../components/FilePreviewPlugin/shared/fileHelpers";
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
import { useDynamicModule } from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import { useSharedValue } from "../../components/FilePreviewPlugin/shared/useSharedValue";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";

export type MarkdownTheme = "auto" | "light" | "dark";

export interface MarkdownPreviewPluginConfig {
  /** 显示 Raw / Preview 切换按钮。默认 true */
  showRaw?: boolean;
  /** GFM（表格 / 删除线 / 任务列表 / 自动链接）。默认 true */
  enableGfm?: boolean;
  /** 单个换行也当 `<br>`（remark-breaks）。默认 true */
  enableBreaks?: boolean;
  /** 代码块高亮（rehype-highlight）。默认 true */
  enableSyntaxHighlight?: boolean;
  /**
   * **是否渲染 Markdown 里的原始 HTML。默认 false（安全）。**
   * 打开后 rehype-raw 会把文件里的 HTML 原样插进 DOM —— 只在前置环节已清洗时开。
   */
  allowHtml?: boolean;
  /** 初始主题。默认 `"auto"`（跟随系统） */
  theme?: MarkdownTheme;
  /** 追加 remark 插件（例如自己装 remark-math） */
  remarkPlugins?: unknown[];
  /** 追加 rehype 插件（例如自己装 rehype-katex） */
  rehypePlugins?: unknown[];
}

type ResolvedConfig = Required<
  Omit<MarkdownPreviewPluginConfig, "remarkPlugins" | "rehypePlugins">
> & {
  remarkPlugins: unknown[];
  rehypePlugins: unknown[];
};

const KEY_RAW = "md:raw";
const KEY_THEME = "md:theme";

interface MarkdownDependencies {
  Markdown: React.ComponentType<Record<string, unknown>>;
  remarkGfm: unknown;
  remarkBreaks: unknown;
  rehypeHighlight: unknown;
  rehypeRaw: unknown | null;
}

/**
 * 两个 loader 都是模块级常量：`allowHtml` 是配置项，构建时就定了，
 * 所以「要不要 rehype-raw」在加载阶段就能分开 —— 不需要在运行时动态拼数组。
 */
const loadBase = async () => {
  const [md, gfm, breaks, highlight] = await Promise.all([
    import("react-markdown"),
    import("remark-gfm"),
    import("remark-breaks"),
    import("rehype-highlight"),
  ]);
  return { md, gfm, breaks, highlight };
};

const loadMarkdownSafe = async (): Promise<MarkdownDependencies> => {
  const base = await loadBase();
  return {
    Markdown: base.md.default as unknown as MarkdownDependencies["Markdown"],
    remarkGfm: base.gfm.default,
    remarkBreaks: base.breaks.default,
    rehypeHighlight: base.highlight.default,
    rehypeRaw: null,
  };
};

const loadMarkdownWithRaw = async (): Promise<MarkdownDependencies> => {
  const [base, raw] = await Promise.all([loadBase(), import("rehype-raw")]);
  return {
    Markdown: base.md.default as unknown as MarkdownDependencies["Markdown"],
    remarkGfm: base.gfm.default,
    remarkBreaks: base.breaks.default,
    rehypeHighlight: base.highlight.default,
    rehypeRaw: raw.default,
  };
};

// ============ 危险属性剥离 ============

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/**
 * 去掉 `on*` 事件属性与 `javascript:` 链接。
 *
 * 为什么必须有这一道：`allowHtml: true` 时 rehype-raw 会把文件里的 HTML
 * 原样解析成 hast，`<img onerror="…">` 到这里就变成 `properties.onError = "…"`。
 * react-markdown 再把它当 prop 传给 React，于是 React 直接抛
 * 「Expected `onError` listener to be a function, instead got a value of `string` type」——
 * 整个预览树崩掉。用户上传的 .md 里带 `onerror` 太常见了（从网页复制粘贴就会有），
 * 一个属性把预览打崩，比不渲染 HTML 更糟。
 *
 * 注意剥掉的不只是「安全风险」：React 本来就不会把字符串变成事件处理器，
 * 所以这里真正解决的是**崩溃**。真想执行 HTML 里的脚本，得自己先清洗再
 * `dangerouslySetInnerHTML`，那不是预览组件的职责。
 */
function stripDangerousAttrs() {
  return (tree: HastNode): void => {
    const walk = (node: HastNode): void => {
      const props = node.properties;
      if (props) {
        for (const key of Object.keys(props)) {
          if (/^on/i.test(key)) delete props[key];
        }
        for (const key of ["href", "src", "srcSet", "action", "formAction"]) {
          const value = props[key];
          if (typeof value === "string" && /^\s*javascript:/i.test(value)) {
            props[key] = "#";
          }
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

// ============ 相对路径 ============

const SAFE_PROTOCOLS = /^(https?:|mailto:|tel:|blob:|data:image\/)/i;

/**
 * 把 Markdown 里的相对 URL 解析到**文件所在目录**。
 *
 * `#anchor` 与绝对地址原样返回；`javascript:` / `data:text/html` 之类
 * 一律置空（react-markdown 自己的默认转义也能挡，但这里先挡一层，
 * 免得以后换了渲染器就漏）。
 */
export function resolveMarkdownUrl(raw: string, fileUrl: string): string {
  const url = (raw ?? "").trim();
  if (!url) return "";
  if (url.startsWith("#")) return url;
  if (SAFE_PROTOCOLS.test(url)) return url;
  // 协议相对 `//cdn.example.com/a.png` —— 跟着页面协议走
  if (url.startsWith("//")) return url;
  // 一切「带协议但不是白名单」的（javascript:、vbscript:、data:text/html…）
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return "";

  try {
    const base =
      typeof window === "undefined" ? undefined : window.location.href;
    return new URL(url, new URL(fileUrl, base).href).href;
  } catch {
    return url;
  }
}

// ============ 样式 ============

/**
 * 迁移前这里内联了 170 行 CSS（亮 / 暗各一套完整 .hljs 规则，用
 * `<style>` 每次渲染都输出一遍）。现在压成一套双主题：靠 `data-md-theme`
 * 切换 CSS 变量，体积与阅读成本都小一个量级。
 */
const MARKDOWN_CSS = `
[data-vfp-md] { line-height: 1.7; font-size: 14px; }
[data-vfp-md] h1, [data-vfp-md] h2, [data-vfp-md] h3,
[data-vfp-md] h4, [data-vfp-md] h5, [data-vfp-md] h6 {
  margin: 1.4em 0 0.6em; line-height: 1.3; font-weight: 600;
}
[data-vfp-md] h1 { font-size: 1.7em; }
[data-vfp-md] h2 { font-size: 1.4em; border-bottom: 1px solid var(--md-border); padding-bottom: 0.3em; }
[data-vfp-md] h3 { font-size: 1.2em; }
[data-vfp-md] p, [data-vfp-md] ul, [data-vfp-md] ol, [data-vfp-md] blockquote { margin: 0.8em 0; }
[data-vfp-md] ul, [data-vfp-md] ol { padding-left: 1.6em; }
[data-vfp-md] li + li { margin-top: 0.25em; }
[data-vfp-md] a { color: var(--md-link); text-decoration: none; }
[data-vfp-md] a:hover { text-decoration: underline; }
[data-vfp-md] hr { border: none; border-top: 1px solid var(--md-border); margin: 1.6em 0; }
[data-vfp-md] blockquote {
  border-left: 3px solid var(--md-border); margin-left: 0;
  padding: 0.2em 0 0.2em 1em; color: var(--md-muted);
}
[data-vfp-md] code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.9em; padding: 0.15em 0.35em; border-radius: 3px;
  background: var(--md-code-bg);
}
[data-vfp-md] pre { margin: 0.9em 0; padding: 12px 14px; border-radius: 6px; overflow-x: auto; background: var(--md-pre-bg); }
[data-vfp-md] pre code { padding: 0; background: none; font-size: 0.86em; line-height: 1.55; }
[data-vfp-md] table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.95em; }
[data-vfp-md] th, [data-vfp-md] td { border: 1px solid var(--md-border); padding: 6px 10px; text-align: left; }
[data-vfp-md] th { background: var(--md-th-bg); font-weight: 600; }
[data-vfp-md] img { max-width: 100%; height: auto; }

[data-vfp-md] { --md-border: #e5e7eb; --md-muted: #6b7280; --md-link: #2563eb;
  --md-code-bg: rgba(175,184,193,0.2); --md-pre-bg: #f6f8fa; --md-th-bg: #f9fafb;
  --hl-comment: #6a737d; --hl-keyword: #d73a49; --hl-number: #005cc5;
  --hl-string: #032f62; --hl-title: #6f42c1; --hl-type: #6f42c1;
  --hl-tag: #22863a; --hl-attr: #005cc5; --hl-builtin: #005cc5; }
[data-vfp-md][data-md-theme="dark"] {
  --md-border: #374151; --md-muted: #9ca3af; --md-link: #60a5fa;
  --md-code-bg: rgba(110,118,129,0.4); --md-pre-bg: #1e1e1e; --md-th-bg: #262626;
  --hl-comment: #6a9955; --hl-keyword: #569cd6; --hl-number: #b5cea8;
  --hl-string: #ce9178; --hl-title: #d7ba7d; --hl-type: #4ec9b0;
  --hl-tag: #569cd6; --hl-attr: #9cdcfe; --hl-builtin: #4ec9b0; }

[data-vfp-md] .hljs-comment, [data-vfp-md] .hljs-quote { color: var(--hl-comment); font-style: italic; }
[data-vfp-md] .hljs-keyword, [data-vfp-md] .hljs-selector-tag { color: var(--hl-keyword); }
[data-vfp-md] .hljs-number, [data-vfp-md] .hljs-literal, [data-vfp-md] .hljs-variable { color: var(--hl-number); }
[data-vfp-md] .hljs-string, [data-vfp-md] .hljs-doctag { color: var(--hl-string); }
[data-vfp-md] .hljs-title, [data-vfp-md] .hljs-section { color: var(--hl-title); }
[data-vfp-md] .hljs-type, [data-vfp-md] .hljs-class .hljs-title { color: var(--hl-type); }
[data-vfp-md] .hljs-tag, [data-vfp-md] .hljs-name { color: var(--hl-tag); }
[data-vfp-md] .hljs-attr, [data-vfp-md] .hljs-attribute { color: var(--hl-attr); }
[data-vfp-md] .hljs-built_in { color: var(--hl-builtin); }
[data-vfp-md] .hljs-emphasis { font-style: italic; }
[data-vfp-md] .hljs-strong { font-weight: 600; }
`;

// ============ 正文 ============

type MdState =
  | { status: "loading" }
  | { status: "ready"; text: string }
  | { status: "error"; error: string };

function MarkdownBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const deps = useDynamicModule(
    config.allowHtml ? loadMarkdownWithRaw : loadMarkdownSafe
  );
  const [showRaw] = useSharedValue(context, KEY_RAW, false);
  // 正文只读主题（写主题的是工具栏），所以这里不要 setter
  const [theme] = useSharedValue<MarkdownTheme>(context, KEY_THEME, config.theme);
  const [doc, setDoc] = useState<MdState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    setDoc({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(context.file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const text = await res.text();
        if (!alive) return;
        setDoc({ status: "ready", text });
      } catch (err) {
        if (!alive) return;
        setDoc({
          status: "error",
          error: err instanceof Error ? err.message : "文件读取失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
    // 只跟 url 走：context 每次渲染都是新对象，放进来会无限重取
  }, [context.file.url]);

  // remark / rehype 插件数组：`react-markdown` 每次渲染都会把它们铺开执行，
  // 数组引用不稳定等于每次都重建 pipeline。deps 就绪后内容才定，故按 deps 记忆。
  const remarkPlugins = useMemo<unknown[]>(() => {
    const list: unknown[] = [...config.remarkPlugins];
    if (deps.status === "ready") {
      // 顺序有讲究：gfm 先解析表格/任务列表，breaks 再处理软换行
      if (config.enableGfm) list.unshift(deps.mod.remarkGfm);
      if (config.enableBreaks) list.unshift(deps.mod.remarkBreaks);
    }
    return list;
  }, [config.enableGfm, config.enableBreaks, config.remarkPlugins, deps]);

  const rehypePlugins = useMemo<unknown[]>(() => {
    const list: unknown[] = [];
    if (deps.status === "ready") {
      if (config.enableSyntaxHighlight) {
        list.push([
          deps.mod.rehypeHighlight,
          { detect: true, ignoreMissing: true },
        ]);
      }
      // 只有 allowHtml 的 loader 才会带回 rehypeRaw
      if (deps.mod.rehypeRaw) {
        list.push(deps.mod.rehypeRaw);
        // 必须在 raw 之后：先解析出属性，才谈得上剥离
        list.push(stripDangerousAttrs);
      }
    }
    for (const p of config.rehypePlugins) list.push(p);
    return list;
  }, [config.enableSyntaxHighlight, config.rehypePlugins, deps]);

  const resolvedTheme =
    theme === "auto"
      ? typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  if (deps.status === "unavailable") {
    return (
      <MissingDependency
        pkg="react-markdown"
        feature="渲染 Markdown 需要 react-markdown（含 remark-gfm / rehype-highlight）"
        hint="如果只需要看原始文本，可以改用 CodePreviewPlugin。"
        error={deps.error.message}
      />
    );
  }

  if (deps.status === "loading" || doc.status === "loading") {
    return <LoadingPanel icon="📝" label="正在读取 Markdown…" />;
  }

  if (doc.status === "error") {
    return <ErrorPanel label="Markdown 读取失败" error={doc.error} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        background: isDark ? "#1a1a1a" : "#fff",
        color: isDark ? "#e5e7eb" : "#1f2329",
        boxSizing: "border-box",
      }}
    >
      <style>{MARKDOWN_CSS}</style>
      <div
        data-vfp-md
        data-md-theme={resolvedTheme}
        style={{ padding: "16px 20px 40px", maxWidth: 860, margin: "0 auto" }}
      >
        {showRaw ? (
          <pre
            data-vfp-md-raw
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 13,
              lineHeight: 1.65,
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            }}
          >
            {doc.text}
          </pre>
        ) : (
          <deps.mod.Markdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            // urlTransform 是 react-markdown v9+ 的入口；相对路径按文件位置解析
            urlTransform={(url: string) =>
              resolveMarkdownUrl(url, context.file.url)
            }
            components={{
              a: ({ children, href, ...rest }: Record<string, unknown>) => (
                <a
                  href={href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...rest}
                >
                  {children as React.ReactNode}
                </a>
              ),
            }}
          >
            {doc.text}
          </deps.mod.Markdown>
        )}
      </div>
    </div>
  );
}

// ============ 工具栏 ============

function MarkdownToolbar({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const [showRaw, setShowRaw] = useSharedValue(context, KEY_RAW, false);
  const [theme, setTheme] = useSharedValue<MarkdownTheme>(
    context,
    KEY_THEME,
    config.theme
  );

  return (
    <ToolbarContainer>
      <FileMeta
        name={context.file.name}
        size={context.file.size}
        type="Markdown"
        icon="📝"
      />
      <ToolbarSeparator />

      {config.showRaw && (
        <ToolbarButton
          onClick={() => setShowRaw(!showRaw)}
          icon={showRaw ? "👁" : "📄"}
          title={showRaw ? "渲染成文档" : "查看原始 Markdown"}
          active={showRaw}
        >
          {showRaw ? "预览" : "原文"}
        </ToolbarButton>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>主题</span>
        <select
          data-vfp-md-theme-select
          value={theme}
          onChange={(e) => setTheme(e.target.value as MarkdownTheme)}
          style={{
            padding: "3px 6px",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            fontSize: 12,
            background: "#fff",
          }}
        >
          <option value="auto">跟随系统</option>
          <option value="light">亮色</option>
          <option value="dark">暗色</option>
        </select>
      </label>

      {config.allowHtml && (
        <span
          data-vfp-md-html-on
          style={{ fontSize: 11, color: "#b45309" }}
          title="allowHtml: true —— 文件里的原始 HTML 会进 DOM"
        >
          HTML 已开启
        </span>
      )}

      <ToolbarButton
        onClick={() => triggerDownload(context.file.url, context.file.name)}
        icon="📥"
        title="下载源文件"
      >
        下载
      </ToolbarButton>
    </ToolbarContainer>
  );
}

// ============ 插件 ============

export function createMarkdownPreviewPlugin(
  config: MarkdownPreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: ResolvedConfig = {
    showRaw: config.showRaw ?? true,
    enableGfm: config.enableGfm ?? true,
    enableBreaks: config.enableBreaks ?? true,
    enableSyntaxHighlight: config.enableSyntaxHighlight ?? true,
    allowHtml: config.allowHtml ?? false,
    theme: config.theme ?? "auto",
    remarkPlugins: config.remarkPlugins ?? [],
    rehypePlugins: config.rehypePlugins ?? [],
  };

  return {
    name: "MarkdownPreviewPlugin",
    version: "2.0.0",
    description: "Markdown 预览：GFM + 行内换行 + 代码高亮（可切原文 / 主题）",
    supportedTypes: ["text/markdown", "text/x-markdown"],
    supportedExtensions: [".md", ".markdown"],
    // 高于 CodePreviewPlugin(4)：文本类里 Markdown 该由它赢
    priority: 9,
    config: resolved,

    hooks: {
      render: (context) => (
        <MarkdownBody context={context} config={resolved} />
      ),
      renderToolbar: (context) => (
        <MarkdownToolbar context={context} config={resolved} />
      ),
    },
  };
}

export default createMarkdownPreviewPlugin;
