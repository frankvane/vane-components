/**
 * `CodePreviewPlugin` 的组件层。
 *
 * 组件与插件工厂分文件：`create.tsx` 只导出工厂（非组件），这里只导出组件，
 * 以满足 `react-refresh/only-export-components`。
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

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
import type { CodePreviewPluginConfig } from "./create";

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

export function CodeBody({
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
        // fetch 之前按字节拦（P1-4）：这里原本没有任何门控，
        // 一个 500MB 的日志会被整份读进内存再交给 prism。
        if (config.maxFileSize > 0 && file.size > config.maxFileSize) {
          throw new Error(
            `文件 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过读取上限 ${(
              config.maxFileSize /
              1024 /
              1024
            ).toFixed(1)}MB`
          );
        }

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
  }, [file.url, file.size, config.maxFileSize]);

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
  // 用字节而不是字符数判断：中文 / emoji 一个字符占 1~4 字节，
  // `text.length` 会把 2MB 的 UTF-8 文件算成只有几百 KB，于是照样交给 prism（P1-4）
  const byteSize = file.size > 0 ? file.size : code.text.length;
  const tooLarge = config.maxBytes > 0 && byteSize > config.maxBytes;

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
            文件 {formatBytes(byteSize)}，超过高亮上限{" "}
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

export function CodeToolbar({
  context,
  config,
}: {
  context: FilePreviewPluginContext;
  config: ResolvedConfig;
}) {
  const prefs = useCodePreferences(context, config);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  /*
   * 复制反馈的定时器必须能清：原来的 `setTimeout` 没有任何句柄，
   * 组件卸载后仍会 setState（React 会警告），快速连点时旧定时器还会
   * 把后一次「已复制」提前打回 idle（P2-3）。
   */
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    },
    []
  );

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
    if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      resetTimer.current = null;
      setCopied("idle");
    }, 2000);
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
