#!/usr/bin/env node
/**
 * 结构标准化校验门禁（P0 落地，配合 tasks/24-结构标准化实施计划.md）。
 *
 * 检查维度（与计划文档第 5 节验收清单 A/B/C 对应）：
 *   A1 入口聚合：src/entries/{core,plugins}.ts 存在（canonical 聚合范式）
 *   A2 命名：插件目录必须 ^[A-Z][A-Za-z0-9]*Plugin$
 *   A3 三件套：每个插件目录含 create.{ts,tsx} + doc.json + index.{ts,tsx}
 *   A4 doc 字段：禁止复数 `examples`（应为 `example`）；其余字段差异仅 INFO 上报（P2 再统一 schema）
 *   A5 ADR-6：根 src/index.ts 不得 `export * from "./custom-plugins"`（桶导出官方插件）
 *   A6 card 双结构：插件实现不得位于 src/components/<包>/custom-plugins（应并入 src/custom-plugins）
 *   C1 demo 范式（INFO）：优先 demos/registry.ts；用旧 pages/ 范式仅提示，P5 迁移
 *
 * 模式：
 *   默认 = warn（打印漂移报告，exit 0）——P0 阶段用，给存量一个测量基线
 *   --strict = 任一 FAIL 即 exit 1——P5 完成后接入 verify / CI 阻断
 *
 * 用法：
 *   node scripts/check-structure.mjs            # warn
 *   node scripts/check-structure.mjs --strict   # 阻断
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

const STRICT = process.argv.includes("--strict");

// 非组件包：templates 是模板（golden 单独自检），plugin-core 是内核基座（无 demo / 无 entries 聚合）
const NON_COMPONENT_DIRS = new Set(["templates", "plugin-core"]);

// 与 check-packages.mjs 同口径动态扫描：readdir(packages) 而非硬编码清单，
// 否则新包不进数组就完全不被扫描，门禁假绿。
const COMPONENT_PKGS = (await readdir(packagesDir, { withFileTypes: true }))
  .filter(
    (d) =>
      d.isDirectory() &&
      !NON_COMPONENT_DIRS.has(d.name) &&
      existsSync(path.join(packagesDir, d.name, "package.json")),
  )
  .map((d) => d.name);

const PLUGIN_NAME_RE = /^[A-Z][A-Za-z0-9]*Plugin$/;

const results = [];
let fail = 0;
const docKeyUniverse = new Map(); // key -> 出现次数（用于 P2 统一 schema 决策）

function record(pkg, code, message, level = "FAIL") {
  results.push({ pkg, code, message, level });
  if (level === "FAIL") fail += 1;
}

/** 递归找所有名为 custom-plugins 的目录，返回它们的一级子目录（即插件目录） */
async function findPluginDirs(srcDir) {
  const out = [];
  async function rec(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name === "node_modules") continue;
      const full = path.join(dir, e.name);
      if (e.name === "custom-plugins") {
        const kids = await readdir(full, { withFileTypes: true });
        for (const k of kids) if (k.isDirectory()) out.push(path.join(full, k.name));
      } else {
        await rec(full);
      }
    }
  }
  await rec(srcDir);
  return out;
}

async function checkPackage(pkg, { golden = false } = {}) {
  const pkgDir = path.join(packagesDir, pkg);
  const srcDir = path.join(pkgDir, "src");
  if (!existsSync(srcDir)) return; // templates 可能无 src 顶层，跳过

  // A1 入口聚合
  const hasCore = existsSync(path.join(srcDir, "entries", "core.ts"));
  const hasPlugins = existsSync(path.join(srcDir, "entries", "plugins.ts"));
  if (!(hasCore && hasPlugins)) {
    record(
      pkg,
      "A1",
      `缺标准入口聚合 entries/{core,plugins}.ts（core=${hasCore} plugins=${hasPlugins}）；当前或走顶层 core.ts/plugins.ts，或核心组件内联`,
    );
  }

  // A5 根 index.ts 桶导出（INFO：lazy-image/file-preview 是 ADR-6 兼容例外，非漂移）
  const indexTs = path.join(srcDir, "index.ts");
  if (existsSync(indexTs)) {
    const c = await readFile(indexTs, "utf-8");
    if (/export\s+\*\s+from\s+["']\.\/custom-plugins["']/.test(c)) {
      record(
        pkg,
        "A5",
        "根 src/index.ts 桶导出 ./custom-plugins（ADR-6 兼容例外：lazy-image/file-preview 为 1.x 兼容保留；其余包不应出现，P4 复核）",
        "INFO",
      );
    }
  }

  // 插件目录
  const pluginDirs = await findPluginDirs(srcDir);
  let sawComponentsCustom = false;

  for (const pd of pluginDirs) {
    const rel = path.relative(srcDir, pd);
    const base = path.basename(pd);

    // 跳过共享/内部目录（如 _shared），它们不是插件
    if (base.startsWith("_")) continue;

    // A6 card 双结构：插件实现位于 components/*/custom-plugins
    if (rel.split(path.sep).includes("components")) {
      sawComponentsCustom = true;
    }

    // A2 命名
    if (!PLUGIN_NAME_RE.test(base)) {
      record(pkg, "A2", `插件目录命名不符合 PascalCase+Plugin：${rel}`);
    }

    // A3 三件套
    const hasCreate = existsSync(path.join(pd, "create.ts")) || existsSync(path.join(pd, "create.tsx"));
    const hasDoc = existsSync(path.join(pd, "doc.json"));
    const hasIndex = existsSync(path.join(pd, "index.ts")) || existsSync(path.join(pd, "index.tsx"));
    if (!(hasCreate && hasDoc && hasIndex)) {
      record(pkg, "A3", `三件套不齐（${rel}）：create=${hasCreate} doc=${hasDoc} index=${hasIndex}`);
    }

    // A4 doc.json：examples 是有意双字段设计（example=单个用法字符串，examples=可视化示例数组，驱动 demo 预览卡片），
    // 属合理扩展，不视为违规（P1 确认：lazy-image 不改字段）。仅当仅有 examples 而无 example 时温和提醒。
    if (hasDoc) {
      try {
        const doc = JSON.parse(await readFile(path.join(pd, "doc.json"), "utf-8"));
        for (const k of Object.keys(doc)) docKeyUniverse.set(k, (docKeyUniverse.get(k) ?? 0) + 1);
        if ("examples" in doc && !("example" in doc)) {
          record(pkg, "A4", `doc.json 仅有复数 examples 而无 example 用法示例（建议补 example）：${rel}`, "INFO");
        }
      } catch (e) {
        record(pkg, "A4", `doc.json 解析失败：${rel} (${e.message})`);
      }
    }
  }

  if (sawComponentsCustom) {
    record(pkg, "A6", "存在 src/components/*/custom-plugins（双 custom-plugins 结构），应并入 src/custom-plugins");
  }

  // C1 demo 范式（INFO，不阻断）
  const demoDir = path.join(pkgDir, "demo");
  const hasRegistry = existsSync(path.join(demoDir, "src", "demos", "registry.ts"));
  const hasLegacyPages = existsSync(path.join(demoDir, "src", "pages"));
  if (hasLegacyPages && !hasRegistry) {
    record(pkg, "C1", "demo 用旧 pages/ 范式（缺 demos/registry.ts），建议 P5 迁移", "INFO");
  } else if (golden && !hasRegistry) {
    record(pkg, "C1", "golden 模板 demo 未用 demos/registry.ts 范式（P5 对齐）", "INFO");
  }
}

async function main() {
  for (const pkg of COMPONENT_PKGS) await checkPackage(pkg);
  // golden 自检：模板应 100% 合规（除 INFO 级 demo 提示）
  const goldenDir = path.join(packagesDir, "templates", "plugin-component");
  if (existsSync(goldenDir)) await checkPackage("templates/plugin-component", { golden: true });

  // 打印
  const byPkg = {};
  for (const r of results) (byPkg[r.pkg] ??= []).push(r);

  // 受扫描的全部包（含 golden），合规的也打印 ✅
  const scanned = [...COMPONENT_PKGS];
  if (existsSync(goldenDir)) scanned.push("templates/plugin-component");

  let pkgCount = 0;
  for (const pkg of scanned) {
    const items = byPkg[pkg] ?? [];
    const realFails = items.filter((r) => r.level === "FAIL");
    const infos = items.filter((r) => r.level === "INFO");
    pkgCount++;
    if (realFails.length === 0 && infos.length === 0) {
      console.log(`\n📦 ${pkg}  ✅ 结构合规`);
      continue;
    }
    console.log(`\n📦 ${pkg}  ${realFails.length ? `✗ ${realFails.length} 项 FAIL` : "• 仅 INFO"}`);
    for (const r of items) {
      const tag = r.level === "INFO" ? "•" : "✗";
      console.log(`   [${r.code}]${tag} ${r.message}`);
    }
  }

  const failList = results.filter((r) => r.level === "FAIL");
  const infoList = results.filter((r) => r.level === "INFO");
  const clean = results.length === 0;

  console.log("\n" + "═".repeat(56));
  console.log(`结构校验 ${STRICT ? "(strict · 阻断)" : "(warn · 基线)"}`);
  console.log(`扫描包：${pkgCount} 个（含 1 golden 模板）`);
  console.log(`FAIL=${failList.length}   INFO=${infoList.length}`);
  if (docKeyUniverse.size) {
    const top = [...docKeyUniverse.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}(${n})`);
    console.log(`doc.json 顶层字段分布（P2 统一 schema 参考）：${top.join(" ")}`);
  }
  if (clean) console.log("✅ 全部合规，无漂移");
  console.log("═".repeat(56));

  if (STRICT && failList.length) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
