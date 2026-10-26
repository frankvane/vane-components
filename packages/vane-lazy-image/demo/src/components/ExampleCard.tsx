import React from "react";
import { StaticPreview } from "./PluginPreview";
import { CodeBlock } from "./CodeBlock";
import type { PluginExample } from "../data/plugin-catalog";

// 把配置对象格式化为可读的 JS 字面量（键不加引号，值为合法 JS）
function toJs(value: any, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (value === null || value === undefined) return "undefined";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => pad + "  " + toJs(v, indent + 1));
    return "[\n" + items.join(",\n") + "\n" + pad + "]";
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    const items = keys.map((k) => pad + "  " + k + ": " + toJs(value[k], indent + 1));
    return "{\n" + items.join(",\n") + "\n" + pad + "}";
  }
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function buildSource(
  example: PluginExample,
  factoryName: string,
  pluginId: string
): string {
  const configs: Record<string, any>[] = example.configs?.length
    ? example.configs
    : [example.config || {}];
  const calls = configs
    .map((c) => `${factoryName}(${toJs(c, 1)})`)
    .join(",\n  ");
  const src = example.src || `https://picsum.photos/seed/${pluginId}/600/400`;
  return [
    `import { LazyLoadImageCore, withPlugins, ${factoryName} } from "vane-lazy-image";`,
    "",
    `const LazyImage = withPlugins(LazyLoadImageCore, [`,
    `  ${calls}`,
    `]);`,
    "",
    "// 在组件中使用",
    `<LazyImage src="${src}" alt="示例图片" />`,
  ].join("\n");
}

export const ExampleCard: React.FC<{
  pluginId: string;
  factoryName: string;
  example: PluginExample;
}> = ({ pluginId, factoryName, example }) => {
  const [open, setOpen] = React.useState(false);
  const code = buildSource(example, factoryName, pluginId);
  return (
    <div className="example-card">
      <h4 className="example-name">{example.name}</h4>
      {example.description && (
        <p className="example-desc">{example.description}</p>
      )}
      <StaticPreview pluginId={pluginId} example={example} />
      <div className="example-actions">
        <button
          type="button"
          className="example-toggle"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "隐藏源码" : "查看源码"}
        </button>
      </div>
      {open && (
        <div className="example-source">
          <CodeBlock code={code} />
        </div>
      )}
    </div>
  );
};
