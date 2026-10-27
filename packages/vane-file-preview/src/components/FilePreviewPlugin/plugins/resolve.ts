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
 * 匹配置信度：这个插件认不认这个文件，以及「有多确定」。
 *
 *   2 = 显式意图（声明了 `canHandle` 且返回 true）或 MIME 命中
 *   1 = 只靠扩展名命中
 *   0 = 不认
 *
 * 为什么要区分 1 和 2：**同一个扩展名可以属于多种媒体**。
 * `.ogg` 既是 `audio/ogg`（Vorbis）也是 `video/ogg`（Theora）；
 * `.ts` 既是 TypeScript 源码也是 MPEG-TS；`.m4a` 与 `.mp4` 同族。
 * 只按「认不认」判，两个插件都认领、优先级又相同，就只能靠声明顺序决出赢家 ——
 * P3-A 的真浏览器验收里就是这样：一段 Vorbis 音频被 `VideoPreviewPlugin`
 * 靠 `.ogg` 扩展名抢走，渲染成一个黑底视频框（控件能播，但工具栏写着 "OGG Video"）。
 *
 * 浏览器给的 MIME 是**权威类型**，扩展名只是文件名的一部分，两者冲突时 MIME 该赢。
 */
export function matchStrength(plugin: FilePreviewPlugin, file: FileInfo): number {
  if (plugin.enabled === false) return 0;

  const { canHandle } = plugin.hooks;
  // 声明了 canHandle 就完全由它决定（互斥），命中即最高置信度
  if (canHandle) return canHandle(file) === true ? 2 : 0;

  const { supportedTypes, supportedExtensions } = plugin;
  const mimeHit = supportedTypes?.some((t) => matchMimeType(file.type, t));
  if (mimeHit) return 2;

  const extHit = supportedExtensions?.some((e) =>
    matchExtension(file.extension, e)
  );
  if (extHit) return 1;

  return 0;
}

/**
 * 这个插件认不认这个文件。
 *
 * 保留 boolean 形态给调用方用（插件作者读得懂），内部用 `matchStrength` 区分强弱。
 */
export function accepts(plugin: FilePreviewPlugin, file: FileInfo): boolean {
  return matchStrength(plugin, file) > 0;
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
 * 排序键（依次比较）：
 *   1. `priority` 降序 —— 插件的显式意图，最高优先
 *   2. 匹配置信度降序 —— priority 平手时，MIME 命中压过「只有扩展名像」
 *   3. 声明顺序 —— 调用方把「更想要的」写在前面，不用猜隐式规则
 *
 * 一个都不认时返回 `null`，由装配层落到 `unsupported` 状态。
 */
export function resolvePreview(
  plugins: FilePreviewPlugin[],
  file: FileInfo
): FilePreviewPlugin | null {
  const candidates = plugins
    .map((plugin) => ({
      plugin,
      strength: matchStrength(plugin, file),
      priority: priorityOf(plugin, file),
    }))
    .filter((c) => c.strength > 0);

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].plugin;

  candidates.sort(
    (a, b) => b.priority - a.priority || b.strength - a.strength
  );
  return candidates[0].plugin;
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
