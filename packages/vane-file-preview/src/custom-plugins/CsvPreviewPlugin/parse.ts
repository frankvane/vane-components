/**
 * CSV / TSV 的解析层 —— **纯函数，不碰 React**。
 *
 * 迁移前这些逻辑全在 730 行的单文件组件里，混着 49 处 `console.log`、
 * 37 个内联样式、三个互相依赖的 `useEffect`。拆出来的理由很直接：
 * 「怎么解码、怎么切列、怎么序列化」是可以单测的，「怎么画表格」不是。
 *
 * ## 修掉的两个真 bug
 *
 * 1. **自动检测出来的分隔符从来没被用上。** 迁移前 `detectDelimiter()` 的结果
 *    写进 `setDelimiter`，而同一次 `parseCsv` 里用的是**闭包里的旧值** `delimiter`
 *    （React 的 setState 是异步的）。于是首屏永远按逗号解析 —— 一个分号分隔的
 *    `.csv` 打开后是「一整列」。更糟的是 `delimiter` 在 effect 依赖数组里，
 *    setDelimiter 又触发第二轮解析，等于每个文件解析两遍。
 *    现在交给 papaparse 自己的 `meta.delimiter`（它本来就是干这个的），
 *    解析一次就拿到「数据 + 实际用的分隔符」。
 *
 * 2. **「自动检测编码」是假的。** 迁移前 `detectEncoding()` 只是 `text.includes("")`
 *    （一个乱码字符），命中就 `setEncoding("gbk")` —— 但**从不重新解码**，
 *    只是把一个字符串塞进 state。真正的 GBK 文件在 `response.text()` 阶段就已经
 *    按 UTF-8 解坏了，之后再怎么标记都救不回来。现在读 `arrayBuffer`，
 *    先试 UTF-8（fatal，失败即抛），再退 GB18030，BOM 单独处理。
 */

/** papaparse 的最小形状 —— 只要 parse，方便单测注入假的实现 */
export interface PapaLike {
  parse: (
    input: string,
    config: Record<string, unknown>
  ) => {
    data: string[][];
    meta: { delimiter: string };
    errors: Array<{ message: string }>;
  };
}

export interface ParsedCsv {
  /** 表头（第一行）。比最长行短时用空字符串补齐 */
  headers: string[];
  /** 数据行（不含表头），已按 maxRows 截断 */
  rows: string[][];
  /** 文件里的总行数（含表头，不含空行） */
  totalRows: number;
  /** 是否因为 maxRows 被截断 */
  truncated: boolean;
  /** 实际使用的分隔符（用户指定，或 papaparse 猜的） */
  delimiter: string;
  /** 解析过程中的非致命警告（列数不齐等），界面可选展示 */
  warnings: string[];
}

export interface ParseCsvOptions {
  /** 指定分隔符；不传则让 papaparse 自己猜（它支持 , ; \t | 与其它单字符） */
  delimiter?: string;
  /** 最多保留多少数据行（不含表头）。0 / 不传表示不限制 */
  maxRows?: number;
}

/**
 * 解析 CSV 文本。
 *
 * 列的取法：以**表头列数**为基准，但行里多出来的单元格不丢 —— 现实里的 CSV
 * 经常有「表头 5 列、某行 6 个值」的情况，丢掉第 6 个等于静默丢数据。
 * 多出来的列会补到 `headers` 尾部（显示为「列 N」）。
 */
export function parseCsv(
  Papa: PapaLike,
  text: string,
  options: ParseCsvOptions = {}
): ParsedCsv {
  const { delimiter, maxRows = 0 } = options;

  const result = Papa.parse(text, {
    ...(delimiter ? { delimiter } : {}),
    header: false,
    skipEmptyLines: "greedy",
  });

  const all = result.data;
  if (all.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      truncated: false,
      delimiter: result.meta.delimiter || ",",
      warnings: [],
    };
  }

  const rawHeaders = all[0] ?? [];
  const bodyRows = all.slice(1);

  // 最长行的列数 → 决定总列数（表头不够就补空标题）
  let columnCount = rawHeaders.length;
  for (const row of bodyRows) {
    if (row.length > columnCount) columnCount = row.length;
  }

  const headers: string[] = [];
  for (let i = 0; i < columnCount; i += 1) {
    headers.push(rawHeaders[i] ?? "");
  }

  const kept = maxRows > 0 ? bodyRows.slice(0, maxRows) : bodyRows;
  const rows = kept.map((row) => {
    const out = new Array<string>(columnCount);
    for (let i = 0; i < columnCount; i += 1) out[i] = row[i] ?? "";
    return out;
  });

  const warnings: string[] = [];
  const ragged = bodyRows.filter((r) => r.length !== columnCount).length;
  if (ragged > 0) {
    warnings.push(`有 ${ragged} 行的列数与表头不一致，已按空单元格补齐`);
  }
  if (result.errors.length > 0) {
    warnings.push(
      `${result.errors.length} 处解析警告：${result.errors[0].message}`
    );
  }

  return {
    headers,
    rows,
    totalRows: bodyRows.length,
    truncated: maxRows > 0 && bodyRows.length > maxRows,
    delimiter: result.meta.delimiter || delimiter || ",",
    warnings,
  };
}

/**
 * 单元格 / 行 → CSV 文本（RFC 4180 口径）。
 *
 * 自己写而不是 `Papa.unparse`：导出只需要「把已经在内存里的二维数组打出来」，
 * 为此把 papaparse 再拉一次没必要；而且自己写能保证**导出与显示完全一致**
 * （用户看到的过滤/排序结果就是导出的内容）。
 */
export function toCsvText(headers: string[], rows: string[][]): string {
  const escapeCell = (value: string): string => {
    const s = value ?? "";
    // 含分隔符 / 引号 / 换行时必须加引号，内部引号翻倍
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCell).join(",")
  );
  return `${lines.join("\r\n")}\r\n`;
}

export interface DecodedText {
  text: string;
  /** 实际使用的编码，界面上要显示（用户才知道自己看到的是不是好的） */
  encoding: string;
}

/**
 * 字节 → 文本。
 *
 * 顺序：BOM 优先（BOM 是权威声明，不该被「像不像 UTF-8」干扰），
 * 然后 UTF-8 fatal 试解，失败退 GB18030（GBK 的超集，含全部 GBK 字符），
 * 最后兜底 UTF-8 宽容模式（会有乱码，但至少能看到内容）。
 *
 * 中文 CSV 里 GBK 仍然很常见 —— Excel 在中文 Windows 上「另存为 CSV」
 * 默认就是 GBK。不解码的话打开是满屏 `锟斤拷`。
 */
export function decodeText(buffer: ArrayBuffer): DecodedText {
  const bytes = new Uint8Array(buffer);

  const decodeWith = (encoding: string, slice: Uint8Array): string | null => {
    try {
      return new TextDecoder(encoding, { fatal: false }).decode(slice);
    } catch {
      // 浏览器不支持该编码（utf-16be 在个别环境缺失）
      return null;
    }
  };

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    const text = decodeWith("utf-8", bytes.subarray(3));
    if (text !== null) return { text, encoding: "utf-8 (BOM)" };
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    const text = decodeWith("utf-16le", bytes.subarray(2));
    if (text !== null) return { text, encoding: "utf-16le" };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    const text = decodeWith("utf-16be", bytes.subarray(2));
    if (text !== null) return { text, encoding: "utf-16be" };
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { text, encoding: "utf-8" };
  } catch {
    // 不是合法 UTF-8，继续往下试
  }

  try {
    const text = new TextDecoder("gb18030", { fatal: true }).decode(bytes);
    return { text, encoding: "gb18030" };
  } catch {
    // 也不是合法 GB18030
  }

  return {
    text: new TextDecoder("utf-8").decode(bytes),
    encoding: "utf-8（含无法解码的字节）",
  };
}
