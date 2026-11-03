/**
 * 示例页骨架（模板版）
 *
 * 结构固定成三段，读第二页就形成肌肉记忆：
 *   刊头（期号 + 标题 + 一句话说明）
 *   → 舞台（真实运行）
 *   → 源码（就是上面跑的那份文件）
 *   → 本页插件的属性 / 事件 / 方法（来自 doc.json，不是手抄）
 *
 * 想加控件就自己接：把 cfg 提到这一层，用 useState 控制再传给 Stage。
 * 完整的「参数控件 + 代码随控件变」范式见 vane-sku 的 demos/DemoPage.tsx。
 */
import React from "react";
import type { DemoEntry } from "./registry";
import { GROUP_META } from "./types";
import { CodeBlock } from "../components/CodeBlock";
import { PluginDocCard } from "../components/PluginDoc";
import { PLUGIN_BY_DIR, type PluginInfo } from "../data/plugins";

export function DemoPage({ entry, order }: { entry: DemoEntry; order: number }) {
  const { meta, Stage, source, file } = entry;
  const no = String(order).padStart(2, "0");

  // meta.plugins 只写目录名，文档表按目录去 registry 取 doc.json，顺序按 priority
  const plugins = (meta.plugins ?? [])
    .map((dir) => PLUGIN_BY_DIR.get(dir))
    .filter((p): p is PluginInfo => Boolean(p))
    .sort((a, b) => a.priority - b.priority);

  return (
    <article>
      <header className="page-head">
        <div>
          <p className="eyebrow">
            {no} · {GROUP_META[meta.group]?.label ?? meta.group}
          </p>
          <h1 className="page-title">{meta.title}</h1>
        </div>
      </header>

      {meta.intro ? <p className="page-sub">{meta.intro}</p> : null}

      <section className="demo-stage">
        <Stage />
      </section>

      {/*
        关键：展示与复制的都是 registry 用 import.meta.glob('?raw') 抓到的**完整源码**，
        不是手抄的简化串——上面跑的那份，就是下面这份。复制按钮原样复制整份文件。
      */}
      <CodeBlock code={source} title={`源码 · ${file}`} collapseAfter={0} />

      {plugins.length > 0 ? (
        <section className="api-sec">
          <div className="api-sec-head">
            <h2 className="api-sec-title">本页用到的插件 · {plugins.length} 个</h2>
            <p className="api-sec-sub">
              就是上面 <code>withPlugins</code> 数组里的全部成员。属性是工厂参数，
              事件是父组件传进来的回调，方法是插件读取 / 调用的上下文能力 ——
              表内容与 <code>doc.json</code> 同源，随包发布。
            </p>
          </div>
          {plugins.map((p) => (
            <PluginDocCard key={p.dir} plugin={p} />
          ))}
        </section>
      ) : null}
    </article>
  );
}
