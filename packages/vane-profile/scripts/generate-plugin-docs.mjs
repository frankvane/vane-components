/**
 * generate-plugin-docs.mjs
 *
 * 从每个官方插件的 `src/custom-plugins/<Name>/doc.json` 自动生成
 * `docs/plugins.md` 中 AUTO-GENERATED 标记之间的内容。
 *
 * 设计：插件作者只写 doc.json（机器可读），本脚本负责排版成人类可读的目录。
 * 新增插件 = 新建插件目录 + 写 doc.json，跑 `pnpm docs:plugins` 即可收录，
 * 无需手改 plugins.md。
 *
 * 用法：node scripts/generate-plugin-docs.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
// 规范化文档源在 monorepo 根：docs/components/<pkg>/（与 sync-readme.mjs 一致）
const monorepoRoot = join(__dirname, "..", "..", "..");
const pluginsDir = join(pkgRoot, "src", "custom-plugins");
const outFile = join(monorepoRoot, "docs", "components", "vane-profile", "plugins.md");

const BEGIN = "<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->";
const END = "<!-- AUTO-GENERATED:END -->";

// 领域槽清单（用于速览列与文案）
const SLOT_NAMES = [
  "renderBannerArea",
  "renderBioArea",
  "renderStatRow",
  "renderTabBar",
  "renderBadgeArea",
  "renderFollowArea",
  "renderContentArea",
];

/** 扫描 create.tsx，识别该插件贡献的第一个领域槽 */
function detectSlot(name) {
  const src = readFileSync(join(pluginsDir, name, "create.tsx"), "utf8");
  const hit = SLOT_NAMES.find((s) => src.includes(`${s}:`));
  return hit ?? "—";
}

const dirs = readdirSync(pluginsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const plugins = dirs.map((name) => {
  const doc = JSON.parse(
    readFileSync(join(pluginsDir, name, "doc.json"), "utf8")
  );
  return { name, doc, slot: detectSlot(name) };
});

const L = [];
L.push(
  `> 本文档由 \`scripts/generate-plugin-docs.mjs\` 从各插件 \`doc.json\` 自动生成，请勿手改；新增插件请写 \`doc.json\` 后跑 \`pnpm docs:plugins\`。\n`
);
L.push(
  `当前共 **${plugins.length}** 个官方插件，覆盖 **7 个领域槽**（` +
    SLOT_NAMES.map((s) => `\`${s}\``).join(" / ") +
    `）及页签切换事件钩子 \`onTabChange\`。\n`
);

// ---------- 速览 ----------
L.push(`## 速览\n`);
L.push(`| 插件 | 领域槽 | since | 一句话 |`);
L.push(`| --- | --- | --- | --- |`);
for (const { name, doc, slot } of plugins) {
  const oneLiner = doc.description.split(/[：:]/)[0];
  L.push(`| \`${name}\` | \`${slot}\` | ${doc.since} | ${oneLiner} |`);
}
L.push("");

// ---------- 逐插件详情 ----------
L.push(`## 插件详情\n`);
for (const { name, doc, slot } of plugins) {
  L.push(`### ${name}`);
  L.push(`\n**领域槽** \`${slot}\` · **since** ${doc.since} · **标签** ${doc.tags
    .map((t) => `\`${t}\``)
    .join(" ")}\n`);
  L.push(`${doc.description}\n`);

  // 配置项
  if (doc.config?.length) {
    L.push(`**配置项**\n`);
    L.push(`| 名称 | 类型 | 默认 | 说明 |`);
    L.push(`| --- | --- | --- | --- |`);
    for (const c of doc.config) {
      const def = String(c.default ?? "-").replace(/\|/g, "\\|");
      L.push(
        `| \`${c.name}\` | \`${c.type}\` | \`${def}\` | ${c.description} |`
      );
    }
    L.push("");
  }

  // 特性
  if (doc.features?.length) {
    L.push(`**特性**`);
    for (const f of doc.features) L.push(`- ${f}`);
    L.push("");
  }

  // 适用场景
  if (doc.useCases?.length) {
    L.push(`**适用场景**`);
    for (const u of doc.useCases) L.push(`- ${u}`);
    L.push("");
  }

  // 注意
  if (doc.notes?.length) {
    L.push(`**注意**`);
    for (const n of doc.notes) L.push(`- ${n}`);
    L.push("");
  }

  // 示例
  if (doc.example) {
    L.push(`**示例**\n`);
    L.push("```tsx");
    L.push(doc.example.trim());
    L.push("```\n");
  }
}

const generated = L.join("\n");

// ---------- 合并（保留标记外的手写内容）----------
const existing = readFileSync(outFile, "utf8");
const re = new RegExp(
  `${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  )}`
);

let next;
if (re.test(existing)) {
  next = existing.replace(re, `${BEGIN}\n\n${generated}\n\n${END}`);
} else {
  // 兜底：标记缺失时整文件重建（保留末尾「如何新增」若本就存在）
  const tail = existing.includes("## 如何新增一个插件")
    ? existing.slice(existing.indexOf("## 如何新增一个插件"))
    : "";
  next = `# 个人主页引擎 · 插件目录\n\n${BEGIN}\n\n${generated}\n\n${END}\n\n${tail}`;
}

writeFileSync(outFile, next, "utf8");
console.log(
  `[docs:plugins] 已生成 ${plugins.length} 个插件文档 -> docs/components/vane-profile/plugins.md`
);
