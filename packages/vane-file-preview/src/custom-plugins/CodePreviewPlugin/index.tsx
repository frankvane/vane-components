/**
 * `vane-file-preview/custom-plugins/CodePreviewPlugin`
 *
 * 代码预览：语法高亮（prism）+ 语言切换 + 主题切换 + 行号 / 换行 + 复制 / 下载。
 *
 * ## 迁移时改掉的四处（都不是「改 import」能带过去的）
 *
 * 1. **五份状态、四份副本、一个 `setTimeout(100)` 补丁。**
 *    迁移前正文与工具栏各存一份 `selectedLanguage` / `selectedTheme` /
 *    `showLineNumbers` / `wrapLongLines`，中间靠 4 条 bus 事件 + `sharedData`
 *    双向同步，工具栏还额外挂了一个「延迟 100ms 再对齐一次」的定时器
 *    （因为 sharedData 不是响应式的，它读到的永远是上次渲染的快照）。
 *    现在真源只有 `sharedData` 一份，写完调 `forceUpdate()`（见 useSharedValue）。
 *
 * 2. **41 套主题 → 2 套 + auto。** 见 themes.ts 头注释：整桶静态 import 是
 *    迁移前 986KB 体积的主因之一。
 *
 * 3. **`getPriority` 改成声明式 `priority`。** `hooks.getPriority` 这个钩子名
 *    在迁移后的钩子面里不存在（装配层读 `priority`），照抄过来等于没有优先级。
 *
 * 4. **localStorage 键加前缀、可关、按扩展名而不是完整文件名。** 见 preferences.ts。
 *
 * ## 大文件不做高亮
 *
 * prism 是 CPU 密集的：2MB 的压缩代码能让主线程卡住好几秒，而代码预览通常发生在
 * 「点开看一眼」的场景，卡住比不亮更糟。所以超过 `maxBytes` 时退化成 `<pre>`
 * （纯文本，零高亮零卡顿），并在顶部说明原因 —— 而不是让用户以为组件挂了。
 */

import React, { useEffect, useMemo, useState } from "react";

import {
  copyToClipboard,
  formatBytes,
  normalizeExtension,
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
import { useDynamicModule } from "../../components/FilePreviewPlugin/shared/useDynamicModule";
import { useSharedValue } from "../../components/FilePreviewPlugin/shared/useSharedValue";
import type {
  FilePreviewPlugin,
  FilePreviewPluginContext,
} from "../../components/FilePreviewPlugin/plugins/types";
import {
  AVAILABLE_LANGUAGES,
  detectLanguageFromFilename,
  getLanguageFromExtension,
} from "./languages";
import { createPreferenceStore } from "./preferences";
import {
  AVAILABLE_THEMES,
  loadCodeDependencies,
  pickTheme,
  resolveTheme,
  type CodeTheme,
} from "./themes";

export type { CodeTheme } from "./themes";
export { AVAILABLE_THEMES } from "./themes";
export { AVAILABLE_LANGUAGES } from "./languages";

export interface CodePreviewPluginConfig {
  /** 默认显示行号。默认 true */
  showLineNumbers?: boolean;
  /** 长行自动换行。默认 false */
  wrapLongLines?: boolean;
  /** 显示「复制」按钮。默认 true */
  enableCopy?: boolean;
  /** 显示语言下拉。默认 true */
  enableLanguageSelection?: boolean;
  /** 显示主题下拉。默认 true */
  enableThemeSelection?: boolean;
  /** 初始主题。默认 `"auto"`（跟随系统 prefers-color-scheme） */
  theme?: CodeTheme;
  /**
   * 是否把主题 / 行号 / 语言偏好写进 localStorage。默认 true。
   * 设为 false 时**完全不碰** localStorage（宿主要求「别在我这儿写存储」时用）。
   */
  storage?: boolean;
  /**
   * 超过这个字节数就不做语法高亮，退化成纯文本。默认 2MB。
   * 设为 0 表示不限制（不建议：prism 是同步 CPU 活）。
   */
  maxBytes?: number;
}

type ResolvedConfig = Required<CodePreviewPluginConfig>;

const KEY_THEME = "code:theme";
const KEY_LANGUAGE = "code:language";
const KEY_LINES = "code:lineNumbers";
const KEY_WRAP = "code:wrapLongLines";

/**
 * 语言检测：先看文件名（Dockerfile / Makefile 这类无扩展名的），再看扩展名。
 *
 * 顺序不能反 —— `Makefile` 没有扩展名，看扩展名会得到 `text`。
 */
function detectLanguage(fileName: string, extension: string): string {
  const byName = detectLanguageFromFilename(fileName);
  if (byName) return byName;
  return getLanguageFromExtension(normalizeExtension(extension));
}

/**
 * 主题 / 语言 / 行号 / 换行的读写。
 *
 * 正文与工具栏**各调一次**，它们看到的是同一份 `sharedData`
 * （真正的单一真源），所以不需要任何事件同步。
 */
function useCodePreferences(
  context: FilePreviewPluginContext,
  config: ResolvedConfig
) {
  // store 在配置不变时引用稳定：read() 只在挂载时跑一次
  const store = useMemo(
    () => createPreferenceStore(config.storage),
    [config.storage]
  );
  const saved = useMemo(() => store.read(), [store]);

  const extension = normalizeExtension(context.file.extension);

  const [theme, setTheme] = useSharedValue<CodeTheme>(
    context,
    KEY_THEME,
    saved.theme ?? config.theme
  );
  const [language, setLanguage] = useSharedValue<string>(
    context,
    KEY_LANGUAGE,
    // 用户手动选过的语言优先于自动检测（否则改完一看还是 text）
    store.readLanguage(extension) ??
      detectLanguage(context.file.name, context.file.extension)
  );
  const [showLineNumbers, setShowLineNumbers] = useSharedValue<boolean>(
    context,
    KEY_LINES,
    saved.showLineNumbers ?? config.showLineNumbers
  );
  const [wrapLongLines, setWrapLongLines] = useSharedValue<boolean>(
    context,
    KEY_WRAP,
    saved.wrapLongLines ?? config.wrapLongLines
  );

  return {
    theme,
    language,
    showLineNumbers,
    wrapLongLines,
    setTheme: (next: CodeTheme) => {
      setTheme(next);
      store.write({ theme: next });
    },
    setLanguage: (next: string) => {
      setLanguage(next);
      // 按扩展名存：给 a.ts 选了 typescript，b.ts 也该记住
      store.writeLanguage(extension, next);
    },
    setShowLineNumbers: (next: boolean) => {
      setShowLineNumbers(next);
      store.write({ showLineNumbers: next });
    },
    setWrapLongLines: (next: boolean) => {
      setWrapLongLines(next);
      store.write({ wrapLongLines: next });
    },
  };
}

// ============ 正文 ============

type CodeState =
  | { status: "loading" }
  | { status: "ready"; text: string }
  | { status: "error"; error: string };

function CodeBody({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const deps = useDynamicModule(loadCodeDependencies);
  const prefs = useCodePreferences(context, config);
  const { file } = context;
  const [code, setCode] = useState<CodeState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    setCode({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const text = await res.text();
        if (!alive) return;
        setCode({ status: "ready", text });
      } catch (err) {
        if (!alive) return;
        setCode({
          status: "error",
          error: err instanceof Error ? err.message : "文件读取失败",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [file.url]);

  if (deps.status === "unavailable") {
    return (
      <MissingDependency
        pkg="react-syntax-highlighter"
        feature="代码高亮需要 prism 语言包"
        hint="不想装也可以：这段代码会退化成纯文本，功能不受影响（删掉这个插件即可）。"
        error={deps.error.message}
      />
    );
  }

  if (deps.status === "loading" || code.status === "loading") {
    return <LoadingPanel icon="💻" label="正在读取文件…" />;
  }

  if (code.status === "error") {
    return <ErrorPanel label="文件读取失败" error={code.error} />;
  }

  const resolved = resolveTheme(prefs.theme);
  const isDark = resolved === "dark";
  const lineCount = code.text ? code.text.split("\n").length : 0;
  const tooLarge = config.maxBytes > 0 && code.text.length > config.maxBytes;

  return (
    <div
      data-vfp-code
      data-vfp-code-theme={resolved}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: isDark ? "#1e1e1e" : "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 12px",
          fontSize: 12,
          flexShrink: 0,
          color: isDark ? "#9ca3af" : "#6b7280",
          borderBottom: `1px solid ${isDark ? "#2d2d2d" : "#e5e7eb"}`,
        }}
      >
        <span style={{ color: isDark ? "#e5e7eb" : "#111827" }}>
          {file.name}
        </span>
        <span>· {prefs.language}</span>
        <span>· {lineCount} 行</span>
        <span>· {formatBytes(file.size)}</span>
      </div>

      {tooLarge ? (
        <div
          data-vfp-code-plain
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            padding: 12,
            fontSize: 12,
            lineHeight: 1.6,
            color: isDark ? "#d4d4d4" : "#1f2329",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          }}
        >
          <div
            style={{
              marginBottom: 10,
              padding: "8px 10px",
              borderRadius: 4,
              background: isDark ? "#3a2f00" : "#fffbeb",
              color: isDark ? "#fcd34d" : "#92400e",
              fontFamily: "inherit",
            }}
          >
            文件 {formatBytes(code.text.length)}，超过高亮上限{" "}
            {formatBytes(config.maxBytes)} —— 已退化成纯文本（高亮是同步 CPU 活，
            大文件会卡住页面）。
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {code.text.slice(0, 200_000)}
            {code.text.length > 200_000
              ? `\n\n… 还有 ${code.text.length - 200_000} 字符未显示`
              : ""}
          </pre>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <deps.mod.Prism
            language={prefs.language}
            style={pickTheme(deps.mod, prefs.theme)}
            showLineNumbers={prefs.showLineNumbers}
            wrapLongLines={prefs.wrapLongLines}
            wrapLines={prefs.wrapLongLines}
            customStyle={{
              margin: 0,
              padding: "12px 16px",
              fontSize: 13,
              lineHeight: 1.6,
              background: "transparent",
            }}
          >
            {code.text}
          </deps.mod.Prism>
        </div>
      )}
    </div>
  );
}

// ============ 工具栏 ============

function CodeToolbar({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const prefs = useCodePreferences(context, config);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  const handleCopy = async () => {
    // 工具栏拿不到正文的 text（正文是另一个组件），复制时再取一次。
    // 与迁移前一致，但多了失败提示 —— 迁移前失败只 console.error，
    // 用户点了按钮毫无反馈。
    try {
      const res = await fetch(context.file.url);
      const text = await res.text();
      const ok = await copyToClipboard(text);
      setCopied(ok ? "ok" : "fail");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied("idle"), 2000);
  };

  return (
    <ToolbarContainer>
      <FileMeta
        name={context.file.name}
        size={context.file.size}
        type={detectLanguage(context.file.name, context.file.extension)}
        icon="💻"
      />
      <ToolbarSeparator />

      {config.enableLanguageSelection && (
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>语言</span>
          <select
            data-vfp-code-language
            value={prefs.language}
            onChange={(e) => prefs.setLanguage(e.target.value)}
            style={selectStyle}
          >
            {AVAILABLE_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {config.enableThemeSelection && (
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>主题</span>
          <select
            data-vfp-code-theme-select
            value={prefs.theme}
            onChange={(e) => prefs.setTheme(e.target.value as CodeTheme)}
            style={selectStyle}
          >
            {AVAILABLE_THEMES.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>行号</span>
        <input
          type="checkbox"
          data-vfp-code-lines
          checked={prefs.showLineNumbers}
          onChange={(e) => prefs.setShowLineNumbers(e.target.checked)}
        />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>换行</span>
        <input
          type="checkbox"
          data-vfp-code-wrap
          checked={prefs.wrapLongLines}
          onChange={(e) => prefs.setWrapLongLines(e.target.checked)}
        />
      </label>

      {config.enableCopy && (
        <ToolbarButton
          onClick={() => void handleCopy()}
          icon={copied === "ok" ? "✓" : copied === "fail" ? "⚠️" : "📋"}
          title={copied === "fail" ? "复制失败（浏览器不允许）" : "复制全部代码"}
          active={copied === "ok"}
        >
          {copied === "ok" ? "已复制" : copied === "fail" ? "复制失败" : "复制"}
        </ToolbarButton>
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

const selectStyle: React.CSSProperties = {
  padding: "3px 6px",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  fontSize: 12,
  background: "#fff",
  maxWidth: 160,
};

// ============ 插件 ============

export function createCodePreviewPlugin(
  config: CodePreviewPluginConfig = {}
): FilePreviewPlugin {
  const resolved: ResolvedConfig = {
    showLineNumbers: config.showLineNumbers ?? true,
    wrapLongLines: config.wrapLongLines ?? false,
    enableCopy: config.enableCopy ?? true,
    enableLanguageSelection: config.enableLanguageSelection ?? true,
    enableThemeSelection: config.enableThemeSelection ?? true,
    theme: config.theme ?? "auto",
    storage: config.storage ?? true,
    maxBytes: config.maxBytes ?? 2 * 1024 * 1024,
  };

  return {
    name: "CodePreviewPlugin",
    version: "2.0.0",
    description:
      "代码预览：prism 语法高亮（100+ 语言）、两套主题 + 跟随系统、行号 / 换行",
    // 与迁移前一致：认领全部文本类 MIME，靠 priority 低于 Markdown(9) / Json / Xml
    supportedTypes: [
      "text/javascript",
      "application/javascript",
      "text/typescript",
      "application/typescript",
      "text/jsx",
      "text/tsx",
      "text/html",
      "application/xhtml+xml",
      "text/css",
      "text/x-scss",
      "text/x-sass",
      "text/x-less",
      "text/x-python",
      "application/x-python",
      "text/x-java-source",
      "text/x-kotlin",
      "text/x-scala",
      "text/x-groovy",
      "text/x-c",
      "text/x-c++",
      "text/x-csrc",
      "text/x-c++src",
      "text/x-csharp",
      "text/x-vb",
      "text/x-fsharp",
      "text/yaml",
      "application/x-yaml",
      "text/x-toml",
      "text/x-sh",
      "application/x-sh",
      "text/x-sql",
      "application/sql",
      "text/x-php",
      "text/x-ruby",
      "text/x-go",
      "text/x-rust",
      "text/x-swift",
      "text/x-dart",
      "text/x-lua",
      "text/x-perl",
      "text/x-r",
      "text/plain",
      "application/toml",
    ],
    supportedExtensions: [
      ".js",
      ".jsx",
      ".mjs",
      ".cjs",
      ".ts",
      ".tsx",
      ".vue",
      ".svelte",
      ".html",
      ".htm",
      ".xhtml",
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".styl",
      ".py",
      ".pyw",
      ".pyx",
      ".pyi",
      ".java",
      ".kt",
      ".kts",
      ".groovy",
      ".gradle",
      ".scala",
      ".c",
      ".h",
      ".cpp",
      ".cc",
      ".cxx",
      ".hpp",
      ".hh",
      ".hxx",
      ".cs",
      ".vb",
      ".fs",
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
      ".php",
      ".php3",
      ".php4",
      ".php5",
      ".phtml",
      ".rb",
      ".rake",
      ".gemspec",
      ".go",
      ".rs",
      ".swift",
      ".m",
      ".mm",
      ".json5",
      ".jsonc",
      ".yaml",
      ".yml",
      ".toml",
      ".ini",
      ".cfg",
      ".conf",
      ".rst",
      ".tex",
      ".sql",
      ".mysql",
      ".pgsql",
      ".r",
      ".lua",
      ".pl",
      ".pm",
      ".dart",
      ".ex",
      ".exs",
      ".erl",
      ".hrl",
      ".clj",
      ".cljs",
      ".elm",
      ".hs",
      ".lhs",
      ".ml",
      ".mli",
      ".dockerfile",
      ".dockerignore",
      ".gitignore",
      ".env",
      ".editorconfig",
      ".prettierrc",
      ".eslintrc",
      ".makefile",
      ".cmake",
      ".asm",
      ".s",
      ".vim",
      ".diff",
      ".patch",
      ".log",
    ],
    // 比 Markdown(9) / Json / Xml / CSV 都低，比兜底下载(-1) 高：
    // 「没人认领的文本」才轮到它
    priority: 4,
    config: resolved,

    hooks: {
      render: (context) => <CodeBody context={context} config={resolved} />,
      renderToolbar: (context) => (
        <CodeToolbar context={context} config={resolved} />
      ),
    },
  };
}

export default createCodePreviewPlugin;
