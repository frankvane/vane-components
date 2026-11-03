/**
 * 「最小装配」代码生成（逐插件示例版）
 *
 * 和 scenarios/minimal.ts 同样的思路：由 meta 现场拼，而不是另写一份片段 ——
 * 插件名、配置、props 只有一处真相，改示例时不会忘同步文档。
 *
 * 比场景版多一件事：支持 `{{key}}` 占位，用控件当前值替换。
 * 把「优秀阈值」拖到另一个值，下面的代码就同步变化 —— 拖控件 = 改代码。
 */
import type { Candidate } from "vane-candidate";
import type { DemoCfg, DemoMeta } from "./types";
import { SAMPLE_CANDIDATES, SAMPLE_STAGES } from "../data/sample";

const PH = /\{\{\s*([\w-]+)\s*\}\}/g;

function fill(text: string, cfg: DemoCfg): string {
  return text.replace(PH, (raw, key: string) => (key in cfg ? String(cfg[key]) : raw));
}

/**
 * 把插件配置渲染成合法的调用实参。
 * 各 demo 的 p.cfg 写法不统一：有的写完整对象字面量 `{ goodThreshold: 80 }`，
 * 有的写内部内容 `goodThreshold: 80`，有的写空 `{}`。这里统一处理：
 *   - 已带一对外层花括号 → 剥掉外层，取内部内容；
 *   - 否则原样当作内部内容；
 *   - 剥完后为空 → 视为无参调用。
 * 这样无论 demo 怎么写，都不会生成 createXxx({ {} }) 这类非法语法。
 */
function renderPluginArg(rawCfg: string | undefined, cfg: DemoCfg): string {
  if (!rawCfg) return "";
  let inner = fill(rawCfg, cfg).trim();
  if (inner.startsWith("{") && inner.endsWith("}")) {
    inner = inner.slice(1, -1).trim();
  }
  if (!inner) return "";
  return `{ ${inner} }`;
}

function renderPluginBlock(meta: DemoMeta, cfg: DemoCfg): string {
  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${renderPluginArg(p.cfg, cfg)}),`)
    .join("\n");
  return meta.plugs.length
    ? `const Board = withPlugins(CandidateCore, [
${pluginLines}
]);`
    : `const Board = CandidateCore;`;
}

/** 一插件一行 import，深层子路径（ADR-6 严格），按工厂名排序 */
function importLineFor(meta: DemoMeta): string {
  const factories = meta.plugs.map((p) => p.fn).sort();
  if (!factories.length) return `// 这一页只用 Core props，不需要任何插件`;
  return factories
    .map((fn) => {
      const dir = `${fn.replace(/^create/, "").replace(/Plugin$/, "")}Plugin`;
      return `import { ${fn} } from "vane-candidate/custom-plugins/${dir}";`;
    })
    .join("\n");
}

export function buildDemoCode(meta: DemoMeta, cfg: DemoCfg): string {
  const propLines = meta.props
    .filter((p) => typeof p === "string" || !p.when || p.when(cfg))
    .map((p) => `      ${fill(typeof p === "string" ? p : p.text, cfg)}`)
    .join("\n");

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { CandidateCore, withPlugins } from "vane-candidate";
import type { Candidate } from "vane-candidate";
${importLineFor(meta)}

${renderPluginBlock(meta, cfg)}

export default function Demo({ data }: { data: Candidate[] }) {
  return (
    <Board
      data={data}
${propLines}
    />
  );
}
`;
}

/* ------------------------------------------------------------------ */
/* 「完整源码」：把 demo 共用的真实候选人数据序列化进代码，          */
/* 复制出去即可跑出与演示站一致的全量看板（而非几条 stub）。        */
/* ------------------------------------------------------------------ */

function isIdent(s: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(s);
}

/** 把任意 JSON 安全值渲染成可读的 TS 字面量（2 空格缩进、尾逗号）。 */
function toLiteral(v: unknown, depth: number): string {
  const pad = "  ".repeat(depth);
  const padIn = "  ".repeat(depth + 1);
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const body = v.map((item) => `${padIn}${toLiteral(item, depth + 1)}`).join(",\n");
    return `[\n${body},\n${pad}]`;
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const body = entries
      .map(([k, val]) => `${padIn}${isIdent(k) ? k : JSON.stringify(k)}: ${toLiteral(val, depth + 1)}`)
      .join(",\n");
    return `{\n${body},\n${pad}}`;
  }
  return JSON.stringify(v);
}

/**
 * 取 demo 共用的完整候选人数据，作为「完整源码」里内联的 data。
 * 头像用占位地址（演示站若用内联 SVG data URI，过长不适合抄写）；
 * 其余字段与演示站一致，复制即可复现整块看板。
 */
function buildSampleData(): string {
  const data = JSON.parse(JSON.stringify(SAMPLE_CANDIDATES)) as Candidate[];
  const cleaned = data.map((c) =>
    c.avatar ? { ...c, avatar: "https://your-avatar.example.com/a.png" } : c
  );
  return `const SAMPLE_STAGES: StageConfig[] = ${toLiteral(SAMPLE_STAGES, 0)};

const data: Candidate[] = ${toLiteral(cleaned, 0)};`;
}

export function buildFullSource(meta: DemoMeta, cfg: DemoCfg): string {
  const propLines = meta.props
    .filter((p) => typeof p === "string" || !p.when || p.when(cfg))
    .map((p) => `      ${fill(typeof p === "string" ? p : p.text, cfg)}`)
    .join("\n");

  return `// ${meta.title} · 完整示例（直接复制即可运行）
import { CandidateCore, withPlugins } from "vane-candidate";
import type { Candidate, StageConfig } from "vane-candidate";
${importLineFor(meta)}

${renderPluginBlock(meta, cfg)}

${buildSampleData()}

export default function Demo() {
  return (
    <Board
      data={data}
      stages={SAMPLE_STAGES}
${propLines}
    />
  );
}
`;
}
