/**
 * 舞台公共件
 *
 * 示例页反复出现的两件事，集中在这里：
 *  1. `Content`：插件负责图 / 价 / 按钮，内容区负责标题与描述（裸 Core 也能看）
 *  2. `makeCard` / `useCard`：把「插件数组」变成组件类型
 *
 * 为什么必须缓存：每次渲染都调 `withPlugins` 会造出**新的组件类型**，
 * React 会把整棵子树卸载重建 —— 插件 onMount 重跑、内部状态全丢。
 *  - 插件集合是常量 → 模块顶层 `makeCard([...])`，一次定型
 *  - 插件集合随控件变化 → `useCard(plugins)`，按「插件名」缓存
 */
import React, { useMemo } from "react";
import { CardCore, withPlugins, type CardPlugin } from "vane-card";

export function Content({
  title,
  subtitle,
  note,
}: {
  title?: string;
  subtitle?: string;
  note?: string;
}) {
  return (
    <div className="stage-content">
      {title ? <div className="stage-title">{title}</div> : null}
      {subtitle ? <div className="stage-sub">{subtitle}</div> : null}
      {note ? <div className="stage-note">{note}</div> : null}
    </div>
  );
}

/** 模块顶层用：插件集合是常量时，把装配结果定型一次 */
export function makeCard(plugins: CardPlugin[]) {
  return withPlugins(CardCore, { plugins });
}

/** 组件内用：插件集合随控件变化时，按「插件名」缓存组件类型 */
export function useCard(plugins: CardPlugin[]) {
  const key = plugins.map((p) => p.name).join("|");
  return useMemo(
    () => withPlugins(CardCore, { plugins }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key 就是「插件集合」的语义
    [key]
  );
}
