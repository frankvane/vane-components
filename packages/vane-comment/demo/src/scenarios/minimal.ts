/**
 * 「最小装配版」代码生成
 *
 * 由 meta 现场拼出来，而不是另写一份文件：这样插件名、配置、props 只有一处真相，
 * 改场景时不会忘记同步文档。生成结果保证可编译（import 按工厂名排序、只导用到的工厂）。
 *
 * 与 vane-sku 的差别：评论区走 `withCommentPlugins(CommentCore, [...])` 装配 API +
 * 深层子路径 import（一插件一行，照抄到真实项目里不需要改任何路径）。
 */
import type { ScenarioMeta } from "./types";

/** 工厂名 → 插件目录名（createLikePlugin → LikePlugin），与包 exports 一致 */
const subpathOf = (fn: string): string => fn.replace(/^create/, "");

export function buildMinimal(meta: ScenarioMeta): string {
  const factories = meta.plugs.map((p) => p.fn).sort();

  // 深层子路径一行一个（消费者视角，vite 别名指回源码，发布后指 dist）
  const importLines = [
    `import { CommentCore, withCommentPlugins } from "vane-comment";`,
    ...factories.map(
      (f) => `import { ${f} } from "vane-comment/custom-plugins/${subpathOf(f)}";`
    ),
    `import type { Comment } from "vane-comment";`,
  ].join("\n");

  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${p.cfg ? `{ ${p.cfg} }` : ""}),`)
    .join("\n");

  const propLines = meta.props.map((p) => `      ${p}`).join("\n");

  // plugs 为空：这一版只用内核（列表壳 + 操作行占位）
  const assembly =
    meta.plugs.length === 0
      ? `// ${meta.title} · 这一版只用内核\nconst Comment = withCommentPlugins(CommentCore, []);`
      : `const Comment = withCommentPlugins(CommentCore, [\n${pluginLines}\n]);`;

  return `// ${meta.title} · 最小装配（照抄即可跑）
${importLines}

${assembly}

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
