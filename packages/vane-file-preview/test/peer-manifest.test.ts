/**
 * P4.3 · optional peer 必须与代码里的真实引用**一一对应**
 *
 * 这条闸门存在的理由：optional peer 是「声明了但默认不装」的依赖，它有两种错法，
 * 两种都不会在构建时报错 ——
 *
 *   ① **漏声明**：代码 `import("jszip")` 却没写进 peerDependencies。消费方装了
 *      本包、没装 jszip，pnpm 的严格 node_modules 下模块图在运行期才炸，
 *      而且报的是 `Failed to fetch dynamically imported module`，跟「少装一个包」
 *      完全对不上号。
 *   ② **多声明**：把已经不再 import 的包留在 peerDependencies 里（迁移过程中
 *      `remark-math` / `rehype-katex` 就是这么留下的），消费方的包管理器会提示
 *      「缺少 peer 依赖」，装上来却永远用不到。
 *
 * 所以这里反向扫源码：`import ... from "pkg"` 与 `import("pkg")` 的裸包名集合，
 * 必须与 `peerDependenciesMeta.*.optional === true` 的集合**完全相等**。
 *
 * 三个口径决定，代码里也照此实现：
 *  - 子路径归一：`mammoth/mammoth.browser` → `mammoth`，`@uiw/react-json-view/light`
 *    → `@uiw/react-json-view`（后者要按 scoped 包的两段式取名）。
 *  - `import type` 也算：类型虽然会被擦除，但它说明「这个包与我的 API 相关」，
 *    漏了它 d.ts 在消费方会解析失败。
 *  - react / react-dom 是**必装** peer（不是 optional），单独放行。
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const srcDir = path.join(pkgRoot, "src");

const pkg = JSON.parse(readFileSync(path.join(pkgRoot, "package.json"), "utf-8")) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

/** 必装 peer，不参与 optional 集合比对 */
const REQUIRED_PEERS = new Set(["react", "react-dom"]);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.tsx?$/.test(full)) acc.push(full);
  }
  return acc;
}

/** `@scope/name/sub` → `@scope/name`；`name/sub` → `name` */
function packageNameOf(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/** 扫 src 下所有裸包引用（静态 import / export from / 动态 import / import type） */
function scanBareImports(): Map<string, Set<string>> {
  // 一次抓两类：`import ... from "x"`（含 export ... from、import type）与 `import("x")`
  const pattern =
    /(?:^|[;\n])\s*(?:import|export)\s+(?:type\s+)?[^;\n]*?from\s*["']([^"'.][^"']*)["']|import\(\s*["']([^"'.][^"']*)["']\s*\)/g;
  const found = new Map<string, Set<string>>();

  for (const file of walk(srcDir)) {
    const source = readFileSync(file, "utf-8");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) {
      const specifier = match[1] ?? match[2];
      if (!specifier) continue;
      const name = packageNameOf(specifier);
      const rel = path.relative(pkgRoot, file);
      if (!found.has(name)) found.set(name, new Set());
      found.get(name)!.add(rel);
    }
  }
  return found;
}

const imports = scanBareImports();
const optionalPeers = new Set(
  Object.entries(pkg.peerDependenciesMeta ?? {})
    .filter(([, meta]) => meta?.optional === true)
    .map(([name]) => name)
);

describe("P4.3 · optional peer 清单", () => {
  it("没有任何运行时 dependencies（重依赖只能是 optional peer）", () => {
    expect(pkg.dependencies ?? {}).toEqual({});
  });

  it("代码里 import 的每个裸包都已声明为 peer", () => {
    const declared = new Set(Object.keys(pkg.peerDependencies ?? {}));
    const missing = [...imports.keys()].filter((name) => !declared.has(name));
    expect(
      missing.map((name) => `${name} ← ${[...imports.get(name)!].join(", ")}`)
    ).toEqual([]);
  });

  it("每个 optional peer 都真的被 import 过（没有幽灵声明）", () => {
    const ghost = [...optionalPeers].filter((name) => !imports.has(name));
    expect(ghost).toEqual([]);
  });

  it("除 react / react-dom 外，所有被 import 的包都是 optional", () => {
    const notOptional = [...imports.keys()].filter(
      (name) => !REQUIRED_PEERS.has(name) && !optionalPeers.has(name)
    );
    expect(notOptional).toEqual([]);
  });

  it("react / react-dom 是必装 peer，不能被标成 optional", () => {
    for (const name of REQUIRED_PEERS) {
      expect(pkg.peerDependencies?.[name], `${name} 应在 peerDependencies`).toBeTruthy();
      expect(optionalPeers.has(name), `${name} 不能是 optional`).toBe(false);
    }
  });

  it("子路径引用归一后不会重复计数（mammoth/… 与 mammoth 是同一个包）", () => {
    expect(packageNameOf("mammoth/mammoth.browser")).toBe("mammoth");
    expect(packageNameOf("@uiw/react-json-view/light")).toBe("@uiw/react-json-view");
    expect(packageNameOf("react-syntax-highlighter/dist/esm/styles/prism/one-light")).toBe(
      "react-syntax-highlighter"
    );
  });
});
