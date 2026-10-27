/**
 * 子路径入口 `vane-card/compound` —— ProductCard 与 38 个复合子组件。
 *
 * 适用：不想一个个装插件、想要「开箱即用的商品卡版式」。
 * 需要先引样式，否则只有结构没有外观：
 *
 *   import "vane-card/style.css";
 *   import { ProductCard } from "vane-card/compound";
 *
 * 依赖关系：复合组件通过 usePluginSlot("priceArea") 读价格区插件输出，
 * 所以这一支**同时**导出槽位实现（CardSlotProvider 由 withPlugins 挂载）。
 */

export * from "./components/CardPlugin/compound";
