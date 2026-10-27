/**
 * 样式表与组件的一致性（C4.3 的回归锁）
 *
 * class 名写错在运行时毫无反馈 —— 组件照常渲染，只是没样式。这类问题靠肉眼
 * review 抓不住，所以用静态扫描对账：
 *   1. 源码里出现的每个 `vc-xxx` class，都必须在 src/styles/*.css 里有定义
 *   2. 反过来，CSS 里定义的类若已无人使用，报出来（避免样式越攒越多）
 *   3. 样式表里不允许出现外链资源（离线可用）
 *
 * 动态拼接的类名（`vc-stock--${size}`）按前缀对账：前缀出现即视为用了这一族。
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STYLE_DIR = path.join(ROOT, "src", "styles");
const SRC_DIR = path.join(ROOT, "src", "components");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

const cssText = readdirSync(STYLE_DIR)
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(path.join(STYLE_DIR, f), "utf-8"))
  .join("\n");

/** CSS 里实际定义过的类名 */
const definedClasses = new Set<string>();
for (const match of cssText.matchAll(/\.(vc-[\w-]+)/g)) definedClasses.add(match[1]);

/** 源码里用到的类名；`vc-stock--${x}` 这类记进前缀表 */
const usedClasses = new Map<string, string[]>();
const usedPrefixes = new Set<string>();
for (const file of walk(SRC_DIR)) {
  const text = readFileSync(file, "utf-8");
  // 负向后视：跳过 `--vc-coupon-bg` 这种 CSS 变量名（变量不是 class）
  for (const match of text.matchAll(/(?<![\w-])vc-[\w-]+/g)) {
    const token = match[0];
    if (token.endsWith("-")) {
      usedPrefixes.add(token);
      continue;
    }
    const list = usedClasses.get(token) ?? [];
    list.push(path.relative(ROOT, file));
    usedClasses.set(token, list);
  }
}

describe("样式表与组件对账", () => {
  it("CSS 与源码都非空（防止扫描路径写错导致假绿）", () => {
    expect(definedClasses.size).toBeGreaterThan(50);
    expect(usedClasses.size).toBeGreaterThan(50);
    expect(usedPrefixes.size).toBeGreaterThan(0);
  });

  it("源码用到的每个 vc- class 都有样式定义", () => {
    const missing = [...usedClasses.keys()].filter((cls) => !definedClasses.has(cls));
    expect(missing, `这些 class 没有样式定义：${missing.join(", ")}`).toEqual([]);
  });

  it("CSS 里没有无人使用的孤儿类", () => {
    const orphans = [...definedClasses].filter((cls) => {
      if (usedClasses.has(cls)) return false;
      // 动态前缀展开出的具体值（vc-stock--small 等）也算被使用
      return ![...usedPrefixes].some((prefix) => cls.startsWith(prefix));
    });
    expect(orphans, `这些 class 定义了但没用：${orphans.join(", ")}`).toEqual([]);
  });

  it("样式表不引外链资源（离线可用）", () => {
    expect(cssText).not.toMatch(/url\(\s*['"]?https?:/);
  });

  it("没有 !important（只有 a11y 开关例外，且它们走运行时注入）", () => {
    expect(cssText).not.toContain("!important");
  });
});
