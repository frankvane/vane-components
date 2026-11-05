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

import type {
  FilePreviewPlugin,
} from "../../components/FilePreviewPlugin/plugins/types";
import { MarkdownBody, MarkdownToolbar } from "./internal";

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
