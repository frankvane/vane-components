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

import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import {
  type CodeTheme,
} from "./themes";
import { CodeBody, CodeToolbar } from "./internal";

export type { CodeTheme } from "./themes";

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
  /**
   * 超过这个字节数直接拒绝读取。默认 20MB。
   * `maxBytes` 只是「不亮但还显示」，这一项是硬闸门：读也读不完的大文件
   * 不该进内存再截断。设为 0 表示不限制。
   */
  maxFileSize?: number;
}

type ResolvedConfig = Required<CodePreviewPluginConfig>;

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
    maxFileSize: config.maxFileSize ?? 20 * 1024 * 1024,
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
