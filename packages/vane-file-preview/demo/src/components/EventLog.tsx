import React from "react";
import type { LogKind } from "../lib/previews";

export interface LogLine {
  id: number;
  at: string;
  text: string;
  kind: LogKind;
}

/**
 * 事件日志。
 *
 * 存在的理由：Core 的 loading → loaded → error 全在内部，页面上只有一个状态点。
 * 把生命周期逐条摊出来之后，「为什么这个文件一直转圈」这类问题通常三条之内就能判：
 * 是没进 loadStart（路由没命中），还是 loadStart 之后没有 success（依赖缺失）。
 */
export const EventLog: React.FC<{
  lines: LogLine[];
  title?: string;
  empty?: string;
}> = ({ lines, title = "事件日志", empty = "还没触发 —— 切一个样本文件试试" }) => (
  <div className="log">
    <div className="log-head">
      <span>{title}</span>
      <span className="log-right">
        <b>{lines.length}</b>
      </span>
    </div>
    {lines.length === 0 ? (
      <p className="log-empty">{empty}</p>
    ) : (
      <ol className="log-list">
        {lines.map((l) => (
          <li key={l.id} className={`log-line is-${l.kind}`}>
            <time>{l.at}</time>
            <span>{l.text}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);
