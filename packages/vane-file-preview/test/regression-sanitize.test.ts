/**
 * P1-5 回归：mammoth / SheetJS 的 HTML 产物必须过白名单。
 *
 * 原缺陷：两处 `dangerouslySetInnerHTML` 直接把第三方库的输出塞进 DOM，
 * 没有本地清洗，也没有安全容器。
 */
import { describe, expect, it } from "vitest";

import { sanitizeHtml } from "../src/components/FilePreviewPlugin/shared/sanitizeHtml";

describe("P1-5 · HTML 白名单清洗", () => {
  it("删除 script / iframe / svg 子树，保留正文", () => {
    const out = sanitizeHtml(
      '<p>正文</p><script>alert(1)</script><iframe src="https://evil"></iframe><svg><circle/></svg>'
    );
    expect(out).toContain("<p>正文</p>");
    expect(out).not.toContain("script");
    expect(out).not.toContain("iframe");
    expect(out).not.toContain("svg");
  });

  it("丢弃所有 on* 属性（mammoth / 单元格里的注入面）", () => {
    const out = sanitizeHtml('<p onclick="alert(1)" onmouseover="x()">hi</p>');
    expect(out).toContain("hi");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onmouseover");
  });

  it("javascript: 链接的 href 被移除，文字保留", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">点我</a>');
    expect(out).toContain("点我");
    expect(out).not.toContain("javascript:");
  });

  it("外部链接保留并补 target/rel", () => {
    const out = sanitizeHtml('<a href="https://example.com">外链</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain("noopener noreferrer");
  });

  it("图片保留 src，但 onerror 与 javascript: 被移除", () => {
    const good = sanitizeHtml(
      '<img src="data:image/png;base64,AAAA" alt="x" onerror="alert(1)">'
    );
    expect(good).toContain("data:image/png;base64");
    expect(good).not.toContain("onerror");

    const bad = sanitizeHtml('<img src="javascript:alert(1)">');
    expect(bad).not.toContain("javascript:");
  });

  it("未知标签剥壳保留子节点（表格不会被误删）", () => {
    const out = sanitizeHtml(
      "<custom><table><tr><td>单元格</td></tr></table></custom>"
    );
    expect(out).toContain("单元格");
    expect(out).toContain("<table>");
    expect(out).not.toContain("custom");
  });
});
