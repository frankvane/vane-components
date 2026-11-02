/**
 * 插件全家桶（子路径 vane-resume/custom-plugins/<Name> 亦可用）。
 * 注意：根入口 src/index.ts 不桶导出插件（ADR-6）；本文件仅供 ./entries/plugins 聚合与
 * 子路径打包。每个插件以 createXxxPlugin 工厂形式导出，.meta 携带 PluginDoc。
 */
export * from "./TemplateSwitchPlugin";
export * from "./ThemeCustomizePlugin";
export * from "./MultiLangPlugin";
export * from "./AiPolishPlugin";
export * from "./PrivacyMaskPlugin";
export * from "./ContactDesensitizePlugin";
export * from "./ExportPdfPlugin";
export * from "./ShareLinkPlugin";
export * from "./QrCodePlugin";
export * from "./VersioningPlugin";
export * from "./DeliverTrackPlugin";
export * from "./AttachmentPreviewPlugin";
export * from "./PrintOptimizePlugin";
export * from "./SectionReorderPlugin";
export * from "./TimelineViewPlugin";
export * from "./KeywordHighlightPlugin";
export * from "./AtsScorePlugin";
export * from "./StatSummaryPlugin";
export * from "./SectionCollapsePlugin";
export * from "./SignatureStampPlugin";
