/**
 * 插件全家桶（子路径 vane-candidate/custom-plugins/<Name> 亦可用）。
 * 注意：根入口 src/index.ts 不桶导出插件（ADR-6）；本文件仅供 ./entries/plugins 聚合与
 * 子路径打包。每个插件以 createXxxPlugin 工厂形式导出，.meta 携带 PluginDoc。
 */
export * from "./ScorePlugin";
export * from "./DupCheckPlugin";
export * from "./TagPlugin";
export * from "./OfferPlugin";
export * from "./StarPlugin";
export * from "./StageFlowPlugin";
export * from "./NotePlugin";
export * from "./InterviewSlotPlugin";
export * from "./RejectTplPlugin";
export * from "./FilterPlugin";
export * from "./SearchPlugin";
export * from "./BatchOpPlugin";
export * from "./ViewSwitchPlugin";
export * from "./ArchivePoolPlugin";
export * from "./ExportPlugin";
export * from "./StatsPlugin";
export * from "./ActivityLogPlugin";
export * from "./RecommendSortPlugin";
export * from "./ContactMaskPlugin";
