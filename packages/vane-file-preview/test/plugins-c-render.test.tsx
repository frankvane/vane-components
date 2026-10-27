/**
 * C 批的渲染冒烟 —— 四条断言各自守住一个「迁移前真的错」的行为：
 *
 * 1. **Code**：高亮组件真的渲染出 `pre/code`，且主题能切换（sharedData + forceUpdate）。
 * 2. **Markdown**：`allowHtml: false` 时文件里的 `<img onerror>` **不进 DOM**，
 *    只作为文本显示；`allowHtml: true` 时才进。这是安全边界，必须双向断言 ——
 *    只测「默认关」的话，把开关写死成永久关闭也会通过。
 * 3. **CSV**：分号分隔的表能被认出来（迁移前首屏永远按逗号切 → 整个文件一列）。
 * 4. **Epub**：非 zip 内容 / 「普通 zip 改后缀」两种都要给出明确错误，
 *    而不是把错误丢进 console 或交给 epub.js 内部去炸。
 */

import { describe, expect, it, vi } from "vitest";

import { createCodePreviewPlugin } from "../src/custom-plugins/CodePreviewPlugin";
import { createMarkdownPreviewPlugin } from "../src/custom-plugins/MarkdownPreviewPlugin";
import { createCsvPreviewPlugin } from "../src/custom-plugins/CsvPreviewPlugin";
import { createEpubPreviewPlugin } from "../src/custom-plugins/EpubPreviewPlugin";
import { resolveMarkdownUrl } from "../src/custom-plugins/MarkdownPreviewPlugin";
import { renderPreview, waitFor } from "./helpers";
import type { FileInfo } from "../src/components/FilePreviewPlugin/plugins/types";

const file = (over: Partial<FileInfo> = {}): FileInfo => ({
  name: "a.txt",
  size: 10,
  type: "text/plain",
  extension: "txt",
  url: "blob:a",
  ...over,
});

/** 所有 C 批插件都靠 fetch 取内容，这里按 url 分发 */
function stubFetch(map: Record<string, string | Uint8Array>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : String(input);
      const body = map[url];
      if (body === undefined) return new Response("", { status: 404 });
      return new Response(body as BodyInit, { status: 200 });
    })
  );
}

const TS_SOURCE = `export function add(a: number, b: number) {
  return a + b;
}
`;

// prism + 主题是按需动态 import 的（第一次要真去加载 react-syntax-highlighter 的
// 语言包与主题），并行跑全量时单条用例会摸到默认 5s 上限。这里放宽而不是靠「再跑一次」。
describe("Code · 渲染", { timeout: 15000 }, () => {
  it("高亮出 pre/code，且显示行数与语言", async () => {
    stubFetch({ "blob:code": TS_SOURCE });
    const h = renderPreview([createCodePreviewPlugin()], {
      file: file({ name: "sum.ts", type: "text/typescript", extension: "ts", url: "blob:code" }),
    });

    await waitFor(() => h.container.querySelector("[data-vfp-code] pre") !== null);

    const pre = h.container.querySelector("[data-vfp-code] pre");
    expect(pre?.textContent).toContain("export function add");
    // prism 会给每个 token 包 span，至少得有一个
    expect(h.container.querySelectorAll("[data-vfp-code] pre span").length).toBeGreaterThan(0);
    expect(h.container.textContent).toContain("sum.ts");
    expect(h.container.textContent).toContain("typescript");
  });

  it("主题下拉能切到 dark（写入 sharedData 并触发重渲染）", async () => {
    stubFetch({ "blob:code": TS_SOURCE });
    const h = renderPreview([createCodePreviewPlugin()], {
      file: file({ name: "sum.ts", type: "text/typescript", extension: "ts", url: "blob:code" }),
    });
    await waitFor(() => h.container.querySelector("[data-vfp-code]") !== null);

    const wrapper = () => h.container.querySelector("[data-vfp-code]");
    // 默认 auto → 取决于 prefers-color-scheme；happy-dom 下没有 matchMedia 的 dark 命中
    expect(wrapper()?.getAttribute("data-vfp-code-theme")).toBe("light");

    const select = h.container.querySelector(
      "[data-vfp-code-theme-select]"
    ) as HTMLSelectElement;
    select.value = "dark";
    select.dispatchEvent(new window.Event("change", { bubbles: true }));

    await waitFor(() => wrapper()?.getAttribute("data-vfp-code-theme") === "dark");
    expect(wrapper()?.getAttribute("data-vfp-code-theme")).toBe("dark");
  });

  it("maxBytes 生效：超大文件退化成纯文本并说明原因", async () => {
    const big = "x".repeat(500);
    stubFetch({ "blob:big": big });
    const h = renderPreview([createCodePreviewPlugin({ maxBytes: 100 })], {
      file: file({ name: "big.js", type: "text/javascript", extension: "js", url: "blob:big" }),
    });

    await waitFor(() => h.container.querySelector("[data-vfp-code-plain]") !== null);
    expect(h.container.querySelector("[data-vfp-code-plain]")?.textContent).toContain(
      "超过高亮上限"
    );
  });
});

describe("Markdown · 安全默认", () => {
  const PAYLOAD = `<img src="x" onerror="document.title='PWNED'">\n\n# 标题\n`;

  it("allowHtml 默认关闭：原始 HTML 不进 DOM，只作为文本", async () => {
    stubFetch({ "blob:md": PAYLOAD });
    const h = renderPreview([createMarkdownPreviewPlugin()], {
      file: file({ name: "a.md", type: "text/markdown", extension: "md", url: "blob:md" }),
    });

    await waitFor(() => h.container.querySelector("[data-vfp-md]") !== null);
    await waitFor(() => (h.container.textContent ?? "").includes("标题"));

    // 关键：没有真的 img 元素
    expect(h.container.querySelector("[data-vfp-md] img")).toBeNull();
    // 标签作为文本可见
    expect(h.container.textContent).toContain("onerror");
    // 正常 Markdown 仍然工作
    expect(h.container.querySelector("[data-vfp-md] h1")).not.toBeNull();
  });

  it("allowHtml: true 时才把 HTML 插进 DOM", async () => {
    stubFetch({ "blob:md": PAYLOAD });
    const h = renderPreview([createMarkdownPreviewPlugin({ allowHtml: true })], {
      file: file({ name: "a.md", type: "text/markdown", extension: "md", url: "blob:md" }),
    });

    await waitFor(() => h.container.querySelector("[data-vfp-md] img") !== null);
    const img = h.container.querySelector("[data-vfp-md] img")!;
    expect(img).not.toBeNull();
    // 元素进来了，但事件处理器必须被剥掉：留着它 React 会抛
    // 「Expected `onError` listener to be a function, instead got a value of `string` type」，
    // 整棵预览树崩掉（真浏览器里复现过，见 stripDangerousAttrs）
    expect(img.getAttribute("onerror")).toBeNull();
    expect((img as HTMLImageElement).onerror).toBeNull();
  });

  it("allowHtml 档遇到 on* 属性不崩，正文照常渲染", async () => {
    stubFetch({
      "blob:md": `<img src="x" onerror="alert(1)" onclick="alert(2)">\n\n# 还好\n`,
    });
    const h = renderPreview([createMarkdownPreviewPlugin({ allowHtml: true })], {
      file: file({ name: "b.md", type: "text/markdown", extension: "md", url: "blob:md" }),
    });

    await waitFor(() => h.container.querySelector("[data-vfp-md] h1") !== null);
    expect(h.container.querySelector("[data-vfp-md] h1")?.textContent).toContain("还好");
    expect(h.container.querySelector("[data-vfp-md] img")).not.toBeNull();
    expect(h.container.querySelector("[data-vfp-md] img")?.getAttribute("onclick")).toBeNull();
  });

  it("相对路径按文件位置解析（不是按页面地址）", () => {
    const fileUrl = "https://cdn.example.com/docs/guide/a.md";
    expect(resolveMarkdownUrl("images/x.png", fileUrl)).toBe(
      "https://cdn.example.com/docs/guide/images/x.png"
    );
    expect(resolveMarkdownUrl("/root.png", fileUrl)).toBe("https://cdn.example.com/root.png");
    expect(resolveMarkdownUrl("#anchor", fileUrl)).toBe("#anchor");
    expect(resolveMarkdownUrl("https://other.com/a.png", fileUrl)).toBe(
      "https://other.com/a.png"
    );
    // 危险协议一律清空
    expect(resolveMarkdownUrl("javascript:alert(1)", fileUrl)).toBe("");
    expect(resolveMarkdownUrl("data:text/html,<script>", fileUrl)).toBe("");
    // data:image 允许（内联小图很常见）
    expect(resolveMarkdownUrl("data:image/png;base64,AAA", fileUrl)).toBe(
      "data:image/png;base64,AAA"
    );
  });
});

describe("CSV · 渲染", () => {
  it("分号分隔的表能被自动识别成多列", async () => {
    stubFetch({ "blob:csv": "姓名;城市\n张三;北京\n李四;上海\n" });
    const h = renderPreview([createCsvPreviewPlugin()], {
      file: file({ name: "a.csv", type: "text/csv", extension: "csv", url: "blob:csv" }),
    });

    await waitFor(() => h.container.querySelector("[data-vfp-csv-table]") !== null);

    const headers = Array.from(
      h.container.querySelectorAll("[data-vfp-csv-table] thead th")
    ).map((th) => th.textContent);
    // 第一列是行号 #
    expect(headers).toContain("姓名");
    expect(headers).toContain("城市");
    expect(h.container.textContent).toContain("张三");
    expect(h.container.querySelector("[data-vfp-csv-count]")?.textContent).toContain(
      "共 2 行"
    );
  });

  it("引号内的逗号不会被切开（papaparse 真的在跑）", async () => {
    stubFetch({ "blob:csv2": 'name,note\n"Li, Lei",hi\n' });
    const h = renderPreview([createCsvPreviewPlugin()], {
      file: file({ name: "b.csv", type: "text/csv", extension: "csv", url: "blob:csv2" }),
    });

    await waitFor(() => h.container.querySelector("[data-vfp-csv-table]") !== null);
    expect(h.container.textContent).toContain("Li, Lei");
  });
});

describe("Epub · 前置校验", () => {
  it("HTML 404 页：说出「看起来像 HTML 页面」而不是把它当书", async () => {
    stubFetch({
      "blob:fake": new TextEncoder().encode(
        "<!DOCTYPE html><html><body>404 Not Found</body></html>"
      ),
    });
    const h = renderPreview([createEpubPreviewPlugin()], {
      file: file({
        name: "fake.epub",
        type: "application/epub+zip",
        extension: "epub",
        url: "blob:fake",
      }),
    });

    await waitFor(() => h.container.querySelector('[data-vfp-panel="error"]') !== null);
    const text = h.container.textContent ?? "";
    expect(text).toContain("这不是一个 EPUB");
    expect(text).toContain("HTML 页面");
    // 二进制头部不能当文本打印：上一版这里是 `PK\uFFFD\uFFFD\uFFFDUO…`
    expect(text).not.toContain("\uFFFD");
  });

  it("二进制头部打印成十六进制，不再出现替换符乱码", async () => {
    // 1x1 PNG 的开头，代表「用户把一张图片改了后缀」
    stubFetch({
      "blob:png": new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]),
    });
    const h = renderPreview([createEpubPreviewPlugin()], {
      file: file({
        name: "pic.epub",
        type: "application/epub+zip",
        extension: "epub",
        url: "blob:png",
      }),
    });

    await waitFor(() => h.container.querySelector('[data-vfp-panel="error"]') !== null);
    const text = h.container.textContent ?? "";
    expect(text).toContain("PNG 图片");
    expect(text).toContain("89 50 4E 47");
    expect(text).not.toContain("\uFFFD");
  });

  it("普通 ZIP 会列出实际条目，让「为什么不是 EPUB」一眼可查", async () => {
    // EPUB 就是 zip，所以**只看魔数区分不了** EPUB 与普通 zip —— 上一版
    // 就是这么写的，结果「a.zip 改名成 a.epub」会一路交到 epub.js 手里，
    // 用户看到的是一句与文件无关的 "Error loading book"。
    // 样本必须是**真 zip 且内容里藏着假的中央目录签名**。
    //
    // 第一版的条目列举是「全文线性扫 PK\x01\x02，再按固定偏移读名字长度」，
    // 而 zip 的压缩数据完全可以恰好包含这四个字节 —— 于是读出一段随机字节
    // 当文件名。真浏览器里 `fake-book.epub` 那次就是这么变成满屏乱码的，
    // 但当时手搓的合成样本里没有数据区，测试是绿的（又一次「单测绿、真文件红」）。
    // 所以这里用 STORE 存一段内容明确含 `PK\x01\x02` 的数据，让旧实现必然踩到。
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const decoy = new Uint8Array(64);
    decoy.set([0x50, 0x4b, 0x01, 0x02], 0);
    decoy[28] = 6; // 旧实现在这里读「名字长度」
    decoy.set([0xff, 0xfe, 0x80, 0x81, 0x82, 0x83], 46); // 一段非法 UTF-8
    zip.file("payload.bin", decoy, { compression: "STORE" });
    zip.file("src/App.css", "body { color: red }");
    zip.file("src/main.tsx", "export const a = 1;");
    const zipBytes = await zip.generateAsync({ type: "uint8array" });
    stubFetch({ "blob:plainzip": zipBytes });

    const h = renderPreview([createEpubPreviewPlugin()], {
      file: file({
        name: "fake.epub",
        type: "application/epub+zip",
        extension: "epub",
        url: "blob:plainzip",
      }),
    });

    await waitFor(() => h.container.querySelector('[data-vfp-panel="error"]') !== null);
    const text = h.container.textContent ?? "";
    expect(text).toContain("普通 ZIP");
    expect(text).toContain("META-INF/container.xml");
    // 必须是**恰好**这三项：多出来任何一项都说明旧实现把数据区当成了目录，
    // 而且那条假条目排在最前面，所以这里断言完整的字符串而不是 contains
    expect(text).toContain("实际条目是：payload.bin、src/App.css、src/main.tsx。");
    expect(text).not.toContain("\uFFFD");
    // 失败面板不能是死路
    expect(h.container.querySelector("[data-vfp-error-action]")).not.toBeNull();
  });
});
