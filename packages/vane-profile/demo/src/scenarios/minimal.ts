/**
 * 「最小装配版」代码生成
 *
 * 由 meta 现场拼出来，而不是另写一份文件：这样插件名、配置、props 只有一处真相，
 * 改场景时不会忘记同步文档。生成结果保证可编译（import 按字母序、只导用到的工厂）。
 */
import type { ScenarioMeta } from "./types";

export function buildMinimal(meta: ScenarioMeta): string {
  const factories = meta.plugs.map((p) => p.fn).sort();
  const multi = factories.length > 3;

  const importLine = multi
    ? `import {\n${factories.map((f) => `  ${f},`).join("\n")}\n} from "vane-profile/custom-plugins";`
    : `import { ${factories.join(", ")} } from "vane-profile/custom-plugins";`;

  const pluginLines = meta.plugs
    .map((p) => `  ${p.fn}(${p.cfg ? `{ ${p.cfg} }` : ""}),`)
    .join("\n");

  const propLines = meta.props.map((p) => `      ${p}`).join("\n");

  return `// ${meta.title} · 最小装配（照抄即可跑）
import { ProfileCore, withPlugins } from "vane-profile";
${importLine}

type User = { id: string; name: string; handle: string; verified?: boolean; followState?: "none" | "following" | "mutual" };

const Profile = withPlugins(ProfileCore, [
${pluginLines}
]);

export default function Demo({ user }: { user: User }) {
  return (
    <Profile
      banner={<span>@{user.handle}</span>}
${propLines}
    />
  );
}
`;
}
