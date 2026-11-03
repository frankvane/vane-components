/**
 * 示例页「本页用到的插件 · 属性 / 事件 / 方法」区块（模板版，全包通用）
 *
 * 为什么用「扫源码」而不是让每个示例手写 `meta.plugins`：
 *   示例源码里必然出现 `createXxxPlugin(...)` 装配调用，直接正则提取工厂名，
 *   再与各包 `data/plugins.ts` 的 PLUGINS 对撞 —— 加/删插件时表自动跟着变，
 *   零手写、零漂移。同理，展示的源码就是 `?raw` 抓到的那份，表里列的就是它真正用到的。
 *
 * 与包的唯一耦合是「传进来的插件数组」，只需结构上带 factory / priority / summary / doc；
 * 各包的 PluginInfo 天然满足（多余字段无妨，TS 结构化赋值不看多出来的字段）。
 */
import React, { useMemo } from "react";
import { PluginDocCard, type PluginDocLike } from "./PluginDoc";

/** 各包 PLUGINS 里的元素在结构上满足这个最小形状即可 */
export interface ApiPluginRef {
  /** 真实插件目录名（如 LikePlugin）；有它时优先用于规避手写 factory 拼写漂移 */
  dir?: string;
  /** 工厂调用表达式，如 `createTaskListPlugin` 或 `createHeaderPlugin({ title: "x" })` */
  factory: string;
  priority: number;
  summary?: string;
  doc: PluginDocLike;
}

const FACTORY_RE = /create[A-Z]\w*Plugin/g;

/** 从工厂表达式里取纯名字：`createHeaderPlugin({...})` → `createHeaderPlugin` */
function factoryName(factory: string): string {
  return (factory.match(/create[A-Z]\w*Plugin/) ?? [factory])[0];
}

/** 插件的真实工厂名：目录名是契约，手写 factory 只作兜底 */
function pluginFactoryName(plugin: ApiPluginRef): string {
  return plugin.dir ? `create${plugin.dir}` : factoryName(plugin.factory);
}

/** 源码里出现的工厂名集合 */
function factoryNamesIn(source: string): Set<string> {
  return new Set(source.match(FACTORY_RE) ?? []);
}

/** 本页真正用到的插件（按 priority 升序，和执行顺序一致） */
function usedPlugins<T extends ApiPluginRef>(
  source: string,
  plugins: readonly T[]
): T[] {
  const used = factoryNamesIn(source);
  return plugins
    .filter((p) => used.has(pluginFactoryName(p)))
    .sort((a, b) => a.priority - b.priority);
}

export function PluginApiSection({
  source,
  plugins,
  heading = "本页用到的插件",
}: {
  /** 该示例的完整源码（registry 的 ?raw 内容） */
  source: string;
  /** 本包全部插件（data/plugins.ts 的 PLUGINS） */
  plugins: readonly ApiPluginRef[];
  heading?: string;
}) {
  const list = useMemo(() => usedPlugins(source, plugins), [source, plugins]);
  if (list.length === 0) return null;

  return (
    <section className="api-sec">
      <div className="api-sec-head">
        <h2 className="api-sec-title">
          {heading} · {list.length} 个
        </h2>
        <p className="api-sec-sub">
          就是上面代码里装配的全部成员。属性是工厂参数，事件是父组件传进来的回调，
          方法是插件读取 / 调用的上下文能力 —— 表内容与 <code>doc.json</code> 同源，随包发布。
        </p>
      </div>
      {list.map((p) => (
        <PluginDocCard
          key={p.factory}
          factory={pluginFactoryName(p)}
          priority={p.priority}
          summary={p.summary ?? p.doc.description ?? ""}
          doc={p.doc}
        />
      ))}
    </section>
  );
}
