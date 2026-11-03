/**
 * 示例页骨架（模板版）
 *
 * 结构固定成三段，读第二页就形成肌肉记忆：
 *   刊头（期号 + 标题 + 一句话说明）
 *   → 舞台（真实运行）
 *   → 源码（就是上面跑的那份）
 *   → 本页插件的属性 / 事件 / 方法（扫源码自动对撞 doc.json，零手写）
 *
 * 想加控件就自己接：把 cfg 提到这一层，用 useState 控制再传给 Stage。
 * 完整的「参数控件 + 代码随控件变」范式见 vane-sku 的 demos/DemoPage.tsx。
 */
import React from "react";
import type { DemoEntry } from "./registry";
import { GROUP_META } from "./types";
import { CodeBlock } from "../components/CodeBlock";
import { PluginApiSection } from "../components/PluginApiSection";
import { PLUGINS } from "../data/plugins";

export function DemoPage({ entry, order }: { entry: DemoEntry; order: number }) {
  const { meta, Stage, source, file } = entry;
  const no = String(order).padStart(2, "0");

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

      {/* 三件表不靠手写清单：扫源码里的 createXxxPlugin，自动对上 doc.json */}
      <PluginApiSection source={source} plugins={PLUGINS} />
    </article>
  );
}
