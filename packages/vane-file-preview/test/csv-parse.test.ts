/**
 * CSV 解析层的单测 —— 这一层之所以被拆出来，就是为了能这样测。
 *
 * 三条断言各自对应迁移前的一个真实缺陷：
 *
 * 1. **GBK 文件**：迁移前「自动检测编码」只把 "gbk" 写进 state、从不重新解码，
 *    所以中文 CSV 打开是满屏乱码。这里直接喂 GBK 字节，断言解出来是「张伟」。
 * 2. **分号 / Tab 分隔**：迁移前检测结果写进 setState 后，同一次解析用的还是旧值
 *    （React setState 异步），于是首屏永远按逗号切 → 整个文件变成一列。
 *    现在交给 papaparse 的 `meta.delimiter`，一次解析就能拿到正确结果。
 * 3. **列数不齐**：表头 3 列、某行 5 个值时，迁移前 `row.map` 会画出 5 个 td，
 *    与表头错位；现在按最长行补齐，并对多出的列补「列 N」标题。
 */

import { describe, expect, it } from "vitest";
import Papa from "papaparse";

import {
  decodeText,
  parseCsv,
  toCsvText,
  type PapaLike,
} from "../src/custom-plugins/CsvPreviewPlugin/parse";

const papa = Papa as unknown as PapaLike;

/** "张伟,北京,研发,92" 的 GB18030 字节（不含 BOM） */
const GBK_BYTES = new Uint8Array([
  0xd5, 0xc5, 0xce, 0xb0, 0x2c, 0xb1, 0xb1, 0xbe, 0xa9, 0x2c, 0xd1, 0xd0, 0xb7,
  0xa2, 0x2c, 0x39, 0x32,
]);

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

describe("decodeText · 编码", () => {
  it("普通 UTF-8 直接解", () => {
    const buf = toArrayBuffer(new TextEncoder().encode("姓名,城市\n张三,北京"));
    const out = decodeText(buf);
    expect(out.encoding).toBe("utf-8");
    expect(out.text).toContain("张三");
  });

  it("UTF-8 BOM 被剥掉（BOM 留在首列会让第一列表头变成 \\uFEFF姓名）", () => {
    const body = new TextEncoder().encode("姓名,城市");
    const withBom = new Uint8Array(body.length + 3);
    withBom.set([0xef, 0xbb, 0xbf]);
    withBom.set(body, 3);

    const out = decodeText(toArrayBuffer(withBom));
    expect(out.encoding).toBe("utf-8 (BOM)");
    expect(out.text.startsWith("姓名")).toBe(true);
    expect(out.text.includes("\uFEFF")).toBe(false);
  });

  it("GBK / GB18030 会被识别并正确解码", () => {
    const out = decodeText(toArrayBuffer(GBK_BYTES));
    // 中文 Windows 的 Excel 默认导出的就是这种
    expect(out.encoding).toBe("gb18030");
    expect(out.text).toBe("张伟,北京,研发,92");
  });

  it("UTF-16LE BOM", () => {
    const body = new Uint8Array([0xff, 0xfe]);
    const text = new Uint8Array(
      Array.from("姓名,城市", (ch) => [ch.charCodeAt(0) & 0xff, ch.charCodeAt(0) >> 8]).flat()
    );
    const bytes = new Uint8Array(body.length + text.length);
    bytes.set(body);
    bytes.set(text, 2);

    const out = decodeText(toArrayBuffer(bytes));
    expect(out.encoding).toBe("utf-16le");
    expect(out.text).toBe("姓名,城市");
  });
});

describe("parseCsv · 解析", () => {
  it("逗号 / 分号 / Tab 都能自己认出来", () => {
    const comma = parseCsv(papa, "a,b\n1,2");
    expect(comma.delimiter).toBe(",");
    expect(comma.headers).toEqual(["a", "b"]);

    const semi = parseCsv(papa, "a;b\n1;2");
    expect(semi.delimiter).toBe(";");
    expect(semi.headers).toEqual(["a", "b"]);

    const tab = parseCsv(papa, "a\tb\n1\t2");
    expect(tab.delimiter).toBe("\t");
    expect(tab.headers).toEqual(["a", "b"]);
  });

  it("引号内的逗号与换行不会被切开", () => {
    const parsed = parseCsv(papa, 'name,note\n"Li, Lei","line1\nline2"');
    expect(parsed.headers).toEqual(["name", "note"]);
    expect(parsed.rows[0][0]).toBe("Li, Lei");
    expect(parsed.rows[0][1]).toBe("line1\nline2");
  });

  it("列数不齐：按最长行补齐，不丢多的那一列", () => {
    const parsed = parseCsv(papa, "a,b\n1\n1,2,3");
    expect(parsed.headers).toEqual(["a", "b", ""]);
    expect(parsed.rows[0]).toEqual(["1", "", ""]);
    expect(parsed.rows[1]).toEqual(["1", "2", "3"]);
    expect(parsed.warnings[0]).toContain("列数与表头不一致");
  });

  it("maxRows 截断并标记 truncated，totalRows 仍是真实行数", () => {
    const parsed = parseCsv(papa, "n\n1\n2\n3\n4", { maxRows: 2 });
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.totalRows).toBe(4);
    expect(parsed.truncated).toBe(true);
  });

  it("显式指定分隔符时以用户为准", () => {
    // 整行里既有逗号又有分号，用户说是分号就是分号
    const parsed = parseCsv(papa, "a;b\n1,5;2", { delimiter: ";" });
    expect(parsed.headers).toEqual(["a", "b"]);
    expect(parsed.rows[0]).toEqual(["1,5", "2"]);
  });

  it("空文本不炸", () => {
    const parsed = parseCsv(papa, "");
    expect(parsed.headers).toEqual([]);
    expect(parsed.rows).toEqual([]);
    expect(parsed.totalRows).toBe(0);
  });
});

describe("toCsvText · 序列化", () => {
  it("含逗号 / 引号 / 换行的单元格加引号并把引号翻倍", () => {
    const csv = toCsvText(["a", "b"], [['x,y', 'he said "hi"'], ["line\nbreak", ""]]);
    expect(csv).toBe('a,b\r\n"x,y","he said ""hi"""\r\n"line\nbreak",\r\n');
  });

  it("往返：parse → toCsvText → parse 得到同样的数据", () => {
    const source = 'name,note\n"Li, Lei","say ""hi"""';
    const first = parseCsv(papa, source);
    const round = parseCsv(papa, toCsvText(first.headers, first.rows));
    expect(round.headers).toEqual(first.headers);
    expect(round.rows).toEqual(first.rows);
  });
});
