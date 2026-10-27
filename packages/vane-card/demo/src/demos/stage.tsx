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
 *  - 插件集合由控件现算 → `useCard(plugins)`，按「插件名 + 控件世代」缓存
 */
import React, { createContext, useContext, useMemo } from "react";
import { CardCore, withPlugins, type CardPlugin } from "vane-card";
import type { DemoCfg } from "./types";

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

/**
 * 控件世代号（由 `DemoPage` 提供，值是当前 cfg 的序列化）
 *
 * 为什么非要这么绕一层：`withPlugins` 返回的组件类型**闭包住了那批插件实例**。
 * 而示例页的插件配置都是从控件值现算的（`createBadgePlugin({ text: cfg.text })`），
 * 所以「控件变了」在语义上就等于「换一个组件类型」。
 *
 * 曾经这里只按「插件名」缓存：名字没变 → 命中缓存 → 拿回第一次那个类型，
 * 里面的插件实例还是初始配置。表现就是拖动「文案 / 语义 / 位置」时**代码块在变、
 * 舞台纹丝不动**（BadgePlugin 就是这么被抓到的，其余 11 个页同样的病）。
 *
 * 用 cfg 而不是插件对象本身当世代号，是因为 cfg 只会被用户拖动时才变：
 *   - 插件对象里有 `new Date(...)`、内联回调这类每次渲染都新的东西，拿它做 key 会每帧重挂；
 *   - cfg 是扁平的 `Record<string, number | boolean | string>`，序列化天然稳定。
 */
const CfgGen = createContext("");

export function CfgGenProvider({ cfg, children }: { cfg: DemoCfg; children: React.ReactNode }) {
  return <CfgGen.Provider value={JSON.stringify(cfg)}>{children}</CfgGen.Provider>;
}

/** 组件内用：插件集合由控件现算时，按「插件名 + 控件世代」缓存组件类型 */
export function useCard(plugins: CardPlugin[]) {
  const gen = useContext(CfgGen);
  const key = plugins.map((p) => p.name).join("|");
  return useMemo(
    () => withPlugins(CardCore, { plugins }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key 是「插件集合」的语义，gen 是「控件动过」的语义，两个都要
    [key, gen]
  );
}
