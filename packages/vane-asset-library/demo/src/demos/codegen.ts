/**
 * 「最小装配」/「完整源码」代码生成
 *
 * 与场景卡同一思路：由 meta 现场拼，而不是另写一份片段 ——
 * 插件名、配置、props 只有一处真相，改示例时不会忘同步文档。
 *
 * 比场景版多一件事：支持 `{{key}}` 占位，用控件当前值替换。
 * 这样把「每页条数」滑到另一个值，下面的代码就同步变化 —— 拖控件 = 改代码。
 */
import type { AssetItem } from "vane-asset-library";
import { SAMPLE_ASSETS } from "../data/samples";
import type { DemoCfg, DemoMeta } from "./types";

const PKG = "vane-asset-library";
const PH = /\{\{\s*([\w-]+)\s*\}\}/g;

function fill(text: string, cfg: DemoCfg): string {
  return text.replace(PH, (raw, key: string) => (key in cfg ? String(cfg[key]) : raw));
}

/** 工厂名 → 插件目录名：createKindFilterPlugin → KindFilterPlugin */
function dirOf(factory: string): string {
  const name = factory.replace(/^create/, "").replace(/Plugin$/, "");
  return `${name}Plugin`;
}

/**
 * 把插件配置渲染成合法的调用实参。
 * 各 demo 的 p.cfg 写法不统一：有的写完整对象 `{ keyword: "x" }`，有的写内部内容。
 * 这里先剥一层外层花括号，空则视为无参调用 —— 否则会生成 `createXxx({ {} })` 这类非法语法。
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

function importLines(meta: DemoMeta): string {
  const factories = [...new Set(meta.plugs.map((p) => p.fn))].sort();
  if (!factories.length) return "// 这一页只用 Core props，不需要任何插件";
  return factories
    .map((fn) => `import { ${fn} } from "${PKG}/custom-plugins/${dirOf(fn)}";`)
    .join("\n");
}

function pluginBlock(meta: DemoMeta, cfg: DemoCfg): string {
  if (!meta.plugs.length) return `const Library = AssetLibraryCore;`;
  const lines = meta.plugs
    .map((p) => `  ${p.fn}(${renderPluginArg(p.cfg, cfg)}),`)
    .join("\n");
  return `const Library = withAssetLibraryPlugins(AssetLibraryCore, [\n${lines}\n]);`;
}

function propLines(meta: DemoMeta, cfg: DemoCfg): string {
  return meta.props
    .filter((p) => typeof p === "string" || !p.when || p.when(cfg))
    .map((p) => `      ${fill(typeof p === "string" ? p : p.text, cfg)}`)
    .join("\n");
}

export function buildDemoCode(meta: DemoMeta, cfg: DemoCfg): string {
  return `// ${meta.title} · 最小装配（照抄即可跑）
import { AssetLibraryCore, withAssetLibraryPlugins } from "${PKG}";
import type { AssetItem } from "${PKG}";
${importLines(meta)}

${pluginBlock(meta, cfg)}

export default function Demo({ items }: { items: AssetItem[] }) {
  return (
    <Library
      items={items}
${propLines(meta, cfg)}
    />
  );
}
`;
}

/* ------------------------------------------------------------------ */
/* 「完整源码」：内联完整素材数据，复制出去即可渲染出与演示站一致的整墙 */
/* ------------------------------------------------------------------ */

function isIdent(s: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(s);
}

function toLiteral(value: unknown, depth: number): string {
  const pad = "  ".repeat(depth);
  const padIn = "  ".repeat(depth + 1);
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    const body = value.map((item) => `${padIn}${toLiteral(item, depth + 1)}`).join(",\n");
    return `[\n${body},\n${pad}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "{}";
    const body = entries
      .map(([key, val]) => `${padIn}${isIdent(key) ? key : JSON.stringify(key)}: ${toLiteral(val, depth + 1)}`)
      .join(",\n");
    return `{\n${body},\n${pad}}`;
  }
  return JSON.stringify(value);
}

/**
 * 演示站的素材图是内联 SVG data-URI（离线可跑、截图稳定），
 * 直接抄进代码会有十几 KB 噪音；这里换成占位 URL，其余字段与演示站逐字一致。
 */
function sampleData(): string {
  const data = SAMPLE_ASSETS.map((item) => ({
    ...item,
    src: `https://cdn.example.com/${item.id}.${item.kind === "video" ? "mp4" : "png"}`,
    thumbnail:
      item.kind === "video" ? `https://cdn.example.com/${item.id}.jpg` : item.thumbnail,
  })) as AssetItem[];
  return `const items: AssetItem[] = ${toLiteral(data, 0)};`;
}

export function buildFullSource(meta: DemoMeta, cfg: DemoCfg): string {
  return `// ${meta.title} · 完整示例（直接复制即可运行）
import { AssetLibraryCore, withAssetLibraryPlugins } from "${PKG}";
import type { AssetItem } from "${PKG}";
${importLines(meta)}

${pluginBlock(meta, cfg)}

${sampleData()}

export default function Demo() {
  return <Library items={items}${meta.props.length ? "\n" + propLines(meta, cfg).replace(/^ {6}/gm, "    ") : ""} />;
}
`;
}
