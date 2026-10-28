/**
 * 极简 TSX 高亮
 *
 * 不引 react-syntax-highlighter：那份依赖会把 demo 产物撑大 300KB+，而示例页只需要
 * 认出注释 / 字符串 / 关键字 / JSX 标签四类 token。这里用一条合并正则扫一遍，
 * 未命中的片段原样输出，输出是 ReactNode 数组（不走 innerHTML），天然无注入风险。
 */

export type Token = { text: string; cls: string | null };

const KEYWORDS =
  "import|from|export|default|function|return|const|let|var|new|if|else|for|of|in|while|switch|case|break|continue|type|interface|extends|implements|as|satisfies|await|async|throw|try|catch|finally|class|typeof|instanceof|delete|void|yield";

const LITERALS = "true|false|null|undefined|this|super";

const TYPES = "number|string|boolean|object|any|unknown|never|React|HTMLElement|void";

const PATTERN = new RegExp(
  [
    // 1 注释
    String.raw`(\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    // 2 字符串 / 模板串
    String.raw`(\`(?:\\[\s\S]|[^\\\`])*\`|"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*')`,
    // 3 关键字
    String.raw`\b(${KEYWORDS})\b`,
    // 4 字面量
    String.raw`\b(${LITERALS})\b`,
    // 5 类型名
    String.raw`\b(${TYPES})\b`,
    // 6 JSX 标签（含闭合）
    String.raw`(<\/?[A-Za-z][\w.$]*)`,
    // 7 数字
    String.raw`\b(\d+(?:\.\d+)?)\b`,
  ].join("|"),
  "g"
);

const CLASSES = [
  "tok-comment",
  "tok-string",
  "tok-kw",
  "tok-lit",
  "tok-type",
  "tok-tag",
  "tok-num",
];

export function tokenize(code: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PATTERN.exec(code))) {
    if (m.index > last) out.push({ text: code.slice(last, m.index), cls: null });
    const hit = CLASSES.findIndex((_c, i) => m![i + 1] !== undefined);
    out.push({ text: m[0], cls: hit >= 0 ? CLASSES[hit] : null });
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push({ text: code.slice(last), cls: null });
  return out;
}
