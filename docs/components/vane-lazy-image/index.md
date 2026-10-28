# 图片懒加载

> 不止于"进入视口才加载"：把图片加载的全链路（占位、渐进、容灾、可访问性、监控）做成插件容器。

## 特性

- 插件化架构：`LazyLoadImageCore` 只做观察与渲染，其余全部是插件，按需引入、tree-shaking 友好
- 60 个内置插件、8 大领域分组（视觉 / 加载策略 / 网络 / 缓存 / 可访问性 / 错误处理 / 监控 / 视口），只增不减
- 5 个场景化配方（presets）：社交信息流 / 商品画廊 / 长文阅读 / 性能优先 / 离线优先
- **商品图集引擎（gallery 子路径）**：多图容器 `GalleryCore`，主图复用 `LazyLoadImageCore` 全部能力，10 个图集域插件（缩略联动 / 360 / 计数 / 指示点 / 轮播 / 缩放 / 全屏 / 相邻预加载 / 热点 / 收藏）+ 单图插件作主图叠加
- `GlobalContext` + `ObserverPool`：N 个图片实例共享一次设备检测、一个 IntersectionObserver
- BlurUp / LQIP 渐进占位、骨架屏、进度条
- 智能重试、CDN 回退、降级图片、离线缓存
- ARIA 自动注入、智能 alt、`srcset/sizes`
- 性能监控与上报
- 零运行时依赖（react 为 peer），无需引入 CSS 文件

## 安装

```bash
npm install vane-lazy-image
```

## 30 秒上手

```tsx
import { LazyLoadImageCore, withPlugins } from "vane-lazy-image";
import { createBlurUpPlugin } from "vane-lazy-image/custom-plugins/BlurUpPlugin";

const LazyImage = withPlugins(LazyLoadImageCore, [
  createBlurUpPlugin({ startBlur: 12, durationMs: 600 }),
]);

<LazyImage
  src="https://picsum.photos/800/600"
  alt="示例图片"
  containerStyle={{ width: 480, height: 300 }}
/>;
```

不用插件时 `LazyLoadImageCore` 可单独使用（视口检测 + ObserverPool 共享）。

## 商品图集引擎（gallery）

把「多图 + 主图」做成插件化图集，主图复用 `LazyLoadImageCore`。两层插件：图集域插件（缩略联动 / 计数 / 轮播 / 全屏 / 热点 / 收藏 …）经 `context.activeIndex` 协调；单图插件（放大镜 / 价格 / 促销 …）通过 `mainPlugins` 挂到主图实例。

```tsx
import { GalleryCore } from "vane-lazy-image/gallery";

<GalleryCore images={images} plugins={[createThumbSyncPlugin(), createZoomControlPlugin()]} />
```

详见 [商品图集引擎（gallery）](gallery.md)。

## 导入方式与体积

| 导入 | 说明 | 实测 Gzip |
| --- | --- | --- |
| `vane-lazy-image/core` | 仅核心（Core + ObserverPool） | 6.9 KB |
| `vane-lazy-image/plugins` | 插件系统（withPlugins + 领域类型 + 一等公民插件） | 5.5 KB |
| `vane-lazy-image/monitoring` | 性能监控 + 全局上下文 | 3.9 KB |
| `vane-lazy-image/advanced` | 依赖解析 + 版本工具 | 3.5 KB |
| `vane-lazy-image` | 完整包（核心 + 插件系统 + 全部插件工厂桶导出） | 26.9 KB |
| `vane-lazy-image/custom-plugins` | 全部插件桶文件（仅 re-export 胶水，可摇） | 1.25 KB |
| `vane-lazy-image/custom-plugins/X` | 单个插件（60 选 1） | 0.14 KB 起 |
| `vane-lazy-image/presets/X` | 场景配方（5 选 1） | 0.18 KB 起 |
| `vane-lazy-image/gallery` | 商品图集引擎（GalleryCore + 框架，默认含 4 个核心域插件） | 18.4 KB |

> 表中的根入口 26.9 KB 是「`import "vane-lazy-image"` 却一个符号都不用」的**未 tree-shake 上界**：
> 根入口为兼容 1.x 的 `import { createXxxPlugin } from "vane-lazy-image"` 写法，按需保留了对
> 全部插件工厂的桶导出（`sideEffects: false`，消费方未用到的会被摇掉）。
> 想要最小体积就走 `vane-lazy-image/core`（6.9 KB）或按子路径引入插件——源码路径 == 发布子路径，
> 未引入的插件不进产物。预算门 `vane.sizeBudgetKb = 28`（实测 26.9 KB），口径记在 package.json 的
> `sizeBudgetNote` 里。

## 从 1.x 迁移

2.0.0 更换了插件系统内核（`vane-plugin-core`），主要差异：

- **插件引入路径**：插件工厂**仍从根入口导出**（`import { createBadgePlugin } from "vane-lazy-image"` 可用，1.x 写法无需改动）；但推荐走 `vane-lazy-image/custom-plugins/<XxxPlugin>` 子路径——只取一个插件时静态图从 26.9 KB 降到 0.14 KB 量级；
- 插件工厂签名不变（`createXxxPlugin(config)`），`priority` 语义仍为「越小越优先，默认 100」，与 1.x 一致；
- 旧版直接可用的 `createPluginManager` / `createPluginBus` / `createPluginSandbox` 等底层 API 改为从 `vane-lazy-image/plugins` 转发（实现来自 `vane-plugin-core`）；
- 移除：插件热更新（`hotReload` / `savePluginState`）、`hookFactory`、`renderDeps`、bus 通配符与批处理——1.x 中无内置插件使用这些能力，自定义插件如依赖需自行实现；
- `render` 渲染钩子合并为 `renderOverlay`（1.x 仅 BadgePlugin 使用）。

## 文档

- [API](api.md)
- [插件目录](plugins.md)
- [组合配方](recipes.md)
- [商品图集引擎（gallery）](gallery.md)

## License

MIT
