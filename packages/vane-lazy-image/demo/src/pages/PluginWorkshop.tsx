import { useMemo, useState } from "react";
import { LazyLoadImageCore } from "@/components/LazyLoadImagePlugin/LazyLoadImageCore";
import { withPlugins } from "@/components/LazyLoadImagePlugin/withPlugins";
import {
  getFactory,
  groupedCatalog,
  type CatalogEntry,
} from "../data/plugin-catalog";

/**
 * 必填配置插件的演示默认值（doc.json 不记录可选性，这里显式兜底，
 * 避免 demo 装配时工厂抛错；真实项目请按业务传参）。
 */
const REQUIRED_CONFIG_DEFAULTS: Record<string, Record<string, unknown>> = {
  CDNFallbackPlugin: { cdnBases: [] },
  FallbackImagePlugin: { fallbackSrc: "https://picsum.photos/seed/vane-fallback/64/40" },
};

const DEMO_SRC = "https://picsum.photos/seed/vane-workshop/1200/750";

function buildPlugin(entry: CatalogEntry) {
  const config = REQUIRED_CONFIG_DEFAULTS[entry.dir];
  return config ? getFactory(entry)(config) : getFactory(entry)();
}

export function PluginWorkshop() {
  const [selected, setSelected] = useState<string[]>([
    "BlurUpPlugin",
    "FadeInPlugin",
  ]);

  const selectedEntries = useMemo(
    () =>
      selected
        .map((dir) => groupedCatalog.flatMap((g) => g.entries).find((e) => e.dir === dir))
        .filter((e): e is CatalogEntry => !!e),
    [selected]
  );

  // 选中项 → 插件实例（工厂抛错的跳过，保证 demo 不崩）
  const plugins = useMemo(
    () =>
      selectedEntries
        .map((entry) => {
          try {
            return buildPlugin(entry);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    [selectedEntries]
  );

  const WorkshopImage = useMemo(
    () => withPlugins(LazyLoadImageCore, plugins as any),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plugins.map((p) => (p as any)?.name).join("|")]
  );

  const code = useMemo(() => {
    const lines = selectedEntries.map(
      (e) => `  ${e.factoryKey}()${REQUIRED_CONFIG_DEFAULTS[e.dir] ? "({ /* 必填配置 */ })" : ""},`
    );
    return [
      'import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";',
      ...selectedEntries.map(
        (e) => `import { ${e.factoryKey} } from "vane-lazy-image/custom-plugins/${e.dir}";`
      ),
      "",
      "const Image = withPlugins(LazyLoadImageCore, [",
      ...lines,
      "]);",
    ].join("\n");
  }, [selectedEntries]);

  const toggle = (dir: string) =>
    setSelected((prev) =>
      prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir]
    );

  const toggleGroup = (dirs: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const d of dirs) {
        if (on) next.add(d);
        else next.delete(d);
      }
      return [...next];
    });

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 500 }}>
        插件工坊（{catalogCount()} 个插件 · 8 大领域）
      </h2>
      <p style={{ color: "#999", fontSize: 12 }}>
        勾选插件实时装配——右侧预览与生成的代码同步更新。单个插件的完整配置见文档站插件目录。
      </p>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* 左：分组目录 */}
        <div style={{ width: 420, fontSize: 12, maxHeight: 560, overflow: "auto" }}>
          {groupedCatalog.map((group) => (
            <div key={group.group} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <strong style={{ fontSize: 12 }}>
                  {group.label}（{group.entries.length}）
                </strong>
                <button
                  style={btn}
                  onClick={() => toggleGroup(group.entries.map((e) => e.dir), true)}
                >
                  全选
                </button>
                <button
                  style={btn}
                  onClick={() => toggleGroup(group.entries.map((e) => e.dir), false)}
                >
                  清空
                </button>
              </div>
              {group.entries.map((entry) => (
                <label
                  key={entry.dir}
                  title={entry.description}
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "baseline",
                    padding: "2px 0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(entry.dir)}
                    onChange={() => toggle(entry.dir)}
                  />
                  <span style={{ fontFamily: "ui-monospace, monospace" }}>
                    {entry.dir}
                  </span>
                  <span style={{ color: "#999" }}>
                    {entry.description.length > 28
                      ? `${entry.description.slice(0, 28)}…`
                      : entry.description}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {/* 右：预览 + 代码 */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ width: "100%", height: 260, border: "1px solid #eee" }}>
            <WorkshopImage src={DEMO_SRC} alt="插件工坊预览" />
          </div>
          <div style={{ margin: "8px 0", fontSize: 12, color: "#666" }}>
            已装配 {plugins.length} 个插件：
            {plugins.length === 0
              ? "（无）"
              : plugins.map((p: any) => p.name).join("、")}
          </div>
          <pre
            style={{
              background: "#f7f7f8",
              border: "1px solid #eee",
              padding: 12,
              fontSize: 11,
              lineHeight: 1.5,
              overflow: "auto",
              maxHeight: 260,
            }}
          >
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  fontSize: 11,
  padding: "1px 8px",
  border: "1px solid #ddd",
  background: "#fff",
  borderRadius: 4,
  cursor: "pointer",
};

function catalogCount() {
  return groupedCatalog.reduce((sum, g) => sum + g.entries.length, 0);
}
