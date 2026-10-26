#!/usr/bin/env node
/**
 * 从 archive-plugins/vane-waterfall 迁移 26 个插件到 packages/vane-waterfall。
 *
 * 做三件事（每件都可重复执行，幂等）：
 *   1. 拷源码：`custom-plugins/<Old>/index.ts(x)` → `src/custom-plugins/<Old>Plugin/create.ts(x)`
 *      - 改写 import：`../../plugins/types` → `../../components/WaterfallPlugin/plugins/types`
 *      - 在插件对象上补 `priority`（数据管线靠它定序）
 *   2. 生成 doc.json（来源：scripts/waterfall-plugin-meta.mjs + 源码里的 config 类型）
 *   3. 生成 index.ts（工厂 + .meta，`typeof create` 保留泛型签名）
 *
 * 不迁：`VirtualWaterfall`（能力已下沉为 Core 选项 `virtualize`，见 tasks/07 · D2-A）。
 *
 * 用法：node scripts/migrate-waterfall-plugins.mjs [--dry]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLUGIN_META } from "./waterfall-plugin-meta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, "..");
const ROOT = path.resolve(PKG, "../..");
const OLD = path.join(ROOT, "archive-plugins/vane-waterfall/src/components/WaterfallPlugin/custom-plugins");
const NEW = path.join(PKG, "src/custom-plugins");
const DRY = process.argv.includes("--dry");

/** 互相排斥的插件（写进 doc.json 的 conflicts，demo 工坊据此提示） */
const CONFLICTS = {
  AutoColumnPlugin: ["ResponsiveColumnsPlugin"],
  ResponsiveColumnsPlugin: ["AutoColumnPlugin"],
  TransitionPlugin: ["ReducedMotionPlugin"],
  ReducedMotionPlugin: ["TransitionPlugin"],
  InfiniteScrollPlugin: ["PaginationPlugin"],
  PaginationPlugin: ["InfiniteScrollPlugin"],
};

function rewriteSource(src) {
  return src
    .replace(/from "\$\.\.\/\.\.\/plugins\/types"/g, "")
    .replace(/from "\.\.\/\.\.\/plugins\/types"/g, 'from "../../components/WaterfallPlugin/plugins/types"')
    .replace(/\r\n/g, "\n")
    .trimEnd()
    .concat("\n");
}

/** 在 `name: "XxxPlugin",` 后面补 priority */
function injectPriority(src, priority) {
  if (priority === 0 || priority === undefined) return src;
  if (/^\s*priority:/m.test(src)) return src;
  return src.replace(/(\n\s*name: "[^"]+",\n)/, `$1    priority: ${priority},\n`);
}

/** 从 config 表生成一个可读的最小示例 */
function buildExample(meta) {
  const factory = meta.factory;
  const args = (meta.doc.config ?? [])
    .filter((c) => c.default && !c.default.startsWith("props.") && c.default !== "—")
    .slice(0, 3)
    .map((c) => `    ${c.name}: ${toLiteral(c)},`);
  const call = args.length ? `${factory}({\n${args.join("\n")}\n  })` : `${factory}()`;
  return [
    `// ${meta.summary}`,
    "const Waterfall = withPlugins(WaterfallCore, [",
    `  ${call},`,
    "]);",
    "",
    "<Waterfall items={items} renderItem={(item) => <Card data={item} />} />;",
  ].join("\n");
}

function toLiteral(config) {
  const d = config.default;
  if (/^-?\d+(\.\d+)?$/.test(d)) return d;
  if (d === "true" || d === "false") return d;
  if (d.startsWith('"') || d.startsWith("[")) return d;
  return JSON.stringify(d);
}

function buildDoc(meta) {
  const doc = {
    name: `${meta.dir.replace(/Plugin$/, "")}Plugin`,
    description: meta.doc.description,
    since: "2.0.0",
    tags: meta.doc.tags,
    config: meta.doc.config,
    example: buildExample(meta),
  };
  if (CONFLICTS[doc.name]) doc.conflicts = CONFLICTS[doc.name];
  doc.features = meta.doc.features;
  doc.useCases = meta.doc.useCases;
  doc.notes = meta.doc.notes;
  return doc;
}

function buildIndex(meta, ext) {
  const typeExport = meta.configType
    ? `\nexport type { ${meta.configType} };\n`
    : "\n";
  return `/**
 * ${meta.dir} — ${meta.summary}
 * 文档数据见同目录 doc.json；工厂实现见 create.${ext}。
 */
import { ${meta.factory} as create } from "./create";
import doc from "./doc.json";
import type { PluginDoc } from "@vane/plugin-core";

/**
 * 工厂 + \`.meta\`：\`typeof create\` 保留原工厂的泛型签名，
 * \`.meta\` 供 docs:plugins 与 demo 工坊读取配置项。
 */
export const ${meta.factory} = Object.assign(create, { meta: doc as PluginDoc }) as typeof create & {
  meta: PluginDoc;
};
${typeExport}`;
}

let created = 0;
let skipped = 0;

for (const meta of PLUGIN_META) {
  const oldDir = path.join(OLD, meta.from);
  if (!existsSync(oldDir)) {
    console.warn(`✗ 源目录不存在：${meta.from}`);
    continue;
  }
  const oldFile = existsSync(path.join(oldDir, "index.tsx"))
    ? path.join(oldDir, "index.tsx")
    : path.join(oldDir, "index.ts");
  const ext = oldFile.endsWith(".tsx") ? "tsx" : "ts";
  const raw = rewriteSource(readFileSync(oldFile, "utf-8"));
  const source = injectPriority(raw, meta.priority);

  const targetDir = path.join(NEW, meta.dir);
  const files = {
    [`create.${ext}`]: source,
    "doc.json": JSON.stringify(buildDoc(meta), null, 2) + "\n",
    "index.ts": buildIndex(meta, ext),
  };

  for (const [name, content] of Object.entries(files)) {
    const target = path.join(targetDir, name);
    if (DRY) {
      console.log(`[dry] ${path.relative(PKG, target)} (${content.length}B)`);
      continue;
    }
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(target, content);
  }
  created += 1;
  console.log(`✓ ${meta.dir.padEnd(26)} priority=${String(meta.priority).padStart(3)} ${meta.group}`);
}

console.log(`\n${DRY ? "[dry] " : ""}迁移 ${created} 个插件，跳过 ${skipped} 个`);
if (created !== PLUGIN_META.length) process.exitCode = 1;
