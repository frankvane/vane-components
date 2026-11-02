/**
 * 「最小装配」代码生成（逐插件示例版）
 *
 * 和 scenarios/minimal.ts 同样的思路：由 meta 现场拼，而不是另写一份片段 ——
 * 插件名、配置、props 只有一处真相，改示例时不会忘同步文档。
 *
 * 比场景版多一件事：支持 `{{key}}` 占位，用控件当前值替换。
 * 这样把「关键词」滑到另一个值，下面的代码就同步变化 —— 拖控件 = 改代码。
 */
import type { DemoCfg, DemoMeta } from "./types";
import type { ResumeData } from "vane-resume";
import { SAMPLE_RESUME } from "../data/sample";

const PH = /\{\{\s*([\w-]+)\s*\}\}/g;

function fill(text: string, cfg: DemoCfg): string {
  return text.replace(PH, (raw, key: string) => (key in cfg ? String(cfg[key]) : raw));
}

/**
 * 把插件配置渲染成合法的调用实参。
 * 各 demo 的 p.cfg 写法不统一：有的写完整对象字面量 `{ keyword: "x" }`，
 * 有的写内部内容 `keyword: "x"`，有的写空 `{}`。这里统一种种写法：
 *   - 已带一对外层花括号 → 剥掉外层，取内部内容；
 *   - 否则原样当作内部内容；
 *   - 剥完后为空 → 视为无参调用。
 * 这样无论 demo 怎么写，都不会生成 createXxx({ {} }) 或 createXxx({ { ... } }) 这类非法语法。
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
    ? `const Resume = withResumePlugins(ResumeCore, [
${pluginLines}
]);`
    : `const Resume = ResumeCore;`;
}

function importLineFor(meta: DemoMeta): string {
  const factories = meta.plugs.map((p) => p.fn).sort();
  if (!factories.length) return `// 这一页只用 Core props，不需要任何插件`;
  return factories.length > 3
    ? `import {\n${factories.map((f) => `  ${f},`).join("\n")}\n} from "vane-resume/custom-plugins";`
    : `import { ${factories.join(", ")} } from "vane-resume/custom-plugins";`;
}

export function buildDemoCode(meta: DemoMeta, cfg: DemoCfg): string {
  const propLines = meta.props
    .filter((p) => typeof p === "string" || !p.when || p.when(cfg))
    .map((p) => `      ${fill(typeof p === "string" ? p : p.text, cfg)}`)
    .join("\n");

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { ResumeCore, withResumePlugins } from "vane-resume";
import type { ResumeData } from "vane-resume";
${importLineFor(meta)}

${renderPluginBlock(meta, cfg)}

export default function Demo({ data }: { data: ResumeData }) {
  return (
    <Resume
      data={data}
${propLines}
    />
  );
}
`;
}

/* ------------------------------------------------------------------ */
/* 「完整源码」：把 demo 共用的真实简历数据序列化进代码，            */
/* 复制出去即可跑出与演示站一致的全量内容（而非 3 段 stub）。        */
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
 * 取 demo 共用的完整简历，作为「完整源码」里内联的 data。
 * 头像用占位地址（演示站是内联 SVG data URI，过长不适合抄写）；
 * 其余字段与演示站一致，复制即可复现整份简历内容。
 */
function buildSampleData(): string {
  const data = JSON.parse(JSON.stringify(SAMPLE_RESUME)) as ResumeData;
  if (data.basics) {
    data.basics.avatar = "https://your-avatar.example.com/a.png";
  }
  return `const data: ResumeData = ${toLiteral(data, 0)};`;
}

export function buildFullSource(meta: DemoMeta, cfg: DemoCfg): string {
  return `// ${meta.title} · 完整示例（直接复制即可运行）
import { ResumeCore, withResumePlugins } from "vane-resume";
import type { ResumeData } from "vane-resume";
${importLineFor(meta)}

${renderPluginBlock(meta, cfg)}

${buildSampleData()}

export default function Demo() {
  return <Resume data={data} />;
}
`;
}
