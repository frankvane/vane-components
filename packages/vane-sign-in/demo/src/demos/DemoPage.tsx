/**
 * 示例页骨架（模板版）
 *
 * 结构固定成三段，读第二页就形成肌肉记忆：
 *   刊头（期号 + 标题 + 一句话说明）
 *   → 舞台（真实运行）
 *   → 源码（就是上面跑的那份文件）
 *
 * 想加控件就自己接：把 cfg 提到这一层，用 useState 控制再传给 Stage。
 * 完整的「参数控件 + 代码随控件变」范式见 vane-sku 的 demos/DemoPage.tsx。
 */
import React from "react";
import type { DemoEntry } from "./registry";
import { GROUP_META } from "./types";

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
        <pre className="demo-src">
          <code>{source}</code>
        </pre>
      </section>
    </article>
  );
}
