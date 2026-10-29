/**
 * 「最小装配」代码生成（逐插件示例版）
 *
 * 由 meta 现场拼，而不是另写一份片段 —— 插件名、配置、props 只有一处真相，
 * 改示例时不会忘同步文档。
 *
 * 比场景版多一件事：支持 `{{key}}` 占位，用控件当前值替换。
 * 拖控件 = 改代码。
 *
 * vane-comment 的插件一律走深层子路径（ADR-6，与包 exports 逐字一致）：
 * 一插件一行 import、按工厂名排序、不合并花括号，消费者按需引入、不进根入口。
 * 子路径目录名带 Plugin 后缀（createLikePlugin → "LikePlugin"），与包 exports 一致。
 */
import type { DemoCfg, DemoMeta } from "./types";

const PH = /\{\{\s*([\w-]+)\s*\}\}/g;

function fill(text: string, cfg: DemoCfg): string {
  return text.replace(PH, (raw, key: string) => (key in cfg ? String(cfg[key]) : raw));
}

/** 工厂名 → 插件目录名（createLikePlugin → LikePlugin），与包 exports 一致 */
function subpathOf(fn: string): string {
  return fn.replace(/^create/, "");
}

export function buildDemoCode(meta: DemoMeta, cfg: DemoCfg): string {
  const factories = meta.plugs.map((p) => p.fn).sort();

  const head = [
    `import { CommentCore, withCommentPlugins } from "vane-comment";`,
    ...factories.map(
      (f) => `import { ${f} } from "vane-comment/custom-plugins/${subpathOf(f)}";`
    ),
    "",
    `import type { Comment } from "vane-comment";`,
  ].join("\n");

  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${p.cfg ? `{ ${fill(p.cfg, cfg)} }` : ""}),`)
    .join("\n");

  const propLines = meta.props
    .filter((p) => typeof p === "string" || !p.when || p.when(cfg))
    .map((p) => `      ${fill(typeof p === "string" ? p : p.text, cfg)}`)
    .join("\n");

  const body = meta.plugs.length
    ? `const Comment = withCommentPlugins(CommentCore, [\n${pluginLines}\n]);`
    : `// 这一页只用 Core：列表壳 + 排序 + 操作行，不需要任何插件\nconst Comment = withCommentPlugins(CommentCore, []);`;

  return `// ${meta.title} · 最小装配（照抄即可跑）
${head}

${body}

export default function Demo({ comments }: { comments: Comment[] }) {
  return (
    <Comment
      comments={comments}
${propLines}
    />
  );
}
`;
}
