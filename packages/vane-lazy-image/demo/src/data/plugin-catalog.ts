/**
 * 插件目录数据（demo 专用）：
 *   - doc.json：从源码 glob 收集 60 个插件的说明/标签/配置（演示站即文档）
 *   - 工厂注册表：从桶文件收集全部工厂（挂 .meta，meta.name == doc.json 的 name）
 *
 * 分组与 doc.json 的 tags[0] 一致（8 大领域，ADR-6：只分组不淘汰）。
 */
import * as factories from "@/custom-plugins";

export interface CatalogEntry {
  /** 目录名 / doc.json name，如 "BlurUpPlugin" */
  dir: string;
  name: string;
  description: string;
  tags: string[];
  config: { name: string; type: string; default?: string; description: string }[];
  /** 桶文件中的真实导出名，如 "createLqipPlugin"（与目录名不一定一致） */
  factoryKey: string;
}

const docs = import.meta.glob<{
  default: {
    name: string;
    description: string;
    tags: string[];
    config: CatalogEntry["config"];
  };
}>("../../../src/custom-plugins/*/doc.json", { eager: true });

/**
 * doc.json name（如 "LQIPPlugin"）→ { 导出名, 工厂 }。
 * 经工厂的 .meta.name 反查——导出名与目录名不一定一致
 * （如 LQIPPlugin 的工厂导出名是 createLqipPlugin）。
 */
const registry = new Map<
  string,
  { key: string; factory: (config?: any) => any }
>();
for (const [key, value] of Object.entries(factories)) {
  if (typeof value === "function") {
    const meta = (value as { meta?: { name?: string } }).meta;
    if (meta?.name) {
      registry.set(meta.name, { key, factory: value as (config?: any) => any });
    }
  }
}

export const GROUP_LABELS: Record<string, string> = {
  visual: "视觉与效果",
  loading: "加载策略",
  cache: "缓存",
  network: "网络与适配",
  viewport: "视口与交互",
  a11y: "可访问性与 SEO",
  error: "错误处理",
  monitor: "监控与可观测",
};

export const GROUP_ORDER = [
  "visual",
  "loading",
  "cache",
  "network",
  "viewport",
  "a11y",
  "error",
  "monitor",
];

export const catalog: CatalogEntry[] = Object.values(docs)
  .map((mod) => {
    const doc = mod.default;
    const hit = registry.get(doc.name);
    return {
      dir: doc.name,
      name: doc.name,
      description: doc.description,
      tags: doc.tags ?? [],
      config: doc.config ?? [],
      factoryKey: hit?.key ?? "",
    };
  })
  .filter((entry) => entry.factoryKey !== "")
  .sort((a, b) => a.dir.localeCompare(b.dir));

/** 按分组的目录：group → entries */
export const groupedCatalog: { group: string; label: string; entries: CatalogEntry[] }[] =
  GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    entries: catalog.filter((e) => e.tags[0] === group),
  })).filter((g) => g.entries.length > 0);

/** 按目录名取工厂（demo 装配用） */
export function getFactory(entry: CatalogEntry) {
  return registry.get(entry.name)!.factory;
}
