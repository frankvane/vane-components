---
"vane-lazy-image": minor
---

新增商品图集引擎（gallery 子特性，B1-B 并入，不建独立包）。

- `vane-lazy-image/gallery` 子路径暴露：`GalleryCore` 多图容器（缩略区 / 主图区 / 工具条区 / 浮层）、`createGallery` 装配器、`useGalleryRuntime`、`renderGallerySlot`、`galleryPreset`
- 主图复用 `LazyLoadImageCore`（懒加载 / 占位 / 容灾 / 单图插件链），两层插件：图集域插件经 `context.activeIndex` 协调，单图插件经 `mainPlugins` 挂主图
- 10 个 gallery 域插件：ThumbSync / Spin360（默认预设 4 个）+ Carousel / ZoomControl / Fullscreen / ThumbPreload / Hotspot / Favorite（按需引入）；8 个复用型单图插件可作 `mainPlugins`，图集生态合计 18 个接入点
- 协调态用 `useState` 持有，切换即重渲染，无需手动 forceUpdate
- 子路径闭包实测 18.4KB gzip（预算 20KB），根入口 26.9KB 不受影响；详见 ADR-19
- 测试：gallery-core / gallery-slots / gallery-plugins / gallery-inventory 共 28 例，全包 46 例通过
