/**
 * 第三方库产物的本地清洗。
 *
 * mammoth（DOCX → HTML）与 SheetJS（`sheet_to_html`）都把**文件内容**写进
 * HTML 字符串，再由插件 `dangerouslySetInnerHTML` 插进 DOM。文件的输入天然不可信，
 * 因此不能把「库有没有转义」当作安全边界 —— 库换一个大版本、或者某个单元格/超链接
 * 走了未转义的分支，注入面就重新打开。
 *
 * 这里不引 DOMPurify：包体预算与「零重依赖」的定位冲突，而这两处产物的标签面很窄
 * （标题 / 段落 / 表格 / 链接 / 图片），白名单足够。规则：
 *  - 只保留白名单标签，其余**连同子树一起删除**（script / style / iframe / svg …）；
 *  - 属性按白名单逐标签保留，任何 `on*` 一律丢弃；
 *  - `href` / `src` 只允许 http(s) / mailto / tel / 相对路径，
 *    `data:` 只允许图片且仅限常见位图；
 *  - `a` 统一补 `rel="noopener noreferrer"` 与 `target="_blank"`。
 *
 * 注意：规范里 DOMParser 产出的是惰性文档（不执行脚本、不加载资源），但并非所有
 * DOM 实现都如此 —— happy-dom 会把解析结果挂到 document 上并执行 `<script>`。
 * 所以进入 DOMParser 之前先用字符串剥离一次危险块，既是纵深防御，也保证清洗流程
 * 在宿主跑测试时不会自己触发副作用。详见 `stripDangerousBlocks`。
 */

const ALLOWED_TAGS = new Set([
  "a",
  "article",
  "b",
  "big",
  "blockquote",
  "br",
  "caption",
  "center",
  "code",
  "col",
  "colgroup",
  "dd",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

/** 连内容一起删除：保留它们的子节点等于把 payload 直接放过 */
const DROP_WHOLE_TAGS = new Set([
  "audio",
  "base",
  "button",
  "embed",
  "form",
  "frame",
  "frameset",
  "head",
  "iframe",
  "input",
  "link",
  "math",
  "meta",
  "noscript",
  "object",
  "script",
  "select",
  "style",
  "svg",
  "template",
  "textarea",
  "video",
]);

/** 各标签允许保留的属性 */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "name"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  table: new Set(["border", "cellpadding", "cellspacing"]),
  col: new Set(["span", "width"]),
  colgroup: new Set(["span", "width"]),
};

const DEFAULT_ALLOWED_ATTRS = new Set(["title", "class"]);

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

const SAFE_IMAGE_DATA = /^data:image\/(png|jpe?g|gif|webp|bmp);base64,/i;

function isSafeUrl(value: string, allowDataImage: boolean): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return false;

  // 相对路径 / 锚点：交给浏览器按当前源解析，本身没有协议
  if (/^(#|\/|\.\/|\.\.\/|\?)/.test(trimmed)) return true;

  // 任何带冒号且能被 URL 解析的，都必须落在白名单协议里
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    try {
      const parsed = new URL(trimmed, "https://vane.invalid/");
      if (allowDataImage && SAFE_IMAGE_DATA.test(trimmed)) return true;
      return SAFE_PROTOCOLS.has(parsed.protocol);
    } catch {
      return false;
    }
  }

  // 形如 `javascript&#58;...` 的解码后再判一次（`&colon;` 等实体）
  const decoded = trimmed.replace(/&#(x?[0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(
      code[0] === "x" || code[0] === "X"
        ? parseInt(code.slice(1), 16)
        : parseInt(code, 10)
    )
  );
  if (decoded !== trimmed) {
    try {
      const parsed = new URL(decoded, "https://vane.invalid/");
      if (allowDataImage && SAFE_IMAGE_DATA.test(decoded)) return true;
      return SAFE_PROTOCOLS.has(parsed.protocol);
    } catch {
      return false;
    }
  }

  return true;
}

function cleanElement(el: Element): void {
  const tag = el.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    if (DROP_WHOLE_TAGS.has(tag) || !el.tagName) {
      el.remove();
      return;
    }
    // 未知但非危险标签：剥壳留子节点（例如 mammoth 输出里的自定义容器）
    const parent = el.parentNode;
    if (!parent) {
      el.remove();
      return;
    }
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    el.remove();
    return;
  }

  const allowed = ALLOWED_ATTRS[tag] ?? DEFAULT_ALLOWED_ATTRS;
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith("on") || !allowed.has(name)) {
      el.removeAttribute(attr.name);
      continue;
    }
    if (name === "href" || name === "src") {
      if (!isSafeUrl(attr.value, tag === "img" && name === "src")) {
        el.removeAttribute(attr.name);
      }
    }
  }

  if (tag === "a" && el.getAttribute("href")) {
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  }
}

const DANGEROUS_PAIRED =
  /<(script|style|iframe|object|embed|svg|math|template|noscript|head|form|textarea|select|button|audio|video|frame|frameset)(?:\s[^>]*)?>[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_VOID = /<(base|link|meta|input)(?:\s[^>]*)?>/gi;
const DANGEROUS_SELF_CLOSING =
  /<(script|style|iframe|object|embed|svg|math|template|noscript|head|form|textarea|select|button|audio|video|frame|frameset|base|link|meta|input)(?:\s[^>]*)?\/>/gi;

/**
 * 在 DOMParser 之前按原文剥掉危险块的**整段**（含内容）。
 *
 * 只用于「多删」：正则匹配错了顶多少画一段内容，不会放过危险节点。
 * 嵌套块（`<script><script></script></script>`）需要多轮：内层先被删，
 * 外层到下一轮才露出完整的闭合标签。
 */
function stripDangerousBlocks(html: string): string {
  let out = html;
  let prev = "";
  for (let i = 0; i < 5 && out !== prev; i += 1) {
    prev = out;
    out = out.replace(DANGEROUS_PAIRED, "");
  }
  return out.replace(DANGEROUS_SELF_CLOSING, "").replace(DANGEROUS_VOID, "");
}

/**
 * 清洗一段 HTML，返回可安全插入 DOM 的字符串。
 *
 * 没有 DOMParser（SSR / 极端环境）时返回空串 —— 宁可少画，也不把未清洗的内容
 * 交给调用方。调用方会因此看到空文档而不是白屏。
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return "";

  const preCleaned = stripDangerousBlocks(html);
  if (!preCleaned) return "";

  const doc = new DOMParser().parseFromString(preCleaned, "text/html");
  const body = doc.body;
  if (!body) return "";

  // 静态快照：清洗过程中会改动 DOM，直接遍历 live 集合会跳项
  const elements = Array.from(body.querySelectorAll("*"));

  // 先删危险子树，再由外向内剥壳，避免父节点被移除后子节点仍被处理
  for (const el of elements) {
    if (isDangerous(el)) el.remove();
  }
  for (const el of Array.from(body.querySelectorAll("*"))) {
    cleanElement(el);
  }

  return body.innerHTML;
}

function isDangerous(el: Element): boolean {
  return DROP_WHOLE_TAGS.has(el.tagName.toLowerCase()) || !el.isConnected;
}
