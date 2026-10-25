# 图片懒加载 · 插件目录

<!-- AUTO-GENERATED:BEGIN 由 scripts/generate-plugin-docs.mjs 生成，请勿手改；新增插件请写 doc.json -->
| 插件 | 说明 | 配置 | 引入版本 | 标签 |
| --- | --- | --- | --- | --- |
<!-- AUTO-GENERATED:END -->

> 迁移说明：插件列表待 `vane-lazy-image` 源码迁入本仓库后由 `doc.json` 自动生成。
> 迁移原则（ADR-6）：**全部保留，一个不删**。71 个插件按业务域分组迁入，逐个补 `doc.json` 与 `tags`，配方提供推荐组合。数量不是负担——未引入的插件会被 tree-shaking，不进消费方产物。

## 计划迁入的分组（先导组，其余插件随后）

| 分类 | 插件 |
| --- | --- |
| 视觉 | FadeIn、BlurUp、Skeleton、Watermark |
| 稳定 | RetryOnError、CdnFallback、OfflinePlaceholder |
| 性能 | Preconnect、PriorityLoading、ConcurrencyControl、ImageOptimization |
| 体验 | LazyHydrate、A11y |
