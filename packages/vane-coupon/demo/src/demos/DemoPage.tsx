/**
 * 示例页骨架
 *
 * 结构固定成三段，读第二页就形成肌肉记忆：
 *   刊头（期号 + 标题 + 一句话说明）
 *   → 舞台（真实运行）
 *   → 源码（CodeBlock：高亮 + 复制 + 超长折叠；就是上面跑的那份文件）
 */
import React from "react";
import type { DemoEntry } from "./registry";
import { GROUP_META } from "./types";
import { CodeBlock } from "../components/CodeBlock";

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

      <section className="demo-src-wrap">
        <div className="demo-src-head">
          <span className="demo-src-title">源码 · {file}</span>
          <span className="demo-src-hint">下面这份就是上面正在跑的那份</span>
        </div>
        <CodeBlock code={source} title={file} collapseAfter={28} maxHeight={460} />
      </section>
    </article>
  );
}
