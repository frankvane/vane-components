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

describe("Code · 渲染", () => {
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
    expect(h.container.querySelector("[data-vfp-md] img")).not.toBeNull();
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
  it("非 zip 内容给出明确错误，而不是空白", async () => {
    stubFetch({
      "blob:fake": new TextEncoder().encode("<html><body>404 Not Found</body></html>"),
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
    expect(h.container.textContent).toContain("这不是一个 EPUB");
  });

  it("普通 ZIP（魔数相同但没有 container.xml）不会被硬塞给 epub.js", async () => {
    // EPUB 就是 zip，所以**只看魔数区分不了** EPUB 与普通 zip —— 上一版
    // 就是这么写的，结果「a.zip 改名成 a.epub」会一路交到 epub.js 手里，
    // 用户看到的是一句与文件无关的 "Error loading book"。
    // 现在多看一步：任何 EPUB 都必须有 META-INF/container.xml。
    const zipBytes = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, // zip 魔数，和 epub 完全一样
      ...new TextEncoder().encode("hello.txt"),
    ]);
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
    expect(h.container.textContent).toContain("普通 ZIP");
    expect(h.container.textContent).toContain("META-INF/container.xml");
  });
});
