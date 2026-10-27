/**
 * 单赢家路由：给定插件列表和一个文件，选出唯一该渲染它的插件。
 *
 * 为什么是纯函数而不是装配层的内部逻辑：
 *  - 「17 种文件分别该由谁渲染」是这个包最要紧的契约，**必须能单测**。
 *    塞在 withPlugins 里就只能靠渲染一张卡再去嗅 DOM 来验证，慢且脆。
 *  - 它没有任何 React 依赖，测试不需要 DOM。
 *
 * 为什么是「单赢家」而不是 vane-card 那种「多插件合成」：
 * 一个文件只能有一个插件渲染正文。槽位合成会让 17 个插件同时渲染同一份内容。
 */

import type { FileInfo, FilePreviewPlugin } from "./types";

/**
 * MIME 匹配，支持 `image/*` 通配与 `* / *`。
 *
 * `* / *`（无空格）是 DownloadPlugin 的写法 —— 它对任何文件都是候选，
 * 靠 `priority: -1` 排在最后当兜底。
 */
export function matchMimeType(fileType: string, pattern: string): boolean {
  if (pattern === "*/*") return true;
  if (pattern.endsWith("/*")) {
    return fileType.startsWith(pattern.slice(0, -2));
  }
  return fileType === pattern;
}

/**
 * 扩展名匹配。
 *
 * 两边都先剥掉前导点再 `endsWith`：
 *  - `extension` 的带点情况不统一（`"pdf"` / `".pdf"` / `".tar.gz"` 都见过，
 *    取决于调用方是从文件名切出来的还是手填的）；
 *  - `pattern` 在 `supportedExtensions` 里一律带点。
 * 只按原样 `endsWith` 的话，`"pdf".endsWith(".pdf")` 是 **false** ——
 * 扩展名不带点的调用方会静默地一个插件都匹配不上。
 *
 * 注意这点也意味着 `".*"` **匹配不到任何东西**（剥点后是 `"*"`）——
 * DownloadPlugin 里那句 `supportedExtensions: [".*"]` 是遗留，
 * 它真正生效靠 supportedTypes 里的星号通配。
 */
export function matchExtension(extension: string, pattern: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/^\./, "");
  return norm(extension).endsWith(norm(pattern));
}

/**
 * 这个插件认不认这个文件。
 *
 * `canHandle` **优先且互斥**：插件一旦声明了它，就完全由它决定，
 * 不再看 `supportedTypes` / `supportedExtensions`。
 * 理由：`DocxPreviewPlugin` 用 `canHandle` 读 `config.enabled` 与 `file.docxMode`，
 * 如果同时再叠加类型匹配，那个开关就会被类型匹配绕过 —— 关了也能命中。
 */
export function accepts(plugin: FilePreviewPlugin, file: FileInfo): boolean {
  if (plugin.enabled === false) return false;

  const { canHandle } = plugin.hooks;
  if (canHandle) return canHandle(file) === true;

  const { supportedTypes, supportedExtensions } = plugin;
  if (supportedTypes?.length) {
    if (supportedTypes.some((t) => matchMimeType(file.type, t))) return true;
  }
  if (supportedExtensions?.length) {
    if (supportedExtensions.some((e) => matchExtension(file.extension, e))) {
      return true;
    }
  }
  return false;
}

/**
 * 插件的实际优先级（越大越优先）。
 *
 * 读取顺序：`hooks.priorityOf(file)` → `plugin.priority` → 0。
 *
 * 兼容 `hooks.getPriority(file)` 是**过渡措施**：迁移前 16 个插件都写的是
 * `getPriority: () => N`（常量），P3 会把其中 15 个改成声明式 `priority`，
 * 只有 OfficePreviewPlugin 保留 `priorityOf`（它要按 config + 文件算）。
 * P3 完成时删掉这条兼容分支 —— 留着它，新插件就会继续照抄旧写法。
 */
export function priorityOf(plugin: FilePreviewPlugin, file: FileInfo): number {
  const h = plugin.hooks as {
    priorityOf?: (f: FileInfo) => number;
    getPriority?: (f: FileInfo) => number;
  };
  if (h.priorityOf) return h.priorityOf(file) ?? 0;
  if (h.getPriority) return h.getPriority(file) ?? 0;
  return plugin.priority ?? 0;
}

/**
 * 选出赢家。
 *
 * 平手时保持**声明顺序**（`Array.prototype.sort` 在 V8 是稳定排序）：
 * 调用方把「更想要的」写在前面，不用去猜隐式规则。
 * 一个都不认时返回 `null`，由装配层落到 `unsupported` 状态。
 */
export function resolvePreview(
  plugins: FilePreviewPlugin[],
  file: FileInfo
): FilePreviewPlugin | null {
  const winners = plugins.filter((p) => accepts(p, file));
  if (winners.length === 0) return null;
  if (winners.length === 1) return winners[0];

  return winners
    .map((plugin) => ({ plugin, score: priorityOf(plugin, file) }))
    .sort((a, b) => b.score - a.score)[0].plugin;
}

/**
 * 给 `unsupported` 状态用的提示文案。
 *
 * 不用 `file.type` 单独成句 —— 浏览器对陌生格式经常给空字符串，
 * 那样提示会变成「不支持的文件类型：」。
 */
export function unsupportedMessage(file: FileInfo): string {
  const kind = file.type || file.extension || "未知类型";
  return `没有插件能预览这个文件（${kind}）`;
}
