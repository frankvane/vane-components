import React from "react";
import { ScenarioCard } from "../components/ScenarioCard";
import { SCENARIOS } from "../scenarios/catalog";

/**
 * 场景集：每个场景一张卡，左实时预览、右源码（默认展开）。
 * 场景定义与源码都来自 scenarios/catalog + scenarios/specs，新增场景只改那两处。
 */
export function Scenarios() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">场景集</h1>
        <p className="page-desc">
          每个卡片一个主题，右侧源码即该卡片真实运行的代码（import 自发布的
          <code className="inline-code">vane-sku</code> 包）。12 个官方插件全部有对应场景：
          信息与联动（PriceLink / PriceRange / StockStatus / Quota）、
          选择与交互（ImageLink / SkuCode / Analytics / KeyboardNav）、
          会话与恢复（ResetBar / StatePersistence / UrlSync / Quantity）。
        </p>
      </div>

      <div className="scn-list">
        {SCENARIOS.map((meta) => (
          <ScenarioCard key={meta.id} meta={meta} />
        ))}
      </div>
    </div>
  );
}
