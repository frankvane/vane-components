/**
 * 插件共用的文件小工具。
 *
 * 迁移前这些小函数被**复制粘贴到 5 个插件里**（`formatSize` 出现 3 份、
 * 扩展名判断散在 docx / office 两处），而且写法还不一致：
 *   - `formatSize` 有的保留 2 位小数、有的 1 位；
 *   - 扩展名一半当带点处理（`".docx"`），一半当不带点处理（`"docx"`）。
 * 第二种不一致真的会出 bug：`file.extension` 到底带不带点取决于调用方
 * 怎么切的文件名，插件里写死一边就一定有一边错。
 */

/**
 * 扩展名归一：去掉前导点、转小写。
 *
 * `".PDF"` / `"pdf"` / `"Pdf"` 全部归一到 `"pdf"`。
 * 插件里判断类型一律先过这个函数，不要再假设带不带点。
 */
export function normalizeExtension(extension: string | undefined): string {
  return (extension ?? "").toLowerCase().replace(/^\./, "");
}

/** 字节数 → 人类可读（1 位小数，工具栏粒度足够） */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * 触发一次浏览器下载。
 *
 * 用 `<a download>` 而不是 `window.open`：后者会被弹窗拦截器杀掉，
 * 而且对 `blob:` / `data:` URL 会直接新开一个标签页播放。
 *
 * 注意 `download` 属性只对**同源** URL 生效。跨域 URL（CDN）会被浏览器忽略，
 * 变成「在标签页里打开」—— 这是浏览器安全策略，不是这里能修的。
 * 需要强制下载的跨域场景得由服务端给 `Content-Disposition: attachment`。
 */
export function triggerDownload(url: string, filename: string): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 这个 URL 能不能被**第三方在线服务**（Office Online / Google Docs Viewer）取到。
 *
 * 这类服务的原理是「它们的服务器去你给的 URL 拉文件」，所以：
 *   - `blob:` / `data:` 只存在于当前页面内存里，服务端永远取不到；
 *   - `localhost` / `127.0.0.1` / `0.0.0.0` 指向的是「你的机器」，不是它们的机器；
 *   - 内网段（10.x / 172.16-31.x / 192.168.x / `.local` / 无点主机名）同理。
 *
 * 迁移前只判断了 `localhost` 且**仍然渲染 iframe**，只是叠一条黄色提示 ——
 * 用户看到的是一个必然超时的空白框加一句话，而不是「这条路走不通」。
 * 现在提到渲染前判断，命中就直接给说明面板。
 */
export function isPubliclyReachableUrl(url: string): boolean {
  if (!url) return false;
  // 相对路径按当前页面解析后再判断
  let parsed: URL;
  try {
    parsed = new URL(url, typeof window === "undefined" ? undefined : window.location.href);
  } catch {
    return false;
  }

  if (parsed.protocol === "blob:" || parsed.protocol === "data:") return false;

  const host = parsed.hostname.toLowerCase();
  if (!host) return false;
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
    return false;
  }
  if (host.endsWith(".localhost") || host.endsWith(".local")) return false;
  // IPv6 回环
  if (host === "[::1]" || host === "::1") return false;

  // 私有网段：10.0.0.0/8、172.16.0.0/12、192.168.0.0/16、169.254.0.0/16
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 169 && b === 254) return false;
    if (a === 127) return false;
  }

  // 无点主机名（如 `http://intranet/file.docx`）只在局域网可解析
  if (!host.includes(".") && !host.startsWith("[")) return false;

  return true;
}

/**
 * 复制文本到剪贴板。
 *
 * 两条路，都要：
 *   1. `navigator.clipboard.writeText` —— 现代 API，但**只在 secure context**
 *      （https / localhost）可用。内网 http 页面里 `navigator.clipboard` 是 undefined，
 *      直接调用会抛 TypeError。
 *   2. 退到隐藏 `<textarea>` + `document.execCommand("copy")` —— 已废弃，
 *      但它是 http 页面里唯一还能用的办法。
 *
 * 迁移前 Code 插件只写了第一条，于是「复制」按钮在内网环境下点了没反应，
 * 也没有任何提示（错误只进了 console）。
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof document === "undefined") return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 落到下面的兜底路径
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
